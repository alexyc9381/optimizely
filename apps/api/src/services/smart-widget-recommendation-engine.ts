/**
 * Smart Widget Recommendation Engine
 * Intelligent widget suggestion system based on company profile and industry best practices
 */

import { adaptiveLayoutEngine, LayoutWidget } from './adaptive-layout-engine';
import { industryMetricMappingService } from './industry-metric-mapping-service';

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  businessModel: 'b2b' | 'b2c' | 'marketplace' | 'platform' | 'saas' | 'ecommerce';
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  technicalSophistication: 'basic' | 'intermediate' | 'advanced' | 'expert';
  primaryGoals: string[];
  currentTools: string[];
  teamSize: number;
  monthlyRevenue?: number;
  geography: string;
  compliance?: string[];
  dataVolume: 'low' | 'medium' | 'high' | 'enterprise';
}

export interface WidgetRecommendation {
  widget: LayoutWidget;
  score: number;
  reason: string;
  category: 'essential' | 'recommended' | 'optional' | 'advanced';
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeToValue: 'immediate' | 'short' | 'medium' | 'long';
    dependencies: string[];
  };
  businessImpact: {
    roi: 'low' | 'medium' | 'high' | 'very_high';
    kpis: string[];
    useCases: string[];
  };
}

export interface RecommendationSet {
  companyId: string;
  industry: string;
  sophisticationLevel: string;
  totalScore: number;
  recommendations: WidgetRecommendation[];
  implementation: {
    phase1: WidgetRecommendation[]; // Essential/Quick wins
    phase2: WidgetRecommendation[]; // Growth
    phase3: WidgetRecommendation[]; // Advanced
  };
  customizations: {
    colorScheme?: string;
    layout?: string;
    branding?: Record<string, any>;
  };
}

export interface BestPracticeRule {
  id: string;
  industry: string;
  businessModel?: string;
  companySize?: string;
  sophistication?: string;
  widgetId: string;
  priority: number;
  conditions: {
    revenue?: { min?: number; max?: number };
    teamSize?: { min?: number; max?: number };
    tools?: string[];
    goals?: string[];
  };
  benefits: string[];
  alternatives?: string[];
}

export class SmartWidgetRecommendationEngine {
  private bestPractices: Map<string, BestPracticeRule[]> = new Map();
  private industryBenchmarks: Map<string, any> = new Map();
  private userFeedback: Map<string, any> = new Map();

  constructor() {
    this.initializeBestPractices();
    this.initializeIndustryBenchmarks();
  }

