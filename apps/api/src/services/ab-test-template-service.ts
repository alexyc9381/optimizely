import { Redis } from 'ioredis';

// Core interfaces for A/B test templates
export interface ABTestTemplate {
  id: string;
  name: string;
  description: string;
  industry: Industry[];
  businessModel: BusinessModel[];
  category: TestCategory;
  difficulty: TestDifficulty;
  estimatedDuration: number; // days
  requiredTraffic: number;
  expectedImpact: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  priority: number; // 1-10
  testType: TestType;
  variations: TestVariation[];
  successMetrics: SuccessMetric[];
  prerequisites: string[];
  implementation: TestImplementation;
  tags: string[];
  metadata: TemplateMetadata;
}

export interface TestVariation {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  changes: VariationChange[];
  trafficAllocation: number; // percentage
  expectedOutcome: string;
}

export interface VariationChange {
  element: string;
  type: ChangeType;
  oldValue?: string;
  newValue: string;
  selector?: string;
  description: string;
}

export interface SuccessMetric {
  name: string;
  type: MetricType;
  description: string;
  calculation: string;
  isPrimary: boolean;
  expectedDirection: 'increase' | 'decrease';
  minimumDetectableEffect: number; // percentage
  statisticalSignificance: number; // typically 0.95
}

export interface TestImplementation {
  platform: string[];
  integrationMethod: IntegrationMethod;
  setupInstructions: string[];
  codeSnippets?: CodeSnippet[];
  qaChecklist: string[];
  rollbackPlan: string;
}

export interface CodeSnippet {
  language: string;
  description: string;
  code: string;
}

export interface TemplateMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  author: string;
  successRate: number; // percentage of successful implementations
  averageImprovement: number; // percentage improvement
  totalImplementations: number;
  industryBenchmarks: Record<string, number>;
}

export type Industry =
  | 'saas' | 'ecommerce' | 'manufacturing' | 'healthcare'
  | 'fintech' | 'education' | 'government' | 'consulting'
  | 'real-estate' | 'travel' | 'media' | 'nonprofit'
  | 'retail' | 'automotive' | 'energy' | 'logistics';

export type BusinessModel =
  | 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'subscription'
  | 'transactional' | 'freemium' | 'enterprise' | 'self-serve';

export type TestCategory =
  | 'conversion-optimization' | 'user-experience' | 'pricing'
  | 'onboarding' | 'checkout' | 'landing-page' | 'email'
  | 'navigation' | 'trust-building' | 'mobile-optimization'
  | 'feature-adoption' | 'retention' | 'revenue-optimization';

export type TestDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type TestType =
  | 'simple-ab' | 'multivariate' | 'split-url' | 'feature-flag'
  | 'personalization' | 'targeting' | 'behavioral';

export type ChangeType =
  | 'text' | 'color' | 'layout' | 'image' | 'button' | 'form'
  | 'navigation' | 'animation' | 'functionality' | 'content';

export type MetricType =
  | 'conversion' | 'revenue' | 'engagement' | 'retention'
  | 'user-experience' | 'performance' | 'behavioral';

export type IntegrationMethod =
  | 'visual-editor' | 'code-changes' | 'api-integration'
  | 'plugin' | 'tag-manager' | 'server-side';

export interface TemplateFilter {
  industry?: Industry[];
  businessModel?: BusinessModel[];
  category?: TestCategory[];
  difficulty?: TestDifficulty[];
  testType?: TestType[];
  minTraffic?: number;
  maxDuration?: number;
  expectedImpact?: ('low' | 'medium' | 'high')[];
  tags?: string[];
}

export interface TemplateRecommendation {
  template: ABTestTemplate;
  relevanceScore: number;
  rationale: string;
  customizations: string[];
  estimatedROI: number;
}

// A/B Test Template Service Implementation
class ABTestTemplateService {
  private redis: Redis;
  private templates: ABTestTemplate[];

  constructor(redis: Redis) {
    this.redis = redis;
    this.templates = this.initializeTemplates();
  }

