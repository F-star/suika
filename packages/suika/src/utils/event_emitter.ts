
/**
 * EventEmiter
 *
 * Publish-Subscribe Design Pattern
 */

type EventName = string | symbol
type Listener = (...args: any[]) => void

class EventEmitter {
  private hashMap: { [eventName: string]: Array<Listener> } = {};

  on(eventName: EventName, listener: Listener): this {
    const name = eventName as string;
    if (!this.hashMap[name]) {
      this.hashMap[name] = [];
    }
    this.hashMap[name].push(listener);
    return this;
  }
  emit(eventName: EventName, ...args: any): boolean {
    const listeners = this.hashMap[eventName as string];
    if (!listeners || listeners.length === 0) return false;
    listeners.forEach(listener => {
      listener(...args);
    });
    return true;
  }
  off(eventName: EventName, listener: Listener): this {
    const listeners = this.hashMap[eventName as string];
    if (listeners && listeners.length > 0) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }
}

export default EventEmitter;