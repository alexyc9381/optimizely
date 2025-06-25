import { EventEmitter as IEventEmitter } from '../types';
export declare class EventEmitter implements IEventEmitter {
    private _events;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    emit(event: string, ...args: any[]): void;
    once(event: string, callback: Function): void;
    removeAllListeners(event?: string): void;
    listenerCount(event: string): number;
    eventNames(): string[];
}
//# sourceMappingURL=EventEmitter.d.ts.map