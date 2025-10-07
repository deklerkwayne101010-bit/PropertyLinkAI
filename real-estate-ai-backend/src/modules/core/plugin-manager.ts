import { IPluginManager, IModule, ModuleHealth } from '../shared/interfaces';
import { ModuleInstance, ModuleMetadata, PluginManagerOptions, PluginLoadOptions } from './types';
import { serviceRegistry } from './service-registry';
import { eventBus } from './event-bus';
import { configManager } from './config-manager';

/**
 * Plugin Manager - Manages module lifecycle, loading, and health monitoring
 * Handles dependency resolution, initialization order, and module isolation
 */
export class PluginManager implements IPluginManager {
  private modules = new Map<string, ModuleInstance>();
  private loadOrder: string[] = [];
  private options: PluginManagerOptions;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(options: PluginManagerOptions = {}) {
    this.options = {
      autoDiscovery: false,
      healthCheckInterval: 30000, // 30 seconds
      maxLoadTime: 30000, // 30 seconds
      ...options
    };

    if (this.options.healthCheckInterval) {
      this.startHealthChecks();
    }
  }

  /**
   * Load a module from the specified path
   */
  async loadModule(modulePath: string, options: Partial<PluginLoadOptions> = {}): Promise<void> {
    const loadOptions: PluginLoadOptions = {
      path: modulePath,
      config: {},
      isolated: false,
      autoStart: true,
      ...options
    };

    try {
      // Load module metadata
      const metadata = await this.loadModuleMetadata(loadOptions.path);

      // Check if module is already loaded
      if (this.modules.has(metadata.id)) {
        throw new Error(`Module '${metadata.id}' is already loaded`);
      }

      // Validate dependencies
      await this.validateDependencies(metadata);

      // Create module instance
      const instance: ModuleInstance = {
        metadata,
        status: 'loading',
        instance: null,
        container: loadOptions.isolated ? this.createIsolatedContainer(metadata.id) : null,
        health: { status: 'unknown', timestamp: new Date() },
        error: null
      };

      this.modules.set(metadata.id, instance);
      this.loadOrder.push(metadata.id);

      // Load module configuration
      if (metadata.configSchema) {
        await this.loadModuleConfig(metadata, loadOptions.config || {});
      }

      // Initialize module with timeout
      const initPromise = this.initializeModule(instance, loadOptions);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Module initialization timeout after ${this.options.maxLoadTime}ms`)), this.options.maxLoadTime);
      });

      await Promise.race([initPromise, timeoutPromise]);

      // Publish module loaded event
      eventBus.publish({
        type: 'module.loaded',
        payload: { moduleId: metadata.id, metadata },
        timestamp: new Date(),
        source: 'plugin-manager'
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load module from '${modulePath}': ${message}`);
    }
  }

  /**
   * Unload a module
   */
  async unloadModule(moduleId: string): Promise<void> {
    const instance = this.modules.get(moduleId);
    if (!instance) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    try {
      instance.status = 'unloading';

      // Shutdown module
      if (instance.instance && typeof instance.instance.shutdown === 'function') {
        await instance.instance.shutdown();
      }

      // Clean up resources
      if (instance.container) {
        instance.container.dispose();
      }

      // Remove from load order
      const index = this.loadOrder.indexOf(moduleId);
      if (index > -1) {
        this.loadOrder.splice(index, 1);
      }

      // Remove from modules map
      this.modules.delete(moduleId);

      // Publish module unloaded event
      eventBus.publish({
        type: 'module.unloaded',
        payload: { moduleId },
        timestamp: new Date(),
        source: 'plugin-manager'
      });

    } catch (error) {
      instance.status = 'error';
      instance.error = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  /**
   * Get all loaded modules
   */
  getModules(): IModule[] {
    return Array.from(this.modules.values())
      .filter(instance => instance.instance)
      .map(instance => instance.instance!);
  }

  /**
   * Get a specific module by ID
   */
  getModule(id: string): IModule | undefined {
    const instance = this.modules.get(id);
    return instance?.instance || undefined;
  }

  /**
   * Check health of all modules
   */
  async checkHealth(): Promise<ModuleHealth[]> {
    const healthChecks = Array.from(this.modules.values()).map(async (instance) => {
      try {
        if (instance.instance && typeof instance.instance.getHealth === 'function') {
          instance.health = await instance.instance.getHealth();
        } else {
          instance.health = {
            status: instance.status === 'initialized' ? 'healthy' : 'unknown',
            timestamp: new Date()
          };
        }
      } catch (error) {
        instance.health = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        };
      }
      return instance.health;
    });

    return Promise.all(healthChecks);
  }

  /**
   * Get module load order
   */
  getLoadOrder(): string[] {
    return [...this.loadOrder];
  }

  /**
   * Check if module is loaded
   */
  isLoaded(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Get module status
   */
  getModuleStatus(moduleId: string): ModuleInstance | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Reload a module
   */
  async reloadModule(moduleId: string): Promise<void> {
    const instance = this.modules.get(moduleId);
    if (!instance) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    const modulePath = instance.metadata.id; // This should be the path, but we need to store it properly
    await this.unloadModule(moduleId);
    await this.loadModule(modulePath);
  }

  /**
   * Shutdown all modules
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Unload modules in reverse order
    const modulesToUnload = [...this.loadOrder].reverse();
    for (const moduleId of modulesToUnload) {
      try {
        await this.unloadModule(moduleId);
      } catch (error) {
        console.error(`Error unloading module ${moduleId}:`, error);
      }
    }
  }

  private async loadModuleMetadata(modulePath: string): Promise<ModuleMetadata> {
    try {
      // Try to load package.json first
      const packageJsonPath = `${modulePath}/package.json`;
      const fs = require('fs').promises;
      const path = require('path');

      const fullPath = path.resolve(packageJsonPath);
      const packageJson = JSON.parse(await fs.readFile(fullPath, 'utf-8'));

      // Load the actual module
      const moduleMain = packageJson.main || 'index.js';
      const mainPath = path.resolve(modulePath, moduleMain);
      const module = require(mainPath);

      if (!module.metadata) {
        throw new Error('Module does not export metadata');
      }

      return module.metadata as ModuleMetadata;
    } catch (error) {
      throw new Error(`Failed to load module metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateDependencies(metadata: ModuleMetadata): Promise<void> {
    for (const dep of metadata.dependencies) {
      if (!this.modules.has(dep)) {
        throw new Error(`Dependency '${dep}' not found for module '${metadata.id}'`);
      }

      const depInstance = this.modules.get(dep)!;
      if (depInstance.status !== 'initialized') {
        throw new Error(`Dependency '${dep}' is not initialized for module '${metadata.id}'`);
      }
    }
  }

  private async loadModuleConfig(metadata: ModuleMetadata, config: Record<string, any>): Promise<void> {
    // Load module-specific configuration
    const moduleConfig = {
      ...config,
      ...configManager.get(`modules.${metadata.id}`, {})
    };

    // Validate against schema if provided
    if (metadata.configSchema) {
      this.validateConfig(moduleConfig, metadata.configSchema);
    }

    // Store in config manager
    configManager.set(`modules.${metadata.id}`, moduleConfig);
  }

  private async initializeModule(instance: ModuleInstance, options: PluginLoadOptions): Promise<void> {
    try {
      instance.status = 'initializing';

      // Load the module
      const module = require(instance.metadata.id); // This needs proper path resolution

      // Create module instance
      const moduleInstance = new module.default({
        config: configManager.get(`modules.${instance.metadata.id}`, {}),
        services: serviceRegistry,
        events: eventBus,
        container: instance.container
      });

      instance.instance = moduleInstance;

      // Initialize the module
      if (typeof moduleInstance.initialize === 'function') {
        await moduleInstance.initialize();
      }

      instance.status = 'initialized';

    } catch (error) {
      instance.status = 'error';
      instance.error = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  private createIsolatedContainer(moduleId: string): any {
    // This would create an isolated container for the module
    // For now, return a basic container
    return {
      register: () => {},
      resolve: () => {},
      dispose: () => {}
    };
  }

  private validateConfig(config: Record<string, any>, schema: any): void {
    // Basic validation - could be enhanced with JSON schema validation
    if (typeof config !== 'object' || config === null) {
      throw new Error('Module configuration must be an object');
    }
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.options.healthCheckInterval);
  }
}

// Export singleton instance
export const pluginManager = new PluginManager();