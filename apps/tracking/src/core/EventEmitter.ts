import { EventEmitter as IEventEmitter } from '../types';

/**
 * Lightweight EventEmitter implementation
 * Optimized for minimal bundle size while providing core functionality
 */
export class EventEmitter implements IEventEmitter {
  private _events: Map<string, Function[]> = new Map();

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this._events.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this._events.delete(event);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  emit(event: string, ...args: any[]): void {
    const listeners = this._events.get(event);
    if (listeners) {
      // Create a copy to avoid issues if listeners are modified during emission
      const copy = [...listeners];
      copy.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          // Silently catch errors to prevent one listener from breaking others
          if (process.env.NODE_ENV !== 'production') {
            console.error('Event listener error:', error);
          }
        }
      });
    }
  }

  /**
   * Add one-time event listener
   */
  once(event: string, callback: Function): void {
    const onceWrapper = (...args: any[]) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Remove all listeners for an event, or all events if no event specified
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: string): number {
    const listeners = this._events.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): string[] {
    return Array.from(this._events.keys());
  }
}
