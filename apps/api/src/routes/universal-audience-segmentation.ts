import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import UniversalAudienceSegmentationEngine from '../services/universal-audience-segmentation-engine';

const router = express.Router();

// Initialize service
const service = new UniversalAudienceSegmentationEngine(redisManager.getClient());

// Rate limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP'
}) as any;

const strictLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests for this endpoint'
}) as any;

// Create audience profile
router.post('/profiles', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const profileData = req.body;
    const profileId = await service.createProfile(profileData);
    
    res.status(201).json({
      success: true,
      data: { profileId },
      message: 'Audience profile created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get audience profile
router.get('/profiles/:profileId', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { profileId } = req.params;
    const profile = await service.getProfile(profileId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: { profile }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update audience profile
router.put('/profiles/:profileId', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;
    
    await service.updateProfile(profileId, updates);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get multiple profiles with filtering
router.get('/profiles', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const filters = {
      segmentIds: req.query.segmentIds ? String(req.query.segmentIds).split(',') : undefined,
      userIds: req.query.userIds ? String(req.query.userIds).split(',') : undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined,
      offset: req.query.offset ? parseInt(String(req.query.offset)) : undefined,
    };
    
    const profiles = await service.getProfiles(filters);
    
    res.json({
      success: true,
      data: { profiles, count: profiles.length }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create audience segment
router.post('/segments', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const segmentData = req.body;
    const segmentId = await service.createSegment(segmentData);
    
    res.status(201).json({
      success: true,
      data: { segmentId },
      message: 'Audience segment created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get audience segment
router.get('/segments/:segmentId', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { segmentId } = req.params;
    const segment = await service.getSegment(segmentId);
    
    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }
    
    res.json({
      success: true,
      data: { segment }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update audience segment
router.put('/segments/:segmentId', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { segmentId } = req.params;
    const updates = req.body;
    
    await service.updateSegment(segmentId, updates);
    
    res.json({
      success: true,
      message: 'Segment updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get multiple segments with filtering
router.get('/segments', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const filters = {
      type: req.query.type ? String(req.query.type) : undefined,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      tags: req.query.tags ? String(req.query.tags).split(',') : undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined,
    };
    
    const segments = await service.getSegments(filters);
    
    res.json({
      success: true,
      data: { segments, count: segments.length }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process segmentation request
router.post('/segmentation/process', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const request = req.body;
    const result = await service.processSegmentation(request);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Queue real-time update
router.post('/realtime/update', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const update = req.body;
    update.timestamp = new Date();
    
    await service.queueRealTimeUpdate(update);
    
    res.json({
      success: true,
      message: 'Real-time update queued successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get service health status
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
