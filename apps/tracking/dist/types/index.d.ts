import { Tracker } from './core/Tracker';
import { TrackerConfig } from './types';
export { EventEmitter } from './core/EventEmitter';
export { Storage } from './core/Storage';
export { Tracker } from './core/Tracker';
export * from './types';
export * from './utils';
export declare function init(config: TrackerConfig): Tracker;
export declare function getTracker(): Tracker | null;
export declare function track(event: string, data?: any): void;
export declare function pageView(data?: any): void;
export declare function identify(visitorId: string, traits?: Record<string, any>): void;
export declare function setConsent(consent: any): void;
export declare function createTracker(): Tracker;
declare const _default: {
    init: typeof init;
    getTracker: typeof getTracker;
    track: typeof track;
    pageView: typeof pageView;
    identify: typeof identify;
    setConsent: typeof setConsent;
    createTracker: typeof createTracker;
    Tracker: typeof Tracker;
};
export default _default;
//# sourceMappingURL=index.d.ts.map