  /**
   * Initialize industry best practices database
   */
  private initializeBestPractices(): void {
    // SaaS Best Practices
    this.bestPractices.set('saas', [
      {
        id: 'saas-mrr-essential',
        industry: 'saas',
        businessModel: 'saas',
        widgetId: 'mrr-kpi',
        priority: 10,
        conditions: { revenue: { min: 10000 } },
        benefits: ['Track recurring revenue growth', 'Predict cash flow', 'Investor reporting'],
        alternatives: ['revenue-chart']
      },
      {
        id: 'saas-churn-critical',
        industry: 'saas',
        businessModel: 'saas',
        widgetId: 'churn-analysis',
        priority: 9,
        conditions: { teamSize: { min: 5 } },
        benefits: ['Reduce customer churn', 'Improve retention', 'Optimize customer success'],
        alternatives: ['customer-retention-chart']
      },
      {
        id: 'saas-conversion-growth',
        industry: 'saas',
        widgetId: 'conversion-rate-chart',
        priority: 8,
        conditions: { goals: ['growth', 'acquisition'] },
        benefits: ['Optimize sales funnel', 'Improve trial conversion', 'Scale efficiently']
      },
      {
        id: 'saas-support-tickets',
        industry: 'saas',
        sophistication: 'intermediate',
        widgetId: 'support-tickets-table',
        priority: 7,
        conditions: { teamSize: { min: 10 } },
        benefits: ['Improve customer support', 'Track resolution time', 'Scale support team']
      },
      {
        id: 'saas-advanced-cohorts',
        industry: 'saas',
        sophistication: 'advanced',
        widgetId: 'cohort-analysis',
        priority: 8,
        conditions: { revenue: { min: 100000 } },
        benefits: ['Deep user behavior insights', 'Retention optimization', 'Product-market fit validation']
      }
    ]);

    // E-commerce Best Practices
    this.bestPractices.set('ecommerce', [
      {
        id: 'ecom-aov-essential',
        industry: 'ecommerce',
        businessModel: 'ecommerce',
        widgetId: 'aov-kpi',
        priority: 10,
        conditions: {},
        benefits: ['Track average order value', 'Optimize pricing', 'Improve profitability']
      },
      {
        id: 'ecom-conversion-critical',
        industry: 'ecommerce',
        widgetId: 'conversion-rate-chart',
        priority: 9,
        conditions: {},
        benefits: ['Optimize checkout flow', 'Reduce cart abandonment', 'Increase sales']
      },
      {
        id: 'ecom-inventory-management',
        industry: 'ecommerce',
        sophistication: 'intermediate',
        widgetId: 'inventory-status',
        priority: 8,
        conditions: { teamSize: { min: 5 } },
        benefits: ['Prevent stockouts', 'Optimize inventory', 'Improve fulfillment']
      },
      {
        id: 'ecom-product-performance',
        industry: 'ecommerce',
        widgetId: 'product-performance-table',
        priority: 7,
        conditions: {},
        benefits: ['Identify best sellers', 'Optimize product mix', 'Manage catalog']
      },
      {
        id: 'ecom-customer-segments',
        industry: 'ecommerce',
        sophistication: 'advanced',
        widgetId: 'customer-segmentation',
        priority: 8,
        conditions: { revenue: { min: 500000 } },
        benefits: ['Personalize marketing', 'Targeted campaigns', 'Customer lifetime value optimization']
      }
    ]);

    // Finance Best Practices
    this.bestPractices.set('finance', [
      {
        id: 'finance-portfolio-essential',
        industry: 'finance',
        widgetId: 'portfolio-overview',
        priority: 10,
        conditions: {},
        benefits: ['Track investment performance', 'Risk management', 'Client reporting']
      },
      {
        id: 'finance-risk-metrics',
        industry: 'finance',
        sophistication: 'intermediate',
        widgetId: 'risk-metrics',
        priority: 9,
        conditions: {},
        benefits: ['Monitor risk exposure', 'Compliance reporting', 'Risk-adjusted returns']
      },
      {
        id: 'finance-compliance-dashboard',
        industry: 'finance',
        widgetId: 'compliance-status',
        priority: 8,
        conditions: { tools: ['regulatory'] },
        benefits: ['Ensure compliance', 'Audit preparation', 'Regulatory reporting']
      }
    ]);

    // Healthcare Best Practices
    this.bestPractices.set('healthcare', [
      {
        id: 'healthcare-patient-metrics',
        industry: 'healthcare',
        widgetId: 'patient-metrics',
        priority: 10,
        conditions: {},
        benefits: ['Patient outcome tracking', 'Quality metrics', 'Care optimization']
      },
      {
        id: 'healthcare-compliance',
        industry: 'healthcare',
        widgetId: 'compliance-status',
        priority: 9,
        conditions: {},
        benefits: ['HIPAA compliance', 'Quality assurance', 'Regulatory reporting']
      },
      {
        id: 'healthcare-operational',
        industry: 'healthcare',
        widgetId: 'operational-efficiency',
        priority: 8,
        conditions: { teamSize: { min: 10 } },
        benefits: ['Resource optimization', 'Cost management', 'Workflow efficiency']
      }
    ]);
  }

  /**
   * Initialize industry benchmarks
   */
  private initializeIndustryBenchmarks(): void {
    this.industryBenchmarks.set('saas', {
      avgWidgetsPerDashboard: 8,
      essentialWidgets: ['mrr-kpi', 'churn-analysis', 'conversion-rate-chart'],
      sophisticationLevels: {
        basic: { maxWidgets: 6, complexity: 'low' },
        intermediate: { maxWidgets: 10, complexity: 'medium' },
        advanced: { maxWidgets: 15, complexity: 'high' },
        expert: { maxWidgets: 20, complexity: 'very_high' }
      }
    });

    this.industryBenchmarks.set('ecommerce', {
      avgWidgetsPerDashboard: 10,
      essentialWidgets: ['aov-kpi', 'conversion-rate-chart', 'inventory-status'],
      sophisticationLevels: {
        basic: { maxWidgets: 7, complexity: 'low' },
        intermediate: { maxWidgets: 12, complexity: 'medium' },
        advanced: { maxWidgets: 18, complexity: 'high' },
        expert: { maxWidgets: 25, complexity: 'very_high' }
      }
    });

    this.industryBenchmarks.set('finance', {
      avgWidgetsPerDashboard: 6,
      essentialWidgets: ['portfolio-overview', 'risk-metrics', 'compliance-status'],
      sophisticationLevels: {
        basic: { maxWidgets: 5, complexity: 'low' },
        intermediate: { maxWidgets: 8, complexity: 'medium' },
        advanced: { maxWidgets: 12, complexity: 'high' },
        expert: { maxWidgets: 15, complexity: 'very_high' }
      }
    });

    this.industryBenchmarks.set('healthcare', {
      avgWidgetsPerDashboard: 7,
      essentialWidgets: ['patient-metrics', 'compliance-status', 'operational-efficiency'],
      sophisticationLevels: {
        basic: { maxWidgets: 6, complexity: 'low' },
        intermediate: { maxWidgets: 9, complexity: 'medium' },
        advanced: { maxWidgets: 14, complexity: 'high' },
        expert: { maxWidgets: 18, complexity: 'very_high' }
      }
    });
  }

