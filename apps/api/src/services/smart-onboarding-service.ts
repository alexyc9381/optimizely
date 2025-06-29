import { Redis } from 'ioredis';

// Core interfaces for the smart questionnaire system
export interface QuestionnaireResponse {
  sessionId: string;
  responses: Record<string, any>;
  currentStep: number;
  completedAt?: Date;
  customerProfile?: CustomerProfile;
}

export interface CustomerProfile {
  id: string;
  industry: Industry;
  businessModel: BusinessModel;
  companySize: CompanySize;
  revenueModel: RevenueModel;
  primaryGoals: ConversionGoal[];
  currentChallenges: BusinessChallenge[];
  targetMetrics: TargetMetric[];
  technicalSophistication: TechnicalLevel;
  currentTools: string[];
  trafficVolume: TrafficVolume;
  avgOrderValue?: number;
  salesCycle: SalesCycle;
  decisionMakers: DecisionMaker[];
  geographicMarkets: string[];
  seasonality: SeasonalityPattern;
  competitivePosition: CompetitivePosition;
  growthStage: GrowthStage;
  abTestingExperience: ABTestingExperience;
  priorityAreas: string[];
  metadata: {
    completedAt: Date;
    source: string;
    version: string;
  };
}

export type Industry =
  | 'saas' | 'ecommerce' | 'manufacturing' | 'healthcare'
  | 'fintech' | 'education' | 'government' | 'consulting'
  | 'real-estate' | 'travel' | 'media' | 'nonprofit'
  | 'retail' | 'automotive' | 'energy' | 'logistics';

export type BusinessModel =
  | 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'subscription'
  | 'transactional' | 'freemium' | 'enterprise' | 'self-serve';

export type CompanySize = 'startup' | 'small' | 'medium' | 'enterprise' | 'fortune500';

export type RevenueModel =
  | 'subscription' | 'one-time' | 'commission' | 'advertising'
  | 'freemium' | 'usage-based' | 'hybrid';

export type ConversionGoal =
  | 'trial-signup' | 'purchase' | 'lead-generation' | 'demo-request'
  | 'consultation-booking' | 'email-signup' | 'download'
  | 'quote-request' | 'contact-form' | 'phone-call';

export type BusinessChallenge =
  | 'low-conversion-rate' | 'high-cart-abandonment' | 'poor-mobile-experience'
  | 'unclear-value-prop' | 'complex-checkout' | 'trust-issues'
  | 'pricing-optimization' | 'feature-adoption' | 'user-onboarding'
  | 'lead-quality' | 'sales-funnel-leaks' | 'seasonal-fluctuations';

export type TargetMetric =
  | 'conversion-rate' | 'revenue-per-visitor' | 'average-order-value'
  | 'customer-lifetime-value' | 'cost-per-acquisition' | 'retention-rate'
  | 'engagement-rate' | 'bounce-rate' | 'time-on-site'
  | 'page-views-per-session' | 'trial-to-paid-conversion';

export type TechnicalLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type TrafficVolume = 'low' | 'medium' | 'high' | 'very-high';

export type SalesCycle = 'immediate' | 'days' | 'weeks' | 'months' | 'quarters';

export type DecisionMaker = 'individual' | 'team' | 'committee' | 'executive' | 'procurement';

export type SeasonalityPattern = 'none' | 'seasonal' | 'cyclical' | 'event-driven';

export type CompetitivePosition = 'leader' | 'challenger' | 'follower' | 'niche';

export type GrowthStage = 'startup' | 'growth' | 'maturity' | 'enterprise';

export type ABTestingExperience = 'none' | 'basic' | 'intermediate' | 'advanced';

export interface QuestionDefinition {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'scale' | 'boolean' | 'conditional';
  question: string;
  description?: string;
  options?: QuestionOption[];
  validation?: ValidationRule;
  conditional?: ConditionalLogic;
  required: boolean;
  category: 'industry' | 'business-model' | 'goals' | 'challenges' | 'technical' | 'traffic' | 'profile';
  weight: number; // For A/B test relevance scoring
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  followUp?: string[]; // IDs of follow-up questions
  abTestRelevance: string[]; // Types of A/B tests this option suggests
}

export interface ValidationRule {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean;
}

export interface ConditionalLogic {
  showIf: {
    questionId: string;
    operator: 'equals' | 'contains' | 'not-equals' | 'greater-than' | 'less-than';
    value: any;
  }[];
  logic: 'and' | 'or';
}

export interface ABTestRecommendation {
  templateId: string;
  priority: number;
  rationale: string;
  expectedImpact: 'low' | 'medium' | 'high';
  confidence: number;
  estimatedDuration: number; // days
  requiredTraffic: number;
}

// Smart Onboarding Service Implementation
class SmartOnboardingService {
  private redis: Redis;
  private questionnaireDefinition: QuestionDefinition[];

  constructor(redis: Redis) {
    this.redis = redis;
    this.questionnaireDefinition = this.initializeQuestions();
  }

