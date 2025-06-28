import crypto from 'crypto';
import { EventEmitter } from 'events';
import Redis from 'ioredis';

// =============================================================================
// CORE INTERFACES - Universal OAuth 2.0 System
// =============================================================================

export interface OAuthProvider {
  id: string;
  name: string;
  type: 'salesforce' | 'hubspot' | 'pipedrive' | 'custom';
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scope: string[];
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isActive: boolean;
  customConfig?: Record<string, any>;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  scope: string[];
  issuedAt: Date;
  providerId: string;
  userId: string;
  organizationId?: string;
}

export interface OAuthSession {
  sessionId: string;
  providerId: string;
  userId: string;
  state: string;
  codeVerifier?: string; // PKCE
  codeChallenge?: string; // PKCE
  redirectUri: string;
  scope: string[];
  createdAt: Date;
  expiresAt: Date;
  isComplete: boolean;
  metadata?: Record<string, any>;
}

export interface OAuthAuthorizationRequest {
  providerId: string;
  userId: string;
  scope?: string[];
  state?: string;
  usePKCE?: boolean;
  customParams?: Record<string, string>;
}

export interface OAuthTokenExchange {
  code: string;
  state: string;
  sessionId?: string;
  codeVerifier?: string;
}

export interface OAuthRefreshRequest {
  providerId: string;
  userId: string;
  refreshToken?: string;
}

export interface OAuthRevocationRequest {
  providerId: string;
  userId: string;
  token: string;
  tokenType?: 'access_token' | 'refresh_token';
}

export interface OAuthValidationResult {
  isValid: boolean;
  token?: OAuthToken;
  error?: string;
  needsRefresh?: boolean;
}

export interface OAuthAuditLog {
  id: string;
  providerId: string;
  userId: string;
  action: 'authorize' | 'token_exchange' | 'refresh' | 'revoke' | 'validate';
  status: 'success' | 'failure' | 'error';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface OAuthMetrics {
  totalTokens: number;
  activeTokens: number;
  expiredTokens: number;
  revokedTokens: number;
  tokensByProvider: Record<string, number>;
  authorizationsByProvider: Record<string, number>;
  refreshesByProvider: Record<string, number>;
  errorsByProvider: Record<string, number>;
  averageTokenLifetime: number;
}

export interface OAuthFilters {
  providerId?: string;
  userId?: string;
  organizationId?: string;
  isActive?: boolean;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

// =============================================================================
// UNIVERSAL OAUTH 2.0 SERVICE
// =============================================================================

export class OAuthService extends EventEmitter {
  private redis: Redis;
  private providers: Map<string, OAuthProvider> = new Map();
  private tokens: Map<string, OAuthToken> = new Map();
  private sessions: Map<string, OAuthSession> = new Map();
  private auditLogs: OAuthAuditLog[] = [];
  private metricsCache: OAuthMetrics | null = null;
  private metricsInterval?: NodeJS.Timeout;
  private jwtSecret: string;

  constructor(redis: Redis, jwtSecret?: string) {
    super();
    this.redis = redis;
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET || 'oauth-default-secret';
    this.initializeDefaultProviders();
    this.startMetricsCalculation();
    this.generateMockData();
  }

  // =============================================================================
  // PROVIDER MANAGEMENT
  // =============================================================================