  /**
   * Analyze company profile and detect technical sophistication
   */
  analyzeCompanyProfile(profile: CompanyProfile): {
    sophisticationScore: number;
    primaryNeeds: string[];
    riskFactors: string[];
    opportunities: string[];
  } {
    let sophisticationScore = 0;
    const primaryNeeds: string[] = [];
    const riskFactors: string[] = [];
    const opportunities: string[] = [];

    // Sophistication scoring
    const sophisticationWeights = {
      basic: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4
    };

    sophisticationScore = sophisticationWeights[profile.technicalSophistication];

    // Adjust based on company size
    if (profile.size === 'enterprise') sophisticationScore += 1;
    else if (profile.size === 'startup') sophisticationScore -= 0.5;

    // Adjust based on tools
    if (profile.currentTools.length > 10) sophisticationScore += 0.5;
    if (profile.currentTools.includes('sql') || profile.currentTools.includes('python')) {
      sophisticationScore += 0.5;
    }

    // Determine primary needs based on profile
    if (profile.primaryGoals.includes('growth')) {
      primaryNeeds.push('conversion optimization', 'customer acquisition', 'retention analysis');
    }
    if (profile.primaryGoals.includes('efficiency')) {
      primaryNeeds.push('operational metrics', 'cost tracking', 'performance monitoring');
    }
    if (profile.primaryGoals.includes('compliance')) {
      primaryNeeds.push('regulatory reporting', 'audit trails', 'compliance monitoring');
    }

    // Identify risk factors
    if (profile.dataVolume === 'high' && profile.technicalSophistication === 'basic') {
      riskFactors.push('Complex data needs vs. basic technical capability');
    }
    if (profile.teamSize < 5 && profile.size === 'large') {
      riskFactors.push('Large company with small team - resource constraints');
    }

    // Identify opportunities
    if (profile.monthlyRevenue && profile.monthlyRevenue > 100000 && sophisticationScore < 3) {
      opportunities.push('High revenue opportunity for advanced analytics');
    }
    if (profile.teamSize > 20 && !profile.currentTools.includes('dashboard')) {
      opportunities.push('Large team could benefit from centralized dashboards');
    }

    return {
      sophisticationScore,
      primaryNeeds,
      riskFactors,
      opportunities
    };
  }

