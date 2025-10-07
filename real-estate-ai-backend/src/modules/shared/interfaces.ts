/**
 * Core interfaces for the modular architecture system
 */

export interface IModule {
  /**
   * Unique identifier for the module
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Module version
   */
  version: string;

  /**
   * Module dependencies
   */
  dependencies?: string[];

  /**
   * Initialize the module
   */
  initialize(): Promise<void>;

  /**
   * Shutdown the module
   */
  shutdown(): Promise<void>;

  /**
   * Get module health status
   */
  getHealth(): Promise<ModuleHealth>;
}

export interface ModuleHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  message?: string;
  timestamp: Date;
}

export interface IService {
  /**
   * Service identifier
   */
  id: string;

  /**
   * Service instance
   */
  instance: any;
}

export interface IServiceRegistry {
  /**
   * Register a service
   */
  register<T>(id: string, service: T, lifetime?: ServiceLifetime): void;

  /**
   * Resolve a service
   */
  resolve<T>(id: string): T;

  /**
   * Check if service exists
   */
  has(id: string): boolean;

  /**
   * Unregister a service
   */
  unregister(id: string): void;
}

export enum ServiceLifetime {
  Singleton = 'singleton',
  Scoped = 'scoped',
  Transient = 'transient'
}

export interface IEventBus {
  /**
   * Publish an event
   */
  publish(event: IEvent): Promise<void>;

  /**
   * Subscribe to events
   */
  subscribe(eventType: string, handler: EventHandler): void;

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType: string, handler: EventHandler): void;
}

export interface IEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source?: string;
}

export type EventHandler = (event: IEvent) => Promise<void> | void;

export interface IConfigManager {
  /**
   * Get configuration value
   */
  get<T>(key: string, defaultValue?: T): T;

  /**
   * Set configuration value
   */
  set<T>(key: string, value: T): void;

  /**
   * Check if key exists
   */
  has(key: string): boolean;

  /**
   * Load configuration from source
   */
  load(source: string): Promise<void>;

  /**
   * Watch for configuration changes
   */
  watch(key: string, callback: (value: any) => void): void;
}

export interface IPluginManager {
  /**
   * Load a module
   */
  loadModule(modulePath: string): Promise<void>;

  /**
   * Unload a module
   */
  unloadModule(moduleId: string): Promise<void>;

  /**
   * Get loaded modules
   */
  getModules(): IModule[];

  /**
   * Get module by ID
   */
  getModule(id: string): IModule | undefined;

  /**
   * Check module health
   */
  checkHealth(): Promise<ModuleHealth[]>;
}

export interface IModuleContainer {
  /**
   * Create isolated container for module
   */
  createContainer(moduleId: string): IModuleContainer;

  /**
   * Register service in container
   */
  register<T>(id: string, service: T): void;

  /**
   * Resolve service from container
   */
  resolve<T>(id: string): T;

  /**
   * Dispose container
   */
  dispose(): void;
}

export interface IMigrationManager {
  /**
   * Run migrations for module
   */
  migrate(moduleId: string): Promise<void>;

  /**
   * Rollback migrations for module
   */
  rollback(moduleId: string, steps?: number): Promise<void>;

  /**
   * Get migration status
   */
  getStatus(moduleId: string): Promise<MigrationStatus[]>;
}

export interface MigrationStatus {
  version: string;
  executed: boolean;
  timestamp?: Date;
}