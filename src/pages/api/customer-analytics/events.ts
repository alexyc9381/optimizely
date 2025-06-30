import type { NextApiRequest, NextApiResponse } from 'next';
import { DeepCustomerProfilingEngine } from '../../../lib/services/deep-customer-profiling-engine';
import { BehavioralEvent, EventContext, DeviceInfo } from '../../../lib/types/customer-analytics';

// Rate limiting for event processing
const eventRequestCounts = new Map<string, { count: number; resetTime: number }>();
const EVENT_RATE_LIMIT = 1000; // events per hour per IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkEventRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = eventRequestCounts.get(ip);
  
  if (!userRequests || now > userRequests.resetTime) {
    eventRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userRequests.count >= EVENT_RATE_LIMIT) {
    return false;
  }
  
  userRequests.count++;
  return true;
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress;
  return ip || 'unknown';
}

function validateEventRequest(data: any): BehavioralEvent {
  // Required fields validation
  if (!data.customerId && !data.visitorId) {
    throw new Error('Either customerId or visitorId is required');
  }
  
  if (!data.eventType) {
    throw new Error('eventType is required');
  }
  
  if (!data.sessionId) {
    throw new Error('sessionId is required');
  }
  
  // Validate event type
  const validEventTypes = [
    'page_view', 'button_click', 'form_submit', 'document_download', 'video_play',
    'scroll_depth', 'time_on_page', 'search_performed', 'feature_interaction',
    'pricing_viewed', 'demo_requested', 'contact_attempt', 'api_docs_viewed',
    'integration_explored', 'competitor_comparison', 'session_start', 'session_end', 'custom'
  ];
  
  if (!validEventTypes.includes(data.eventType)) {
    throw new Error(`Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`);
  }
  
  // Extract device info from user agent
  const userAgent = data.userAgent || '';
  const deviceInfo: DeviceInfo = {
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    browserVersion: detectBrowserVersion(userAgent),
    os: detectOS(userAgent),
    osVersion: detectOSVersion(userAgent),
    screenResolution: data.screenResolution || 'unknown'
  };
  
  // Build event context
  const context: EventContext = {
    page: data.page || data.eventData?.page || 'unknown',
    referrer: data.referrer || '',
    userAgent: userAgent,
    ipAddress: data.ipAddress || 'unknown',
    geolocation: data.geolocation,
    deviceInfo
  };
  
  return {
    eventId: data.eventId || generateEventId(),
    customerId: data.customerId || `visitor_${data.visitorId}`,
    eventType: data.eventType,
    eventData: data.eventData || {},
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    sessionId: data.sessionId,
    source: data.source || 'web',
    context
  };
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const mobileRegex = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
  
  if (tabletRegex.test(userAgent)) return 'tablet';
  if (mobileRegex.test(userAgent)) return 'mobile';
  return 'desktop';
}

function detectBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
}

function detectBrowserVersion(userAgent: string): string {
  const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/);
  return match ? match[2] : 'Unknown';
}

function detectOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS X')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function detectOSVersion(userAgent: string): string {
  let match;
  
  if (userAgent.includes('Windows NT')) {
    match = userAgent.match(/Windows NT (\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  if (userAgent.includes('Mac OS X')) {
    match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    return match ? match[1].replace(/_/g, '.') : 'Unknown';
  }
  
  if (userAgent.includes('Android')) {
    match = userAgent.match(/Android (\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  return 'Unknown';
}

function calculateEventPriority(event: BehavioralEvent): 'high' | 'medium' | 'low' {
  const highPriorityEvents = [
    'demo_requested', 'contact_attempt', 'pricing_viewed', 'form_submit', 'api_docs_viewed'
  ];
  
  const mediumPriorityEvents = [
    'document_download', 'feature_interaction', 'integration_explored', 
    'competitor_comparison', 'video_play'
  ];
  
  if (highPriorityEvents.includes(event.eventType)) return 'high';
  if (mediumPriorityEvents.includes(event.eventType)) return 'medium';
  return 'low';
}

interface EventProcessingResponse {
  success: boolean;
  eventId: string;
  priority: 'high' | 'medium' | 'low';
  profileUpdated: boolean;
  alertsTriggered: string[];
  recommendations?: string[];
  processingTime: number;
}

interface BatchEventResponse {
  success: boolean;
  batchId: string;
  processedEvents: number;
  failedEvents: number;
  processingTime: number;
  errors: string[];
  highPriorityEvents: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EventProcessingResponse | BatchEventResponse | { error: string; details?: string }>
) {
  const startTime = Date.now();
  
  // Check rate limiting
  const clientIP = getClientIP(req);
  if (!checkEventRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      details: `Maximum ${EVENT_RATE_LIMIT} events per hour allowed`
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const profilingEngine = DeepCustomerProfilingEngine.getInstance();
    
    // Check if this is a batch request
    const isBatchRequest = Array.isArray(req.body.events);
    
    if (isBatchRequest) {
      return await handleBatchEvents(req, res, profilingEngine, startTime);
    } else {
      return await handleSingleEvent(req, res, profilingEngine, startTime);
    }
    
  } catch (error) {
    console.error('Error processing event request:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: 'Failed to process event request',
      details: isDevelopment ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
}

async function handleSingleEvent(
  req: NextApiRequest,
  res: NextApiResponse<EventProcessingResponse | { error: string; details?: string }>,
  profilingEngine: DeepCustomerProfilingEngine,
  startTime: number
) {
  // Validate and create event
  const event = validateEventRequest(req.body);
  const priority = calculateEventPriority(event);
  
  console.log(`Processing ${priority} priority event: ${event.eventType} for customer: ${event.customerId}`);
  
  // Process the event
  await profilingEngine.processEvent(event);
  
  // Determine if profile was updated (simplified logic)
  const profileUpdated = priority === 'high' || Math.random() > 0.7;
  
  // Mock alerts and recommendations
  const alertsTriggered: string[] = [];
  const recommendations: string[] = [];
  
  if (event.eventType === 'demo_requested') {
    alertsTriggered.push('high_intent_alert');
    recommendations.push('schedule_follow_up_within_24h');
  }
  
  if (event.eventType === 'pricing_viewed' && event.eventData.timeOnPage > 120) {
    alertsTriggered.push('pricing_interest_alert');
    recommendations.push('send_pricing_guide');
  }
  
  if (event.eventType === 'api_docs_viewed') {
    alertsTriggered.push('technical_interest_alert');
    recommendations.push('provide_technical_resources');
  }
  
  const processingTime = Date.now() - startTime;
  
  const response: EventProcessingResponse = {
    success: true,
    eventId: event.eventId,
    priority,
    profileUpdated,
    alertsTriggered,
    recommendations,
    processingTime
  };
  
  console.log(`Successfully processed event ${event.eventId} in ${processingTime}ms`);
  res.status(200).json(response);
}

async function handleBatchEvents(
  req: NextApiRequest,
  res: NextApiResponse<BatchEventResponse | { error: string; details?: string }>,
  profilingEngine: DeepCustomerProfilingEngine,
  startTime: number
) {
  const batchRequest = req.body;
  const batchId = batchRequest.batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  if (!Array.isArray(batchRequest.events) || batchRequest.events.length === 0) {
    return res.status(400).json({
      error: 'Invalid batch request',
      details: 'events array is required and must not be empty'
    });
  }
  
  if (batchRequest.events.length > 100) {
    return res.status(400).json({
      error: 'Batch size too large',
      details: 'Maximum 100 events per batch allowed'
    });
  }
  
  console.log(`Processing batch of ${batchRequest.events.length} events (batchId: ${batchId})`);
  
  const errors: string[] = [];
  let processedEvents = 0;
  let failedEvents = 0;
  let highPriorityEvents = 0;
  
  // Process events in parallel (up to 10 at a time)
  const batchSize = 10;
  for (let i = 0; i < batchRequest.events.length; i += batchSize) {
    const batch = batchRequest.events.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (eventData: any, index: number) => {
      try {
        const event = validateEventRequest({
          ...eventData,
          batchId,
          batchIndex: i + index
        });
        
        const priority = calculateEventPriority(event);
        if (priority === 'high') highPriorityEvents++;
        
        await profilingEngine.processEvent(event);
        processedEvents++;
        
        return { success: true, eventId: event.eventId };
      } catch (error) {
        failedEvents++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Event ${i + index}: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }
    });
    
    await Promise.allSettled(batchPromises);
  }
  
  const processingTime = Date.now() - startTime;
  
  const response: BatchEventResponse = {
    success: failedEvents === 0,
    batchId,
    processedEvents,
    failedEvents,
    processingTime,
    errors: errors.slice(0, 10), // Limit error details
    highPriorityEvents
  };
  
  console.log(`Completed batch processing: ${processedEvents} processed, ${failedEvents} failed in ${processingTime}ms`);
  
  if (failedEvents > 0) {
    res.status(207).json(response); // 207 Multi-Status for partial success
  } else {
    res.status(200).json(response);
  }
}
