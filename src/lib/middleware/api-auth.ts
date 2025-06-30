import { NextApiRequest } from 'next';

interface AuthResult {
  valid: boolean;
  clientId: string;
  apiKey: string;
}

interface RateLimitResult {
  allowed: boolean;
  resetTime?: number;
  remainingRequests?: number;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const API_KEYS = new Map<string, string>([
  ['test_key_123', 'client_test'],
  ['dev_key_456', 'client_dev'],
  ['prod_key_789', 'client_prod']
]);

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  premium: { requests: 1000, window: 60 * 1000 } // 1000 requests per minute
};

export async function validateApiKey(req: NextApiRequest): Promise<AuthResult> {
  const authHeader = req.headers.authorization;
  const apiKeyQuery = req.query.api_key as string;

  let apiKey = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7);
  } else if (apiKeyQuery) {
    apiKey = apiKeyQuery;
  }

  if (!apiKey) {
    return { valid: false, clientId: '', apiKey: '' };
  }

  const clientId = API_KEYS.get(apiKey);
  if (!clientId) {
    return { valid: false, clientId: '', apiKey };
  }

  return { valid: true, clientId, apiKey };
}

export async function rateLimitCheck(req: NextApiRequest, clientId: string): Promise<RateLimitResult> {
  const key = `${clientId}_${req.socket.remoteAddress}`;
  const now = Date.now();
  const limit = RATE_LIMITS.default;

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.window });
    return {
      allowed: true,
      remainingRequests: limit.requests - 1,
      resetTime: now + limit.window
    };
  }

  if (current.count >= limit.requests) {
    return {
      allowed: false,
      resetTime: current.resetTime,
      remainingRequests: 0
    };
  }

  current.count++;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remainingRequests: limit.requests - current.count,
    resetTime: current.resetTime
  };
}

export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
