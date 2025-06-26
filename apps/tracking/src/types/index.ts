// Universal Tracking Types
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
  // WebSocket configuration
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
  // GDPR configuration
  gdpr?: GDPRConfig;
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

// GDPR Compliance Types
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

// Enhanced GDPR Compliance Types
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
  retentionPeriod: number; // days
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
  consentString?: string; // TCF 2.0 compatible
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
  // Consent Management
  showConsentBanner(): void;
  hideConsentBanner(): void;
  getConsent(): GDPRConsent | null;
  setConsent(consent: Partial<GDPRConsent>): void;
  withdrawConsent(category?: string): void;
  renewConsent(): void;

  // Cookie Management
  getCookieCategories(): CookieCategory[];
  setCookieCategory(categoryId: string, enabled: boolean): void;
  clearCookies(category?: string): void;

  // Data Subject Rights
  requestDataAccess(email?: string): Promise<DataSubjectRequest>;
  requestDataDeletion(email?: string): Promise<DataSubjectRequest>;
  requestDataPortability(email?: string): Promise<DataSubjectRequest>;

  // Privacy Controls
  getPrivacySettings(): PrivacySettings;
  setPrivacySettings(settings: Partial<PrivacySettings>): void;
  anonymizeData(data: any): any;

  // Compliance Checks
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

// Performance tracking
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

  // Core methods
  init(config: TrackerConfig): Promise<void>;
  track(event: string, data?: any): void;
  identify(visitorId: string, traits?: Record<string, any>): void;
  pageView(data?: Partial<PageViewData>): void;

  // Module management
  use(module: ModuleInterface): void;
  getModule<T extends ModuleInterface>(name: string): T | null;

  // GDPR (Legacy)
  setConsent(consent: ConsentData): void;
  hasConsent(): boolean;

  // Enhanced GDPR Methods
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

  // WebSocket methods
  connectWebSocket(): Promise<void>;
  disconnectWebSocket(): void;
  sendWebSocketEvent(event: string, data?: any, priority?: 'low' | 'normal' | 'high' | 'critical'): Promise<boolean>;
  getWebSocketState(): WebSocketConnectionState | null;
  getWebSocketMetrics(): WebSocketMetrics | null;

  // Utility
  flush(): Promise<void>;
  destroy(): void;
}

// Session Management Types
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

// WebSocket Communication Types
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
  'connection:error': { error: Error; state: WebSocketConnectionState };
  'connection:reconnecting': WebSocketConnectionState;
  'connection:reconnected': WebSocketConnectionState;
  'message:sent': WebSocketMessage;
  'message:received': WebSocketMessage;
  'message:queued': WebSocketMessage;
  'message:failed': { message: WebSocketMessage; error: Error };
  'heartbeat:sent': { timestamp: number };
  'heartbeat:received': { timestamp: number; latency: number };
  'queue:full': { size: number; dropped: WebSocketMessage };
  'fallback:activated': { reason: string; url: string };
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

  // Event subscription methods
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
