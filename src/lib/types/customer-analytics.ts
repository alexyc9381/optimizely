// Customer Analytics and Insights Engine Types

export interface CustomerProfile {
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  visitorId?: string;

  // Basic Information
  basicInfo: CustomerBasicInfo;

  // Behavioral Analytics
  behavioralProfile: BehavioralProfile;

  // Technology Profile
  technologyProfile: TechnologyProfile;

  // Engagement Metrics
  engagementMetrics: EngagementMetrics;

  // Intent Signals
  intentSignals: IntentSignals;

  // Psychographic Profile
  psychographicProfile: PsychographicProfile;

  // Revenue Analytics
  revenueAnalytics: RevenueAnalytics;

  // Journey Analytics
  journeyAnalytics: CustomerJourney;

  // Industry-Specific Insights
  industryInsights: IndustrySpecificInsights;

  // Risk Assessment
  riskAssessment: RiskAssessment;

  // Competitive Analysis
  competitiveAnalysis: CompetitiveAnalysis;

  // Profile Confidence
  profileConfidence: ProfileConfidence;
}

export interface CustomerBasicInfo {
  // Company Information
  companyName?: string;
  domain?: string;
  industry?: string;
  companySize?: CompanySize;
  estimatedRevenue?: number;
  location?: GeographicLocation;
  foundedYear?: number;

  // Contact Information
  email?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  seniority?: SeniorityLevel;
  linkedInUrl?: string;
  phoneNumber?: string;

  // Firmographics
  employeeCount?: number;
  fundingStage?: FundingStage;
  totalFunding?: number;
  businessModel?: BusinessModel;
  targetMarket?: string[];

  // Enrichment Data
  enrichmentSources: string[];
  enrichmentQuality: 'high' | 'medium' | 'low';
  lastEnrichmentAt: Date;
}

export interface BehavioralProfile {
  // Session Analytics
  sessionAnalytics: {
    totalSessions: number;
    totalPageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
    returnVisitorRate: number;
  };
  totalSessions: number;
  totalPageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  returnVisitorRate: number;

  // Page Flow Analysis
  pageFlowPatterns: PageFlowPattern[];
  mostViewedPages: PageEngagement[];
  contentAffinityScore: number;

  // Interaction Patterns
  scrollDepthAverage: number;
  timeOnKeyPages: { [pageType: string]: number };
  documentDownloads: DocumentDownload[];
  formInteractions: FormInteraction[];

  // Temporal Patterns
  visitTimePatterns: TemporalPattern[];
  weeklyActivityPattern: WeeklyActivity;
  seasonalPatterns: SeasonalPattern[];

  // Behavioral Anomalies
  anomalies: BehavioralAnomaly[];
  anomalyScore: number;

  // Engagement Quality
  sessionQualityScore: number;
  interactionDensity: number;
  contentEngagementScore: number;
}

export interface TechnologyProfile {
  // Device and Browser
  devices: DeviceUsage[];
  browsers: BrowserUsage[];
  operatingSystems: OSUsage[];
  screenResolutions: ScreenResolution[];

  // Technology Stack Detection
  detectedTechnologies: TechnologyStack[];
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  cloudProviders: string[];
  analyticsTools: string[];

  // Technical Sophistication
  technicalSophistication: 'high' | 'medium' | 'low';
  developerIndicators: DeveloperIndicator[];
  techStackComplexity: number;

  // Integration Readiness
  apiCapabilities: APICapability[];
  integrationReadiness: 'high' | 'medium' | 'low';
  technicalDecisionMakerSignals: boolean;
}

export interface EngagementMetrics {
  // Overall Engagement
  overallEngagementScore: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  engagementTier: 'high' | 'medium' | 'low';

  // Content Engagement
  contentInteractionScore: number;
  featureInterestScores: { [feature: string]: number };
  pricingPageEngagement: PricingEngagement;

  // Communication Engagement
  emailEngagement: EmailEngagement;
  socialMediaEngagement: SocialEngagement;
  webinarAttendance: WebinarEngagement[];

  // Sales Engagement
  salesInteractionScore: number;
  responseTime: number;
  meetingAcceptanceRate: number;

