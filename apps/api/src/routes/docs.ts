import express from 'express';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

const router = express.Router();

// Load OpenAPI specification
let openApiDoc: any = null;
try {
  const openApiPath = path.join(__dirname, '../../docs/openapi.yaml');
  openApiDoc = yaml.load(fs.readFileSync(openApiPath, 'utf8'));
} catch (error) {
  console.warn('⚠️  Could not load OpenAPI documentation:', error);
}

// API Documentation routes
router.get('/', (req, res) => {
  if (openApiDoc) {
    res.json({
      message: 'Universal AI A/B Testing Platform API Documentation',
      version: openApiDoc.info?.version || '1.0.0',
      title: openApiDoc.info?.title || 'Universal AI A/B Testing Platform API',
      description: openApiDoc.info?.description || 'Comprehensive API for AI-powered A/B testing across multiple platforms',
      endpoints: {
        openapi_spec: '/docs/openapi.json',
        openapi_yaml: '/docs/openapi.yaml',
        health: '/docs/health'
      },
      note: 'This API supports multiple authentication methods. See the OpenAPI specification for full details.',
      swagger_ui: 'Swagger UI temporarily disabled - use OpenAPI spec endpoints above'
    });
  } else {
    res.status(503).json({
      error: 'OpenAPI documentation not available',
      message: 'Could not load API specification',
      endpoints: {
        health: '/docs/health'
      }
    });
  }
});

// Raw OpenAPI spec endpoints
router.get('/openapi.yaml', (req, res) => {
  if (openApiDoc) {
    try {
      const openApiPath = path.join(__dirname, '../../docs/openapi.yaml');
      res.setHeader('Content-Type', 'text/yaml');
      res.sendFile(openApiPath);
    } catch (error) {
      res.status(404).json({ error: 'OpenAPI YAML file not found' });
    }
  } else {
    res.status(404).json({ error: 'OpenAPI specification not loaded' });
  }
});

router.get('/openapi.json', (req, res) => {
  if (openApiDoc) {
    res.json(openApiDoc);
  } else {
    res.status(404).json({ error: 'OpenAPI specification not loaded' });
  }
});

// Health endpoint for docs service
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Documentation service is running',
    features: {
      openApiSpec: !!openApiDoc,
      swaggerUI: false // Temporarily disabled due to TypeScript compatibility
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
