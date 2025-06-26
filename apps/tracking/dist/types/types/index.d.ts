export interface TrackerConfig {
    apiUrl: string;
    projectId: string;
    debug?: boolean;
    enableGDPR?: boolean;
    cookieDomain?: string;
    sessionTimeout?: number;
    batchSize?: number;
    flushInterval?: number;
    platform?: string;
}
export interface VisitorSession {
    sessionId: string;
    visitorId: string;
    startTime: number;
    lastActivity: number;
    pageViews: number;
    platform: string;
    userAgent: string;
    referrer?: string;
    landingPage: string;
    companyId?: string;
    companyName?: string;
}
export interface PageViewData {
    url: string;
    title: string;
    timestamp: number;
    sessionId: string;
    visitorId: string;
    referrer?: string;
    scrollDepth?: number;
    timeOnPage?: number;
}
export interface EventData {
    type: 'click' | 'scroll' | 'form_submit' | 'download' | 'custom';
    element?: string;
    value?: string | number;
    timestamp: number;
    sessionId: string;
    visitorId: string;
    metadata?: Record<string, any>;
}
export interface CompanyData {
    id: string;
    name: string;
    domain: string;
    industry?: string;
    size?: 'small' | 'medium' | 'large' | 'enterprise';
    revenue?: string;
    confidence: number;
}
export interface TechStackDetection {
    cms?: string;
    framework?: string;
    analytics?: string[];
    libraries?: string[];
    server?: string;
    hosting?: string;
}
export interface TrackingEvent {
    type: string;
    data: any;
    timestamp: number;
    sessionId: string;
    visitorId: string;
}
export interface ModuleInterface {
    name: string;
    init(): void;
    destroy?(): void;
    enable?(): void;
    disable?(): void;
}
export interface EventEmitter {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    emit(event: string, ...args: any[]): void;
}
export interface StorageInterface {
    get(key: string): string | null;
    set(key: string, value: string, expiry?: number): void;
    remove(key: string): void;
    clear(): void;
}
export interface NetworkInterface {
    send(endpoint: string, data: any): Promise<Response>;
    batch(events: TrackingEvent[]): Promise<Response>;
}
export interface PlatformDetector {
    detect(): {
        platform: string;
        framework?: string;
        version?: string;
    };
}
export interface ConsentData {
    hasConsent: boolean;
    consentDate?: number;
    consentVersion?: string;
    purposes: {
        analytics: boolean;
        marketing: boolean;
        functional: boolean;
    };
}
export interface PerformanceMetrics {
    loadTime: number;
    domReady: number;
    firstPaint?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
}
export interface TrackerInstance extends EventEmitter {
    config: TrackerConfig;
    session: VisitorSession;
    isInitialized: boolean;
    init(config: TrackerConfig): Promise<void>;
    track(event: string, data?: any): void;
    identify(visitorId: string, traits?: Record<string, any>): void;
    pageView(data?: Partial<PageViewData>): void;
    use(module: ModuleInterface): void;
    getModule<T extends ModuleInterface>(name: string): T | null;
    setConsent(consent: ConsentData): void;
    hasConsent(): boolean;
    flush(): Promise<void>;
    destroy(): void;
}
export interface SessionOptions {
    sessionTimeout: number;
    enableCrossTabs: boolean;
    enableFingerprinting: boolean;
    fingerprintElements: FingerprintElement;
    sessionValidation: boolean;
    storagePrefix: string;
}
export interface FingerprintElement {
    screen: boolean;
    timezone: boolean;
    language: boolean;
    platform: boolean;
    plugins: boolean;
    canvas: boolean;
}
export interface SessionFingerprint {
    screenResolution: string;
    timezone: number;
    language: string;
    platform: string;
    browser: string;
    pluginsHash: string;
    canvasHash?: string;
    hash: string;
}
export interface SessionValidation {
    isValid: boolean;
    reasons: string[];
    fingerprint: SessionFingerprint;
    lastValidated: number;
}
export interface SessionEvent {
    type: 'session:created' | 'session:restored' | 'session:expired' | 'session:invalid' | 'session:synchronized';
    session: VisitorSession;
    timestamp: number;
    tabId: string;
}
//# sourceMappingURL=index.d.ts.map