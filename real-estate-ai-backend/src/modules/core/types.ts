/**
 * Core types for the modular architecture system
 */

export type ModuleStatus = 'loading' | 'loaded' | 'initializing' | 'initialized' | 'error' | 'unloading' | 'unloaded';

export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies: string[];
  configSchema?: any;
  migrationPath?: string;
}

export interface ModuleInstance {
  metadata: ModuleMetadata;
  status: ModuleStatus;
  instance: any;
  container: any;
  health: any;
  error?: Error;
}

export interface ServiceDescriptor {
  id: string;
  implementation: any;
  lifetime: ServiceLifetime;
  dependencies?: string[];
  tags?: string[];
}

export enum ServiceLifetime {
  Singleton = 'singleton',
  Scoped = 'scoped',
  Transient = 'transient'
}

export interface EventSubscription {
  eventType: string;
  handler: import('../shared/interfaces').EventHandler;
  priority?: number;
  filter?: (event: any) => boolean;
}

export interface ConfigSource {
  name: string;
  priority: number;
  load(): Promise<Record<string, any>>;
  watch?(callback: (config: Record<string, any>) => void): void;
}

export interface MigrationScript {
  version: string;
  up: (db: any) => Promise<void>;
  down: (db: any) => Promise<void>;
  description?: string;
}

export interface ModuleTemplate {
  name: string;
  description: string;
  files: Array<{
    path: string;
    content: string;
    template?: boolean;
  }>;
  dependencies?: string[];
}

export interface PluginLoadOptions {
  path: string;
  config?: Record<string, any>;
  isolated?: boolean;
  autoStart?: boolean;
}

export interface ContainerOptions {
  parent?: any;
  services?: ServiceDescriptor[];
  config?: Record<string, any>;
}

export interface EventBusOptions {
  async?: boolean;
  persistent?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ConfigManagerOptions {
  sources?: ConfigSource[];
  validation?: boolean;
  hotReload?: boolean;
}

export interface ServiceRegistryOptions {
  allowOverrides?: boolean;
  strictMode?: boolean;
  autoResolve?: boolean;
}

export interface PluginManagerOptions {
  modulePaths?: string[];
  autoDiscovery?: boolean;
  healthCheckInterval?: number;
  maxLoadTime?: number;
}