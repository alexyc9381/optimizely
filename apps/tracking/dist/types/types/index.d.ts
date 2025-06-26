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
    websocket?: {
        enabled?: boolean;
        url?: string;
        autoConnect?: boolean;
        protocols?: string[];
        reconnect?: boolean;
        reconnectInterval?: number;
        maxReconnectAttempts?: number;
        heartbeatInterval?: number;
        messageQueueSize?: number;
        enableCompression?: boolean;
        enableFallback?: boolean;
        fallbackUrl?: string;
        timeout?: number;
    };
    gdpr?: GDPRConfig;
    performance?: PerformanceConfig;
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
        advertising?: boolean;
        personalization?: boolean;
    };
}
export interface GDPRConfig {
    enabled: boolean;
    consentBanner?: {
        enabled: boolean;
        position: 'top' | 'bottom' | 'modal';
        theme: 'light' | 'dark' | 'custom';
        customStyles?: Record<string, string>;
        texts?: GDPRTexts;
        showOnEveryPage?: boolean;
        respectDoNotTrack?: boolean;
    };
    cookieCategories?: CookieCategory[];
    dataRetention?: {
        defaultDays: number;
        purposeSpecific?: Record<string, number>;
        automaticDeletion: boolean;
    };
    userRights?: {
        enableDataAccess: boolean;
        enableDataDeletion: boolean;
        enableDataPortability: boolean;
        enableOptOut: boolean;
        contactEmail?: string;
    };
    privacyByDesign?: {
        dataMinimization: boolean;
        purposeLimitation: boolean;
        storageMinimization: boolean;
        autoAnonymization: boolean;
    };
    legalBasis?: LegalBasis;
}
export interface GDPRTexts {
    bannerTitle: string;
    bannerDescription: string;
    acceptAll: string;
    rejectAll: string;
    customize: string;
    savePreferences: string;
    necessary: string;
    analytics: string;
    marketing: string;
    privacyPolicy: string;
    cookiePolicy: string;
}
export interface CookieCategory {
    id: string;
    name: string;
    description: string;
    required: boolean;
    enabled: boolean;
    cookies: CookieInfo[];
    purpose: string;
    legalBasis: LegalBasis;
    retentionPeriod: number;
}
export interface CookieInfo {
    name: string;
    purpose: string;
    provider: string;
    expiry: string;
    type: 'essential' | 'analytics' | 'marketing' | 'functional' | 'advertising';
    domain?: string;
}
export interface LegalBasis {
    type: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
    description: string;
    legitimateInterests?: string;
}
export interface GDPRConsent extends ConsentData {
    id: string;
    timestamp: number;
    version: string;
    method: 'banner' | 'settings' | 'api' | 'implied';
    ipAddress?: string;
    userAgent?: string;
    categories: Record<string, boolean>;
    legalBasis: Record<string, LegalBasis>;
    withdrawalDate?: number;
    renewalRequired?: boolean;
    consentString?: string;
}
export interface DataSubjectRequest {
    id: string;
    type: 'access' | 'deletion' | 'portability' | 'rectification' | 'restriction' | 'objection';
    timestamp: number;
    visitorId: string;
    email?: string;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    requestData?: any;
    responseData?: any;
    completedAt?: number;
    expiresAt: number;
}
export interface PrivacySettings {
    dataMinimization: boolean;
    anonymizeIPs: boolean;
    respectDoNotTrack: boolean;
    cookielessTracking: boolean;
    storageMinimization: boolean;
    automaticDeletion: boolean;
    purposeLimitation: boolean;
    dataRetentionDays: number;
    consentRequired: boolean;
}
export interface GDPRComplianceModule extends ModuleInterface {
    showConsentBanner(): void;
    hideConsentBanner(): void;
    getConsent(): GDPRConsent | null;
    setConsent(consent: Partial<GDPRConsent>): void;
    withdrawConsent(category?: string): void;
    renewConsent(): void;
    getCookieCategories(): CookieCategory[];
    setCookieCategory(categoryId: string, enabled: boolean): void;
    clearCookies(category?: string): void;
    requestDataAccess(email?: string): Promise<DataSubjectRequest>;
    requestDataDeletion(email?: string): Promise<DataSubjectRequest>;
    requestDataPortability(email?: string): Promise<DataSubjectRequest>;
    getPrivacySettings(): PrivacySettings;
    setPrivacySettings(settings: Partial<PrivacySettings>): void;
    anonymizeData(data: any): any;
    isCompliant(): boolean;
    getComplianceReport(): GDPRComplianceReport;
    exportUserData(visitorId: string): Promise<UserDataExport>;
    deleteUserData(visitorId: string): Promise<boolean>;
}
export interface GDPRComplianceReport {
    timestamp: number;
    consentStatus: 'valid' | 'expired' | 'missing' | 'withdrawn';
    dataRetentionCompliance: boolean;
    cookieCompliance: boolean;
    privacySettingsCompliance: boolean;
    issues: string[];
    recommendations: string[];
}
export interface UserDataExport {
    visitorId: string;
    exportDate: number;
    sessions: VisitorSession[];
    events: EventData[];
    pageViews: PageViewData[];
    consent: GDPRConsent[];
    profile?: any;
    format: 'json' | 'csv' | 'xml';
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
    showConsentBanner(): void;
    hideConsentBanner(): void;
    getGDPRConsent(): GDPRConsent | null;
    setGDPRConsent(consent: Partial<GDPRConsent>): void;
    withdrawConsent(category?: string): void;
    requestDataAccess(email?: string): Promise<DataSubjectRequest>;
    requestDataDeletion(email?: string): Promise<DataSubjectRequest>;
    requestDataPortability(email?: string): Promise<DataSubjectRequest>;
    getPrivacySettings(): PrivacySettings;
    setPrivacySettings(settings: Partial<PrivacySettings>): void;
    isGDPRCompliant(): boolean;
    exportUserData(visitorId?: string): Promise<UserDataExport>;
    connectWebSocket(): Promise<void>;
    disconnectWebSocket(): void;
    sendWebSocketEvent(event: string, data?: any, priority?: 'low' | 'normal' | 'high' | 'critical'): Promise<boolean>;
    getWebSocketState(): WebSocketConnectionState | null;
    getWebSocketMetrics(): WebSocketMetrics | null;
    configurePerformance(config: Partial<PerformanceConfig>): void;
    getPerformanceMetrics(): PerformanceMetrics;
    getPerformanceReport(): PerformanceOptimizationReport;
    startPerformanceMonitoring(): void;
    stopPerformanceMonitoring(): void;
    optimizePerformance(): void;
    preloadCriticalResources(): Promise<void>;
    enableLazyLoading(): void;
    enableCodeSplitting(): void;
    measureCoreWebVitals(): Promise<CoreWebVitalsObserver>;
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
export interface WebSocketConfig {
    url?: string;
    protocols?: string[];
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
    messageQueueSize?: number;
    enableCompression?: boolean;
    enableFallback?: boolean;
    fallbackUrl?: string;
    timeout?: number;
    debug?: boolean;
}
export interface WebSocketMessage {
    id: string;
    type: 'event' | 'heartbeat' | 'ack' | 'error' | 'command';
    data?: any;
    timestamp: number;
    sessionId: string;
    visitorId: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    retry?: boolean;
}
export interface WebSocketConnectionState {
    status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed';
    url: string;
    protocol?: string;
    reconnectAttempts: number;
    lastError?: Error;
    connectedAt?: number;
    disconnectedAt?: number;
    latency?: number;
}
export interface WebSocketMetrics {
    messagesSet: number;
    messagesReceived: number;
    reconnections: number;
    errors: number;
    averageLatency: number;
    uptime: number;
    lastActivity: number;
}
export interface QueuedMessage extends WebSocketMessage {
    attempts: number;
    nextRetry: number;
    maxRetries: number;
}
export interface WebSocketEvents {
    'connection:open': WebSocketConnectionState;
    'connection:close': WebSocketConnectionState;
    'connection:error': {
        error: Error;
        state: WebSocketConnectionState;
    };
    'connection:reconnecting': WebSocketConnectionState;
    'connection:reconnected': WebSocketConnectionState;
    'message:sent': WebSocketMessage;
    'message:received': WebSocketMessage;
    'message:queued': WebSocketMessage;
    'message:failed': {
        message: WebSocketMessage;
        error: Error;
    };
    'heartbeat:sent': {
        timestamp: number;
    };
    'heartbeat:received': {
        timestamp: number;
        latency: number;
    };
    'queue:full': {
        size: number;
        dropped: WebSocketMessage;
    };
    'fallback:activated': {
        reason: string;
        url: string;
    };
}
export interface WebSocketManagerInterface extends ModuleInterface {
    readonly connectionState: WebSocketConnectionState;
    readonly metrics: WebSocketMetrics;
    readonly isConnected: boolean;
    readonly queueSize: number;
    connect(url?: string): Promise<void>;
    disconnect(): void;
    reconnect(): Promise<void>;
    send(message: Omit<WebSocketMessage, 'id' | 'timestamp' | 'sessionId' | 'visitorId'>): Promise<boolean>;
    sendEvent(event: string, data?: any, priority?: WebSocketMessage['priority']): Promise<boolean>;
    sendHeartbeat(): void;
    getConnectionState(): WebSocketConnectionState;
    getMetrics(): WebSocketMetrics;
    clearQueue(): void;
    on<K extends keyof WebSocketEvents>(event: K, callback: (data: WebSocketEvents[K]) => void): void;
    off<K extends keyof WebSocketEvents>(event: K, callback: (data: WebSocketEvents[K]) => void): void;
}
export interface HeartbeatConfig {
    interval: number;
    timeout: number;
    maxMissed: number;
    enabled: boolean;
}
export interface FallbackTransport {
    type: 'http' | 'sse' | 'polling';
    url: string;
    enabled: boolean;
    retryInterval: number;
}
export interface PerformanceConfig {
    enabled: boolean;
    lazyLoading?: {
        enabled: boolean;
        threshold: number;
        modules: string[];
        chunkSize: number;
    };
    codesplitting?: {
        enabled: boolean;
        splitPoints: string[];
        dynamicImports: boolean;
        preloadCritical: boolean;
    };
    memoryManagement?: {
        enabled: boolean;
        maxMemoryUsage: number;
        gcInterval: number;
        leakDetection: boolean;
        autoCleanup: boolean;
        memoryThreshold: number;
    };
    cpuThrottling?: {
        enabled: boolean;
        maxCpuUsage: number;
        throttleInterval: number;
        adaptiveThrottling: boolean;
        priorityQueue: boolean;
    };
    requestBatching?: {
        enabled: boolean;
        batchSize: number;
        flushInterval: number;
        maxBatchAge: number;
        priorityBatching: boolean;
        compression: boolean;
    };
    coreWebVitals?: {
        enabled: boolean;
        lcpThreshold: number;
        fidThreshold: number;
        clsThreshold: number;
        monitoring: boolean;
        optimization: boolean;
    };
    resourcePrioritization?: {
        enabled: boolean;
        criticalResources: string[];
        preloadThreshold: number;
        deferNonCritical: boolean;
        adaptivePriority: boolean;
    };
    crossPlatform?: {
        enabled: boolean;
        frameworkOptimizations: Record<string, any>;
        universalPolyfills: boolean;
        adaptiveLoading: boolean;
    };
}
export interface PerformanceMetrics {
    loadTime: number;
    domReady: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
    totalBlockingTime?: number;
    timeToInteractive?: number;
    memoryUsage?: {
        used: number;
        total: number;
        limit: number;
    };
    cpuUsage?: number;
    networkStats?: {
        requests: number;
        bytesTransferred: number;
        averageLatency: number;
    };
    scriptPerformance?: {
        initTime: number;
        executionTime: number;
        moduleLoadTimes: Record<string, number>;
    };
}
export interface PerformanceThresholds {
    memory: {
        warning: number;
        critical: number;
    };
    cpu: {
        warning: number;
        critical: number;
    };
    network: {
        latency: number;
        bandwidth: number;
    };
    coreWebVitals: {
        lcp: number;
        fid: number;
        cls: number;
    };
}
export interface LazyLoadModule {
    name: string;
    size: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
    dependencies: string[];
    loader: () => Promise<any>;
    loaded: boolean;
    loadTime?: number;
}
export interface CodeSplitPoint {
    name: string;
    condition: () => boolean;
    modules: string[];
    preload: boolean;
    critical: boolean;
}
export interface MemorySnapshot {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss?: number;
    leaks?: MemoryLeak[];
}
export interface MemoryLeak {
    type: string;
    size: number;
    location: string;
    stack?: string;
    timestamp: number;
}
export interface CpuProfile {
    timestamp: number;
    usage: number;
    tasks: {
        name: string;
        duration: number;
        cpu: number;
    }[];
    throttled: boolean;
}
export interface RequestBatch {
    id: string;
    requests: QueuedRequest[];
    size: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
    createdAt: number;
    flushAt: number;
    compressed: boolean;
}
export interface QueuedRequest {
    id: string;
    endpoint: string;
    method: string;
    data: any;
    priority: 'low' | 'normal' | 'high' | 'critical';
    timestamp: number;
    retries: number;
    maxRetries: number;
}
export interface CoreWebVitalsObserver {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    tbt?: number;
    tti?: number;
}
export interface ResourcePriority {
    resource: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    timing: 'immediate' | 'defer' | 'lazy' | 'preload';
    condition?: () => boolean;
}
export interface PlatformOptimization {
    platform: string;
    framework?: string;
    optimizations: {
        moduleLoading?: any;
        eventHandling?: any;
        rendering?: any;
        memory?: any;
        networking?: any;
    };
    polyfills?: string[];
    fallbacks?: string[];
}
export interface PerformanceOptimizationModule extends ModuleInterface {
    configure(config: Partial<PerformanceConfig>): void;
    getConfig(): PerformanceConfig;
    registerLazyModule(module: LazyLoadModule): void;
    loadModule(name: string): Promise<any>;
    preloadModules(names: string[]): Promise<void>;
    registerSplitPoint(splitPoint: CodeSplitPoint): void;
    splitCode(): Promise<void>;
    preloadCritical(): Promise<void>;
    getMemoryUsage(): MemorySnapshot;
    detectMemoryLeaks(): MemoryLeak[];
    cleanup(): void;
    forceGarbageCollection(): void;
    getCpuUsage(): CpuProfile;
    throttleCpu(enabled: boolean): void;
    queueTask(task: Function, priority: 'low' | 'normal' | 'high' | 'critical'): void;
    addRequest(request: Omit<QueuedRequest, 'id' | 'timestamp'>): string;
    flushBatch(batchId?: string): Promise<void>;
    getBatchStatus(): RequestBatch[];
    measureCoreWebVitals(): Promise<CoreWebVitalsObserver>;
    optimizeCoreWebVitals(): void;
    getCoreWebVitalsReport(): CoreWebVitalsObserver;
    prioritizeResource(resource: ResourcePriority): void;
    preloadCriticalResources(): Promise<void>;
    deferNonCriticalResources(): void;
    optimizeForPlatform(platform: string, framework?: string): void;
    enableUniversalPolyfills(): void;
    getOptimizationReport(): PerformanceOptimizationReport;
    startMonitoring(): void;
    stopMonitoring(): void;
    getMetrics(): PerformanceMetrics;
    getThresholds(): PerformanceThresholds;
    setThresholds(thresholds: Partial<PerformanceThresholds>): void;
}
export interface PerformanceOptimizationReport {
    timestamp: number;
    metrics: PerformanceMetrics;
    thresholds: PerformanceThresholds;
    violations: PerformanceViolation[];
    optimizations: OptimizationRecommendation[];
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
export interface PerformanceViolation {
    type: 'memory' | 'cpu' | 'network' | 'core-web-vitals' | 'resource';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: number;
    location?: string;
}
export interface OptimizationRecommendation {
    type: 'lazy-loading' | 'code-splitting' | 'memory' | 'cpu' | 'batching' | 'resource-priority';
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    action?: () => void;
}
//# sourceMappingURL=index.d.ts.map