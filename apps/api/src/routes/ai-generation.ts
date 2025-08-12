import express from 'express';
import { geminiAIService, VariantGenerationRequest } from '../services/gemini-ai-service';

const router = express.Router();

// POST /generate-variants - Generate A/B test variants using Gemini AI
router.post('/generate-variants', async (req, res) => {
  try {
    const {
      elementType,
      originalContent,
      hypothesis,
      targetUrl,
      industry,
      context,
      count = 3
    } = req.body;

    if (!elementType || !originalContent) {
      return res.status(400).json({
        success: false,
        error: 'elementType and originalContent are required'
      });
    }

    const request: VariantGenerationRequest = {
      elementType,
      originalContent,
      hypothesis: hypothesis || '',
      targetUrl,
      industry,
      context
    };

    console.log('AI Generation: Generating variants for:', {
      elementType,
      originalContent: originalContent.substring(0, 50) + '...',
      count
    });

    const variants = await geminiAIService.generateVariants(request, count);

    res.json({
      success: true,
      data: variants
    });

  } catch (error) {
    console.error('AI Generation: Error generating variants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate variants: ' + (error as Error).message
    });
  }
});

// POST /generate-hypothesis - Generate test hypothesis using Gemini AI
router.post('/generate-hypothesis', async (req, res) => {
  try {
    const { elementType, originalContent, targetUrl, industry, context } = req.body;

    if (!elementType || !originalContent) {
      return res.status(400).json({
        success: false,
        error: 'elementType and originalContent are required'
      });
    }

    const request = {
      elementType,
      originalContent,
      targetUrl,
      industry,
      context
    };

    console.log('AI Generation: Generating hypothesis for:', {
      elementType,
      originalContent: originalContent.substring(0, 50) + '...'
    });

    const hypothesis = await geminiAIService.generateHypothesis(request);

    res.json({
      success: true,
      data: { hypothesis }
    });

  } catch (error) {
    console.error('AI Generation: Error generating hypothesis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate hypothesis: ' + (error as Error).message
    });
  }
});

// POST /generate-description - Generate test description using Gemini AI
router.post('/generate-description', async (req, res) => {
  try {
    const { elementType, originalContent, hypothesis, targetUrl, industry } = req.body;

    if (!elementType || !originalContent || !hypothesis) {
      return res.status(400).json({
        success: false,
        error: 'elementType, originalContent, and hypothesis are required'
      });
    }

    const request: VariantGenerationRequest = {
      elementType,
      originalContent,
      hypothesis,
      targetUrl,
      industry
    };

    console.log('AI Generation: Generating description for:', {
      elementType,
      hypothesis: hypothesis.substring(0, 50) + '...'
    });

    const description = await geminiAIService.generateTestDescription(request);

    res.json({
      success: true,
      data: { description }
    });

  } catch (error) {
    console.error('AI Generation: Error generating description:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate description: ' + (error as Error).message
    });
  }
});

export default router;