  /**
   * Generate smart widget recommendations based on company profile
   */
  generateRecommendations(profile: CompanyProfile): RecommendationSet {
    const analysis = this.analyzeCompanyProfile(profile);
    const industryProfile = industryMetricMappingService.getIndustryProfile(profile.industry);
    const availableWidgets = adaptiveLayoutEngine.getAvailableWidgets(
      profile.industry,
      profile.businessModel,
      'all'
    );

    const recommendations: WidgetRecommendation[] = [];
    const bestPractices = this.bestPractices.get(profile.industry) || [];
    const benchmarks = this.industryBenchmarks.get(profile.industry);

    // Apply best practice rules
    for (const rule of bestPractices) {
      if (this.matchesConditions(rule, profile)) {
        const widget = availableWidgets.find(w => w.id === rule.widgetId);
        if (widget) {
          const recommendation = this.createRecommendation(widget, rule, profile, analysis);
          recommendations.push(recommendation);
        }
      }
    }

    // Add industry-specific essential widgets
    if (benchmarks?.essentialWidgets) {
      for (const widgetId of benchmarks.essentialWidgets) {
        if (!recommendations.find(r => r.widget.id === widgetId)) {
          const widget = availableWidgets.find(w => w.id === widgetId);
          if (widget) {
            recommendations.push({
              widget,
              score: 9,
              reason: 'Industry essential widget',
              category: 'essential',
              implementation: {
                difficulty: 'easy',
                timeToValue: 'immediate',
                dependencies: []
              },
              businessImpact: {
                roi: 'high',
                kpis: ['efficiency', 'visibility'],
                useCases: ['daily monitoring', 'executive reporting']
              }
            });
          }
        }
      }
    }

    // Sort by score and limit based on sophistication
    recommendations.sort((a, b) => b.score - a.score);
    const maxWidgets = benchmarks?.sophisticationLevels[profile.technicalSophistication]?.maxWidgets || 10;
    const finalRecommendations = recommendations.slice(0, maxWidgets);

    // Create implementation phases
    const phase1 = finalRecommendations.filter(r =>
      r.category === 'essential' || r.implementation.timeToValue === 'immediate'
    ).slice(0, 4);

    const phase2 = finalRecommendations.filter(r =>
      r.category === 'recommended' && !phase1.includes(r)
    ).slice(0, 4);

    const phase3 = finalRecommendations.filter(r =>
      (r.category === 'optional' || r.category === 'advanced') &&
      !phase1.includes(r) && !phase2.includes(r)
    );

    return {
      companyId: profile.id,
      industry: profile.industry,
      sophisticationLevel: profile.technicalSophistication,
      totalScore: finalRecommendations.reduce((sum, r) => sum + r.score, 0),
      recommendations: finalRecommendations,
      implementation: { phase1, phase2, phase3 },
      customizations: this.generateCustomizations(profile)
    };
  }

  /**
   * Check if a best practice rule matches the company profile
   */
  private matchesConditions(rule: BestPracticeRule, profile: CompanyProfile): boolean {
    // Check business model
    if (rule.businessModel && rule.businessModel !== profile.businessModel) {
      return false;
    }

    // Check company size
    if (rule.companySize && rule.companySize !== profile.size) {
      return false;
    }

    // Check sophistication level
    if (rule.sophistication && rule.sophistication !== profile.technicalSophistication) {
      return false;
    }

    // Check revenue conditions
    if (rule.conditions.revenue) {
      if (!profile.monthlyRevenue) return false;
      if (rule.conditions.revenue.min && profile.monthlyRevenue < rule.conditions.revenue.min) {
        return false;
      }
      if (rule.conditions.revenue.max && profile.monthlyRevenue > rule.conditions.revenue.max) {
        return false;
      }
    }

    // Check team size conditions
    if (rule.conditions.teamSize) {
      if (rule.conditions.teamSize.min && profile.teamSize < rule.conditions.teamSize.min) {
        return false;
      }
      if (rule.conditions.teamSize.max && profile.teamSize > rule.conditions.teamSize.max) {
        return false;
      }
    }

    // Check required tools
    if (rule.conditions.tools) {
      const hasRequiredTools = rule.conditions.tools.some(tool =>
        profile.currentTools.includes(tool)
      );
      if (!hasRequiredTools) return false;
    }

    // Check goals alignment
    if (rule.conditions.goals) {
      const hasMatchingGoals = rule.conditions.goals.some(goal =>
        profile.primaryGoals.includes(goal)
      );
      if (!hasMatchingGoals) return false;
    }

    return true;
  }

  /**
   * Create a detailed widget recommendation
   */
  private createRecommendation(
    widget: LayoutWidget,
    rule: BestPracticeRule,
    profile: CompanyProfile,
    analysis: any
  ): WidgetRecommendation {
    // Calculate recommendation score
    let score = rule.priority;

    // Boost score based on sophistication match
    if (rule.sophistication === profile.technicalSophistication) {
      score += 1;
    }

    // Boost score for goal alignment
    if (rule.conditions.goals?.some(goal => profile.primaryGoals.includes(goal))) {
      score += 0.5;
    }

    // Determine category
    let category: WidgetRecommendation['category'] = 'recommended';
    if (score >= 9) category = 'essential';
    else if (score >= 7) category = 'recommended';
    else if (score >= 5) category = 'optional';
    else category = 'advanced';

    // Determine implementation difficulty
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (analysis.sophisticationScore >= 3) difficulty = 'easy';
    else if (analysis.sophisticationScore >= 2) difficulty = 'medium';
    else difficulty = 'hard';

    // Determine time to value
    let timeToValue: 'immediate' | 'short' | 'medium' | 'long' = 'short';
    if (category === 'essential') timeToValue = 'immediate';
    else if (difficulty === 'easy') timeToValue = 'short';
    else if (difficulty === 'medium') timeToValue = 'medium';
    else timeToValue = 'long';

    return {
      widget,
      score,
      reason: `${rule.benefits.join(', ')}. Best practice for ${profile.industry} companies.`,
      category,
      implementation: {
        difficulty,
        timeToValue,
        dependencies: rule.alternatives || []
      },
      businessImpact: {
        roi: score >= 8 ? 'very_high' : score >= 6 ? 'high' : score >= 4 ? 'medium' : 'low',
        kpis: rule.benefits,
        useCases: analysis.primaryNeeds
      }
    };
  }