  // Initialize comprehensive template library
  private initializeTemplates(): ABTestTemplate[] {
    const templates: ABTestTemplate[] = [
      // =============================================================================
      // SaaS TEMPLATES
      // =============================================================================
      {
        id: 'saas-trial-signup-optimization',
        name: 'SaaS Trial Signup Form Optimization',
        description: 'Optimize trial signup forms to increase conversion rates by testing different form lengths, fields, and value propositions',
        industry: ['saas'],
        businessModel: ['b2b', 'b2c', 'freemium'],
        category: 'conversion-optimization',
        difficulty: 'beginner',
        estimatedDuration: 14,
        requiredTraffic: 1000,
        expectedImpact: 'high',
        confidence: 0.85,
        priority: 9,
        testType: 'simple-ab',
        variations: [
          {
            id: 'control',
            name: 'Original Form',
            description: 'Current trial signup form',
            isControl: true,
            changes: [],
            trafficAllocation: 50,
            expectedOutcome: 'Baseline conversion rate'
          },
          {
            id: 'simplified',
            name: 'Simplified Form',
            description: 'Reduced form fields to email and password only',
            isControl: false,
            changes: [
              {
                element: 'signup-form',
                type: 'form',
                oldValue: 'Name, Email, Company, Password, Phone',
                newValue: 'Email, Password',
                selector: '#trial-signup-form',
                description: 'Remove name, company, and phone fields'
              }
            ],
            trafficAllocation: 50,
            expectedOutcome: 'Higher conversion due to reduced friction'
          }
        ],
        successMetrics: [
          {
            name: 'Trial Signup Conversion Rate',
            type: 'conversion',
            description: 'Percentage of visitors who complete trial signup',
            calculation: '(Trial Signups / Unique Visitors) * 100',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 10,
            statisticalSignificance: 0.95
          },
          {
            name: 'Trial to Paid Conversion',
            type: 'revenue',
            description: 'Percentage of trial users who convert to paid',
            calculation: '(Paid Conversions / Trial Signups) * 100',
            isPrimary: false,
            expectedDirection: 'increase',
            minimumDetectableEffect: 5,
            statisticalSignificance: 0.95
          }
        ],
        prerequisites: [
          'Existing trial signup flow',
          'Analytics tracking in place',
          'Sufficient traffic volume (1000+ visitors/week)'
        ],
        implementation: {
          platform: ['optimizely', 'google-optimize', 'vwo'],
          integrationMethod: 'visual-editor',
          setupInstructions: [
            'Set up page targeting for trial signup page',
            'Create variation with simplified form',
            'Configure conversion tracking for form submissions',
            'Set traffic allocation to 50/50',
            'Launch test and monitor for 2 weeks'
          ],
          qaChecklist: [
            'Form submission works correctly in both variations',
            'Thank you page displays properly',
            'Email notifications are sent',
            'Analytics events are tracked',
            'Mobile experience is optimized'
          ],
          rollbackPlan: 'Immediately redirect all traffic to control if conversion rate drops by >20%'
        },
        tags: ['conversion', 'forms', 'signup', 'trial', 'saas'],
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          version: '1.0',
          author: 'Optimizely Template Library',
          successRate: 78,
          averageImprovement: 23.5,
          totalImplementations: 156,
          industryBenchmarks: {
            'saas': 12.3,
            'b2b': 8.7,
            'freemium': 15.8
          }
        }
      },

      {
        id: 'saas-pricing-page-optimization',
        name: 'SaaS Pricing Page A/B Test',
        description: 'Test different pricing presentations, tier structures, and value propositions to optimize conversion',
        industry: ['saas'],
        businessModel: ['b2b', 'b2c', 'subscription'],
        category: 'pricing',
        difficulty: 'intermediate',
        estimatedDuration: 21,
        requiredTraffic: 2000,
        expectedImpact: 'high',
        confidence: 0.80,
        priority: 8,
        testType: 'multivariate',
        variations: [
          {
            id: 'control',
            name: 'Current Pricing',
            description: 'Existing pricing page layout and copy',
            isControl: true,
            changes: [],
            trafficAllocation: 33,
            expectedOutcome: 'Baseline conversion and revenue metrics'
          },
          {
            id: 'value-focused',
            name: 'Value-Focused Pricing',
            description: 'Emphasize ROI and value propositions over features',
            isControl: false,
            changes: [
              {
                element: 'pricing-copy',
                type: 'content',
                oldValue: 'Feature-focused descriptions',
                newValue: 'ROI and value-focused benefits',
                selector: '.pricing-tier-description',
                description: 'Replace feature lists with value propositions'
              }
            ],
            trafficAllocation: 33,
            expectedOutcome: 'Higher conversion through value communication'
          },
          {
            id: 'social-proof',
            name: 'Social Proof Enhanced',
            description: 'Add customer testimonials and usage statistics',
            isControl: false,
            changes: [
              {
                element: 'testimonials',
                type: 'content',
                oldValue: 'No social proof',
                newValue: 'Customer testimonials and logos',
                selector: '.pricing-social-proof',
                description: 'Add testimonials below pricing tiers'
              }
            ],
            trafficAllocation: 34,
            expectedOutcome: 'Increased trust and conversion rates'
          }
        ],
        successMetrics: [
          {
            name: 'Pricing Page Conversion Rate',
            type: 'conversion',
            description: 'Percentage of pricing page visitors who start a trial or purchase',
            calculation: '(Conversions / Pricing Page Visitors) * 100',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 8,
            statisticalSignificance: 0.95
          },
          {
            name: 'Average Revenue Per User',
            type: 'revenue',
            description: 'Average revenue generated per pricing page visitor',
            calculation: 'Total Revenue / Pricing Page Visitors',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 12,
            statisticalSignificance: 0.95
          }
        ],
        prerequisites: [
          'Existing pricing page with multiple tiers',
          'Revenue tracking implementation',
          'Customer testimonials available'
        ],
        implementation: {
          platform: ['optimizely', 'vwo', 'ab-tasty'],
          integrationMethod: 'visual-editor',
          setupInstructions: [
            'Create multivariate test on pricing page',
            'Set up revenue tracking for each variation',
            'Implement custom segments for analysis',
            'Configure statistical significance settings',
            'Run test for minimum 3 weeks'
          ],
          qaChecklist: [
            'All pricing tiers display correctly',
            'Payment flow works for each variation',
            'Revenue attribution is accurate',
            'Mobile responsiveness maintained',
            'Loading performance optimized'
          ],
          rollbackPlan: 'Revert to control if revenue per visitor decreases by >15%'
        },
        tags: ['pricing', 'conversion', 'revenue', 'saas', 'value-proposition'],
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          version: '1.0',
          author: 'Optimizely Template Library',
          successRate: 71,
          averageImprovement: 18.7,
          totalImplementations: 89,
          industryBenchmarks: {
            'saas': 8.9,
            'subscription': 11.2,
            'b2b': 6.4
          }
        }
      },

