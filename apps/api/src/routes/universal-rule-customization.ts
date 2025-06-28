import { Router, Request, Response } from 'express';
import { universalRuleCustomizationEngine } from '../services/universal-rule-customization-engine';

const router = Router();

// Initialize the rule engine
universalRuleCustomizationEngine.initialize().catch(console.error);

// Rule Management Endpoints

/**
 * Create a new business rule
 */
router.post('/rules', async (req: Request, res: Response) => {
  try {
    const ruleData = {
      ...req.body,
      version: req.body.version || '1.0.0',
      tags: req.body.tags || [],
      validationRules: req.body.validationRules || []
    };

    const rule = await universalRuleCustomizationEngine.createRule(ruleData);
    
    res.status(201).json({
      success: true,
      data: rule,
      message: 'Rule created successfully'
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create rule'
    });
  }
});

/**
 * Get all business rules with optional filtering
 */
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    
    if (req.query.category) {
      filters.category = req.query.category as string;
    }
    
    if (req.query.tags) {
      filters.tags = (req.query.tags as string).split(',');
    }
    
    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit as string);
    }
    
    if (req.query.offset) {
      filters.offset = parseInt(req.query.offset as string);
    }

    const rules = await universalRuleCustomizationEngine.getRules(filters);
    
    res.json({
      success: true,
      data: rules,
      count: rules.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error getting rules:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rules'
    });
  }
});

/**
 * Get a specific business rule by ID
 */
router.get('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await universalRuleCustomizationEngine.getRule(id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error getting rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rule'
    });
  }
});

/**
 * Execute a business rule with input data
 */
router.post('/rules/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Input data is required'
      });
    }
    
    const execution = await universalRuleCustomizationEngine.executeRule(id, data);
    
    res.json({
      success: true,
      data: execution,
      message: 'Rule executed successfully'
    });
  } catch (error) {
    console.error('Error executing rule:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute rule'
    });
  }
});

/**
 * Get rule engine health status
 */
router.get('/rules/health', async (req: Request, res: Response) => {
  try {
    const health = await universalRuleCustomizationEngine.getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health status'
    });
  }
});

export default router;
