import { Request, Response } from 'express';
import { AnalyticsServiceManager } from '../services/analytics-service';

// Initialize analytics service for GraphQL context
const analyticsService = new AnalyticsServiceManager();

export interface Context {
  req: Request;
  res: Response;
  analyticsService: AnalyticsServiceManager;
  user: {
    id: string;
    apiKey: string;
    permissions: string[];
  } | null;
}

export interface CreateContextParams {
  req: Request;
  res: Response;
}

// Authentication helper
const authenticateRequest = (req: Request): Context['user'] | null => {
  // Check for API key in headers
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization as string;

  let extractedKey: string | null = null;

  if (apiKey) {
    extractedKey = apiKey;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    extractedKey = authHeader.substring(7);
  }

  if (!extractedKey) {
    return null;
  }

  // Basic API key validation (in production, this should validate against a database)
  const validApiKeys = ['test-api-key', 'demo-key', 'admin-key'];

  if (validApiKeys.includes(extractedKey)) {
    return {
      id: `user_${extractedKey}`,
      apiKey: extractedKey,
      permissions: extractedKey === 'admin-key' ? ['read', 'write', 'admin'] : ['read', 'write'],
    };
  }

  return null;
};

// Create GraphQL context
export const createContext = async ({ req, res }: CreateContextParams): Promise<Context> => {
  // Authenticate the request
  const user = authenticateRequest(req);

  // Ensure analytics service is initialized
  try {
    await analyticsService.start();
  } catch (error) {
    console.warn('Analytics service initialization warning:', error);
  }

  return {
    req,
    res,
    analyticsService,
    user,
  };
};

// Helper function to check authentication
export const requireAuth = (context: Context): NonNullable<Context['user']> => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context.user;
};

// Helper function to check specific permissions
export const requirePermission = (context: Context, permission: string): void => {
  const user = requireAuth(context);
  if (!user.permissions.includes(permission)) {
    throw new Error(`Permission '${permission}' required`);
  }
};
