/**
 * Automated Onboarding Engine
 * Provides intelligent, industry-specific onboarding flows with guided tours,
 * setup wizards, and configuration recommendations based on company profile analysis
 */

import { industryMetricMappingService } from './industry-metric-mapping-service';
import { progressiveComplexityManager } from './progressive-complexity-manager';
import { smartWidgetRecommendationEngine } from './smart-widget-recommendation-engine';

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  industry: string;
  businessModel: string;
  estimatedDuration: number; // minutes
  steps: OnboardingStep[];
  prerequisites?: OnboardingPrerequisite[];
  completionCriteria: CompletionCriteria;
  rewards: OnboardingReward[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'profile-setup' | 'data-connection' | 'widget-selection' | 'layout-configuration' | 'feature-introduction' | 'tutorial' | 'completion';
  category: 'required' | 'recommended' | 'optional';
  estimatedDuration: number; // minutes
  order: number;
  content: StepContent;
  validation?: StepValidation;
  navigation: StepNavigation;
  helpContent: HelpContent;
}

export interface StepContent {
  primaryAction: Action;
  secondaryActions?: Action[];
  interactiveElements: InteractiveElement[];
  visualAids: VisualAid[];
  progressIndicator: ProgressIndicator;
}

export interface Action {
  id: string;
  label: string;
  type: 'button' | 'link' | 'form-submit' | 'api-call' | 'navigation';
  target?: string;
  payload?: any;
  styling: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export interface InteractiveElement {
  id: string;
  type: 'input' | 'select' | 'checkbox' | 'radio' | 'slider' | 'file-upload' | 'code-snippet' | 'preview';
  label: string;
  description?: string;
  required: boolean;
  validation?: ValidationRule[];
  defaultValue?: any;
  options?: SelectOption[];
  placeholder?: string;
}

export interface VisualAid {
  id: string;
  type: 'image' | 'video' | 'animation' | 'diagram' | 'screenshot' | 'overlay';
  src: string;
  alt: string;
  caption?: string;
  dimensions?: { width: number; height: number };
  position: 'inline' | 'sidebar' | 'modal' | 'overlay';
}

export interface ProgressIndicator {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining: number; // minutes
  percentComplete: number;
}

export interface StepValidation {
  rules: ValidationRule[];
  onSuccess?: Action;
  onFailure?: Action;
  customValidator?: string; // function name for custom validation
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'url' | 'min-length' | 'max-length' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface StepNavigation {
  canSkip: boolean;
  canGoBack: boolean;
  nextStep?: string;
  previousStep?: string;
  skipTarget?: string;
  backTarget?: string;
}

export interface HelpContent {
  quickTip: string;
  detailedGuide: string;
  videoUrl?: string;
  troubleshooting: TroubleshootingItem[];
  relatedArticles: RelatedArticle[];
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
  additionalResources?: string[];
}

export interface RelatedArticle {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'video' | 'blog';
}

export interface OnboardingPrerequisite {
  type: 'account-verification' | 'permissions' | 'integrations' | 'data-availability';
  description: string;
  required: boolean;
  checkFunction: string; // function name to verify prerequisite
}

export interface CompletionCriteria {
  requiredSteps: string[];
  minimumCompletion: number; // percentage
  timeLimit?: number; // days
  customCriteria?: CustomCriterion[];
}

export interface CustomCriterion {
  name: string;
  description: string;
  checkFunction: string; // function name
  weight: number; // importance weight
}

export interface OnboardingReward {
  type: 'feature-unlock' | 'template' | 'badge' | 'credits' | 'support-priority';
  name: string;
  description: string;
  value: string | number;
  icon?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface UserOnboardingSession {
  userId: string;
  companyId: string;
  flowId: string;
  currentStepId: string;
  startedAt: Date;
  lastActiveAt: Date;
  completedSteps: string[];
  skippedSteps: string[];
  userData: Record<string, any>;
  progressMetrics: SessionMetrics;
  customizations: SessionCustomization[];
}

export interface SessionMetrics {
  timeSpent: number; // minutes
  stepsCompleted: number;
  stepsSkipped: number;
  helpRequestsCount: number;
  errorsEncountered: number;
  completionRate: number; // percentage
}

export interface SessionCustomization {
  stepId: string;
  customizations: Record<string, any>;
  appliedAt: Date;
}

export interface OnboardingRecommendation {
  type: 'flow-selection' | 'step-customization' | 'content-personalization' | 'pace-adjustment';
  target: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  suggestedAction: string;
  estimatedValue: string;
}

export interface FlowAnalytics {
  flowId: string;
  completionRate: number;
  averageDuration: number; // minutes
  dropOffPoints: StepAnalytics[];
  userSatisfaction: number; // 1-5 scale
  industryBenchmark: number;
  improvementOpportunities: string[];
}

export interface StepAnalytics {
  stepId: string;
  completionRate: number;
  averageDuration: number;
  skipRate: number;
  helpRequestRate: number;
  errorRate: number;
  userFeedback: number; // 1-5 scale
}

export class AutomatedOnboardingEngine {
  private onboardingFlows: Map<string, OnboardingFlow> = new Map();
  private userSessions: Map<string, UserOnboardingSession> = new Map();
  private flowAnalytics: Map<string, FlowAnalytics> = new Map();