  // Initialize the smart questionnaire with all industry-specific questions
  private initializeQuestions(): QuestionDefinition[] {
    return [
      // Industry Classification (High Priority)
      {
        id: 'industry',
        type: 'single-choice',
        question: 'What industry best describes your business?',
        description: 'This helps us suggest the most relevant A/B testing strategies',
        options: [
          { value: 'saas', label: 'Software as a Service (SaaS)', abTestRelevance: ['trial-signup', 'pricing-page', 'feature-adoption'] },
          { value: 'ecommerce', label: 'E-commerce & Retail', abTestRelevance: ['checkout-flow', 'product-page', 'cart-abandonment'] },
          { value: 'fintech', label: 'Financial Technology', abTestRelevance: ['application-flow', 'trust-signals', 'onboarding'] },
          { value: 'healthcare', label: 'Healthcare & Medical', abTestRelevance: ['appointment-booking', 'trust-building', 'compliance-focused'] },
          { value: 'education', label: 'Education & Training', abTestRelevance: ['enrollment-flow', 'course-discovery', 'pricing-tiers'] },
          { value: 'consulting', label: 'Professional Services & Consulting', abTestRelevance: ['lead-generation', 'consultation-booking', 'portfolio-showcase'] },
          { value: 'manufacturing', label: 'Manufacturing & Industrial', abTestRelevance: ['rfq-forms', 'product-catalog', 'contact-optimization'] },
          { value: 'real-estate', label: 'Real Estate', abTestRelevance: ['lead-capture', 'property-showcase', 'contact-forms'] },
          { value: 'travel', label: 'Travel & Hospitality', abTestRelevance: ['booking-flow', 'search-optimization', 'upselling'] },
          { value: 'nonprofit', label: 'Non-profit & Associations', abTestRelevance: ['donation-flow', 'volunteer-signup', 'event-registration'] },
          { value: 'media', label: 'Media & Entertainment', abTestRelevance: ['subscription-flow', 'content-discovery', 'engagement'] },
          { value: 'automotive', label: 'Automotive', abTestRelevance: ['lead-generation', 'configurator', 'dealer-locator'] },
          { value: 'energy', label: 'Energy & Utilities', abTestRelevance: ['service-signup', 'quote-calculator', 'educational-content'] },
          { value: 'government', label: 'Government & Public Sector', abTestRelevance: ['citizen-services', 'form-optimization', 'accessibility'] },
          { value: 'logistics', label: 'Logistics & Transportation', abTestRelevance: ['quote-requests', 'service-selection', 'tracking'] },
          { value: 'other', label: 'Other', abTestRelevance: ['general-conversion', 'lead-generation'] }
        ],
        required: true,
        category: 'industry',
        weight: 10
      },

      // Business Model (High Priority)
      {
        id: 'business_model',
        type: 'multiple-choice',
        question: 'Which business model best describes your company? (Select all that apply)',
        description: 'Understanding your business model helps optimize A/B tests for your specific customer journey',
        options: [
          { value: 'b2b', label: 'Business-to-Business (B2B)', abTestRelevance: ['lead-forms', 'demo-requests', 'case-studies'] },
          { value: 'b2c', label: 'Business-to-Consumer (B2C)', abTestRelevance: ['product-pages', 'checkout-flow', 'social-proof'] },
          { value: 'b2b2c', label: 'Business-to-Business-to-Consumer (B2B2C)', abTestRelevance: ['partner-portals', 'white-label', 'multi-tenant'] },
          { value: 'marketplace', label: 'Marketplace/Platform', abTestRelevance: ['onboarding-flow', 'seller-buyer-matching', 'commission-optimization'] },
          { value: 'subscription', label: 'Subscription-based', abTestRelevance: ['pricing-tiers', 'trial-conversion', 'churn-prevention'] },
          { value: 'transactional', label: 'One-time Transactions', abTestRelevance: ['impulse-buying', 'upselling', 'cart-optimization'] },
          { value: 'freemium', label: 'Freemium Model', abTestRelevance: ['upgrade-prompts', 'feature-limitations', 'value-demonstration'] },
          { value: 'enterprise', label: 'Enterprise Sales', abTestRelevance: ['demo-scheduling', 'sales-enablement', 'roi-calculators'] },
          { value: 'self-serve', label: 'Self-Service', abTestRelevance: ['onboarding-flow', 'self-help', 'automated-setup'] }
        ],
        required: true,
        category: 'business-model',
        weight: 9
      },

      // Company Size & Scale
      {
        id: 'company_size',
        type: 'single-choice',
        question: 'What is your company size?',
        description: 'This helps us understand your resource constraints and optimization priorities',
        options: [
          { value: 'startup', label: 'Startup (1-10 employees)', abTestRelevance: ['growth-focused', 'conversion-rate', 'resource-efficient'] },
          { value: 'small', label: 'Small Business (11-50 employees)', abTestRelevance: ['lead-generation', 'customer-acquisition', 'efficiency'] },
          { value: 'medium', label: 'Medium Business (51-200 employees)', abTestRelevance: ['scalability', 'process-optimization', 'segmentation'] },
          { value: 'enterprise', label: 'Enterprise (201-1000 employees)', abTestRelevance: ['complex-funnels', 'multi-channel', 'personalization'] },
          { value: 'fortune500', label: 'Fortune 500 (1000+ employees)', abTestRelevance: ['advanced-targeting', 'compliance', 'enterprise-features'] }
        ],
        required: true,
        category: 'profile',
        weight: 6
      },

      // Primary Conversion Goals
      {
        id: 'primary_goals',
        type: 'multiple-choice',
        question: 'What are your primary conversion goals? (Select up to 3)',
        description: 'We\'ll prioritize A/B tests that directly impact these goals',
        options: [
          { value: 'trial-signup', label: 'Free Trial Signups', abTestRelevance: ['trial-forms', 'value-props', 'social-proof'] },
          { value: 'purchase', label: 'Direct Purchases', abTestRelevance: ['product-pages', 'checkout-flow', 'pricing'] },
          { value: 'lead-generation', label: 'Lead Generation', abTestRelevance: ['contact-forms', 'lead-magnets', 'landing-pages'] },
          { value: 'demo-request', label: 'Demo Requests', abTestRelevance: ['demo-forms', 'scheduling', 'qualification'] },
          { value: 'consultation-booking', label: 'Consultation Bookings', abTestRelevance: ['booking-flow', 'calendar-integration', 'qualification'] },
          { value: 'email-signup', label: 'Email Newsletter Signups', abTestRelevance: ['opt-in-forms', 'incentives', 'value-communication'] },
          { value: 'download', label: 'Content Downloads', abTestRelevance: ['gated-content', 'forms', 'value-demonstration'] },
          { value: 'quote-request', label: 'Quote Requests', abTestRelevance: ['quote-forms', 'calculators', 'trust-signals'] },
          { value: 'contact-form', label: 'Contact Form Submissions', abTestRelevance: ['contact-forms', 'urgency', 'accessibility'] },
          { value: 'phone-call', label: 'Phone Calls', abTestRelevance: ['click-to-call', 'phone-prominence', 'trust-building'] }
        ],
        required: true,
        category: 'goals',
        weight: 9
      },

      // Current Challenges
      {
        id: 'current_challenges',
        type: 'multiple-choice',
        question: 'What are your biggest conversion challenges? (Select all that apply)',
        description: 'We\'ll suggest A/B tests specifically designed to address these issues',
        options: [
          { value: 'low-conversion-rate', label: 'Low Overall Conversion Rate', abTestRelevance: ['landing-page', 'value-prop', 'cta-optimization'] },
          { value: 'high-cart-abandonment', label: 'High Cart Abandonment', abTestRelevance: ['checkout-flow', 'trust-signals', 'payment-options'] },
          { value: 'poor-mobile-experience', label: 'Poor Mobile Conversion', abTestRelevance: ['mobile-optimization', 'responsive-design', 'mobile-forms'] },
          { value: 'unclear-value-prop', label: 'Unclear Value Proposition', abTestRelevance: ['messaging', 'headlines', 'benefit-communication'] },
          { value: 'complex-checkout', label: 'Complex Checkout Process', abTestRelevance: ['checkout-simplification', 'guest-checkout', 'progress-indicators'] },
          { value: 'trust-issues', label: 'Trust & Credibility Issues', abTestRelevance: ['social-proof', 'testimonials', 'security-badges'] },
          { value: 'pricing-optimization', label: 'Pricing Strategy Questions', abTestRelevance: ['pricing-display', 'pricing-tiers', 'discount-strategies'] },
          { value: 'feature-adoption', label: 'Low Feature Adoption', abTestRelevance: ['onboarding', 'feature-discovery', 'progressive-disclosure'] },
          { value: 'user-onboarding', label: 'User Onboarding Issues', abTestRelevance: ['onboarding-flow', 'activation', 'time-to-value'] },
          { value: 'lead-quality', label: 'Poor Lead Quality', abTestRelevance: ['qualification-forms', 'targeting', 'pre-qualification'] },
          { value: 'sales-funnel-leaks', label: 'Sales Funnel Drop-offs', abTestRelevance: ['funnel-analysis', 'step-optimization', 'progress-tracking'] },
          { value: 'seasonal-fluctuations', label: 'Seasonal Performance Issues', abTestRelevance: ['seasonal-messaging', 'promotional-strategies', 'timing'] }
        ],
        required: false,
        category: 'challenges',
        weight: 8
      },

      // Traffic Volume & Testing Feasibility
      {
        id: 'traffic_volume',
        type: 'single-choice',
        question: 'What is your monthly website traffic volume?',
        description: 'This helps us recommend tests that will reach statistical significance quickly',
        options: [
          { value: 'low', label: 'Under 10,000 visitors/month', abTestRelevance: ['high-impact-tests', 'qualitative-research', 'conversion-focused'] },
          { value: 'medium', label: '10,000 - 100,000 visitors/month', abTestRelevance: ['standard-testing', 'funnel-optimization', 'segmentation'] },
          { value: 'high', label: '100,000 - 1M visitors/month', abTestRelevance: ['advanced-testing', 'micro-optimizations', 'personalization'] },
          { value: 'very-high', label: 'Over 1M visitors/month', abTestRelevance: ['sophisticated-testing', 'ai-optimization', 'real-time-testing'] }
        ],
        required: true,
        category: 'traffic',
        weight: 7
      },

      // A/B Testing Experience
      {
        id: 'ab_testing_experience',
        type: 'single-choice',
        question: 'What is your current A/B testing experience level?',
        description: 'We\'ll adjust our recommendations and interface complexity accordingly',
        options: [
          { value: 'none', label: 'No previous A/B testing experience', abTestRelevance: ['beginner-tests', 'education', 'simple-setup'] },
          { value: 'basic', label: 'Basic (run a few simple tests)', abTestRelevance: ['intermediate-tests', 'best-practices', 'methodology'] },
          { value: 'intermediate', label: 'Intermediate (regular testing program)', abTestRelevance: ['advanced-tests', 'statistical-rigor', 'optimization'] },
          { value: 'advanced', label: 'Advanced (sophisticated testing strategy)', abTestRelevance: ['complex-tests', 'multivariate', 'ai-assisted'] }
        ],
        required: true,
        category: 'technical',
        weight: 5
      },

      // Conditional Questions Based on Industry
      {
        id: 'saas_metrics',
        type: 'multiple-choice',
        question: 'Which SaaS metrics are most important to you?',
        description: 'We\'ll focus A/B tests on improving these specific metrics',
        conditional: {
          showIf: [{ questionId: 'industry', operator: 'equals', value: 'saas' }],
          logic: 'and'
        },
        options: [
          { value: 'trial-conversion', label: 'Trial-to-Paid Conversion Rate', abTestRelevance: ['trial-experience', 'upgrade-prompts', 'value-demonstration'] },
          { value: 'mrr-growth', label: 'Monthly Recurring Revenue Growth', abTestRelevance: ['pricing-optimization', 'upselling', 'retention'] },
          { value: 'churn-rate', label: 'Customer Churn Rate', abTestRelevance: ['retention-campaigns', 'exit-surveys', 'win-back'] },
          { value: 'activation-rate', label: 'User Activation Rate', abTestRelevance: ['onboarding-optimization', 'aha-moments', 'feature-adoption'] },
          { value: 'ltv', label: 'Customer Lifetime Value', abTestRelevance: ['upselling', 'cross-selling', 'retention-optimization'] }
        ],
        required: false,
        category: 'goals',
        weight: 8
      },

      {
        id: 'ecommerce_metrics',
        type: 'multiple-choice',
        question: 'Which e-commerce metrics are your top priorities?',
        description: 'We\'ll design A/B tests to directly impact these KPIs',
        conditional: {
          showIf: [{ questionId: 'industry', operator: 'equals', value: 'ecommerce' }],
          logic: 'and'
        },
        options: [
          { value: 'conversion-rate', label: 'Overall Conversion Rate', abTestRelevance: ['product-pages', 'checkout-optimization', 'trust-signals'] },
          { value: 'aov', label: 'Average Order Value', abTestRelevance: ['upselling', 'bundling', 'pricing-strategies'] },
          { value: 'cart-abandonment', label: 'Cart Abandonment Rate', abTestRelevance: ['checkout-flow', 'shipping-options', 'payment-methods'] },
          { value: 'repeat-purchase', label: 'Repeat Purchase Rate', abTestRelevance: ['email-campaigns', 'loyalty-programs', 'recommendations'] },
          { value: 'mobile-conversion', label: 'Mobile Conversion Rate', abTestRelevance: ['mobile-optimization', 'mobile-checkout', 'responsive-design'] }
        ],
        required: false,
        category: 'goals',
        weight: 8
      },

      // Priority Areas for A/B Testing
      {
        id: 'priority_areas',
        type: 'multiple-choice',
        question: 'Which areas would you like to focus your A/B testing efforts on first? (Select up to 3)',
        description: 'We\'ll prioritize these areas in your initial testing roadmap',
        options: [
          { value: 'homepage', label: 'Homepage Optimization', abTestRelevance: ['homepage-layout', 'hero-sections', 'navigation'] },
          { value: 'landing-pages', label: 'Landing Page Performance', abTestRelevance: ['landing-page-design', 'cta-placement', 'form-optimization'] },
          { value: 'pricing-pages', label: 'Pricing Page Optimization', abTestRelevance: ['pricing-display', 'pricing-tiers', 'value-communication'] },
          { value: 'checkout-flow', label: 'Checkout/Purchase Flow', abTestRelevance: ['checkout-optimization', 'payment-flow', 'form-fields'] },
          { value: 'onboarding', label: 'User Onboarding Process', abTestRelevance: ['onboarding-flow', 'activation-optimization', 'tutorial-design'] },
          { value: 'product-pages', label: 'Product/Service Pages', abTestRelevance: ['product-presentation', 'feature-highlighting', 'social-proof'] },
          { value: 'email-campaigns', label: 'Email Marketing', abTestRelevance: ['email-design', 'subject-lines', 'cta-optimization'] },
          { value: 'mobile-experience', label: 'Mobile Experience', abTestRelevance: ['mobile-optimization', 'responsive-design', 'mobile-forms'] },
          { value: 'search-functionality', label: 'Search & Navigation', abTestRelevance: ['search-optimization', 'navigation-design', 'filtering'] },
          { value: 'trust-building', label: 'Trust & Social Proof', abTestRelevance: ['testimonials', 'reviews', 'security-badges'] }
        ],
        required: false,
        category: 'goals',
        weight: 7
      },

      // Technical Setup & Integration
      {
        id: 'current_tools',
        type: 'multiple-choice',
        question: 'What marketing/analytics tools are you currently using? (Select all that apply)',
        description: 'This helps us ensure seamless integration and avoid conflicts',
        options: [
          { value: 'google-analytics', label: 'Google Analytics', abTestRelevance: ['ga-integration', 'goal-tracking'] },
          { value: 'google-optimize', label: 'Google Optimize', abTestRelevance: ['migration-strategy', 'advanced-features'] },
          { value: 'hotjar', label: 'Hotjar/Heatmaps', abTestRelevance: ['behavior-analysis', 'qualitative-insights'] },
          { value: 'mixpanel', label: 'Mixpanel', abTestRelevance: ['event-tracking', 'funnel-analysis'] },
          { value: 'amplitude', label: 'Amplitude', abTestRelevance: ['advanced-analytics', 'cohort-analysis'] },
          { value: 'hubspot', label: 'HubSpot', abTestRelevance: ['marketing-automation', 'lead-tracking'] },
          { value: 'salesforce', label: 'Salesforce', abTestRelevance: ['crm-integration', 'lead-attribution'] },
          { value: 'mailchimp', label: 'Mailchimp/Email Platform', abTestRelevance: ['email-integration', 'audience-sync'] },
          { value: 'facebook-ads', label: 'Facebook/Meta Ads', abTestRelevance: ['ad-optimization', 'audience-matching'] },
          { value: 'google-ads', label: 'Google Ads', abTestRelevance: ['ad-landing-page-sync', 'conversion-tracking'] },
          { value: 'shopify', label: 'Shopify/E-commerce Platform', abTestRelevance: ['ecommerce-integration', 'checkout-testing'] },
          { value: 'wordpress', label: 'WordPress', abTestRelevance: ['cms-integration', 'plugin-compatibility'] }
        ],
        required: false,
        category: 'technical',
        weight: 4
      }
    ];
  }

