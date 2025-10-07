import { IModuleContainer } from '../shared/interfaces';
import { ContainerOptions } from './types';
import { serviceRegistry } from './service-registry';

/**
 * Module Container - Provides isolated execution environment for modules
 * Supports dependency injection, lifecycle management, and resource isolation
 */
export class ModuleContainer implements IModuleContainer {
  private services = new Map<string, any>();
  private disposables: Array<() => void> = [];
  private isDisposed = false;
  private parentContainer?: ModuleContainer;
  private childContainers = new Set<ModuleContainer>();

  constructor(options: ContainerOptions = {}) {
    this.parentContainer = options.parent;

    // Register services from options
    if (options.services) {
      for (const descriptor of options.services) {
        this.register(descriptor.id, descriptor.implementation);
      }
    }

    // Register config if provided
    if (options.config) {
      this.register('config', options.config);
    }
  }

  /**
   * Create a child container
   */
  createContainer(moduleId: string): IModuleContainer {
    const childContainer = new ModuleContainer({
      parent: this
    });

    this.childContainers.add(childContainer);
    return childContainer;
  }

  /**
   * Register a service in the container
   */
  register<T>(id: string, service: T): void {
    if (this.isDisposed) {
      throw new Error('Cannot register service in disposed container');
    }

    this.services.set(id, service);

    // If service has dispose method, track it
    if (typeof service === 'object' && service !== null && 'dispose' in service) {
      this.disposables.push(() => {
        try {
          (service as any).dispose();
        } catch (error) {
          console.error(`Error disposing service ${id}:`, error);
        }
      });
    }
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(id: string): T {
    if (this.isDisposed) {
      throw new Error('Cannot resolve service from disposed container');
    }

    // Check local services first
    if (this.services.has(id)) {
      return this.services.get(id);
    }

    // Check parent container
    if (this.parentContainer) {
      try {
        return this.parentContainer.resolve<T>(id);
      } catch {
        // Continue to global registry
      }
    }

    // Fall back to global service registry
    return serviceRegistry.resolve<T>(id);
  }

  /**
   * Check if service exists in container
   */
  has(id: string): boolean {
    return this.services.has(id) ||
           (this.parentContainer ? this.parentContainer.has(id) : false) ||
           serviceRegistry.has(id);
  }

  /**
   * Dispose the container and clean up resources
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;

    // Dispose child containers first
    for (const child of this.childContainers) {
      try {
        child.dispose();
      } catch (error) {
        console.error('Error disposing child container:', error);
      }
    }
    this.childContainers.clear();

    // Dispose registered services
    for (const dispose of this.disposables.reverse()) {
      try {
        dispose();
      } catch (error) {
        console.error('Error in dispose function:', error);
      }
    }
    this.disposables = [];

    // Clear services
    this.services.clear();

    // Remove from parent
    if (this.parentContainer) {
      this.parentContainer.childContainers.delete(this);
    }
  }

  /**
   * Get all registered service IDs in this container
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get container statistics
   */
  getStats(): ContainerStats {
    return {
      serviceCount: this.services.size,
      childContainerCount: this.childContainers.size,
      isDisposed: this.isDisposed,
      disposablesCount: this.disposables.length
    };
  }
}

/**
 * Scoped Module Container - Provides request-scoped services
 */
export class ScopedModuleContainer extends ModuleContainer {
  private scopeId: string;

  constructor(scopeId: string, parent?: ModuleContainer) {
    super({ parent });
    this.scopeId = scopeId;
  }

  /**
   * Get the scope ID
   */
  getScopeId(): string {
    return this.scopeId;
  }
}

/**
 * Factory for creating module containers
 */
export class ContainerFactory {
  private static rootContainer = new ModuleContainer();

  /**
   * Create a root container
   */
  static createRoot(options: ContainerOptions = {}): ModuleContainer {
    return new ModuleContainer(options);
  }

  /**
   * Create a module-specific container
   */
  static createModule(moduleId: string, options: ContainerOptions = {}): ModuleContainer {
    return new ModuleContainer({
      ...options,
      parent: this.rootContainer
    });
  }

  /**
   * Create a scoped container
   */
  static createScoped(scopeId: string, parent?: ModuleContainer): ScopedModuleContainer {
    return new ScopedModuleContainer(scopeId, parent);
  }

  /**
   * Get the root container
   */
  static getRootContainer(): ModuleContainer {
    return this.rootContainer;
  }
}

export interface ContainerStats {
  serviceCount: number;
  childContainerCount: number;
  isDisposed: boolean;
  disposablesCount: number;
}

// Export singleton root container
export const rootContainer = ContainerFactory.getRootContainer();