  constructor() {
    this.initializeOnboardingFlows();
  }

  /**
   * Initialize industry-specific onboarding flows
   */
  private initializeOnboardingFlows(): void {
    // SaaS Onboarding Flow
    this.onboardingFlows.set('saas-standard', {
      id: 'saas-standard',
      name: 'SaaS Business Setup',
      description: 'Complete onboarding for SaaS companies focusing on MRR, churn, and growth metrics',
      industry: 'saas',
      businessModel: 'subscription',
      estimatedDuration: 25,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Your Analytics Journey',
          description: 'Let\'s set up your SaaS analytics dashboard to track what matters most',
          type: 'welcome',
          category: 'required',
          estimatedDuration: 2,
          order: 1,
          content: {
            primaryAction: {
              id: 'start-setup',
              label: 'Start Setup',
              type: 'button',
              styling: 'primary'
            },
            interactiveElements: [],
            visualAids: [{
              id: 'welcome-video',
              type: 'video',
              src: '/onboarding/saas-welcome.mp4',
              alt: 'SaaS onboarding welcome video',
              position: 'inline'
            }],
            progressIndicator: {
              currentStep: 1,
              totalSteps: 8,
              completedSteps: 0,
              estimatedTimeRemaining: 23,
              percentComplete: 0
            }
          },
          navigation: {
            canSkip: false,
            canGoBack: false,
            nextStep: 'company-profile'
          },
          helpContent: {
            quickTip: 'This setup takes about 25 minutes and will customize your dashboard for SaaS metrics',
            detailedGuide: 'We\'ll guide you through connecting your data sources and setting up key SaaS metrics like MRR, churn rate, and customer acquisition cost.',
            troubleshooting: [],
            relatedArticles: []
          }
        },
        {
          id: 'company-profile',
          title: 'Tell Us About Your Company',
          description: 'Help us customize your experience by sharing key details about your SaaS business',
          type: 'profile-setup',
          category: 'required',
          estimatedDuration: 5,
          order: 2,
          content: {
            primaryAction: {
              id: 'save-profile',
              label: 'Continue',
              type: 'form-submit',
              styling: 'primary'
            },
            interactiveElements: [
              {
                id: 'company-stage',
                type: 'select',
                label: 'Company Stage',
                required: true,
                options: [
                  { value: 'pre-revenue', label: 'Pre-Revenue' },
                  { value: 'early-stage', label: 'Early Stage ($0-$1M ARR)' },
                  { value: 'growth-stage', label: 'Growth Stage ($1M-$10M ARR)' },
                  { value: 'scale-stage', label: 'Scale Stage ($10M+ ARR)' }
                ]
              },
              {
                id: 'primary-metric',
                type: 'select',
                label: 'Most Important Metric',
                required: true,
                options: [
                  { value: 'revenue-growth', label: 'Revenue Growth' },
                  { value: 'customer-acquisition', label: 'Customer Acquisition' },
                  { value: 'churn-reduction', label: 'Churn Reduction' },
                  { value: 'product-adoption', label: 'Product Adoption' }
                ]
              },
              {
                id: 'team-size',
                type: 'select',
                label: 'Team Size',
                required: true,
                options: [
                  { value: '1-10', label: '1-10 employees' },
                  { value: '11-50', label: '11-50 employees' },
                  { value: '51-200', label: '51-200 employees' },
                  { value: '200+', label: '200+ employees' }
                ]
              }
            ],
            visualAids: [],
            progressIndicator: {
              currentStep: 2,
              totalSteps: 8,
              completedSteps: 1,
              estimatedTimeRemaining: 18,
              percentComplete: 12.5
            }
          },
          navigation: {
            canSkip: false,
            canGoBack: true,
            nextStep: 'data-connections',
            previousStep: 'welcome'
          },
          helpContent: {
            quickTip: 'This information helps us recommend the right metrics and widgets for your business stage',
            detailedGuide: 'We use your company profile to suggest industry-specific KPIs and dashboard layouts that match your current growth stage and priorities.',
            troubleshooting: [
              {
                issue: 'Not sure about company stage?',
                solution: 'Choose based on your current annual recurring revenue (ARR) or select the stage that best matches your current challenges and goals.'
              }
            ],
            relatedArticles: []
          }
        },
        {
          id: 'data-connections',
          title: 'Connect Your Data Sources',
          description: 'Link your key business tools to automatically populate your dashboard',
          type: 'data-connection',
          category: 'required',
          estimatedDuration: 8,
          order: 3,
          content: {
            primaryAction: {
              id: 'test-connections',
              label: 'Test Connections',
              type: 'api-call',
              styling: 'primary'
            },
            secondaryActions: [{
              id: 'skip-connections',
              label: 'Skip for Now',
              type: 'navigation',
              target: 'widget-selection',
              styling: 'secondary'
            }],
            interactiveElements: [
              {
                id: 'stripe-connection',
                type: 'checkbox',
                label: 'Stripe (Revenue & Subscriptions)',
                required: false,
                description: 'Connect to track MRR, churn, and subscription metrics'
              },
              {
                id: 'google-analytics',
                type: 'checkbox',
                label: 'Google Analytics (Traffic & Conversions)',
                required: false,
                description: 'Monitor website traffic and conversion funnels'
              },
              {
                id: 'mixpanel-connection',
                type: 'checkbox',
                label: 'Mixpanel (Product Analytics)',
                required: false,
                description: 'Track user engagement and feature adoption'
              },
              {
                id: 'hubspot-connection',
                type: 'checkbox',
                label: 'HubSpot (Sales & Marketing)',
                required: false,
                description: 'Monitor lead generation and sales pipeline'
              }
            ],
            visualAids: [{
              id: 'integration-diagram',
              type: 'diagram',
              src: '/onboarding/data-flow-diagram.svg',
              alt: 'Data integration flow diagram',
              position: 'sidebar'
            }],
            progressIndicator: {
              currentStep: 3,
              totalSteps: 8,
              completedSteps: 2,
              estimatedTimeRemaining: 15,
              percentComplete: 25
            }
          },
          validation: {
            rules: [
              {
                field: 'at-least-one-connection',
                type: 'custom',
                message: 'Please connect at least one data source or skip this step'
              }
            ]
          },
          navigation: {
            canSkip: true,
            canGoBack: true,
            nextStep: 'widget-selection',
            previousStep: 'company-profile',
            skipTarget: 'widget-selection'
          },
          helpContent: {
            quickTip: 'You can always add more integrations later from the settings page',
            detailedGuide: 'Each integration automatically creates relevant widgets and metrics. Stripe adds revenue tracking, Google Analytics adds traffic monitoring, etc.',
            troubleshooting: [
              {
                issue: 'Connection failed?',
                solution: 'Check your API keys and permissions. Make sure the service account has read access to the required data.',
                additionalResources: ['/docs/troubleshooting/integrations']
              }
            ],
            relatedArticles: []
          }
        }
        // Additional steps would continue here...
      ],
      completionCriteria: {
        requiredSteps: ['welcome', 'company-profile'],
        minimumCompletion: 75,
        timeLimit: 7
      },
      rewards: [
        {
          type: 'feature-unlock',
          name: 'Advanced SaaS Widgets',
          description: 'Unlock cohort analysis, revenue forecasting, and churn prediction widgets',
          value: 'saas-advanced-widgets'
        },
        {
          type: 'template',
          name: 'SaaS Executive Dashboard',
          description: 'Pre-configured dashboard template with key SaaS metrics',
          value: 'saas-executive-template'
        }
      ]
    });