  // Start a new questionnaire session
  async startQuestionnaire(sessionId: string, source: string = 'web'): Promise<{ sessionId: string; currentQuestion: QuestionDefinition }> {
    const session: QuestionnaireResponse = {
      sessionId,
      responses: {},
      currentStep: 0
    };

    await this.redis.setex(`questionnaire:${sessionId}`, 3600, JSON.stringify(session)); // 1 hour expiry

    const firstQuestion = this.getNextQuestion(session);
    if (!firstQuestion) {
      throw new Error('No questions available in questionnaire');
    }

    return {
      sessionId,
      currentQuestion: firstQuestion
    };
  }

  // Submit an answer and get the next question
  async submitAnswer(sessionId: string, questionId: string, answer: any): Promise<{
    success: boolean;
    nextQuestion?: QuestionDefinition;
    completed?: boolean;
    customerProfile?: CustomerProfile;
    abTestRecommendations?: ABTestRecommendation[];
  }> {
    const sessionData = await this.redis.get(`questionnaire:${sessionId}`);
    if (!sessionData) {
      throw new Error('Questionnaire session not found or expired');
    }

    const session: QuestionnaireResponse = JSON.parse(sessionData);

    // Validate the answer
    const question = this.questionnaireDefinition.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Invalid question ID');
    }

