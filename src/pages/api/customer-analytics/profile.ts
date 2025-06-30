import type { NextApiRequest, NextApiResponse } from 'next';
import { DeepCustomerProfilingEngine } from '../../../lib/services/deep-customer-profiling-engine';
import {
    CustomerInsight,
    CustomerProfile,
    CustomerProfileRequest,
    CustomerProfileResponse,
    CustomerRecommendation,
    NextBestAction
} from '../../../lib/types/customer-analytics';

// Rate limiting using a simple in-memory store
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userRequests.count >= RATE_LIMIT) {
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

function validateProfileRequest(data: any): CustomerProfileRequest {
  if (!data.customerId && !data.visitorId && !data.email && !data.domain) {
    throw new Error('At least one identifier (customerId, visitorId, email, or domain) is required');
  }

  return {
    customerId: data.customerId,
    visitorId: data.visitorId,
    email: data.email,
    domain: data.domain,
    includeFullProfile: data.includeFullProfile !== false, // Default to true
    includePredictions: data.includePredictions || false,
    includeRecommendations: data.includeRecommendations !== false // Default to true
  };
}

function generateInsights(profile: CustomerProfile): CustomerInsight[] {
  const insights: CustomerInsight[] = [];

  // High intent insight
  if (profile.intentSignals.buyingIntentScore > 70) {
    insights.push({
      type: 'high_intent',
      title: 'High Buying Intent Detected',
      description: `Customer shows strong buying intent with a score of ${profile.intentSignals.buyingIntentScore}/100. They have engaged with pricing content and technical documentation.`,
      confidence: profile.intentSignals.intentConfidence,
      impact: 'high',
      actionable: true,
      evidence: [
        'Multiple pricing page visits',
        'Technical documentation engagement',
        'Demo request submitted'
      ],
      generatedAt: new Date()
    });
  }

  // Technical sophistication insight
  if (profile.technologyProfile.technicalSophistication === 'high') {
    insights.push({
      type: 'technical_champion',
      title: 'Technical Champion Identified',
      description: 'Customer demonstrates high technical sophistication with deep API documentation engagement and developer tool usage.',
      confidence: 0.85,
      impact: 'medium',
      actionable: true,
      evidence: [
        'API documentation access',
        'Developer tool detection',
        'Technical content preference'
      ],
      generatedAt: new Date()
    });
  }

  // Engagement trend insight
  if (profile.engagementMetrics.engagementTrend === 'increasing') {
    insights.push({
      type: 'engagement_acceleration',
      title: 'Accelerating Engagement',
      description: 'Customer engagement is trending upward with increasing session frequency and depth.',
      confidence: 0.78,
      impact: 'medium',
      actionable: true,
      evidence: [
        'Increasing session frequency',
        'Growing content engagement',
        'Longer session durations'
      ],
      generatedAt: new Date()
    });
  }

  // Risk insight
  if (profile.riskAssessment.riskTier === 'low') {
    insights.push({
      type: 'low_risk_opportunity',
      title: 'Low-Risk High-Value Opportunity',
      description: 'Customer presents minimal risk factors with strong budget fit and realistic timeline.',
      confidence: 0.82,
      impact: 'high',
      actionable: true,
      evidence: [
        'Strong budget alignment',
        'Realistic implementation timeline',
        'Stable company profile'
      ],
      generatedAt: new Date()
    });
  }

  return insights;
}

function generateRecommendations(profile: CustomerProfile): CustomerRecommendation[] {
  const recommendations: CustomerRecommendation[] = [];

  // Based on journey stage
  if (profile.journeyAnalytics.journeyStage === 'evaluation') {
    recommendations.push({
      type: 'sales_action',
      title: 'Schedule Technical Deep Dive',
      description: 'Customer is in evaluation stage with high technical interest. Schedule a technical deep dive to demonstrate advanced capabilities.',
      priority: 'high',
      expectedOutcome: 'Accelerate evaluation and build technical confidence',
      effort: 'medium',
      timeline: '1 week',
      owner: 'sales_engineer',
      successMetrics: [
        'Technical questions answered',
        'POC timeline established',
        'Next meeting scheduled'
      ]
    });
  }

  // Based on intent signals
  if (profile.intentSignals.buyingIntentScore > 70) {
    recommendations.push({
      type: 'sales_acceleration',
      title: 'Expedite Proposal Process',
      description: 'High buying intent detected. Prepare and present customized proposal to capitalize on current momentum.',
      priority: 'high',
      expectedOutcome: 'Convert high intent into committed evaluation',
      effort: 'high',
      timeline: '3-5 days',
      owner: 'account_executive',
      successMetrics: [
        'Proposal presented',
        'Budget discussion initiated',
        'Decision timeline clarified'
      ]
    });
  }

  // Based on technology profile
  if (profile.technologyProfile.technicalDecisionMakerSignals) {
    recommendations.push({
      type: 'content_strategy',
      title: 'Provide Advanced Technical Resources',
      description: 'Technical decision maker identified. Share advanced documentation, API guides, and integration examples.',
      priority: 'medium',
      expectedOutcome: 'Build technical confidence and address implementation concerns',
      effort: 'low',
      timeline: '1-2 days',
      owner: 'developer_relations',
      successMetrics: [
        'Technical resources accessed',
        'Implementation questions clarified',
        'POC requirements defined'
      ]
    });
  }

  // Based on competitive analysis
  if (profile.competitiveAnalysis.competitivePressure === 'high') {
    recommendations.push({
      type: 'competitive_strategy',
      title: 'Deploy Competitive Differentiation Strategy',
      description: 'High competitive pressure detected. Emphasize unique value propositions and competitive advantages.',
      priority: 'high',
      expectedOutcome: 'Neutralize competitive threats and highlight unique value',
      effort: 'medium',
      timeline: '1 week',
      owner: 'sales_manager',
      successMetrics: [
        'Competitive concerns addressed',
        'Unique value demonstrated',
        'Competitive comparison completed'
      ]
    });
  }

  return recommendations;
}

function generateNextBestActions(profile: CustomerProfile): NextBestAction[] {
  const actions: NextBestAction[] = [];

  // Immediate actions based on current state
  if (profile.journeyAnalytics.journeyStage === 'evaluation') {
    actions.push({
      action: 'Send technical evaluation guide',
      priority: 'high',
      expectedOutcome: 'Provide structured evaluation framework',
      timeline: '24 hours',
      owner: 'sales_engineer'
    });
  }

  if (profile.intentSignals.buyingIntentScore > 60) {
    actions.push({
      action: 'Schedule executive alignment call',
      priority: 'medium',
      expectedOutcome: 'Align on business value and strategic fit',
      timeline: '1 week',
      owner: 'account_executive'
    });
  }

  if (profile.engagementMetrics.responseTime > 48) {
    actions.push({
      action: 'Follow up on outstanding items',
      priority: 'high',
      expectedOutcome: 'Re-engage and maintain momentum',
      timeline: 'immediate',
      owner: 'account_manager'
    });
  }

  return actions;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomerProfileResponse | { error: string; details?: string }>
) {
  // Check rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      details: `Maximum ${RATE_LIMIT} requests per hour allowed`
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const profileRequest = validateProfileRequest(req.body);

    // Get customer ID (use provided ID or generate from other identifiers)
    const customerId = profileRequest.customerId ||
                      profileRequest.email ||
                      profileRequest.domain ||
                      profileRequest.visitorId ||
                      'unknown';

    console.log(`Processing customer profile request for: ${customerId}`);

    // Get profiling engine instance
    const profilingEngine = DeepCustomerProfilingEngine.getInstance();

    // Build customer profile
    const profile = await profilingEngine.getCustomerProfile(customerId, {
      includeRealTime: true,
      includePredictions: profileRequest.includePredictions,
      forceRefresh: false
    });

    // Generate insights and recommendations if requested
    let insights: CustomerInsight[] = [];
    let recommendations: CustomerRecommendation[] = [];
    let nextBestActions: NextBestAction[] = [];

    if (profileRequest.includeRecommendations) {
      insights = generateInsights(profile);
      recommendations = generateRecommendations(profile);
      nextBestActions = generateNextBestActions(profile);
    }

    // Prepare response
    const response: CustomerProfileResponse = {
      profile: profileRequest.includeFullProfile ? profile : {
        customerId: profile.customerId,
        updatedAt: profile.updatedAt,
        basicInfo: profile.basicInfo,
        engagementMetrics: profile.engagementMetrics,
        intentSignals: profile.intentSignals,
        journeyAnalytics: profile.journeyAnalytics,
        profileConfidence: profile.profileConfidence
      } as CustomerProfile,
      insights,
      recommendations,
      nextBestActions,
      confidence: profile.profileConfidence
    };

    console.log(`Successfully generated customer profile for: ${customerId}`);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error processing customer profile request:', error);

    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: 'Failed to process customer profile request',
      details: isDevelopment ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
}
