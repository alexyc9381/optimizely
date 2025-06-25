import { ConsentData, ModuleInterface, PageViewData, TrackerConfig, TrackerInstance, VisitorSession } from '../types';
import { EventEmitter } from './EventEmitter';
export declare class Tracker extends EventEmitter implements TrackerInstance {
    config: TrackerConfig;
    session: VisitorSession;
    isInitialized: boolean;
    private _storage;
    private _modules;
    private _eventQueue;
    private _flushTimer?;
    private _destroyed;
    constructor();
    init(config: TrackerConfig): void;
    track(event: string, data?: any): void;
    identify(visitorId: string, traits?: Record<string, any>): void;
    pageView(data?: Partial<PageViewData>): void;
    use(module: ModuleInterface): void;
    getModule<T extends ModuleInterface>(name: string): T | null;
    setConsent(consent: ConsentData): void;
    hasConsent(): boolean;
    flush(): Promise<void>;
    destroy(): void;
    private _initializeSession;
    private _createNewSession;
    private _createEmptySession;
    private _saveSession;
    private _queueEvent;
    private _startFlushTimer;
    private _sendEvents;
}
//# sourceMappingURL=Tracker.d.ts.map