    const isValid = this.validateAnswer(question, answer);
    if (!isValid) {
      throw new Error('Invalid answer format');
    }

    // Store the answer
    session.responses[questionId] = answer;
    session.currentStep++;

    // Check if questionnaire is complete
    const nextQuestion = this.getNextQuestion(session);

    if (!nextQuestion) {
      // Questionnaire completed - generate customer profile and recommendations
      session.completedAt = new Date();
      const customerProfile = await this.generateCustomerProfile(session);
      const abTestRecommendations = await this.generateABTestRecommendations(customerProfile);

      session.customerProfile = customerProfile;

      // Store completed session with longer expiry
      await this.redis.setex(`questionnaire:completed:${sessionId}`, 86400 * 7, JSON.stringify(session)); // 7 days
      await this.redis.setex(`customer-profile:${customerProfile.id}`, 86400 * 30, JSON.stringify(customerProfile)); // 30 days

      return {
        success: true,
        completed: true,
        customerProfile,
        abTestRecommendations
      };
    }

    // Update session and return next question
    await this.redis.setex(`questionnaire:${sessionId}`, 3600, JSON.stringify(session));

    return {
      success: true,
      nextQuestion
    };
  }

  // Get the next question based on current responses and conditional logic
  private getNextQuestion(session: QuestionnaireResponse): QuestionDefinition | null {
    const answeredQuestions = Object.keys(session.responses);

    for (const question of this.questionnaireDefinition) {
      // Skip if already answered
      if (answeredQuestions.includes(question.id)) {
        continue;
      }

      // Check conditional logic
      if (question.conditional) {
        const shouldShow = this.evaluateConditionalLogic(question.conditional, session.responses);
        if (!shouldShow) {
          continue;
        }
      }

      return question;
    }

    return null; // No more questions
  }

  // Evaluate conditional logic for question visibility
  private evaluateConditionalLogic(conditional: ConditionalLogic, responses: Record<string, any>): boolean {
    const results = conditional.showIf.map(condition => {
      const responseValue = responses[condition.questionId];

      switch (condition.operator) {
        case 'equals':
          return responseValue === condition.value;
        case 'not-equals':
          return responseValue !== condition.value;
        case 'contains':
          return Array.isArray(responseValue) && responseValue.includes(condition.value);
        case 'greater-than':
          return Number(responseValue) > Number(condition.value);
        case 'less-than':
          return Number(responseValue) < Number(condition.value);
        default:
          return false;
      }
    });

    return conditional.logic === 'and'
      ? results.every(Boolean)
      : results.some(Boolean);
  }

  // Validate answer format and constraints
  private validateAnswer(question: QuestionDefinition, answer: any): boolean {
    if (question.required && (answer === null || answer === undefined || answer === '')) {
      return false;
    }

    switch (question.type) {
      case 'single-choice':
        return typeof answer === 'string' &&
               Boolean(question.options?.some(opt => opt.value === answer));

      case 'multiple-choice':
        return Array.isArray(answer) &&
               answer.every(val => Boolean(question.options?.some(opt => opt.value === val)));

      case 'text':
        if (typeof answer !== 'string') return false;
        if (question.validation?.minLength && answer.length < question.validation.minLength) return false;
        if (question.validation?.maxLength && answer.length > question.validation.maxLength) return false;
        if (question.validation?.pattern && !new RegExp(question.validation.pattern).test(answer)) return false;
        return true;

      case 'number':
        const num = Number(answer);
        if (isNaN(num)) return false;
        if (question.validation?.min && num < question.validation.min) return false;
        if (question.validation?.max && num > question.validation.max) return false;
        return true;

      case 'boolean':
        return typeof answer === 'boolean';

      case 'scale':
        const scale = Number(answer);
        return !isNaN(scale) && scale >= 1 && scale <= 10;

      default:
        return true;
    }
  }

  // Generate customer profile from questionnaire responses
  private async generateCustomerProfile(session: QuestionnaireResponse): Promise<CustomerProfile> {
    const responses = session.responses;
    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: profileId,
      industry: responses.industry || 'other',
      businessModel: Array.isArray(responses.business_model)
        ? responses.business_model[0]
        : responses.business_model || 'b2c',
      companySize: responses.company_size || 'small',
      revenueModel: this.inferRevenueModel(responses),
      primaryGoals: responses.primary_goals || ['purchase'],
      currentChallenges: responses.current_challenges || [],
      targetMetrics: this.inferTargetMetrics(responses),
      technicalSophistication: this.inferTechnicalLevel(responses),
      currentTools: responses.current_tools || [],
      trafficVolume: responses.traffic_volume || 'medium',
      salesCycle: this.inferSalesCycle(responses),
      decisionMakers: this.inferDecisionMakers(responses),
      geographicMarkets: ['global'], // Default, could be expanded
      seasonality: 'none', // Default, could be expanded
      competitivePosition: 'challenger', // Default, could be expanded
      growthStage: this.inferGrowthStage(responses),
      abTestingExperience: responses.ab_testing_experience || 'none',
      priorityAreas: responses.priority_areas || [],
      metadata: {
        completedAt: new Date(),
        source: 'questionnaire',
        version: '1.0'
      }
    };
  }

  // Helper methods for profile inference
  private inferRevenueModel(responses: Record<string, any>): RevenueModel {
    const businessModels = responses.business_model || [];
    if (businessModels.includes('subscription')) return 'subscription';
    if (businessModels.includes('freemium')) return 'freemium';
    if (businessModels.includes('marketplace')) return 'commission';
    return 'one-time';
  }

  private inferTargetMetrics(responses: Record<string, any>): TargetMetric[] {
    const industry = responses.industry;
    const goals = responses.primary_goals || [];

    const metrics: TargetMetric[] = ['conversion-rate']; // Always include

    if (goals.includes('purchase')) metrics.push('revenue-per-visitor', 'average-order-value');
    if (goals.includes('trial-signup')) metrics.push('trial-to-paid-conversion');
    if (industry === 'saas') metrics.push('customer-lifetime-value', 'retention-rate');
    if (industry === 'ecommerce') metrics.push('average-order-value', 'retention-rate');

    return [...new Set(metrics)]; // Remove duplicates
  }

  private inferTechnicalLevel(responses: Record<string, any>): TechnicalLevel {
    const tools = responses.current_tools || [];
    const abExperience = responses.ab_testing_experience;

    if (abExperience === 'advanced' || tools.length > 5) return 'expert';
    if (abExperience === 'intermediate' || tools.length > 3) return 'advanced';
    if (abExperience === 'basic' || tools.length > 1) return 'intermediate';
    return 'beginner';
  }

  private inferSalesCycle(responses: Record<string, any>): SalesCycle {
    const industry = responses.industry;
    const businessModel = responses.business_model || [];

    if (industry === 'government' || businessModel.includes('enterprise')) return 'quarters';
    if (industry === 'manufacturing' || industry === 'healthcare') return 'months';
    if (industry === 'consulting' || industry === 'real-estate') return 'weeks';
    if (industry === 'ecommerce' || businessModel.includes('b2c')) return 'immediate';
    return 'days';
  }

  private inferDecisionMakers(responses: Record<string, any>): DecisionMaker[] {
    const businessModel = responses.business_model || [];
    const companySize = responses.company_size;

    if (companySize === 'enterprise' || companySize === 'fortune500') {
      return ['committee', 'executive', 'procurement'];
    }
    if (businessModel.includes('b2b')) {
      return ['team', 'executive'];
    }
    return ['individual'];
  }

  private inferGrowthStage(responses: Record<string, any>): GrowthStage {
    const companySize = responses.company_size;

    switch (companySize) {
      case 'startup': return 'startup';
      case 'small': return 'growth';
      case 'medium': return 'growth';
      case 'enterprise': return 'maturity';
      case 'fortune500': return 'enterprise';
      default: return 'growth';
    }
  }

  // Generate A/B test recommendations based on customer profile
  private async generateABTestRecommendations(profile: CustomerProfile): Promise<ABTestRecommendation[]> {
    const recommendations: ABTestRecommendation[] = [];

    // Industry-specific recommendations
    const industryRecs = this.getIndustrySpecificRecommendations(profile);
    recommendations.push(...industryRecs);

    // Challenge-based recommendations
    const challengeRecs = this.getChallengeBasedRecommendations(profile);
    recommendations.push(...challengeRecs);

    // Traffic-based filtering and prioritization
    const filteredRecs = this.filterByTrafficVolume(recommendations, profile.trafficVolume);

    // Sort by priority and confidence
    return filteredRecs
      .sort((a, b) => (b.priority * b.confidence) - (a.priority * a.confidence))
      .slice(0, 10); // Top 10 recommendations
  }

  private getIndustrySpecificRecommendations(profile: CustomerProfile): ABTestRecommendation[] {
    const recommendations: ABTestRecommendation[] = [];

    switch (profile.industry) {
      case 'saas':
        recommendations.push(
          {
            templateId: 'saas-trial-signup-optimization',
            priority: 9,
            rationale: 'Optimize trial signup flow for SaaS companies to increase conversion rates',
            expectedImpact: 'high',
            confidence: 0.85,
            estimatedDuration: 14,
            requiredTraffic: 1000
          },
          {
            templateId: 'saas-pricing-page-optimization',
            priority: 8,
            rationale: 'Test pricing presentation and tier structures for better conversions',
            expectedImpact: 'high',
            confidence: 0.80,
            estimatedDuration: 21,
            requiredTraffic: 1500
          }
        );
        break;

      case 'ecommerce':
        recommendations.push(
          {
            templateId: 'ecommerce-checkout-optimization',
            priority: 10,
            rationale: 'Reduce cart abandonment through checkout flow optimization',
            expectedImpact: 'high',
            confidence: 0.90,
            estimatedDuration: 14,
            requiredTraffic: 2000
          },
          {
            templateId: 'ecommerce-product-page-optimization',
            priority: 8,
            rationale: 'Improve product page conversion through better presentation',
            expectedImpact: 'medium',
            confidence: 0.75,
            estimatedDuration: 14,
            requiredTraffic: 2500
          }
        );
        break;

      case 'fintech':
        recommendations.push(
          {
            templateId: 'fintech-application-flow',
            priority: 9,
            rationale: 'Optimize financial application processes with trust signals and progressive disclosure',
            expectedImpact: 'high',
            confidence: 0.75,
            estimatedDuration: 28,
            requiredTraffic: 1500
          }
        );
        break;

      case 'manufacturing':
        recommendations.push(
          {
            templateId: 'manufacturing-rfq-optimization',
            priority: 8,
            rationale: 'Optimize RFQ forms to increase lead quality and conversion for B2B manufacturing',
            expectedImpact: 'high',
            confidence: 0.80,
            estimatedDuration: 21,
            requiredTraffic: 800
          }
        );
        break;

      case 'healthcare':
        recommendations.push(
          {
            templateId: 'healthcare-appointment-booking',
            priority: 9,
            rationale: 'Optimize appointment booking with trust signals and provider information',
            expectedImpact: 'high',
            confidence: 0.75,
            estimatedDuration: 28,
            requiredTraffic: 1200
          }
        );
        break;

      case 'education':
        recommendations.push(
          {
            templateId: 'education-enrollment-optimization',
            priority: 8,
            rationale: 'Increase student enrollment through social proof and outcome demonstration',
            expectedImpact: 'high',
            confidence: 0.82,
            estimatedDuration: 21,
            requiredTraffic: 1500
          }
        );
        break;

      case 'consulting':
        recommendations.push(
          {
            templateId: 'consulting-consultation-booking',
            priority: 9,
            rationale: 'Optimize consultation booking with value proposition and consultant credibility',
            expectedImpact: 'high',
            confidence: 0.85,
            estimatedDuration: 14,
            requiredTraffic: 800
          }
        );
        break;

      // Add more industry-specific recommendations...
    }

    return recommendations;
  }

  private getChallengeBasedRecommendations(profile: CustomerProfile): ABTestRecommendation[] {
    const recommendations: ABTestRecommendation[] = [];

    profile.currentChallenges.forEach(challenge => {
      switch (challenge) {
        case 'low-conversion-rate':
          recommendations.push({
            templateId: 'general-conversion-optimization',
            priority: 9,
            rationale: 'Address low conversion rates through systematic testing',
            expectedImpact: 'high',
            confidence: 0.85,
            estimatedDuration: 14,
            requiredTraffic: 1000
          });
          break;

        case 'high-cart-abandonment':
          recommendations.push({
            templateId: 'cart-abandonment-reduction',
            priority: 10,
            rationale: 'Specific tests to reduce cart abandonment rates',
            expectedImpact: 'high',
            confidence: 0.90,
            estimatedDuration: 14,
            requiredTraffic: 1500
          });
          break;

        // Add more challenge-based recommendations...
      }
    });

    return recommendations;
  }

  private filterByTrafficVolume(recommendations: ABTestRecommendation[], trafficVolume: TrafficVolume): ABTestRecommendation[] {
    const trafficMultiplier = {
      'low': 0.5,
      'medium': 1.0,
      'high': 1.5,
      'very-high': 2.0
    };

    const multiplier = trafficMultiplier[trafficVolume];

    return recommendations.filter(rec => {
      // Adjust required traffic based on actual volume
      rec.requiredTraffic *= multiplier;

      // Filter out tests that require too much traffic for low-traffic sites
      if (trafficVolume === 'low' && rec.requiredTraffic > 5000) {
        return false;
      }

      return true;
    });
  }

  // Get questionnaire progress
  async getQuestionnaireProgress(sessionId: string): Promise<{
    currentStep: number;
    totalSteps: number;
    completionPercentage: number;
    responses: Record<string, any>;
  }> {
    const sessionData = await this.redis.get(`questionnaire:${sessionId}`);
    if (!sessionData) {
      throw new Error('Questionnaire session not found');
    }

    const session: QuestionnaireResponse = JSON.parse(sessionData);
    const applicableQuestions = this.getApplicableQuestions(session.responses);

    return {
      currentStep: session.currentStep,
      totalSteps: applicableQuestions.length,
      completionPercentage: Math.round((session.currentStep / applicableQuestions.length) * 100),
      responses: session.responses
    };
  }

  // Get list of questions that apply to current responses (for progress calculation)
  private getApplicableQuestions(responses: Record<string, any>): QuestionDefinition[] {
    return this.questionnaireDefinition.filter(question => {
      if (!question.conditional) return true;
      return this.evaluateConditionalLogic(question.conditional, responses);
    });
  }

  // Get completed customer profile
  async getCustomerProfile(profileId: string): Promise<CustomerProfile | null> {
    const profileData = await this.redis.get(`customer-profile:${profileId}`);
    return profileData ? JSON.parse(profileData) : null;
  }

  // Get health status
  async getHealthStatus(): Promise<{ status: string; questionnaires: { active: number; completed: number } }> {
    try {
      const activeKeys = await this.redis.keys('questionnaire:*');
      const completedKeys = await this.redis.keys('questionnaire:completed:*');

      return {
        status: 'healthy',
        questionnaires: {
          active: activeKeys.length,
          completed: completedKeys.length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        questionnaires: { active: 0, completed: 0 }
      };
    }
  }
}

// Factory function to create service instance
export default function createSmartOnboardingService(redis: Redis): SmartOnboardingService {
  return new SmartOnboardingService(redis);
}