  /**
   * Generate customizations based on company profile
   */
  private generateCustomizations(profile: CompanyProfile): RecommendationSet['customizations'] {
    const customizations: RecommendationSet['customizations'] = {};

    // Color scheme based on industry
    const industryColors = {
      saas: '#4F46E5', // Indigo
      ecommerce: '#059669', // Emerald
      finance: '#DC2626', // Red
      healthcare: '#2563EB', // Blue
      default: '#6366F1' // Purple
    };

    customizations.colorScheme = industryColors[profile.industry as keyof typeof industryColors] || industryColors.default;

    // Layout based on sophistication
    if (profile.technicalSophistication === 'basic') {
      customizations.layout = 'simple';
    } else if (profile.technicalSophistication === 'expert') {
      customizations.layout = 'dense';
    } else {
      customizations.layout = 'balanced';
    }

    // Branding considerations
    customizations.branding = {
      companySize: profile.size,
      industry: profile.industry,
      complexity: profile.technicalSophistication
    };

    return customizations;
  }

  /**
   * Get recommendation explanation with reasoning
   */
  getRecommendationExplanation(companyId: string, widgetId: string): {
    reasoning: string;
    alternatives: string[];
    implementationSteps: string[];
    expectedBenefits: string[];
  } {
    // This would typically fetch from a database or cache
    // For now, providing a structured response
    return {
      reasoning: 'Widget recommended based on industry best practices and company profile analysis',
      alternatives: ['Alternative widget options available'],
      implementationSteps: [
        'Configure data sources',
        'Set up widget parameters',
        'Test with sample data',
        'Deploy to dashboard'
      ],
      expectedBenefits: [
        'Improved visibility into key metrics',
        'Better decision making',
        'Automated reporting capabilities'
      ]
    };
  }

  /**
   * Track recommendation feedback for learning
   */
  trackRecommendationFeedback(
    companyId: string,
    widgetId: string,
    feedback: {
      implemented: boolean;
      useful: boolean;
      rating: number;
      comments?: string;
    }
  ): void {
    if (!this.userFeedback.has(companyId)) {
      this.userFeedback.set(companyId, []);
    }

    const companyFeedback = this.userFeedback.get(companyId)!;
    companyFeedback.push({
      widgetId,
      feedback,
      timestamp: new Date()
    });

    // In a real implementation, this would update ML models
    console.log(`Feedback recorded for ${companyId}, widget ${widgetId}:`, feedback);
  }

  /**
   * Get industry benchmarks and comparisons
   */
  getIndustryBenchmarks(industry: string): {
    avgWidgetsPerDashboard: number;
    commonWidgets: string[];
    implementationTimeline: Record<string, string>;
    successMetrics: string[];
  } {
    const benchmarks = this.industryBenchmarks.get(industry);
    if (!benchmarks) {
      return {
        avgWidgetsPerDashboard: 8,
        commonWidgets: [],
        implementationTimeline: {},
        successMetrics: []
      };
    }

    return {
      avgWidgetsPerDashboard: benchmarks.avgWidgetsPerDashboard,
      commonWidgets: benchmarks.essentialWidgets,
      implementationTimeline: {
        'Phase 1 (Week 1-2)': 'Essential widgets setup',
        'Phase 2 (Week 3-4)': 'Growth optimization widgets',
        'Phase 3 (Month 2+)': 'Advanced analytics widgets'
      },
      successMetrics: ['adoption rate', 'time to value', 'user engagement', 'business impact']
    };
  }
}

// Export singleton instance
export const smartWidgetRecommendationEngine = new SmartWidgetRecommendationEngine();