    // E-commerce Onboarding Flow
    this.onboardingFlows.set('ecommerce-standard', {
      id: 'ecommerce-standard',
      name: 'E-commerce Analytics Setup',
      description: 'Optimize your e-commerce business with conversion tracking and customer analytics',
      industry: 'ecommerce',
      businessModel: 'transactional',
      estimatedDuration: 20,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to E-commerce Analytics',
          description: 'Set up tracking for sales, conversions, and customer behavior',
          type: 'welcome',
          category: 'required',
          estimatedDuration: 2,
          order: 1,
          content: {
            primaryAction: {
              id: 'start-ecommerce-setup',
              label: 'Start Setup',
              type: 'button',
              styling: 'primary'
            },
            interactiveElements: [],
            visualAids: [{
              id: 'ecommerce-preview',
              type: 'screenshot',
              src: '/onboarding/ecommerce-dashboard-preview.png',
              alt: 'E-commerce dashboard preview',
              position: 'inline'
            }],
            progressIndicator: {
              currentStep: 1,
              totalSteps: 6,
              completedSteps: 0,
              estimatedTimeRemaining: 18,
              percentComplete: 0
            }
          },
          navigation: {
            canSkip: false,
            canGoBack: false,
            nextStep: 'store-profile'
          },
          helpContent: {
            quickTip: 'We\'ll help you track sales performance, customer behavior, and marketing ROI',
            detailedGuide: 'This setup focuses on e-commerce specific metrics like conversion rates, average order value, customer lifetime value, and inventory turnover.',
            troubleshooting: [],
            relatedArticles: []
          }
        }
        // Additional e-commerce specific steps...
      ],
      completionCriteria: {
        requiredSteps: ['welcome', 'store-profile'],
        minimumCompletion: 70,
        timeLimit: 5
      },
      rewards: [
        {
          type: 'feature-unlock',
          name: 'E-commerce Intelligence',
          description: 'Advanced product analytics, customer segmentation, and inventory optimization',
          value: 'ecommerce-intelligence'
        }
      ]
    });

