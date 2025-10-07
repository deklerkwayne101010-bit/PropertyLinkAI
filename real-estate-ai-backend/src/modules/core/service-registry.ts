import { IServiceRegistry, ServiceLifetime, IService } from '../shared/interfaces';
import { ServiceDescriptor } from './types';

/**
 * Service Registry - Dependency Injection Container
 * Provides interface-based dependency injection with support for different service lifetimes
 */
export class ServiceRegistry implements IServiceRegistry {
  private services = new Map<string, ServiceDescriptor>();
  private singletons = new Map<string, any>();
  private scopedServices = new Map<string, Map<string, any>>();
  private options: { allowOverrides?: boolean; strictMode?: boolean; autoResolve?: boolean } = {};

  constructor(options: { allowOverrides?: boolean; strictMode?: boolean; autoResolve?: boolean } = {}) {
    this.options = { allowOverrides: false, strictMode: true, autoResolve: true, ...options };
  }

  /**
   * Register a service with the registry
   */
  register<T>(id: string, service: T, lifetime: ServiceLifetime = ServiceLifetime.Singleton): void {
    if (this.services.has(id) && !this.options.allowOverrides) {
      throw new Error(`Service '${id}' is already registered. Use allowOverrides option to override.`);
    }

    const descriptor: ServiceDescriptor = {
      id,
      implementation: service,
      lifetime,
      dependencies: this.extractDependencies(service)
    };

    this.services.set(id, descriptor);

    // Clear singleton cache if overriding
    if (this.singletons.has(id)) {
      this.singletons.delete(id);
    }
  }

  /**
   * Resolve a service from the registry
   */
  resolve<T>(id: string): T {
    const descriptor = this.services.get(id);
    if (!descriptor) {
      if (this.options.strictMode) {
        throw new Error(`Service '${id}' not found in registry`);
      }
      return null as T;
    }

    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        return this.resolveSingleton<T>(descriptor);
      case ServiceLifetime.Transient:
        return this.resolveTransient<T>(descriptor);
      case ServiceLifetime.Scoped:
        return this.resolveScoped<T>(descriptor);
      default:
        throw new Error(`Unknown service lifetime: ${descriptor.lifetime}`);
    }
  }

  /**
   * Check if a service is registered
   */
  has(id: string): boolean {
    return this.services.has(id);
  }

  /**
   * Unregister a service
   */
  unregister(id: string): void {
    if (!this.services.has(id)) {
      return;
    }

    this.services.delete(id);
    this.singletons.delete(id);

    // Clear from all scopes
    for (const scope of this.scopedServices.values()) {
      scope.delete(id);
    }
  }

  /**
   * Create a new scope for scoped services
   */
  createScope(scopeId: string): IServiceRegistry {
    const scopedRegistry = new ScopedServiceRegistry(this, scopeId);
    this.scopedServices.set(scopeId, new Map());
    return scopedRegistry;
  }

  /**
   * Dispose a scope
   */
  disposeScope(scopeId: string): void {
    this.scopedServices.delete(scopeId);
  }

  /**
   * Get all registered service IDs
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.scopedServices.clear();
  }

  private resolveSingleton<T>(descriptor: ServiceDescriptor): T {
    if (!this.singletons.has(descriptor.id)) {
      const instance = this.instantiateService<T>(descriptor);
      this.singletons.set(descriptor.id, instance);
    }
    return this.singletons.get(descriptor.id);
  }

  private resolveTransient<T>(descriptor: ServiceDescriptor): T {
    return this.instantiateService<T>(descriptor);
  }

  private resolveScoped<T>(descriptor: ServiceDescriptor): T {
    // For scoped services, we need a scope context
    // This is a simplified implementation - in a real app you'd use async local storage
    const scopeId = 'default'; // This should come from context
    let scope = this.scopedServices.get(scopeId);
    if (!scope) {
      scope = new Map();
      this.scopedServices.set(scopeId, scope);
    }

    if (!scope.has(descriptor.id)) {
      const instance = this.instantiateService<T>(descriptor);
      scope.set(descriptor.id, instance);
    }

    return scope.get(descriptor.id);
  }

  private instantiateService<T>(descriptor: ServiceDescriptor): T {
    let instance = descriptor.implementation;

    // If it's a class constructor, instantiate it
    if (typeof descriptor.implementation === 'function' && descriptor.implementation.prototype) {
      try {
        // Try to resolve dependencies if autoResolve is enabled
        if (this.options.autoResolve && descriptor.dependencies) {
          const deps = descriptor.dependencies.map(dep => this.resolve(dep));
          instance = new (descriptor.implementation as any)(...deps);
        } else {
          instance = new (descriptor.implementation as any)();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to instantiate service '${descriptor.id}': ${message}`);
      }
    }

    return instance;
  }

  private extractDependencies(service: any): string[] {
    // Simple dependency extraction - in a real implementation you'd use reflection or decorators
    // For now, return empty array - dependencies would be specified manually or via decorators
    return [];
  }
}

/**
 * Scoped Service Registry for handling scoped services
 */
class ScopedServiceRegistry implements IServiceRegistry {
  constructor(private parent: ServiceRegistry, private scopeId: string) {}

  register<T>(id: string, service: T, lifetime?: ServiceLifetime): void {
    // Scoped registries delegate to parent for registration
    this.parent.register(id, service, lifetime);
  }

  resolve<T>(id: string): T {
    const descriptor = (this.parent as any).services.get(id);
    if (!descriptor) {
      throw new Error(`Service '${id}' not found`);
    }

    if (descriptor.lifetime === ServiceLifetime.Scoped) {
      let scope = (this.parent as any).scopedServices.get(this.scopeId);
      if (!scope) {
        scope = new Map();
        (this.parent as any).scopedServices.set(this.scopeId, scope);
      }

      if (!scope.has(id)) {
        const instance = (this.parent as any).instantiateService(descriptor);
        scope.set(id, instance);
      }

      return scope.get(id);
    }

    // For singleton and transient, delegate to parent
    return this.parent.resolve<T>(id);
  }

  has(id: string): boolean {
    return this.parent.has(id);
  }

  unregister(id: string): void {
    // Scoped registries don't unregister services
  }
}

// Export singleton instance
export const serviceRegistry = new ServiceRegistry();