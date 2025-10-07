import { IEventBus, IEvent, EventHandler } from '../shared/interfaces';
import { EventSubscription, EventBusOptions } from './types';

/**
 * Event Bus - Publish-Subscribe pattern for inter-module communication
 * Supports asynchronous event handling, event filtering, and persistence
 */
export class EventBus implements IEventBus {
  private subscriptions = new Map<string, EventSubscription[]>();
  private eventHistory: IEvent[] = [];
  private options: EventBusOptions;
  private isProcessing = false;

  constructor(options: EventBusOptions = {}) {
    this.options = {
      async: true,
      persistent: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };
  }

  /**
   * Publish an event to all subscribers
   */
  async publish(event: IEvent): Promise<void> {
    if (this.isProcessing && !this.options.async) {
      throw new Error('Event bus is already processing an event in synchronous mode');
    }

    this.isProcessing = true;

    try {
      // Add timestamp if not provided
      if (!event.timestamp) {
        event.timestamp = new Date();
      }

      // Store event history if persistent
      if (this.options.persistent) {
        this.eventHistory.push({ ...event });
        // Keep only last 1000 events to prevent memory leaks
        if (this.eventHistory.length > 1000) {
          this.eventHistory = this.eventHistory.slice(-1000);
        }
      }

      const subscribers = this.subscriptions.get(event.type) || [];

      if (this.options.async) {
        // Process asynchronously
        this.processEventAsync(event, subscribers).catch(error => {
          console.error(`Error processing event ${event.type}:`, error);
        });
      } else {
        // Process synchronously
        await this.processEventSync(event, subscribers);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscription: EventSubscription = {
      eventType,
      handler,
      priority: 0
    };

    this.subscriptions.get(eventType)!.push(subscription);

    // Sort by priority (higher priority first)
    this.subscriptions.get(eventType)!.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    const subscribers = this.subscriptions.get(eventType);
    if (!subscribers) return;

    const index = subscribers.findIndex(sub => sub.handler === handler);
    if (index > -1) {
      subscribers.splice(index, 1);
    }

    // Clean up empty subscription arrays
    if (subscribers.length === 0) {
      this.subscriptions.delete(eventType);
    }
  }

  /**
   * Subscribe with advanced options (priority, filtering)
   */
  subscribeAdvanced(subscription: EventSubscription): void {
    if (!this.subscriptions.has(subscription.eventType)) {
      this.subscriptions.set(subscription.eventType, []);
    }

    this.subscriptions.get(subscription.eventType)!.push(subscription);

    // Sort by priority
    this.subscriptions.get(subscription.eventType)!.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get event history
   */
  getEventHistory(eventType?: string, limit = 100): IEvent[] {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }

    return history.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get all subscribed event types
   */
  getSubscribedEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get subscriber count for an event type
   */
  getSubscriberCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.length || 0;
  }

  /**
   * Remove all subscriptions
   */
  clearSubscriptions(): void {
    this.subscriptions.clear();
  }

  private async processEventAsync(event: IEvent, subscribers: EventSubscription[]): Promise<void> {
    const promises = subscribers
      .filter(sub => !sub.filter || sub.filter(event))
      .map(async (sub) => {
        try {
          await this.executeHandler(sub.handler, event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
          // Continue processing other handlers even if one fails
        }
      });

    await Promise.allSettled(promises);
  }

  private async processEventSync(event: IEvent, subscribers: EventSubscription[]): Promise<void> {
    for (const sub of subscribers) {
      if (sub.filter && !sub.filter(event)) {
        continue;
      }

      await this.executeHandler(sub.handler, event);
    }
  }

  private async executeHandler(handler: EventHandler, event: IEvent): Promise<void> {
    let retries = 0;
    const maxRetries = this.options.maxRetries || 0;

    while (retries <= maxRetries) {
      try {
        await handler(event);
        return;
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          throw error;
        }

        // Wait before retry
        if (this.options.retryDelay) {
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        }
      }
    }
  }
}

/**
 * Global event bus instance
 */
export const eventBus = new EventBus({
  async: true,
  persistent: true,
  maxRetries: 3,
  retryDelay: 1000
});

/**
 * Helper function to create typed events
 */
export function createEvent<T = any>(type: string, payload: T, source?: string): IEvent {
  const event: IEvent = {
    type,
    payload,
    timestamp: new Date()
  };

  if (source !== undefined) {
    event.source = source;
  }

  return event;
}

/**
 * Helper function to subscribe to events with type safety
 */
export function subscribeToEvent<T = any>(
  eventBus: IEventBus,
  eventType: string,
  handler: (event: IEvent & { payload: T }) => void | Promise<void>
): void {
  eventBus.subscribe(eventType, handler as EventHandler);
}