  // Multi-dimensional Scoring
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmScore: number;
}

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type SeniorityLevel = 'individual_contributor' | 'manager' | 'director' | 'vp' | 'c_level' | 'founder';
export type FundingStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c+' | 'ipo' | 'private';
export type BusinessModel = 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'platform' | 'saas' | 'ecommerce';

// Event Types and Priorities
export enum EventType {
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  DOWNLOAD = 'download',
  VIDEO_PLAY = 'video_play',
  PRICING_VIEW = 'pricing_view',
  DEMO_REQUEST = 'demo_request',
  CONTACT_FORM = 'contact_form',
  CHAT_STARTED = 'chat_started',
  EMAIL_SIGNUP = 'email_signup',
  WEBINAR_REGISTER = 'webinar_register',
  TRIAL_SIGNUP = 'trial_signup',
  PURCHASE = 'purchase',
  LOGIN = 'login',
  LOGOUT = 'logout',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end'
}

export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface GeographicLocation {
  country: string;
  region?: string;
  city?: string;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PageFlowPattern {
  sequence: string[];
  frequency: number;
  conversionRate: number;
  averageDuration: number;
}

export interface PageEngagement {
  page: string;
  views: number;
  timeSpent: number;
  engagementScore: number;
  conversionRate: number;
}

export interface DocumentDownload {
  documentType: string;
  documentName: string;
  downloadedAt: Date;
  pageContext: string;
}

export interface FormInteraction {
  formType: string;
  formName: string;
  completionRate: number;
  abandonnmentPoints: string[];
  submittedAt?: Date;
}

export interface TemporalPattern {
  timeOfDay: number;
  dayOfWeek: number;
  frequency: number;
  engagementLevel: 'high' | 'medium' | 'low';
}

export interface WeeklyActivity {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  activityLevel: number;
  conversionRate: number;
}

export interface BehavioralAnomaly {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  confidence: number;
}

export interface DeviceUsage {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  usage: number;
  engagementScore: number;
}

export interface BrowserUsage {
  browser: string;
  version: string;
  usage: number;
}

export interface OSUsage {
  os: string;
  version: string;
  usage: number;
}

export interface ScreenResolution {
  width: number;
  height: number;
  usage: number;
}

export interface TechnologyStack {
  category: string;
  technology: string;
  confidence: number;
  detectionMethod: string;
}

export interface DeveloperIndicator {
  indicator: string;
  confidence: number;
  evidence: string[];
}

export interface APICapability {
  capability: string;
  assessment: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface PricingEngagement {
  pricingPageViews: number;
  timeOnPricingPage: number;
  planComparisons: number;
  calculatorUsage: number;
  pricingDownloads: number;
}

export interface EmailEngagement {
  openRate: number;
  clickRate: number;
  replyRate: number;
  unsubscribeRate: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface SocialEngagement {
  platform: string;
  followerCount: number;
  engagementRate: number;
  mentionSentiment: 'positive' | 'neutral' | 'negative';
}

export interface WebinarEngagement {
  webinarTitle: string;
  attendedAt: Date;
  attendanceDuration: number;
  interactionLevel: 'high' | 'medium' | 'low';
  followUpActions: string[];
}

export interface IntentSignals {
  // Buying Intent
  buyingIntent: {
    score: number;
    confidence: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  buyingIntentScore: number;
  intentConfidence: number;
  intentTrend: 'increasing' | 'stable' | 'decreasing';

  // Intent Indicators
  highIntentActions: IntentAction[];
  urgencyIndicators: UrgencyIndicator[];
  budgetSignals: BudgetSignal[];

  // Decision-Making Signals
  decisionMakerInvolvement: DecisionMakerSignal[];
  stakeholderMapping: StakeholderMap;
  purchaseTimingSignals: TimingSignal[];

  // Competitive Signals
  competitorResearchPatterns: CompetitorResearch[];
  alternativeSolutionResearch: AlternativeResearch[];

  // Intent Attribution
  intentSources: IntentSource[];
  intentHistory: IntentHistoryPoint[];
}

export interface IntentAction {
  action: string;
  timestamp: Date;
  intentScore: number;
  context: string;
}

export interface UrgencyIndicator {
  indicator: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  evidence: string;
  detectedAt: Date;
}

export interface BudgetSignal {
  signal: string;
  budgetIndicator: 'high' | 'medium' | 'low' | 'unknown';
  confidence: number;
  evidence: string[];
}

export interface DecisionMakerSignal {
  personRole: string;
  involvementLevel: 'primary' | 'influencer' | 'user' | 'gatekeeper';
  confidence: number;
  evidence: string[];
}

export interface StakeholderMap {
  stakeholders: Stakeholder[];
  decisionProcess: string;
  timelineEstimate: number;
}

export interface Stakeholder {
  role: string;
  seniority: SeniorityLevel;
  involvementLevel: 'primary' | 'influencer' | 'user' | 'gatekeeper';
  contactInfo?: {
    email?: string;
    name?: string;
  };
}

export interface TimingSignal {
  signal: string;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  confidence: number;
  evidence: string[];
}

export interface CompetitorResearch {
  competitor: string;
  researchDepth: 'surface' | 'moderate' | 'deep';
  researchRecency: Date;
  focusAreas: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface AlternativeResearch {
  alternativeType: string;
  researchDepth: 'surface' | 'moderate' | 'deep';
  considerationLevel: 'high' | 'medium' | 'low';
}

export interface IntentSource {
  source: string;
  contribution: number;
  lastActivity: Date;
}

export interface IntentHistoryPoint {
  timestamp: Date;
  intentScore: number;
  majorEvents: string[];
  confidenceLevel: number;
}

export interface PsychographicProfile {
  // Decision-Making Style
  decisionMakingStyle: DecisionMakingStyle;
  riskTolerance: 'high' | 'medium' | 'low';
  innovationAdoption: 'innovator' | 'early_adopter' | 'early_majority' | 'late_majority' | 'laggard';

  // Value Perception
  valueDrivers: ValueDriver[];
  pricesensitivity: 'high' | 'medium' | 'low';
  featurePriorities: FeaturePriority[];

  // Communication Preferences
  communicationStyle: 'direct' | 'consultative' | 'relationship_focused' | 'data_driven';
  preferredChannels: CommunicationChannel[];
  contentPreferences: ContentPreference[];

  // Business Mindset
  businessMaturity: 'startup' | 'scale_up' | 'enterprise' | 'enterprise_plus';
  growthOrientation: 'aggressive' | 'steady' | 'conservative';
  changeReadiness: 'change_leader' | 'change_follower' | 'change_resistant';
}

export interface DecisionMakingStyle {
  style: 'analytical' | 'directive' | 'conceptual' | 'behavioral';
  confidence: number;
  evidence: string[];
}

export interface ValueDriver {
  driver: string;
  importance: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface FeaturePriority {
  feature: string;
  priority: 'must_have' | 'nice_to_have' | 'not_important';
  evidence: string[];
}

export interface CommunicationChannel {
  channel: string;
  preference: 'preferred' | 'acceptable' | 'avoided';
  responseRate: number;
}

export interface ContentPreference {
  contentType: string;
  engagementLevel: 'high' | 'medium' | 'low';
  consumptionFrequency: number;
}

export interface RevenueAnalytics {
  // Revenue Prediction
  predictedRevenue: number;
  revenueConfidenceInterval: ConfidenceInterval;
  lifetimeValuePrediction: number;

  // Deal Analytics
  dealSizePrediction: number;
  closeProbability: number;
  timeToCloseEstimate: number;

  // Revenue Factors
  revenueDrivers: RevenueDriver[];
  revenueRisks: RevenueRisk[];
  expansionPotential: ExpansionPotential;

  // Historical Analytics
  revenueHistory: RevenueHistoryPoint[];
  contractHistory: ContractHistory[];
  paymentHistory: PaymentHistory[];

  // Pricing Analytics
  priceOptimization: PriceOptimization;
  discountSensitivity: DiscountSensitivity;
  upsellPotential: UpsellPotential;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
}

export interface RevenueDriver {
  driver: string;
  impact: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface RevenueRisk {
  risk: string;
  impact: 'high' | 'medium' | 'low';
  probability: number;
  mitigation: string[];
}

export interface ExpansionPotential {
  upsellPotential: number;
  crossSellPotential: number;
  timeToExpansion: number;
  expansionDrivers: string[];
}

export interface RevenueHistoryPoint {
  date: Date;
  revenue: number;
  contractValue: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
}

export interface ContractHistory {
  contractId: string;
  startDate: Date;
  endDate: Date;
  value: number;
  terms: string[];
  renewalProbability: number;
}

export interface PaymentHistory {
  paymentId: string;
  amount: number;
  date: Date;
  method: string;
  status: 'successful' | 'failed' | 'pending';
}

export interface PriceOptimization {
  optimalPrice: number;
  currentPrice: number;
  priceElasticity: number;
  optimizationOpportunity: number;
}

export interface DiscountSensitivity {
  sensitivity: 'high' | 'medium' | 'low';
  optimalDiscount: number;
  discountThreshold: number;
}

export interface UpsellPotential {
  potential: 'high' | 'medium' | 'low';
  suggestedProducts: string[];
  timeToUpsell: number;
  upsellValue: number;
}

export interface CustomerJourney {
  // Journey Overview
  journeyStage: JourneyStage;
  journeyProgress: number;
  timeInCurrentStage: number;

  // Touchpoint Analysis
  touchpoints: Touchpoint[];
  conversionPath: ConversionPath[];
  dropOffPoints: DropOffPoint[];

  // Journey Analytics
  journeyEfficiency: number;
  conversionProbability: number;
  expectedJourneyDuration: number;

  // Optimization Opportunities
  optimizationOpportunities: OptimizationOpportunity[];
  nextBestActions: NextBestAction[];

  // Journey History
  journeyHistory: JourneyHistoryPoint[];
  stageTransitions: StageTransition[];
}

export type JourneyStage = 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase' | 'retention' | 'advocacy';

export interface Touchpoint {
  touchpointId: string;
  type: string;
  channel: string;
  timestamp: Date;
  duration: number;
  outcome: string;
  satisfaction: number;
}

export interface ConversionPath {
  step: number;
  touchpoint: string;
  conversionRate: number;
  dropOffRate: number;
  averageTime: number;
}

export interface DropOffPoint {
  location: string;
  dropOffRate: number;
  commonReasons: string[];
  recoveryActions: string[];
}

export interface OptimizationOpportunity {
  opportunity: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  expectedImprovement: number;
}

export interface NextBestAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expectedOutcome: string;
  timeline: string;
  owner: string;
}

export interface JourneyHistoryPoint {
  timestamp: Date;
  stage: JourneyStage;
  triggerEvent: string;
  duration: number;
}

export interface StageTransition {
  fromStage: JourneyStage;
  toStage: JourneyStage;
  transitionRate: number;
  averageTime: number;
  commonTriggers: string[];
}

export interface IndustrySpecificInsights {
  primaryIndustry: string;
  industryConfidence: number;

  // Industry-Specific Metrics
  industryMetrics: { [key: string]: any };

  // SaaS-Specific (if applicable)
  saasInsights?: SaaSCustomerInsights;

  // College Consulting-Specific (if applicable)
  collegeConsultingInsights?: CollegeConsultingCustomerInsights;

  // E-commerce-Specific (if applicable)
  ecommerceInsights?: EcommerceCustomerInsights;

  // Financial Services-Specific (if applicable)
  financialServicesInsights?: FinancialServicesCustomerInsights;
}

export interface SaaSCustomerInsights {
  subscriptionIndicators: {
    trialUsage: number;
    featureAdoption: number;
    apiUsage: number;
    userGrowth: number;
  };
  usagePatterns: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    sessionDuration: number;
    featureStickiness: number;
  };
  expansionSignals: {
    teamSize: number;
    departmentSpread: number;
    powerUserRatio: number;
    integrationRequests: number;
  };
}

export interface CollegeConsultingCustomerInsights {
  studentPipeline: {
    gradeLevel: string;
    academicPerformance: string;
    collegeGoals: string[];
    timelineUrgency: 'high' | 'medium' | 'low';
  };
  parentInvolvement: {
    involvementLevel: 'high' | 'medium' | 'low';
    decisionMakingRole: 'primary' | 'secondary' | 'advisory';
    budgetAuthority: 'full' | 'partial' | 'none';
  };
  enrollmentCycle: {
    cycleStage: string;
    deadlineProximity: number;
    applicationProgress: number;
  };
}

export interface EcommerceCustomerInsights {
  seasonalPatterns: {
    peakSeasons: string[];
    inventoryNeeds: string[];
    scalingRequirements: string[];
  };
  transactionPatterns: {
    averageOrderValue: number;
    orderFrequency: number;
    paymentMethods: string[];
    returnRate: number;
  };
  growthIndicators: {
    salesTrend: 'growing' | 'stable' | 'declining';
    marketExpansion: string[];
    technologyNeeds: string[];
  };
}

export interface FinancialServicesCustomerInsights {
  complianceNeeds: {
    regulatoryFrameworks: string[];
    complianceGaps: string[];
    auditFrequency: string;
  };
  securityRequirements: {
    securityMaturity: 'high' | 'medium' | 'low';
    threatExposure: string[];
    securityPriorities: string[];
  };
  riskProfile: {
    riskTolerance: 'high' | 'medium' | 'low';
    riskManagementMaturity: string;
    operationalRisks: string[];
  };
}

export interface RiskAssessment {
  // Overall Risk
  overallRiskScore: number;
  riskTier: 'low' | 'medium' | 'high' | 'very_high';

  // Specific Risk Factors
  churnRisk: ChurnRisk;
  budgetRisk: BudgetRisk;
  timelineRisk: TimelineRisk;
  competitorRisk: CompetitorRisk;

  // Risk Mitigation
  riskMitigationActions: RiskMitigationAction[];
  riskMonitoring: RiskMonitoringAction[];
}

export interface ChurnRisk {
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  riskFactors: string[];
  earlyWarningSignals: string[];
  preventionActions: string[];
}

export interface BudgetRisk {
  budgetFit: 'excellent' | 'good' | 'tight' | 'poor';
  budgetCycle: string;
  budgetAuthority: 'confirmed' | 'likely' | 'uncertain' | 'unknown';
  costJustification: string[];
}

export interface TimelineRisk {
  urgency: 'high' | 'medium' | 'low';
  timelineRealism: 'realistic' | 'optimistic' | 'pessimistic';
  delayRisks: string[];
  accelerationOpportunities: string[];
}

export interface CompetitorRisk {
  competitiveThreat: 'high' | 'medium' | 'low';
  activeCompetitors: string[];
  competitorAdvantages: string[];
  defensiveStrategies: string[];
}

export interface RiskMitigationAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  owner: string;
  expectedImpact: string;
}

export interface RiskMonitoringAction {
  metric: string;
  threshold: number;
  frequency: string;
  alertOwner: string;
}

export interface CompetitiveAnalysis {
  // Competitor Research
  competitorsResearched: CompetitorResearch[];
  competitivePosition: 'leading' | 'competing' | 'lagging';

  // Competitive Threats
  primaryCompetitors: string[];
  competitivePressure: 'high' | 'medium' | 'low';
  competitorAdvantages: CompetitorAdvantage[];

  // Differentiation Opportunities
  differentiationOpportunities: DifferentiationOpportunity[];
  competitiveMessaging: CompetitiveMessage[];
}

export interface CompetitorAdvantage {
  competitor: string;
  advantage: string;
  impact: 'high' | 'medium' | 'low';
  counterStrategy: string[];
}

export interface DifferentiationOpportunity {
  opportunity: string;
  uniqueValue: string;
  competitiveGap: string;
  messagingStrategy: string[];
}

export interface CompetitiveMessage {
  scenario: string;
  message: string;
  supportingEvidence: string[];
  effectiveness: 'high' | 'medium' | 'low';
}

export interface ProfileConfidence {
  overallConfidence: number;
  overallScore: number; // Added for backward compatibility
  dataCompleteness: number;
  dataFreshness: number;
  sourceReliability: number;

  // Section-Specific Confidence
  basicInfoConfidence: number;
  behavioralConfidence: number;
  technologyConfidence: number;
  intentConfidence: number;
  revenueConfidence: number;

  // Quality Indicators
  qualityIndicators: QualityIndicator[];
  dataGaps: DataGap[];
  improvementActions: ImprovementAction[];
}

export interface QualityIndicator {
  indicator: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  impact: string;
  improvement: string[];
}

export interface DataGap {
  category: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  acquisitionMethod: string[];
}

export interface ImprovementAction {
  action: string;
  expectedImprovement: number;
  effort: 'high' | 'medium' | 'low';
  timeline: string;
}

// API Request/Response Types

export interface CustomerProfileRequest {
  customerId?: string;
  visitorId?: string;
  email?: string;
  domain?: string;
  includeFullProfile?: boolean;
  includePredictions?: boolean;
  includeRecommendations?: boolean;
}

export interface CustomerProfileResponse {
  profile: CustomerProfile;
  insights: CustomerInsight[];
  recommendations: CustomerRecommendation[];
  nextBestActions: NextBestAction[];
  confidence: ProfileConfidence;
}

export interface CustomerInsight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  evidence: string[];
  generatedAt: Date;
}

export interface CustomerRecommendation {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedOutcome: string;
  effort: 'high' | 'medium' | 'low';
  timeline: string;
  owner: string;
  successMetrics: string[];
}

export interface ProfileUpdateRequest {
  customerId: string;
  updateType: 'behavioral' | 'firmographic' | 'engagement' | 'intent' | 'journey';
  data: any;
  source: string;
  timestamp?: Date;
}

export interface ProfileUpdateResponse {
  success: boolean;
  updatedFields: string[];
  profileVersion: number;
  confidence: ProfileConfidence;
  triggeredActions: string[];
}

export interface CustomerAnalyticsConfig {
  // Scoring Weights
  behavioralWeight: number;
  engagementWeight: number;
  intentWeight: number;
  firmographicWeight: number;

  // Thresholds
  highEngagementThreshold: number;
  highIntentThreshold: number;
  qualifiedLeadThreshold: number;

  // Real-time Processing
  realTimeEnabled: boolean;
  updateFrequency: number; // in seconds
  batchProcessingSize: number;

  // Data Retention
  dataRetentionDays: number;
  archiveThreshold: number;

  // Privacy Settings
  cookieConsentRequired: boolean;
  dataMinimization: boolean;
  anonymizationLevel: 'none' | 'partial' | 'full';
}

// Behavioral Analytics Types

export interface BehavioralEvent {
  eventId?: string;
  customerId: string;
  sessionId: string;
  eventType: EventType | string;
  timestamp: Date | string;
  page: string;
  userAgent: string;
  ipAddress: string;
  deviceInfo: DeviceInfo;
  priority: EventPriority;
  properties: { [key: string]: any };
  contentEngagement?: {
    timeOnPage: number;
    scrollDepth: number;
    clickEvents: number;
    formInteractions: number;
  };
  // Legacy properties for backward compatibility
  eventData?: { [key: string]: any };
  source?: string;
  context?: EventContext;
}

export interface EventContext {
  page: string;
  referrer: string;
  userAgent: string;
  ipAddress: string;
  geolocation?: GeographicLocation;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  deviceType?: 'desktop' | 'mobile' | 'tablet'; // Legacy property
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
  screenResolution: string;
  viewportSize?: string;
}

export interface SessionAnalytics {
  sessionId: string;
  customerId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  pageViews: number;
  interactions: number;
  conversionEvents: string[];
  exitPage: string;
  qualityScore: number;
}

// Real-time Analytics Types

export interface RealTimeUpdate {
  customerId: string;
  updateType: 'behavioral' | 'intent' | 'engagement' | 'journey';
  data: any;
  timestamp: Date;
  confidence: number;
  triggerActions: string[];
}

export interface AnalyticsAlert {
  alertId: string;
  customerId: string;
  alertType: 'high_intent' | 'risk_escalation' | 'anomaly_detected' | 'opportunity_identified';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: Date;
  acknowledged: boolean;
  assignedTo?: string;
}

export interface CustomerSegment {
  segmentId: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  customerCount: number;
  averageScore: number;
  conversionRate: number;
  revenueContribution: number;
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  weight: number;
}