    // Financial Services Onboarding Flow
    this.onboardingFlows.set('fintech-standard', {
      id: 'fintech-standard',
      name: 'Financial Services Setup',
      description: 'Compliance-ready analytics for financial institutions and fintech companies',
      industry: 'fintech',
      businessModel: 'financial',
      estimatedDuration: 35,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Financial Analytics',
          description: 'Set up secure, compliant analytics for your financial services',
          type: 'welcome',
          category: 'required',
          estimatedDuration: 3,
          order: 1,
          content: {
            primaryAction: {
              id: 'start-fintech-setup',
              label: 'Start Secure Setup',
              type: 'button',
              styling: 'primary'
            },
            interactiveElements: [],
            visualAids: [{
              id: 'compliance-badge',
              type: 'image',
              src: '/onboarding/compliance-certifications.png',
              alt: 'Compliance certifications',
              position: 'sidebar'
            }],
            progressIndicator: {
              currentStep: 1,
              totalSteps: 10,
              completedSteps: 0,
              estimatedTimeRemaining: 32,
              percentComplete: 0
            }
          },
          navigation: {
            canSkip: false,
            canGoBack: false,
            nextStep: 'compliance-verification'
          },
          helpContent: {
            quickTip: 'This setup ensures your analytics meet financial industry compliance requirements',
            detailedGuide: 'We\'ll configure data encryption, audit trails, and compliance reporting features required for financial services.',
            troubleshooting: [],
            relatedArticles: []
          }
        }
        // Additional fintech specific steps...
      ],
      completionCriteria: {
        requiredSteps: ['welcome', 'compliance-verification'],
        minimumCompletion: 85,
        timeLimit: 14
      },
      rewards: [
        {
          type: 'feature-unlock',
          name: 'Financial Compliance Suite',
          description: 'Advanced risk monitoring, regulatory reporting, and audit trail features',
          value: 'fintech-compliance-suite'
        }
      ]
    });
  }

  /**
   * Recommend the best onboarding flow based on company profile
   */
  recommendOnboardingFlow(companyProfile: any): OnboardingRecommendation[] {
    const recommendations: OnboardingRecommendation[] = [];

    try {
      // Analyze company profile to determine best flow
      const analysis = smartWidgetRecommendationEngine.analyzeCompanyProfile(companyProfile);
      const industryProfile = industryMetricMappingService.getIndustryProfile(companyProfile.industry);

      // Primary flow recommendation based on industry
      let recommendedFlowId = 'saas-standard'; // default
      if (industryProfile) {
        const industryName = (industryProfile as any).name?.toLowerCase() || companyProfile.industry?.toLowerCase() || '';
        if (industryName.includes('ecommerce') || industryName.includes('retail')) {
          recommendedFlowId = 'ecommerce-standard';
        } else if (industryName.includes('fintech') || industryName.includes('banking') || industryName.includes('financial')) {
          recommendedFlowId = 'fintech-standard';
        }
      }

      const flow = this.onboardingFlows.get(recommendedFlowId);
      if (flow) {
        recommendations.push({
          type: 'flow-selection',
          target: flow.id,
          reason: `Optimized for ${flow.industry} businesses with ${flow.businessModel} model`,
          impact: 'high',
          confidence: 0.85,
          suggestedAction: `Start with ${flow.name} (${flow.estimatedDuration} min setup)`,
          estimatedValue: 'Faster time-to-value with industry-specific widgets and metrics'
        });
      }

      // Content personalization recommendations
      if (analysis && analysis.sophisticationScore > 7) {
        recommendations.push({
          type: 'content-personalization',
          target: 'advanced-features',
          reason: 'High technical sophistication detected',
          impact: 'medium',
          confidence: 0.78,
          suggestedAction: 'Include advanced features and technical details in onboarding',
          estimatedValue: 'Reduced setup time by skipping basic explanations'
        });
      }

      // Pace adjustment recommendations
      if (companyProfile.teamSize && companyProfile.teamSize === '1-10') {
        recommendations.push({
          type: 'pace-adjustment',
          target: 'setup-speed',
          reason: 'Small team detected - likely wants quick setup',
          impact: 'medium',
          confidence: 0.72,
          suggestedAction: 'Offer express setup option with essential features only',
          estimatedValue: 'Faster initial setup, can expand features later'
        });
      }

    } catch (error) {
      console.warn('Error generating onboarding recommendations:', error);
      // Return default recommendation
      recommendations.push({
        type: 'flow-selection',
        target: 'saas-standard',
        reason: 'Default onboarding flow for broad compatibility',
        impact: 'medium',
        confidence: 0.6,
        suggestedAction: 'Start with standard SaaS onboarding flow',
        estimatedValue: 'Comprehensive setup covering most business needs'
      });
    }

    return recommendations;
  }

  /**
   * Start a new onboarding session for a user
   */
  startOnboardingSession(userId: string, companyId: string, flowId: string, customizations?: Record<string, any>): UserOnboardingSession {
    const flow = this.onboardingFlows.get(flowId);
    if (!flow) {
      throw new Error(`Onboarding flow ${flowId} not found`);
    }

    const session: UserOnboardingSession = {
      userId,
      companyId,
      flowId,
      currentStepId: flow.steps[0].id,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      completedSteps: [],
      skippedSteps: [],
      userData: customizations || {},
      progressMetrics: {
        timeSpent: 0,
        stepsCompleted: 0,
        stepsSkipped: 0,
        helpRequestsCount: 0,
        errorsEncountered: 0,
        completionRate: 0
      },
      customizations: []
    };

    this.userSessions.set(userId, session);

    // Create user profile in progressive complexity manager
    progressiveComplexityManager.getUserProfile(userId, companyId);

    return session;
  }

  /**
   * Get current step for user's onboarding session
   */
  getCurrentStep(userId: string): OnboardingStep | null {
    const session = this.userSessions.get(userId);
    if (!session) return null;

    const flow = this.onboardingFlows.get(session.flowId);
    if (!flow) return null;

    return flow.steps.find(step => step.id === session.currentStepId) || null;
  }

  /**
   * Complete a step in the onboarding flow
   */
  completeStep(userId: string, stepId: string, userData?: Record<string, any>): { success: boolean; nextStep?: OnboardingStep; completed?: boolean } {
    const session = this.userSessions.get(userId);
    if (!session) {
      return { success: false };
    }

    const flow = this.onboardingFlows.get(session.flowId);
    if (!flow) {
      return { success: false };
    }

    const currentStep = flow.steps.find(step => step.id === stepId);
    if (!currentStep) {
      return { success: false };
    }

    // Update session
    session.completedSteps.push(stepId);
    session.progressMetrics.stepsCompleted++;
    session.lastActiveAt = new Date();

    if (userData) {
      session.userData = { ...session.userData, ...userData };
    }

    // Update progress metrics
    const totalSteps = flow.steps.length;
    session.progressMetrics.completionRate = (session.progressMetrics.stepsCompleted / totalSteps) * 100;

    // Find next step
    const currentStepIndex = flow.steps.findIndex(step => step.id === stepId);
    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex < flow.steps.length) {
      const nextStep = flow.steps[nextStepIndex];
      session.currentStepId = nextStep.id;

      return { success: true, nextStep };
    } else {
      // Onboarding completed
      const completionResult = this.completeOnboarding(userId);
      return { success: true, completed: true, ...completionResult };
    }
  }

  /**
   * Skip a step in the onboarding flow
   */
  skipStep(userId: string, stepId: string): { success: boolean; nextStep?: OnboardingStep } {
    const session = this.userSessions.get(userId);
    if (!session) {
      return { success: false };
    }

    const flow = this.onboardingFlows.get(session.flowId);
    if (!flow) {
      return { success: false };
    }

    const currentStep = flow.steps.find(step => step.id === stepId);
    if (!currentStep || !currentStep.navigation.canSkip) {
      return { success: false };
    }

    // Update session
    session.skippedSteps.push(stepId);
    session.progressMetrics.stepsSkipped++;
    session.lastActiveAt = new Date();

    // Navigate to next step
    const targetStepId = currentStep.navigation.skipTarget || currentStep.navigation.nextStep;
    if (targetStepId) {
      const nextStep = flow.steps.find(step => step.id === targetStepId);
      if (nextStep) {
        session.currentStepId = nextStep.id;
        return { success: true, nextStep };
      }
    }

    return { success: false };
  }

  /**
   * Complete the entire onboarding flow
   */
  private completeOnboarding(userId: string): { rewards: OnboardingReward[]; progressionUnlocked?: boolean } {
    const session = this.userSessions.get(userId);
    if (!session) {
      return { rewards: [] };
    }

    const flow = this.onboardingFlows.get(session.flowId);
    if (!flow) {
      return { rewards: [] };
    }

    // Check completion criteria
    const requiredStepsCompleted = flow.completionCriteria.requiredSteps.every(
      stepId => session.completedSteps.includes(stepId)
    );

    const minimumCompletionMet = session.progressMetrics.completionRate >= flow.completionCriteria.minimumCompletion;

    if (requiredStepsCompleted && minimumCompletionMet) {
      // Award rewards
      const rewards = flow.rewards;

      // Unlock features in progressive complexity manager
      rewards.forEach(reward => {
        if (reward.type === 'feature-unlock') {
          // This would integrate with the progressive complexity manager
          // to unlock specific features for the user
        }
      });

      // Track completion milestone
      progressiveComplexityManager.completeMilestone(userId, 'onboarding-completed');

      return { rewards, progressionUnlocked: true };
    }

    return { rewards: [] };
  }

  /**
   * Get onboarding session for a user
   */
  getSession(userId: string): UserOnboardingSession | null {
    return this.userSessions.get(userId) || null;
  }

  /**
   * Get available onboarding flows
   */
  getAvailableFlows(): OnboardingFlow[] {
    return Array.from(this.onboardingFlows.values());
  }

  /**
   * Get flow by ID
   */
  getFlow(flowId: string): OnboardingFlow | null {
    return this.onboardingFlows.get(flowId) || null;
  }

  /**
   * Record help request during onboarding
   */
  recordHelpRequest(userId: string, stepId: string, helpType: string): void {
    const session = this.userSessions.get(userId);
    if (session) {
      session.progressMetrics.helpRequestsCount++;
      session.lastActiveAt = new Date();
    }
  }

  /**
   * Record error encountered during onboarding
   */
  recordError(userId: string, stepId: string, error: string): void {
    const session = this.userSessions.get(userId);
    if (session) {
      session.progressMetrics.errorsEncountered++;
      session.lastActiveAt = new Date();
    }
  }

  /**
   * Update session with time spent
   */
  updateTimeSpent(userId: string, additionalMinutes: number): void {
    const session = this.userSessions.get(userId);
    if (session) {
      session.progressMetrics.timeSpent += additionalMinutes;
      session.lastActiveAt = new Date();
    }
  }

  /**
   * Generate analytics for onboarding flows
   */
  generateFlowAnalytics(flowId: string): FlowAnalytics {
    const sessions = Array.from(this.userSessions.values()).filter(s => s.flowId === flowId);
    const flow = this.onboardingFlows.get(flowId);

    if (!flow || sessions.length === 0) {
      return {
        flowId,
        completionRate: 0,
        averageDuration: 0,
        dropOffPoints: [],
        userSatisfaction: 0,
        industryBenchmark: 0,
        improvementOpportunities: []
      };
    }

    const completedSessions = sessions.filter(s => s.progressMetrics.completionRate >= 100);
    const completionRate = (completedSessions.length / sessions.length) * 100;
    const averageDuration = sessions.reduce((sum, s) => sum + s.progressMetrics.timeSpent, 0) / sessions.length;

    // Analyze drop-off points
    const stepAnalytics: StepAnalytics[] = flow.steps.map(step => {
      const sessionsReachedStep = sessions.filter(s =>
        s.completedSteps.includes(step.id) || s.skippedSteps.includes(step.id) || s.currentStepId === step.id
      );
      const sessionsCompletedStep = sessions.filter(s => s.completedSteps.includes(step.id));
      const sessionsSkippedStep = sessions.filter(s => s.skippedSteps.includes(step.id));

      return {
        stepId: step.id,
        completionRate: sessionsReachedStep.length > 0 ? (sessionsCompletedStep.length / sessionsReachedStep.length) * 100 : 0,
        averageDuration: step.estimatedDuration, // Would track actual time in real implementation
        skipRate: sessionsReachedStep.length > 0 ? (sessionsSkippedStep.length / sessionsReachedStep.length) * 100 : 0,
        helpRequestRate: 0, // Would track help requests per step
        errorRate: 0, // Would track errors per step
        userFeedback: 4.2 // Would track actual user feedback
      };
    });

    const dropOffPoints = stepAnalytics.filter(sa => sa.completionRate < 80);

    return {
      flowId,
      completionRate,
      averageDuration,
      dropOffPoints,
      userSatisfaction: 4.1, // Would calculate from actual feedback
      industryBenchmark: 78, // Would get from industry data
      improvementOpportunities: [
        ...(completionRate < 70 ? ['Simplify setup process'] : []),
        ...(dropOffPoints.length > 2 ? ['Reduce friction in high drop-off steps'] : []),
        ...(averageDuration > flow.estimatedDuration * 1.5 ? ['Optimize step duration'] : [])
      ]
    };
  }
}

// Singleton instance
export const automatedOnboardingEngine = new AutomatedOnboardingEngine();