      // =============================================================================
      // E-COMMERCE TEMPLATES
      // =============================================================================
      {
        id: 'ecommerce-checkout-optimization',
        name: 'E-commerce Checkout Flow Optimization',
        description: 'Reduce cart abandonment by testing simplified checkout processes, guest checkout options, and trust signals',
        industry: ['ecommerce', 'retail'],
        businessModel: ['b2c', 'b2b', 'marketplace'],
        category: 'checkout',
        difficulty: 'intermediate',
        estimatedDuration: 14,
        requiredTraffic: 2500,
        expectedImpact: 'high',
        confidence: 0.90,
        priority: 10,
        testType: 'simple-ab',
        variations: [
          {
            id: 'control',
            name: 'Standard Checkout',
            description: 'Current multi-step checkout process',
            isControl: true,
            changes: [],
            trafficAllocation: 50,
            expectedOutcome: 'Baseline checkout completion rate'
          },
          {
            id: 'single-page',
            name: 'Single Page Checkout',
            description: 'Streamlined single-page checkout with guest option',
            isControl: false,
            changes: [
              {
                element: 'checkout-flow',
                type: 'layout',
                oldValue: 'Multi-step checkout (4 steps)',
                newValue: 'Single page checkout with sections',
                selector: '#checkout-container',
                description: 'Combine all checkout steps into single page'
              },
              {
                element: 'guest-checkout',
                type: 'functionality',
                oldValue: 'Account required',
                newValue: 'Guest checkout option prominent',
                selector: '.checkout-options',
                description: 'Add prominent guest checkout button'
              }
            ],
            trafficAllocation: 50,
            expectedOutcome: 'Reduced abandonment through simplified flow'
          }
        ],
        successMetrics: [
          {
            name: 'Checkout Completion Rate',
            type: 'conversion',
            description: 'Percentage of users who complete checkout after entering',
            calculation: '(Completed Checkouts / Checkout Starts) * 100',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 5,
            statisticalSignificance: 0.95
          },
          {
            name: 'Cart Abandonment Rate',
            type: 'conversion',
            description: 'Percentage of users who abandon cart during checkout',
            calculation: '(Abandoned Carts / Checkout Starts) * 100',
            isPrimary: true,
            expectedDirection: 'decrease',
            minimumDetectableEffect: 8,
            statisticalSignificance: 0.95
          },
          {
            name: 'Revenue Per Visitor',
            type: 'revenue',
            description: 'Average revenue generated per checkout page visitor',
            calculation: 'Total Revenue / Checkout Page Visitors',
            isPrimary: false,
            expectedDirection: 'increase',
            minimumDetectableEffect: 10,
            statisticalSignificance: 0.95
          }
        ],
        prerequisites: [
          'E-commerce platform with checkout tracking',
          'Guest checkout functionality available',
          'Secure payment processing',
          'Mobile-optimized checkout'
        ],
        implementation: {
          platform: ['optimizely', 'vwo', 'google-optimize'],
          integrationMethod: 'code-changes',
          setupInstructions: [
            'Implement single-page checkout layout',
            'Configure guest checkout option',
            'Set up enhanced tracking for checkout steps',
            'Test payment processing for both variations',
            'Monitor performance and user experience'
          ],
          codeSnippets: [
            {
              language: 'javascript',
              description: 'Enhanced checkout tracking',
              code: `
// Track checkout step completion
function trackCheckoutStep(step, variation) {
  analytics.track('Checkout Step Completed', {
    step: step,
    variation: variation,
    timestamp: new Date().toISOString()
  });
}

// Track checkout abandonment
window.addEventListener('beforeunload', function() {
  if (isInCheckout && !orderCompleted) {
    analytics.track('Checkout Abandoned', {
      step: currentCheckoutStep,
      variation: currentVariation
    });
  }
});
              `
            }
          ],
          qaChecklist: [
            'Payment processing works correctly',
            'Order confirmation emails sent',
            'Inventory management updated',
            'Tax calculations accurate',
            'Mobile experience optimized',
            'SSL certificates valid'
          ],
          rollbackPlan: 'Immediately revert if checkout completion rate drops by >10%'
        },
        tags: ['checkout', 'ecommerce', 'abandonment', 'conversion', 'revenue'],
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          version: '1.0',
          author: 'Optimizely Template Library',
          successRate: 82,
          averageImprovement: 16.3,
          totalImplementations: 234,
          industryBenchmarks: {
            'ecommerce': 68.5,
            'retail': 71.2,
            'b2c': 69.8
          }
        }
      },

      // =============================================================================
      // FINTECH TEMPLATES
      // =============================================================================
      {
        id: 'fintech-application-flow',
        name: 'FinTech Application Process Optimization',
        description: 'Optimize financial service application flows by testing progressive disclosure, trust signals, and form optimization',
        industry: ['fintech'],
        businessModel: ['b2c', 'b2b'],
        category: 'conversion-optimization',
        difficulty: 'advanced',
        estimatedDuration: 28,
        requiredTraffic: 1500,
        expectedImpact: 'high',
        confidence: 0.75,
        priority: 9,
        testType: 'simple-ab',
        variations: [
          {
            id: 'control',
            name: 'Standard Application',
            description: 'Current application form and process',
            isControl: true,
            changes: [],
            trafficAllocation: 50,
            expectedOutcome: 'Baseline application completion rate'
          },
          {
            id: 'progressive',
            name: 'Progressive Disclosure',
            description: 'Multi-step application with progress indicators and trust signals',
            isControl: false,
            changes: [
              {
                element: 'application-form',
                type: 'layout',
                oldValue: 'Single long form',
                newValue: 'Multi-step form with progress bar',
                selector: '#application-form',
                description: 'Break form into logical steps with progress indication'
              },
              {
                element: 'trust-signals',
                type: 'content',
                oldValue: 'Minimal security messaging',
                newValue: 'Security badges and compliance statements',
                selector: '.trust-indicators',
                description: 'Add bank-level security badges and FDIC/compliance logos'
              }
            ],
            trafficAllocation: 50,
            expectedOutcome: 'Higher completion through reduced cognitive load and increased trust'
          }
        ],
        successMetrics: [
          {
            name: 'Application Completion Rate',
            type: 'conversion',
            description: 'Percentage of users who complete the full application',
            calculation: '(Completed Applications / Application Starts) * 100',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 12,
            statisticalSignificance: 0.95
          },
          {
            name: 'Application Approval Rate',
            type: 'conversion',
            description: 'Percentage of completed applications that get approved',
            calculation: '(Approved Applications / Completed Applications) * 100',
            isPrimary: false,
            expectedDirection: 'increase',
            minimumDetectableEffect: 5,
            statisticalSignificance: 0.95
          }
        ],
        prerequisites: [
          'Regulatory compliance review completed',
          'Security and privacy measures in place',
          'Application tracking system implemented',
          'Legal approval for test variations'
        ],
        implementation: {
          platform: ['optimizely', 'adobe-target'],
          integrationMethod: 'code-changes',
          setupInstructions: [
            'Implement progressive form disclosure',
            'Add security and trust signal elements',
            'Configure detailed application funnel tracking',
            'Ensure compliance with financial regulations',
            'Test for minimum 4 weeks due to longer consideration cycles'
          ],
          qaChecklist: [
            'All form validations work correctly',
            'Data security measures maintained',
            'Regulatory compliance verified',
            'Application processing pipeline functional',
            'Error handling and recovery processes',
            'Accessibility standards met'
          ],
          rollbackPlan: 'Immediate rollback if application completion drops by >15% or security concerns arise'
        },
        tags: ['fintech', 'application', 'trust', 'security', 'progressive-disclosure'],
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          version: '1.0',
          author: 'Optimizely Template Library',
          successRate: 67,
          averageImprovement: 22.1,
          totalImplementations: 43,
          industryBenchmarks: {
            'fintech': 34.2,
            'financial-services': 28.7,
            'b2c': 31.5
          }
        }
      },

      // =============================================================================
      // MANUFACTURING TEMPLATES
      // =============================================================================
      {
        id: 'manufacturing-rfq-optimization',
        name: 'Manufacturing RFQ Form Optimization',
        description: 'Optimize Request for Quote forms to increase lead quality and conversion rates for manufacturing companies',
        industry: ['manufacturing'],
        businessModel: ['b2b', 'enterprise'],
        category: 'conversion-optimization',
        difficulty: 'intermediate',
        estimatedDuration: 21,
        requiredTraffic: 800,
        expectedImpact: 'high',
        confidence: 0.80,
        priority: 8,
        testType: 'simple-ab',
        variations: [
          {
            id: 'control',
            name: 'Standard RFQ Form',
            description: 'Current RFQ form with standard fields',
            isControl: true,
            changes: [],
            trafficAllocation: 50,
            expectedOutcome: 'Baseline RFQ completion rate'
          },
          {
            id: 'streamlined',
            name: 'Streamlined RFQ with Progressive Disclosure',
            description: 'Simplified initial form with progressive disclosure for detailed requirements',
            isControl: false,
            changes: [
              {
                element: 'rfq-form',
                type: 'form',
                oldValue: 'Single long form with all fields required',
                newValue: 'Two-step form: basic info first, then detailed specs',
                selector: '#rfq-form',
                description: 'Split form into basic contact/project info and detailed specifications'
              },
              {
                element: 'trust-indicators',
                type: 'content',
                oldValue: 'Minimal company credibility indicators',
                newValue: 'Industry certifications, client logos, and experience highlights',
                selector: '.trust-section',
                description: 'Add ISO certifications, major client logos, years in business'
              }
            ],
            trafficAllocation: 50,
            expectedOutcome: 'Higher completion through reduced initial friction'
          }
        ],
        successMetrics: [
          {
            name: 'RFQ Completion Rate',
            type: 'conversion',
            description: 'Percentage of visitors who complete RFQ form',
            calculation: '(Completed RFQs / Form Starts) * 100',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 15,
            statisticalSignificance: 0.95
          },
          {
            name: 'Lead Quality Score',
            type: 'conversion',
            description: 'Average quality score of submitted RFQs based on completeness and detail',
            calculation: 'Sum(Quality Scores) / Total RFQs',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 10,
            statisticalSignificance: 0.95
          }
        ],
        prerequisites: [
          'CRM system for lead tracking',
          'RFQ processing workflow in place',
          'Sales team capacity for follow-up'
        ],
        implementation: {
          platform: ['optimizely', 'vwo', 'unbounce'],
          integrationMethod: 'visual-editor',
          setupInstructions: [
            'Implement progressive form disclosure',
            'Add trust signal elements',
            'Configure lead scoring system',
            'Set up CRM integration for lead quality tracking',
            'Monitor for minimum 3 weeks'
          ],
          qaChecklist: [
            'Form validation works correctly',
            'CRM integration captures all data',
            'Mobile responsiveness maintained',
            'File upload functionality (if applicable)',
            'Email notifications to sales team'
          ],
          rollbackPlan: 'Revert if RFQ completion rate drops by >20% or lead quality significantly decreases'
        },
        tags: ['manufacturing', 'rfq', 'b2b', 'lead-generation', 'progressive-disclosure'],
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          version: '1.0',
          author: 'Optimizely Template Library',
          successRate: 73,
          averageImprovement: 19.2,
          totalImplementations: 54,
          industryBenchmarks: {
            'manufacturing': 12.8,
            'b2b': 15.3,
            'industrial': 11.7
          }
        }
      },

      // =============================================================================
      // HEALTHCARE TEMPLATES
      // =============================================================================
      {
        id: 'healthcare-appointment-booking',
        name: 'Healthcare Appointment Booking Optimization',
        description: 'Optimize online appointment booking flows to increase patient conversion and reduce abandonment',
        industry: ['healthcare'],
        businessModel: ['b2c', 'b2b'],
        category: 'conversion-optimization',
        difficulty: 'advanced',
        estimatedDuration: 28,
        requiredTraffic: 1200,
        expectedImpact: 'high',
        confidence: 0.75,
        priority: 9,
        testType: 'simple-ab',
        variations: [
          {
            id: 'control',
            name: 'Standard Booking Form',
            description: 'Current appointment booking process',
            isControl: true,
            changes: [],
            trafficAllocation: 50,
            expectedOutcome: 'Baseline appointment booking rate'
          },
          {
            id: 'trust-enhanced',
            name: 'Trust-Enhanced Booking with Provider Info',
            description: 'Enhanced booking with provider photos, credentials, and patient reviews',
            isControl: false,
            changes: [
              {
                element: 'provider-info',
                type: 'content',
                oldValue: 'Minimal provider information',
                newValue: 'Provider photos, credentials, specialties, and patient reviews',
                selector: '.provider-selection',
                description: 'Add comprehensive provider profiles with trust signals'
              },
              {
                element: 'privacy-assurance',
                type: 'content',
                oldValue: 'Basic privacy notice',
                newValue: 'Prominent HIPAA compliance messaging and security badges',
                selector: '.privacy-section',
                description: 'Emphasize HIPAA compliance and medical data security'
              }
            ],
            trafficAllocation: 50,
            expectedOutcome: 'Higher booking rates through increased trust and transparency'
          }
        ],
        successMetrics: [
          {
            name: 'Appointment Booking Completion Rate',
            type: 'conversion',
            description: 'Percentage of users who complete appointment booking',
            calculation: '(Completed Bookings / Booking Starts) * 100',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 12,
            statisticalSignificance: 0.95
          },
          {
            name: 'Appointment Show-Up Rate',
            type: 'conversion',
            description: 'Percentage of booked appointments that patients actually attend',
            calculation: '(Attended Appointments / Booked Appointments) * 100',
            isPrimary: false,
            expectedDirection: 'increase',
            minimumDetectableEffect: 8,
            statisticalSignificance: 0.95
          }
        ],
        prerequisites: [
          'HIPAA compliance review completed',
          'Integration with practice management system',
          'Provider scheduling system in place',
          'Patient communication system for reminders'
        ],
        implementation: {
          platform: ['optimizely', 'adobe-target'],
          integrationMethod: 'code-changes',
          setupInstructions: [
            'Implement enhanced provider profiles',
            'Add HIPAA compliance messaging',
            'Configure appointment tracking system',
            'Ensure all variations maintain compliance',
            'Test for minimum 4 weeks due to appointment cycles'
          ],
          qaChecklist: [
            'HIPAA compliance maintained in all variations',
            'Appointment system integration functional',
            'Provider information accuracy verified',
            'Mobile booking experience optimized',
            'Patient notification system working'
          ],
          rollbackPlan: 'Immediate rollback if booking completion drops by >15% or compliance issues arise'
        },
        tags: ['healthcare', 'appointments', 'trust', 'hipaa', 'patient-experience'],
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          version: '1.0',
          author: 'Optimizely Template Library',
          successRate: 69,
          averageImprovement: 16.8,
          totalImplementations: 32,
          industryBenchmarks: {
            'healthcare': 28.4,
            'medical': 31.2,
            'patient-portal': 35.8
          }
        }
      },

      // =============================================================================
      // EDUCATION TEMPLATES
      // =============================================================================
      {
        id: 'education-enrollment-optimization',
        name: 'Education Enrollment Process Optimization',
        description: 'Optimize course enrollment and application processes to increase student conversion rates',
        industry: ['education'],
        businessModel: ['b2c', 'b2b'],
        category: 'conversion-optimization',
        difficulty: 'intermediate',
        estimatedDuration: 21,
        requiredTraffic: 1500,
        expectedImpact: 'high',
        confidence: 0.82,
        priority: 8,
        testType: 'simple-ab',
        variations: [
          {
            id: 'control',
            name: 'Standard Enrollment',
            description: 'Current enrollment form and process',
            isControl: true,
            changes: [],
            trafficAllocation: 50,
            expectedOutcome: 'Baseline enrollment completion rate'
          },
          {
            id: 'social-proof',
            name: 'Social Proof Enhanced Enrollment',
            description: 'Enrollment process with student testimonials, success stories, and program outcomes',
            isControl: false,
            changes: [
              {
                element: 'testimonials',
                type: 'content',
                oldValue: 'Minimal social proof',
                newValue: 'Student testimonials, success stories, and outcome statistics',
                selector: '.enrollment-social-proof',
                description: 'Add compelling student testimonials and program success metrics'
              },
              {
                element: 'program-outcomes',
                type: 'content',
                oldValue: 'Basic program description',
                newValue: 'Detailed career outcomes, job placement rates, and alumni achievements',
                selector: '.program-outcomes',
                description: 'Emphasize career outcomes and return on investment'
              }
            ],
            trafficAllocation: 50,
            expectedOutcome: 'Higher enrollment through social proof and outcome demonstration'
          }
        ],
        successMetrics: [
          {
            name: 'Enrollment Completion Rate',
            type: 'conversion',
            description: 'Percentage of visitors who complete enrollment process',
            calculation: '(Completed Enrollments / Enrollment Starts) * 100',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 10,
            statisticalSignificance: 0.95
          },
          {
            name: 'Enrollment to Attendance Rate',
            type: 'conversion',
            description: 'Percentage of enrolled students who actually attend/start the program',
            calculation: '(Active Students / Enrollments) * 100',
            isPrimary: false,
            expectedDirection: 'increase',
            minimumDetectableEffect: 8,
            statisticalSignificance: 0.95
          }
        ],
        prerequisites: [
          'Student information system in place',
          'Payment processing for tuition',
          'Program outcome data available',
          'Student testimonials collected'
        ],
        implementation: {
          platform: ['optimizely', 'vwo', 'google-optimize'],
          integrationMethod: 'visual-editor',
          setupInstructions: [
            'Implement social proof elements',
            'Add program outcome data',
            'Configure enrollment tracking',
            'Set up student success metrics tracking',
            'Monitor for full enrollment cycle (typically 4-6 weeks)'
          ],
          qaChecklist: [
            'Enrollment system integration works',
            'Payment processing functional',
            'Student data privacy maintained',
            'Mobile enrollment experience optimized',
            'Confirmation emails and communications'
          ],
          rollbackPlan: 'Revert if enrollment completion drops by >12% or student quality decreases'
        },
        tags: ['education', 'enrollment', 'social-proof', 'outcomes', 'student-conversion'],
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          version: '1.0',
          author: 'Optimizely Template Library',
          successRate: 76,
          averageImprovement: 21.3,
          totalImplementations: 67,
          industryBenchmarks: {
            'education': 18.7,
            'online-learning': 22.4,
            'higher-education': 15.9
          }
        }
      },

      // =============================================================================
      // CONSULTING TEMPLATES
      // =============================================================================
      {
        id: 'consulting-consultation-booking',
        name: 'Consulting Consultation Booking Optimization',
        description: 'Optimize consultation booking and lead capture for professional services and consulting firms',
        industry: ['consulting'],
        businessModel: ['b2b', 'enterprise'],
        category: 'conversion-optimization',
        difficulty: 'intermediate',
        estimatedDuration: 14,
        requiredTraffic: 800,
        expectedImpact: 'high',
        confidence: 0.85,
        priority: 9,
        testType: 'simple-ab',
        variations: [
          {
            id: 'control',
            name: 'Standard Consultation Form',
            description: 'Current consultation booking form',
            isControl: true,
            changes: [],
            trafficAllocation: 50,
            expectedOutcome: 'Baseline consultation booking rate'
          },
          {
            id: 'value-focused',
            name: 'Value-Focused Consultation Booking',
            description: 'Booking form emphasizing free consultation value and consultant expertise',
            isControl: false,
            changes: [
              {
                element: 'value-proposition',
                type: 'content',
                oldValue: 'Basic consultation offer',
                newValue: 'Detailed free consultation value: "$500 strategy session at no cost"',
                selector: '.consultation-offer',
                description: 'Emphasize the monetary value and benefits of the free consultation'
              },
              {
                element: 'consultant-credentials',
                type: 'content',
                oldValue: 'Minimal consultant information',
                newValue: 'Consultant photos, credentials, client results, and testimonials',
                selector: '.consultant-profile',
                description: 'Showcase consultant expertise and past client successes'
              }
            ],
            trafficAllocation: 50,
            expectedOutcome: 'Higher booking rates through value demonstration and credibility'
          }
        ],
        successMetrics: [
          {
            name: 'Consultation Booking Rate',
            type: 'conversion',
            description: 'Percentage of visitors who book a consultation',
            calculation: '(Booked Consultations / Page Visitors) * 100',
            isPrimary: true,
            expectedDirection: 'increase',
            minimumDetectableEffect: 15,
            statisticalSignificance: 0.95
          },
          {
            name: 'Consultation Show-Up Rate',
            type: 'conversion',
            description: 'Percentage of booked consultations where prospect attends',
            calculation: '(Attended Consultations / Booked Consultations) * 100',
            isPrimary: false,
            expectedDirection: 'increase',
            minimumDetectableEffect: 10,
            statisticalSignificance: 0.95
          }
        ],
        prerequisites: [
          'Calendar booking system integrated',
          'Consultant availability management',
          'Client testimonials and case studies',
          'Lead qualification process'
        ],
        implementation: {
          platform: ['optimizely', 'unbounce', 'leadpages'],
          integrationMethod: 'visual-editor',
          setupInstructions: [
            'Implement value proposition messaging',
            'Add consultant credential sections',
            'Configure calendar integration',
            'Set up consultation tracking',
            'Test for 2-3 weeks to capture booking cycles'
          ],
          qaChecklist: [
            'Calendar booking system works correctly',
            'Consultant profiles display properly',
            'Mobile booking experience optimized',
            'Confirmation and reminder emails sent',
            'Lead qualification data captured'
          ],
          rollbackPlan: 'Revert if booking rate drops by >18% or lead quality significantly decreases'
        },
        tags: ['consulting', 'professional-services', 'consultation', 'value-proposition', 'credibility'],
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          version: '1.0',
          author: 'Optimizely Template Library',
          successRate: 81,
          averageImprovement: 27.6,
          totalImplementations: 73,
          industryBenchmarks: {
            'consulting': 8.2,
            'professional-services': 9.7,
            'b2b-services': 7.4
          }
        }
      }

      // Additional templates would continue here for other industries...
      // Government, Real Estate, Travel, etc.
    ];

    return templates;
  }

  // Get all available templates with optional filtering
  async getTemplates(filter?: TemplateFilter): Promise<ABTestTemplate[]> {
    let filteredTemplates = this.templates;

    if (filter) {
      filteredTemplates = this.templates.filter(template => {
        // Industry filter
        if (filter.industry && !filter.industry.some(ind => template.industry.includes(ind))) {
          return false;
        }

        // Business model filter
        if (filter.businessModel && !filter.businessModel.some(bm => template.businessModel.includes(bm))) {
          return false;
        }

        // Category filter
        if (filter.category && !filter.category.includes(template.category)) {
          return false;
        }

        // Difficulty filter
        if (filter.difficulty && !filter.difficulty.includes(template.difficulty)) {
          return false;
        }

        // Test type filter
        if (filter.testType && !filter.testType.includes(template.testType)) {
          return false;
        }

        // Traffic requirements
        if (filter.minTraffic && template.requiredTraffic < filter.minTraffic) {
          return false;
        }

        // Duration filter
        if (filter.maxDuration && template.estimatedDuration > filter.maxDuration) {
          return false;
        }

        // Expected impact filter
        if (filter.expectedImpact && !filter.expectedImpact.includes(template.expectedImpact)) {
          return false;
        }

        // Tags filter
        if (filter.tags && !filter.tags.some(tag => template.tags.includes(tag))) {
          return false;
        }

        return true;
      });
    }

    return filteredTemplates.sort((a, b) => b.priority - a.priority);
  }

  // Get template by ID
  async getTemplate(templateId: string): Promise<ABTestTemplate | null> {
    return this.templates.find(template => template.id === templateId) || null;
  }

  // Get recommended templates based on customer profile
  async getRecommendedTemplates(customerProfile: any): Promise<TemplateRecommendation[]> {
    const recommendations: TemplateRecommendation[] = [];

    for (const template of this.templates) {
      const relevanceScore = this.calculateRelevanceScore(template, customerProfile);

      if (relevanceScore > 0.3) { // Only include reasonably relevant templates
        const recommendation: TemplateRecommendation = {
          template,
          relevanceScore,
          rationale: this.generateRationale(template, customerProfile, relevanceScore),
          customizations: this.suggestCustomizations(template, customerProfile),
          estimatedROI: this.calculateEstimatedROI(template, customerProfile)
        };

        recommendations.push(recommendation);
      }
    }

    // Sort by relevance score and priority
    return recommendations
      .sort((a, b) => (b.relevanceScore * b.template.priority) - (a.relevanceScore * a.template.priority))
      .slice(0, 10); // Top 10 recommendations
  }

  // Calculate relevance score for a template based on customer profile
  private calculateRelevanceScore(template: ABTestTemplate, profile: any): number {
    let score = 0;
    let maxScore = 0;

    // Industry match (high weight)
    maxScore += 0.4;
    if (template.industry.includes(profile.industry)) {
      score += 0.4;
    }

    // Business model match (medium weight)
    maxScore += 0.25;
    const profileBusinessModels = Array.isArray(profile.businessModel)
      ? profile.businessModel
      : [profile.businessModel];
    if (profileBusinessModels.some((bm: any) => template.businessModel.includes(bm))) {
      score += 0.25;
    }

    // Challenge/goal alignment (medium weight)
    maxScore += 0.2;
    const challengeAlignment = this.calculateChallengeAlignment(template, profile);
    score += challengeAlignment * 0.2;

    // Traffic requirements (low weight)
    maxScore += 0.1;
    const trafficScore = this.calculateTrafficScore(template, profile);
    score += trafficScore * 0.1;

    // Experience level match (low weight)
    maxScore += 0.05;
    const experienceScore = this.calculateExperienceScore(template, profile);
    score += experienceScore * 0.05;

    return score / maxScore; // Normalize to 0-1 scale
  }

  private calculateChallengeAlignment(template: ABTestTemplate, profile: any): number {
    if (!profile.currentChallenges || profile.currentChallenges.length === 0) {
      return 0.5; // Neutral if no challenges specified
    }

    const challengeMap: Record<string, string[]> = {
      'low-conversion-rate': ['conversion-optimization', 'landing-page', 'pricing'],
      'high-cart-abandonment': ['checkout', 'conversion-optimization'],
      'poor-mobile-experience': ['mobile-optimization', 'user-experience'],
      'unclear-value-prop': ['pricing', 'landing-page', 'conversion-optimization'],
      'complex-checkout': ['checkout', 'user-experience'],
      'trust-issues': ['trust-building', 'conversion-optimization'],
      'pricing-optimization': ['pricing', 'revenue-optimization'],
      'feature-adoption': ['feature-adoption', 'onboarding'],
      'user-onboarding': ['onboarding', 'user-experience'],
      'lead-quality': ['conversion-optimization', 'landing-page'],
      'sales-funnel-leaks': ['conversion-optimization', 'user-experience']
    };

    let alignmentScore = 0;
    let totalChallenges = profile.currentChallenges.length;

    for (const challenge of profile.currentChallenges) {
      const relevantCategories = challengeMap[challenge] || [];
      if (relevantCategories.includes(template.category)) {
        alignmentScore += 1;
      }
    }

    return totalChallenges > 0 ? alignmentScore / totalChallenges : 0.5;
  }

  private calculateTrafficScore(template: ABTestTemplate, profile: any): number {
    const trafficMap = {
      'low': 5000,
      'medium': 25000,
      'high': 100000,
      'very-high': 500000
    };

    const estimatedTraffic = trafficMap[profile.trafficVolume as keyof typeof trafficMap] || 25000;

    if (estimatedTraffic >= template.requiredTraffic) {
      return 1.0; // Perfect score if traffic requirements are met
    } else {
      return estimatedTraffic / template.requiredTraffic; // Proportional score
    }
  }

  private calculateExperienceScore(template: ABTestTemplate, profile: any): number {
    const experienceMap = {
      'none': 1,
      'basic': 2,
      'intermediate': 3,
      'advanced': 4
    };

    const profileExp = experienceMap[profile.abTestingExperience as keyof typeof experienceMap] || 1;
    const templateReq = experienceMap[template.difficulty as keyof typeof experienceMap] || 1;

    if (profileExp >= templateReq) {
      return 1.0; // Perfect score if experience level matches or exceeds requirement
    } else {
      return profileExp / templateReq; // Proportional penalty for insufficient experience
    }
  }

  private generateRationale(template: ABTestTemplate, profile: any, relevanceScore: number): string {
    const reasons = [];

    if (template.industry.includes(profile.industry)) {
      reasons.push(`Specifically designed for ${profile.industry} industry`);
    }

    if (relevanceScore > 0.8) {
      reasons.push('Highly relevant to your business model and challenges');
    } else if (relevanceScore > 0.6) {
      reasons.push('Good fit for your business characteristics');
    }

    if (template.expectedImpact === 'high') {
      reasons.push(`High expected impact (${template.metadata.averageImprovement}% average improvement)`);
    }

    if (template.difficulty === 'beginner' && profile.abTestingExperience === 'none') {
      reasons.push('Beginner-friendly implementation');
    }

    return reasons.join('. ') || 'Matches your business profile and goals';
  }

  private suggestCustomizations(template: ABTestTemplate, profile: any): string[] {
    const customizations = [];

    // Industry-specific customizations
    if (profile.industry === 'fintech' && !template.industry.includes('fintech')) {
      customizations.push('Add financial security badges and compliance messaging');
    }

    if (profile.industry === 'healthcare' && !template.industry.includes('healthcare')) {
      customizations.push('Include HIPAA compliance and medical professional endorsements');
    }

    // Business model customizations
    if (profile.businessModel?.includes('b2b')) {
      customizations.push('Focus on ROI and business value propositions');
      customizations.push('Include case studies and enterprise testimonials');
    }

    // Challenge-specific customizations
    if (profile.currentChallenges?.includes('trust-issues')) {
      customizations.push('Emphasize security, testimonials, and trust signals');
    }

    if (profile.currentChallenges?.includes('mobile-optimization')) {
      customizations.push('Prioritize mobile-first design and testing');
    }

    return customizations;
  }

  private calculateEstimatedROI(template: ABTestTemplate, profile: any): number {
    // Base ROI from template performance
    let baseROI = template.metadata.averageImprovement;

    // Adjust based on relevance and profile characteristics
    const relevanceScore = this.calculateRelevanceScore(template, profile);
    const adjustedROI = baseROI * relevanceScore;

    // Industry-specific adjustments
    const industryMultipliers = {
      'fintech': 1.3, // Higher value transactions
      'saas': 1.2,    // Subscription value
      'ecommerce': 1.0, // Baseline
      'healthcare': 1.1,
      'manufacturing': 0.9
    };

    const industryMultiplier = industryMultipliers[profile.industry as keyof typeof industryMultipliers] || 1.0;

    return Math.round(adjustedROI * industryMultiplier * 100) / 100;
  }

  // Get templates by category
  async getTemplatesByCategory(category: TestCategory): Promise<ABTestTemplate[]> {
    return this.templates
      .filter(template => template.category === category)
      .sort((a, b) => b.priority - a.priority);
  }

  // Get templates by industry
  async getTemplatesByIndustry(industry: Industry): Promise<ABTestTemplate[]> {
    return this.templates
      .filter(template => template.industry.includes(industry))
      .sort((a, b) => b.priority - a.priority);
  }

  // Search templates by keyword
  async searchTemplates(query: string): Promise<ABTestTemplate[]> {
    const searchTerm = query.toLowerCase();

    return this.templates.filter(template => {
      return template.name.toLowerCase().includes(searchTerm) ||
             template.description.toLowerCase().includes(searchTerm) ||
             template.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
             template.category.toLowerCase().includes(searchTerm);
    }).sort((a, b) => b.priority - a.priority);
  }

  // Get health status
  async getHealthStatus(): Promise<{ status: string; templates: { total: number; byIndustry: Record<string, number>; byCategory: Record<string, number> } }> {
    try {
      const industryCount: Record<string, number> = {};
      const categoryCount: Record<string, number> = {};

      this.templates.forEach(template => {
        // Count by industry
        template.industry.forEach(industry => {
          industryCount[industry] = (industryCount[industry] || 0) + 1;
        });

        // Count by category
        categoryCount[template.category] = (categoryCount[template.category] || 0) + 1;
      });

      return {
        status: 'healthy',
        templates: {
          total: this.templates.length,
          byIndustry: industryCount,
          byCategory: categoryCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        templates: { total: 0, byIndustry: {}, byCategory: {} }
      };
    }
  }
}

// Factory function to create service instance
export default function createABTestTemplateService(redis: Redis): ABTestTemplateService {
  return new ABTestTemplateService(redis);
}