  private initializeDefaultProviders(): void {
    const defaultProviders: OAuthProvider[] = [
      {
        id: 'salesforce',
        name: 'Salesforce',
        type: 'salesforce',
        authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        revokeUrl: 'https://login.salesforce.com/services/oauth2/revoke',
        scope: ['api', 'refresh_token', 'offline_access'],
        clientId: process.env.SALESFORCE_CLIENT_ID || 'sf_client_id',
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET || 'sf_client_secret',
        redirectUri: process.env.SALESFORCE_REDIRECT_URI || 'https://api.optimizely.com/oauth/callback/salesforce',
        isActive: true
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        type: 'hubspot',
        authUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        scope: ['contacts', 'companies', 'deals', 'tickets'],
        clientId: process.env.HUBSPOT_CLIENT_ID || 'hs_client_id',
        clientSecret: process.env.HUBSPOT_CLIENT_SECRET || 'hs_client_secret',
        redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'https://api.optimizely.com/oauth/callback/hubspot',
        isActive: true
      },
      {
        id: 'pipedrive',
        name: 'Pipedrive',
        type: 'pipedrive',
        authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
        tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
        scope: ['deals:read', 'deals:write', 'contacts:read', 'contacts:write'],
        clientId: process.env.PIPEDRIVE_CLIENT_ID || 'pd_client_id',
        clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET || 'pd_client_secret',
        redirectUri: process.env.PIPEDRIVE_REDIRECT_URI || 'https://api.optimizely.com/oauth/callback/pipedrive',
        isActive: true
      }
    ];

    defaultProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  async addProvider(provider: Omit<OAuthProvider, 'id'>): Promise<OAuthProvider> {
    const id = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProvider: OAuthProvider = {
      id,
      ...provider
    };

    this.providers.set(id, newProvider);
    await this.redis.setex(`oauth:provider:${id}`, 3600, JSON.stringify(newProvider));

    this.emit('providerAdded', newProvider);
    return newProvider;
  }

  async updateProvider(providerId: string, updates: Partial<OAuthProvider>): Promise<OAuthProvider | null> {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    const updatedProvider = { ...provider, ...updates };
    this.providers.set(providerId, updatedProvider);
    await this.redis.setex(`oauth:provider:${providerId}`, 3600, JSON.stringify(updatedProvider));

    this.emit('providerUpdated', updatedProvider);
    return updatedProvider;
  }

  getProvider(providerId: string): OAuthProvider | null {
    return this.providers.get(providerId) || null;
  }

  getProviders(filters?: { type?: string; isActive?: boolean }): OAuthProvider[] {
    let providers = Array.from(this.providers.values());

    if (filters?.type) {
      providers = providers.filter(p => p.type === filters.type);
    }

    if (filters?.isActive !== undefined) {
      providers = providers.filter(p => p.isActive === filters.isActive);
    }

    return providers;
  }

  // =============================================================================
  // AUTHORIZATION FLOW
  // =============================================================================

  async generateAuthorizationUrl(request: OAuthAuthorizationRequest): Promise<{
    authUrl: string;
    sessionId: string;
    state: string;
  }> {
    const provider = this.providers.get(request.providerId);
    if (!provider) {
      throw new Error(`Provider ${request.providerId} not found`);
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const state = request.state || crypto.randomBytes(32).toString('hex');
    const scope = request.scope || provider.scope;

    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    // PKCE implementation
    if (request.usePKCE) {
      codeVerifier = crypto.randomBytes(32).toString('base64url');
      codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    }

    const session: OAuthSession = {
      sessionId,
      providerId: request.providerId,
      userId: request.userId,
      state,
      codeVerifier,
      codeChallenge,
      redirectUri: provider.redirectUri,
      scope,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isComplete: false,
      metadata: request.customParams
    };

    this.sessions.set(sessionId, session);
    await this.redis.setex(`oauth:session:${sessionId}`, 600, JSON.stringify(session));

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      scope: scope.join(' '),
      state,
      ...request.customParams
    });

    if (codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    const authUrl = `${provider.authUrl}?${params.toString()}`;

    this.auditLog({
      providerId: request.providerId,
      userId: request.userId,
      action: 'authorize',
      status: 'success',
      metadata: { sessionId, state }
    });

    return { authUrl, sessionId, state };
  }

  // =============================================================================
  // TOKEN EXCHANGE
  // =============================================================================

  async exchangeCodeForToken(exchange: OAuthTokenExchange): Promise<OAuthToken> {
    const session = this.sessions.get(exchange.sessionId || '');
    if (!session || exchange.state !== session.state) {
      throw new Error('Invalid session or state parameter');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Authorization session has expired');
    }

    const provider = this.providers.get(session.providerId);
    if (!provider) {
      throw new Error(`Provider ${session.providerId} not found`);
    }

    try {
      // Simulate token exchange (in real implementation, make HTTP request)
      const tokenData = await this.simulateTokenExchange(provider, exchange.code, session);

      const token: OAuthToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in || 3600,
        expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
        scope: tokenData.scope?.split(' ') || session.scope,
        issuedAt: new Date(),
        providerId: session.providerId,
        userId: session.userId,
        organizationId: tokenData.organization_id
      };

      const tokenKey = `${session.providerId}:${session.userId}`;
      this.tokens.set(tokenKey, token);
      await this.redis.setex(`oauth:token:${tokenKey}`, token.expiresIn, JSON.stringify(token));

      // Mark session as complete
      session.isComplete = true;
      this.sessions.set(session.sessionId, session);

      this.emit('tokenIssued', token);
      this.auditLog({
        providerId: session.providerId,
        userId: session.userId,
        action: 'token_exchange',
        status: 'success',
        metadata: { tokenType: token.tokenType, expiresIn: token.expiresIn }
      });

      return token;
    } catch (error) {
      this.auditLog({
        providerId: session.providerId,
        userId: session.userId,
        action: 'token_exchange',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async simulateTokenExchange(provider: OAuthProvider, code: string, session: OAuthSession): Promise<any> {
    // Simulate different provider responses
    const baseToken = {
      access_token: `${provider.type}_${crypto.randomBytes(32).toString('hex')}`,
      refresh_token: `${provider.type}_refresh_${crypto.randomBytes(32).toString('hex')}`,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: session.scope.join(' ')
    };

    switch (provider.type) {
      case 'salesforce':
        return {
          ...baseToken,
          instance_url: 'https://optimizely.my.salesforce.com',
          id: 'https://login.salesforce.com/id/00Dxx0000000000EAA/005xx000000000TAAQ',
          signature: crypto.randomBytes(32).toString('hex')
        };
      case 'hubspot':
        return {
          ...baseToken,
          hub_domain: 'optimizely.hubspot.com',
          hub_id: 12345678
        };
      case 'pipedrive':
        return {
          ...baseToken,
          api_domain: 'optimizely.pipedrive.com',
          company_id: 87654321
        };
      default:
        return baseToken;
    }
  }

  // =============================================================================
  // TOKEN REFRESH
  // =============================================================================

  async refreshToken(request: OAuthRefreshRequest): Promise<OAuthToken> {
    const tokenKey = `${request.providerId}:${request.userId}`;
    const existingToken = this.tokens.get(tokenKey);

    if (!existingToken && !request.refreshToken) {
      throw new Error('No existing token or refresh token provided');
    }

    const refreshToken = request.refreshToken || existingToken?.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const provider = this.providers.get(request.providerId);
    if (!provider) {
      throw new Error(`Provider ${request.providerId} not found`);
    }

    try {
      // Simulate token refresh (in real implementation, make HTTP request)
      const tokenData = await this.simulateTokenRefresh(provider, refreshToken);

      const newToken: OAuthToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in || 3600,
        expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
        scope: tokenData.scope?.split(' ') || existingToken?.scope || [],
        issuedAt: new Date(),
        providerId: request.providerId,
        userId: request.userId,
        organizationId: existingToken?.organizationId
      };

      this.tokens.set(tokenKey, newToken);
      await this.redis.setex(`oauth:token:${tokenKey}`, newToken.expiresIn, JSON.stringify(newToken));

      this.emit('tokenRefreshed', newToken);
      this.auditLog({
        providerId: request.providerId,
        userId: request.userId,
        action: 'refresh',
        status: 'success',
        metadata: { expiresIn: newToken.expiresIn }
      });

      return newToken;
    } catch (error) {
      this.auditLog({
        providerId: request.providerId,
        userId: request.userId,
        action: 'refresh',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async simulateTokenRefresh(provider: OAuthProvider, refreshToken: string): Promise<any> {
    return {
      access_token: `${provider.type}_${crypto.randomBytes(32).toString('hex')}`,
      refresh_token: refreshToken, // Some providers rotate refresh tokens
      token_type: 'Bearer',
      expires_in: 3600
    };
  }

  // =============================================================================
  // TOKEN VALIDATION
  // =============================================================================

  async validateToken(providerId: string, userId: string, accessToken?: string): Promise<OAuthValidationResult> {
    const tokenKey = `${providerId}:${userId}`;
    const token = this.tokens.get(tokenKey);

    if (!token) {
      return { isValid: false, error: 'Token not found' };
    }

    if (accessToken && token.accessToken !== accessToken) {
      return { isValid: false, error: 'Token mismatch' };
    }

    if (token.expiresAt < new Date()) {
      return { isValid: false, error: 'Token expired', needsRefresh: !!token.refreshToken };
    }

    this.auditLog({
      providerId,
      userId,
      action: 'validate',
      status: 'success'
    });

    return { isValid: true, token };
  }

  // =============================================================================
  // TOKEN REVOCATION
  // =============================================================================

  async revokeToken(request: OAuthRevocationRequest): Promise<boolean> {
    const provider = this.providers.get(request.providerId);
    if (!provider) {
      throw new Error(`Provider ${request.providerId} not found`);
    }

    try {
      // Simulate token revocation (in real implementation, make HTTP request to revoke endpoint)
      await this.simulateTokenRevocation(provider, request.token);

      const tokenKey = `${request.providerId}:${request.userId}`;
      this.tokens.delete(tokenKey);
      await this.redis.del(`oauth:token:${tokenKey}`);

      this.emit('tokenRevoked', { providerId: request.providerId, userId: request.userId });
      this.auditLog({
        providerId: request.providerId,
        userId: request.userId,
        action: 'revoke',
        status: 'success',
        metadata: { tokenType: request.tokenType }
      });

      return true;
    } catch (error) {
      this.auditLog({
        providerId: request.providerId,
        userId: request.userId,
        action: 'revoke',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async simulateTokenRevocation(provider: OAuthProvider, token: string): Promise<void> {
    // Simulate successful revocation
    return Promise.resolve();
  }

  // =============================================================================
  // TOKEN MANAGEMENT
  // =============================================================================

  getToken(providerId: string, userId: string): OAuthToken | null {
    const tokenKey = `${providerId}:${userId}`;
    return this.tokens.get(tokenKey) || null;
  }

  getTokens(filters?: OAuthFilters): OAuthToken[] {
    let tokens = Array.from(this.tokens.values());

    if (filters?.providerId) {
      tokens = tokens.filter(t => t.providerId === filters.providerId);
    }

    if (filters?.userId) {
      tokens = tokens.filter(t => t.userId === filters.userId);
    }

    if (filters?.organizationId) {
      tokens = tokens.filter(t => t.organizationId === filters.organizationId);
    }

    if (filters?.isActive !== undefined) {
      const now = new Date();
      if (filters.isActive) {
        tokens = tokens.filter(t => t.expiresAt > now);
      } else {
        tokens = tokens.filter(t => t.expiresAt <= now);
      }
    }

    if (filters?.expiresAfter) {
      tokens = tokens.filter(t => t.expiresAt > filters.expiresAfter!);
    }

    if (filters?.expiresBefore) {
      tokens = tokens.filter(t => t.expiresAt < filters.expiresBefore!);
    }

    return tokens;
  }

  // =============================================================================
  // SESSION MANAGEMENT
  // =============================================================================

  getSession(sessionId: string): OAuthSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getSessions(filters?: { providerId?: string; userId?: string; isComplete?: boolean }): OAuthSession[] {
    let sessions = Array.from(this.sessions.values());

    if (filters?.providerId) {
      sessions = sessions.filter(s => s.providerId === filters.providerId);
    }

    if (filters?.userId) {
      sessions = sessions.filter(s => s.userId === filters.userId);
    }

    if (filters?.isComplete !== undefined) {
      sessions = sessions.filter(s => s.isComplete === filters.isComplete);
    }

    return sessions;
  }

  // =============================================================================
  // METRICS AND ANALYTICS
  // =============================================================================

  private startMetricsCalculation(): void {
    this.metricsInterval = setInterval(() => {
      this.calculateMetrics();
    }, 30 * 60 * 1000); // Calculate every 30 minutes
  }

  private calculateMetrics(): void {
    const tokens = Array.from(this.tokens.values());
    const now = new Date();

    const activeTokens = tokens.filter(t => t.expiresAt > now);
    const expiredTokens = tokens.filter(t => t.expiresAt <= now);

    const tokensByProvider: Record<string, number> = {};
    const authorizationsByProvider: Record<string, number> = {};
    const refreshesByProvider: Record<string, number> = {};
    const errorsByProvider: Record<string, number> = {};

    // Count tokens by provider
    tokens.forEach(token => {
      tokensByProvider[token.providerId] = (tokensByProvider[token.providerId] || 0) + 1;
    });

    // Count audit logs by provider and action
    this.auditLogs.forEach(log => {
      if (log.action === 'authorize') {
        authorizationsByProvider[log.providerId] = (authorizationsByProvider[log.providerId] || 0) + 1;
      } else if (log.action === 'refresh') {
        refreshesByProvider[log.providerId] = (refreshesByProvider[log.providerId] || 0) + 1;
      }

      if (log.status === 'error') {
        errorsByProvider[log.providerId] = (errorsByProvider[log.providerId] || 0) + 1;
      }
    });

    // Calculate average token lifetime
    const lifetimes = tokens.map(t => t.expiresIn);
    const averageTokenLifetime = lifetimes.length > 0
      ? lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length
      : 0;

    this.metricsCache = {
      totalTokens: tokens.length,
      activeTokens: activeTokens.length,
      expiredTokens: expiredTokens.length,
      revokedTokens: 0, // Would track separately in real implementation
      tokensByProvider,
      authorizationsByProvider,
      refreshesByProvider,
      errorsByProvider,
      averageTokenLifetime
    };

    this.emit('metricsCalculated', this.metricsCache);
  }

  getMetrics(): OAuthMetrics | null {
    return this.metricsCache;
  }

  // =============================================================================
  // AUDIT LOGGING
  // =============================================================================

  private auditLog(entry: Omit<OAuthAuditLog, 'id' | 'timestamp'>): void {
    const auditEntry: OAuthAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry
    };

    this.auditLogs.push(auditEntry);

    // Keep only last 1000 entries in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    this.emit('auditLog', auditEntry);
  }

  getAuditLogs(filters?: {
    providerId?: string;
    userId?: string;
    action?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): OAuthAuditLog[] {
    let logs = [...this.auditLogs];

    if (filters?.providerId) {
      logs = logs.filter(l => l.providerId === filters.providerId);
    }

    if (filters?.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }

    if (filters?.action) {
      logs = logs.filter(l => l.action === filters.action);
    }

    if (filters?.status) {
      logs = logs.filter(l => l.status === filters.status);
    }

    if (filters?.startDate) {
      logs = logs.filter(l => l.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      logs = logs.filter(l => l.timestamp <= filters.endDate!);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, token] of this.tokens.entries()) {
      if (token.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.tokens.delete(key);
      await this.redis.del(`oauth:token:${key}`);
    }

    this.emit('tokensCleanedUp', { count: expiredKeys.length });
    return expiredKeys.length;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.sessions.delete(sessionId);
      await this.redis.del(`oauth:session:${sessionId}`);
    }

    this.emit('sessionsCleanedUp', { count: expiredSessions.length });
    return expiredSessions.length;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: number;
    tokens: number;
    activeSessions: number;
    metricsStatus: 'active' | 'inactive';
  }> {
    const activeProviders = this.getProviders({ isActive: true }).length;
    const totalTokens = this.tokens.size;
    const activeSessions = this.getSessions({ isComplete: false }).length;
    const metricsActive = this.metricsInterval !== undefined;

    const status = activeProviders > 0 && metricsActive ? 'healthy' :
                   activeProviders > 0 ? 'degraded' : 'unhealthy';

    return {
      status,
      providers: activeProviders,
      tokens: totalTokens,
      activeSessions,
      metricsStatus: metricsActive ? 'active' : 'inactive'
    };
  }

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
    this.removeAllListeners();
  }

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  generateMockData(): void {
    // Generate mock tokens for testing
    const mockUsers = ['user1', 'user2', 'user3'];
    const providers = Array.from(this.providers.keys());

    mockUsers.forEach((userId, index) => {
      providers.forEach(providerId => {
        if (Math.random() > 0.3) { // 70% chance of having a token
          const expiresIn = 3600 + Math.random() * 3600; // 1-2 hours
          const token: OAuthToken = {
            accessToken: `${providerId}_${crypto.randomBytes(16).toString('hex')}`,
            refreshToken: `${providerId}_refresh_${crypto.randomBytes(16).toString('hex')}`,
            tokenType: 'Bearer',
            expiresIn: Math.floor(expiresIn),
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            scope: this.providers.get(providerId)?.scope || [],
            issuedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            providerId,
            userId,
            organizationId: `org_${index + 1}`
          };

          const tokenKey = `${providerId}:${userId}`;
          this.tokens.set(tokenKey, token);
        }
      });
    });

    // Generate mock audit logs
    for (let i = 0; i < 50; i++) {
      const providerId = providers[Math.floor(Math.random() * providers.length)];
      const userId = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const actions: Array<OAuthAuditLog['action']> = ['authorize', 'token_exchange', 'refresh', 'validate'];
      const statuses: Array<OAuthAuditLog['status']> = ['success', 'success', 'success', 'failure']; // Mostly success

      this.auditLog({
        providerId,
        userId,
        action: actions[Math.floor(Math.random() * actions.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        metadata: { mockData: true }
      });
    }

    this.calculateMetrics();
  }
}

export default OAuthService;
