import { IConfigManager } from '../shared/interfaces';
import { ConfigSource, ConfigManagerOptions } from './types';

/**
 * Configuration Manager - Handles configuration loading, validation, and runtime updates
 * Supports multiple configuration sources with priority-based merging
 */
export class ConfigManager implements IConfigManager {
  private config = new Map<string, any>();
  private sources: ConfigSource[] = [];
  private watchers = new Map<string, ((value: any) => void)[]>();
  private options: ConfigManagerOptions;

  constructor(options: ConfigManagerOptions = {}) {
    this.options = {
      validation: true,
      hotReload: false,
      ...options
    };
  }

  /**
   * Get configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    const value = this.getNestedValue(key);
    if (value !== undefined) {
      return value as T;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(`Configuration key '${key}' not found and no default value provided`);
  }

  /**
   * Set configuration value
   */
  set<T>(key: string, value: T): void {
    this.setNestedValue(key, value);

    // Notify watchers
    const watchers = this.watchers.get(key);
    if (watchers) {
      watchers.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in config watcher for key '${key}':`, error);
        }
      });
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.getNestedValue(key) !== undefined;
  }

  /**
   * Load configuration from source
   */
  async load(source: string): Promise<void> {
    const configSource = this.sources.find(s => s.name === source);
    if (!configSource) {
      throw new Error(`Configuration source '${source}' not found`);
    }

    try {
      const configData = await configSource.load();

      // Validate if validation is enabled
      if (this.options.validation) {
        this.validateConfig(configData);
      }

      // Merge with existing config (source priority determines override behavior)
      this.mergeConfig(configData, configSource.priority);

      // Set up watching if supported and hot reload is enabled
      if (this.options.hotReload && configSource.watch) {
        configSource.watch((newConfig) => {
          this.mergeConfig(newConfig, configSource.priority);
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load configuration from '${source}': ${message}`);
    }
  }

  /**
   * Watch for configuration changes
   */
  watch(key: string, callback: (value: any) => void): void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, []);
    }
    this.watchers.get(key)!.push(callback);
  }

  /**
   * Add a configuration source
   */
  addSource(source: ConfigSource): void {
    // Remove existing source with same name if it exists
    this.sources = this.sources.filter(s => s.name !== source.name);
    this.sources.push(source);

    // Sort by priority (higher priority first)
    this.sources.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a configuration source
   */
  removeSource(name: string): void {
    this.sources = this.sources.filter(s => s.name !== name);
  }

  /**
   * Get all configuration as object
   */
  getAll(): Record<string, any> {
    return this.mapToObject(this.config);
  }

  /**
   * Clear all configuration
   */
  clear(): void {
    this.config.clear();
    this.watchers.clear();
  }

  /**
   * Load all sources
   */
  async loadAll(): Promise<void> {
    for (const source of this.sources) {
      await this.load(source.name);
    }
  }

  private getNestedValue(key: string): any {
    const keys = key.split('.');
    let current: any = this.config;

    for (const k of keys) {
      if (current instanceof Map) {
        current = current.get(k);
      } else if (typeof current === 'object' && current !== null) {
        current = current[k];
      } else {
        return undefined;
      }

      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  private setNestedValue(key: string, value: any): void {
    const keys = key.split('.');
    let current: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(current instanceof Map)) {
        if (typeof current !== 'object' || current === null) {
          current = new Map();
          // Go back and set the parent
          this.setNestedValue(keys.slice(0, i).join('.'), current);
          current = this.getNestedValue(keys.slice(0, i + 1).join('.'));
        }
      }

      if (current instanceof Map) {
        if (!current.has(k)) {
          current.set(k, new Map());
        }
        current = current.get(k);
      } else {
        if (!current[k]) {
          current[k] = {};
        }
        current = current[k];
      }
    }

    const lastKey = keys[keys.length - 1];
    if (current instanceof Map) {
      current.set(lastKey, value);
    } else {
      current[lastKey] = value;
    }
  }

  private mergeConfig(newConfig: Record<string, any>, priority: number): void {
    this.mergeObject(this.config, newConfig);
  }

  private mergeObject(target: Map<string, any>, source: Record<string, any>): void {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (!target.has(key)) {
          target.set(key, new Map());
        }
        this.mergeObject(target.get(key), value);
      } else {
        target.set(key, value);
      }
    }
  }

  private mapToObject(map: Map<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of map.entries()) {
      if (value instanceof Map) {
        result[key] = this.mapToObject(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private validateConfig(config: Record<string, any>): void {
    // Basic validation - can be extended with JSON schema validation
    if (typeof config !== 'object' || config === null) {
      throw new Error('Configuration must be a valid object');
    }
  }
}

/**
 * Environment-based configuration source
 */
export class EnvironmentConfigSource implements ConfigSource {
  name = 'environment';
  priority = 10;

  async load(): Promise<Record<string, any>> {
    const config: Record<string, any> = {};

    // Load all environment variables that start with CONFIG_
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('CONFIG_')) {
        const configKey = key.substring(7).toLowerCase().replace(/_/g, '.');
        this.setNestedConfigValue(config, configKey, this.parseValue(value));
      }
    }

    return config;
  }

  private parseValue(value: string | undefined): any {
    if (value === undefined) return undefined;

    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // If not JSON, try to parse as boolean or number
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      if (!isNaN(Number(value))) return Number(value);
      return value;
    }
  }

  private setNestedConfigValue(obj: Record<string, any>, key: string, value: any): void {
    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }
}

/**
 * File-based configuration source
 */
export class FileConfigSource implements ConfigSource {
  constructor(
    public name: string,
    private filePath: string,
    public priority = 5
  ) {}

  async load(): Promise<Record<string, any>> {
    const fs = require('fs').promises;
    const path = require('path');

    const fullPath = path.resolve(this.filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    if (this.filePath.endsWith('.json')) {
      return JSON.parse(content);
    }

    // For other formats, you could add support for YAML, TOML, etc.
    throw new Error(`Unsupported configuration file format: ${this.filePath}`);
  }

  watch?(callback: (config: Record<string, any>) => void): void {
    const fs = require('fs');
    const path = require('path');

    const fullPath = path.resolve(this.filePath);
    let lastModified = 0;

    fs.watchFile(fullPath, { interval: 1000 }, async () => {
      try {
        const stat = await fs.promises.stat(fullPath);
        if (stat.mtimeMs > lastModified) {
          lastModified = stat.mtimeMs;
          const config = await this.load();
          callback(config);
        }
      } catch (error) {
        console.error(`Error watching config file ${this.filePath}:`, error);
      }
    });
  }
}

// Export singleton instance
export const configManager = new ConfigManager({
  validation: true,
  hotReload: true
});

// Add default environment source
configManager.addSource(new EnvironmentConfigSource());