/**
 * Progressive Complexity Management Engine
 * Gradually introduces advanced features based on user sophistication and engagement levels
 */

import { smartWidgetRecommendationEngine } from './smart-widget-recommendation-engine';

export interface UserComplexityProfile {
  userId: string;
  companyId: string;
  currentLevel: ComplexityLevel;
  sophisticationScore: number;
  engagementScore: number;
  progressionScore: number;
  unlockedFeatures: string[];
  completedMilestones: string[];
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplexityLevel {
  id: string;
  name: string;
  description: string;
  order: number;
  requiredScore: number;
  features: FeatureDefinition[];
  milestones: MilestoneDefinition[];
  progressionCriteria: ProgressionCriteria;
}

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: 'widget' | 'layout' | 'analytics' | 'automation' | 'integration';
  complexityWeight: number;
  prerequisites: string[];
  onboardingSteps: OnboardingStep[];
  helpContent: HelpContent;
}

export interface MilestoneDefinition {
  id: string;
  name: string;
  description: string;
  criteria: {
    type: 'usage' | 'time' | 'achievement' | 'engagement';
    target: number;
    metric: string;
  };
  reward: {
    type: 'feature' | 'template' | 'badge' | 'guidance';
    value: string;
  };
}

export interface ProgressionCriteria {
  minimumEngagement: number; // 0-10 scale
  minimumUsageHours: number;
  requiredMilestones: string[];
  timeInLevel: number; // days
  optionalCriteria?: {
    feedbackRating?: number;
    helpUsage?: number;
    errorRate?: number;
  };
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'tutorial' | 'tooltip' | 'demo' | 'interactive';
  targetElement?: string;
  content: string;
  order: number;
  estimatedDuration: number; // minutes
}

export interface HelpContent {
  quickTip: string;
  detailedGuide: string;
  videoUrl?: string;
  exampleUseCase: string;
  troubleshooting: string[];
}

export interface EngagementMetrics {
  dailyActiveTime: number;
  weeklyActiveTime: number;
  monthlyActiveTime: number;
  featuresUsed: number;
  widgetsInteracted: number;
  dashboardsCreated: number;
  helpRequests: number;
  feedbackSubmitted: number;
  errorsEncountered: number;
}

export interface ProgressionRecommendation {
  type: 'unlock' | 'milestone' | 'guidance' | 'restriction';
  target: string;
  reason: string;
  expectedBenefit: string;
  requiredAction?: string;
  estimatedTime?: number;
}

export interface ComplexityReport {
  userId: string;
  currentLevel: ComplexityLevel;
  progressToNext: number; // percentage
  recommendations: ProgressionRecommendation[];
  engagementTrends: {
    trend: 'increasing' | 'stable' | 'decreasing';
    weeklyChange: number;
    monthlyChange: number;
  };
  riskFactors: string[];
  opportunities: string[];
}

export class ProgressiveComplexityManager {
  private complexityLevels: Map<string, ComplexityLevel> = new Map();
  private userProfiles: Map<string, UserComplexityProfile> = new Map();
  private engagementMetrics: Map<string, EngagementMetrics> = new Map();
  private featureDefinitions: Map<string, FeatureDefinition> = new Map();

  constructor() {
    this.initializeComplexityLevels();
    this.initializeFeatureDefinitions();
  }

  /**
   * Initialize complexity levels from beginner to expert
   */
  private initializeComplexityLevels(): void {
    // Beginner Level
    this.complexityLevels.set('beginner', {
      id: 'beginner',
      name: 'Getting Started',
      description: 'Essential features for new users',
      order: 1,
      requiredScore: 0,
      features: [
        this.createFeatureRef('basic-dashboard'),
        this.createFeatureRef('simple-widgets'),
        this.createFeatureRef('guided-tour'),
        this.createFeatureRef('basic-help')
      ],
      milestones: [
        {
          id: 'first-dashboard',
          name: 'First Dashboard Created',
          description: 'Create your first dashboard',
          criteria: { type: 'achievement', target: 1, metric: 'dashboards_created' },
          reward: { type: 'template', value: 'industry-starter-template' }
        },
        {
          id: 'first-week',
          name: 'First Week Complete',
          description: 'Complete one week of usage',
          criteria: { type: 'time', target: 7, metric: 'days_active' },
          reward: { type: 'feature', value: 'basic-customization' }
        }
      ],
      progressionCriteria: {
        minimumEngagement: 3,
        minimumUsageHours: 5,
        requiredMilestones: ['first-dashboard'],
        timeInLevel: 7
      }
    });

    // Intermediate Level
    this.complexityLevels.set('intermediate', {
      id: 'intermediate',
      name: 'Building Proficiency',
      description: 'Advanced widgets and customization options',
      order: 2,
      requiredScore: 3,
      features: [
        this.createFeatureRef('advanced-widgets'),
        this.createFeatureRef('layout-customization'),
        this.createFeatureRef('data-filtering'),
        this.createFeatureRef('basic-automation'),
        this.createFeatureRef('collaboration-tools')
      ],
      milestones: [
        {
          id: 'widget-mastery',
          name: 'Widget Master',
          description: 'Use 10 different widget types',
          criteria: { type: 'usage', target: 10, metric: 'unique_widgets_used' },
          reward: { type: 'feature', value: 'custom-widget-creation' }
        },
        {
          id: 'layout-expert',
          name: 'Layout Expert',
          description: 'Create 3 custom layouts',
          criteria: { type: 'achievement', target: 3, metric: 'custom_layouts_created' },
          reward: { type: 'template', value: 'advanced-layout-templates' }
        }
      ],
      progressionCriteria: {
        minimumEngagement: 5,
        minimumUsageHours: 20,
        requiredMilestones: ['widget-mastery'],
        timeInLevel: 14
      }
    });

    // Advanced Level
    this.complexityLevels.set('advanced', {
      id: 'advanced',
      name: 'Power User',
      description: 'Advanced analytics and automation features',
      order: 3,
      requiredScore: 6,
      features: [
        this.createFeatureRef('advanced-analytics'),
        this.createFeatureRef('automation-workflows'),
        this.createFeatureRef('api-integrations'),
        this.createFeatureRef('advanced-filtering'),
        this.createFeatureRef('performance-optimization'),
        this.createFeatureRef('team-management')
      ],
      milestones: [
        {
          id: 'automation-master',
          name: 'Automation Master',
          description: 'Create 5 automated workflows',
          criteria: { type: 'achievement', target: 5, metric: 'automation_workflows_created' },
          reward: { type: 'feature', value: 'advanced-automation-templates' }
        },
        {
          id: 'integration-expert',
          name: 'Integration Expert',
          description: 'Connect 3 external services',
          criteria: { type: 'achievement', target: 3, metric: 'integrations_configured' },
          reward: { type: 'feature', value: 'custom-api-connectors' }
        }
      ],
      progressionCriteria: {
        minimumEngagement: 7,
        minimumUsageHours: 50,
        requiredMilestones: ['automation-master'],
        timeInLevel: 21
      }
    });

    // Expert Level
    this.complexityLevels.set('expert', {
      id: 'expert',
      name: 'Expert User',
      description: 'Full platform capabilities and advanced features',
      order: 4,
      requiredScore: 9,
      features: [
        this.createFeatureRef('enterprise-features'),
        this.createFeatureRef('custom-development'),
        this.createFeatureRef('advanced-security'),
        this.createFeatureRef('white-label-options'),
        this.createFeatureRef('advanced-apis'),
        this.createFeatureRef('beta-features')
      ],
      milestones: [
        {
          id: 'platform-master',
          name: 'Platform Master',
          description: 'Achieve mastery across all areas',
          criteria: { type: 'engagement', target: 9, metric: 'overall_mastery_score' },
          reward: { type: 'badge', value: 'platform-expert-badge' }
        }
      ],
      progressionCriteria: {
        minimumEngagement: 9,
        minimumUsageHours: 100,
        requiredMilestones: ['platform-master'],
        timeInLevel: 30
      }
    });
  }

  /**
   * Helper method to create feature references
   */
  private createFeatureRef(featureId: string): FeatureDefinition {
    return this.featureDefinitions.get(featureId) || {
      id: featureId,
      name: featureId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Feature: ${featureId}`,
      category: 'widget',
      complexityWeight: 1,
      prerequisites: [],
      onboardingSteps: [],
      helpContent: {
        quickTip: '',
        detailedGuide: '',
        exampleUseCase: '',
        troubleshooting: []
      }
    };
  }

  /**
   * Initialize comprehensive feature definitions
   */
  private initializeFeatureDefinitions(): void {
    // Basic Level Features
    this.featureDefinitions.set('basic-dashboard', {
      id: 'basic-dashboard',
      name: 'Basic Dashboard',
      description: 'Simple dashboard with essential widgets',
      category: 'layout',
      complexityWeight: 1,
      prerequisites: [],
      onboardingSteps: [
        {
          id: 'dashboard-intro',
          title: 'Welcome to Your Dashboard',
          description: 'Learn the basics of dashboard navigation',
          type: 'tutorial',
          content: 'Your dashboard is your central hub for monitoring key metrics...',
          order: 1,
          estimatedDuration: 3
        }
      ],
      helpContent: {
        quickTip: 'Use the sidebar to add new widgets to your dashboard',
        detailedGuide: 'Dashboard Guide: Creating and customizing your first dashboard...',
        exampleUseCase: 'Track daily sales and visitor metrics for your e-commerce store',
        troubleshooting: [
          'If widgets don\'t load, check your internet connection',
          'Refresh the page if data appears outdated'
        ]
      }
    });

    this.featureDefinitions.set('simple-widgets', {
      id: 'simple-widgets',
      name: 'Essential Widgets',
      description: 'Basic KPI and chart widgets',
      category: 'widget',
      complexityWeight: 1,
      prerequisites: ['basic-dashboard'],
      onboardingSteps: [
        {
          id: 'widget-basics',
          title: 'Understanding Widgets',
          description: 'Learn about different widget types',
          type: 'interactive',
          targetElement: '.widget-library',
          content: 'Widgets display your data in visual formats...',
          order: 1,
          estimatedDuration: 5
        }
      ],
      helpContent: {
        quickTip: 'Drag widgets from the library to your dashboard',
        detailedGuide: 'Widget Guide: Understanding and using essential widgets...',
        exampleUseCase: 'Add a revenue KPI widget to track monthly performance',
        troubleshooting: [
          'Ensure data sources are properly connected',
          'Check widget configuration for correct metrics'
        ]
      }
    });

    // Intermediate Level Features
    this.featureDefinitions.set('advanced-widgets', {
      id: 'advanced-widgets',
      name: 'Advanced Widgets',
      description: 'Complex charts, tables, and interactive widgets',
      category: 'widget',
      complexityWeight: 3,
      prerequisites: ['simple-widgets'],
      onboardingSteps: [
        {
          id: 'advanced-widget-intro',
          title: 'Advanced Widget Capabilities',
          description: 'Explore complex visualization options',
          type: 'demo',
          content: 'Advanced widgets offer deeper insights...',
          order: 1,
          estimatedDuration: 8
        }
      ],
      helpContent: {
        quickTip: 'Use advanced widgets for detailed analysis and complex data',
        detailedGuide: 'Advanced Widget Guide: Cohort analysis, funnel charts, and heat maps...',
        exampleUseCase: 'Analyze customer behavior with cohort analysis widget',
        troubleshooting: [
          'Complex widgets may require more data processing time',
          'Ensure sufficient data volume for meaningful analysis'
        ]
      }
    });

    this.featureDefinitions.set('layout-customization', {
      id: 'layout-customization',
      name: 'Layout Customization',
      description: 'Custom layouts and dashboard arrangements',
      category: 'layout',
      complexityWeight: 2,
      prerequisites: ['basic-dashboard'],
      onboardingSteps: [
        {
          id: 'layout-editor',
          title: 'Layout Editor',
          description: 'Learn to customize dashboard layouts',
          type: 'interactive',
          targetElement: '.layout-editor',
          content: 'Customize your dashboard layout for optimal workflow...',
          order: 1,
          estimatedDuration: 6
        }
      ],
      helpContent: {
        quickTip: 'Drag and resize widgets to create your ideal layout',
        detailedGuide: 'Layout Guide: Creating efficient and beautiful dashboard layouts...',
        exampleUseCase: 'Create a executive summary layout with key metrics at the top',
        troubleshooting: [
          'Save layouts before making major changes',
          'Use grid snap for precise alignment'
        ]
      }
    });

    // Advanced Level Features
    this.featureDefinitions.set('automation-workflows', {
      id: 'automation-workflows',
      name: 'Automation Workflows',
      description: 'Automated alerts, reports, and actions',
      category: 'automation',
      complexityWeight: 5,
      prerequisites: ['advanced-widgets', 'data-filtering'],
      onboardingSteps: [
        {
          id: 'automation-intro',
          title: 'Automation Basics',
          description: 'Introduction to workflow automation',
          type: 'tutorial',
          content: 'Automate repetitive tasks and get proactive alerts...',
          order: 1,
          estimatedDuration: 12
        }
      ],
      helpContent: {
        quickTip: 'Set up automated alerts for critical metric changes',
        detailedGuide: 'Automation Guide: Creating powerful workflows and alerts...',
        exampleUseCase: 'Automatically send weekly reports to stakeholders',
        troubleshooting: [
          'Test workflows with small datasets first',
          'Monitor automation logs for errors'
        ]
      }
    });

    this.featureDefinitions.set('api-integrations', {
      id: 'api-integrations',
      name: 'API Integrations',
      description: 'Connect external services and data sources',
      category: 'integration',
      complexityWeight: 4,
      prerequisites: ['advanced-widgets'],
      onboardingSteps: [
        {
          id: 'api-setup',
          title: 'API Integration Setup',
          description: 'Learn to connect external services',
          type: 'tutorial',
          content: 'Integrate with your existing tools and data sources...',
          order: 1,
          estimatedDuration: 15
        }
      ],
      helpContent: {
        quickTip: 'Start with pre-built connectors before creating custom integrations',
        detailedGuide: 'Integration Guide: Connecting and managing external data sources...',
        exampleUseCase: 'Connect Salesforce CRM for real-time sales data',
        troubleshooting: [
          'Verify API credentials and permissions',
          'Check rate limits for external services'
        ]
      }
    });

    // Expert Level Features
    this.featureDefinitions.set('enterprise-features', {
      id: 'enterprise-features',
      name: 'Enterprise Features',
      description: 'Advanced security, governance, and scaling capabilities',
      category: 'integration',
      complexityWeight: 6,
      prerequisites: ['automation-workflows', 'api-integrations'],
      onboardingSteps: [
        {
          id: 'enterprise-setup',
          title: 'Enterprise Capabilities',
          description: 'Explore enterprise-grade features',
          type: 'tutorial',
          content: 'Leverage enterprise features for large-scale deployments...',
          order: 1,
          estimatedDuration: 20
        }
      ],
      helpContent: {
        quickTip: 'Enterprise features require proper governance and training',
        detailedGuide: 'Enterprise Guide: Scaling and securing your analytics platform...',
        exampleUseCase: 'Implement role-based access control for different departments',
        troubleshooting: [
          'Coordinate with IT security for enterprise deployments',
          'Plan migration strategies for existing workflows'
        ]
      }
    });
  }

  /**
   * Get or create user complexity profile
   */
  getUserProfile(userId: string, companyId: string): UserComplexityProfile {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        companyId,
        currentLevel: this.complexityLevels.get('beginner')!,
        sophisticationScore: 0,
        engagementScore: 0,
        progressionScore: 0,
        unlockedFeatures: ['basic-dashboard', 'simple-widgets', 'guided-tour', 'basic-help'],
        completedMilestones: [],
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Calculate user sophistication score based on company profile and usage
   */
  calculateSophisticationScore(userId: string, companyProfile?: any): number {
    const profile = this.getUserProfile(userId, companyProfile?.id || 'unknown');
    const metrics = this.engagementMetrics.get(userId);

    let score = 0;

    // Base score from company profile
    if (companyProfile) {
      try {
        const analysis = smartWidgetRecommendationEngine.analyzeCompanyProfile(companyProfile);
        if (analysis && typeof analysis.sophisticationScore === 'number') {
          score += analysis.sophisticationScore * 2; // Weight company sophistication heavily
        }
      } catch (error) {
        // Gracefully handle any analysis errors
        console.warn('Error analyzing company profile:', error);
      }
    }

    // Engagement-based scoring
    if (metrics) {
      score += Math.min(metrics.featuresUsed / 10, 2); // Max 2 points for feature usage
      score += Math.min(metrics.widgetsInteracted / 20, 1); // Max 1 point for widget interaction
      score += Math.min(metrics.dashboardsCreated / 5, 1); // Max 1 point for dashboard creation
      score += Math.max(0, 1 - (metrics.errorsEncountered / 10)); // Reduce for errors
    }

    // Time-based progression
    const accountAge = (Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24); // days
    score += Math.min(accountAge / 30, 1); // Max 1 point for account maturity

    // Milestone completion bonus
    score += profile.completedMilestones.length * 0.5;

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Calculate engagement score based on usage patterns
   */
  calculateEngagementScore(userId: string): number {
    const metrics = this.engagementMetrics.get(userId);
    const profile = this.userProfiles.get(userId);

    if (!metrics || !profile) return 0;

    let score = 0;

    // Daily activity score (0-3 points)
    const dailyHours = metrics.dailyActiveTime / 60; // Convert to hours
    score += Math.min(dailyHours / 2, 3); // Max 3 points for 2+ hours daily

    // Feature adoption score (0-2 points)
    const unlockedFeaturesCount = profile.unlockedFeatures.length;
    if (unlockedFeaturesCount > 0) {
      const featureAdoption = metrics.featuresUsed / unlockedFeaturesCount;
      score += featureAdoption * 2;
    }

    // Consistency score (0-2 points)
    const weeklyConsistency = metrics.weeklyActiveTime > 0 ? 1 : 0;
    const monthlyConsistency = metrics.monthlyActiveTime > 0 ? 1 : 0;
    score += weeklyConsistency + monthlyConsistency;

    // Quality indicators (0-3 points)
    score += Math.max(0, 3 - (metrics.errorsEncountered / 5)); // Reduce for errors
    score += Math.min(metrics.feedbackSubmitted * 0.5, 1); // Bonus for feedback

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Update user engagement metrics
   */
  updateEngagementMetrics(userId: string, metrics: Partial<EngagementMetrics>): void {
    const existing = this.engagementMetrics.get(userId) || {
      dailyActiveTime: 0,
      weeklyActiveTime: 0,
      monthlyActiveTime: 0,
      featuresUsed: 0,
      widgetsInteracted: 0,
      dashboardsCreated: 0,
      helpRequests: 0,
      feedbackSubmitted: 0,
      errorsEncountered: 0
    };

    this.engagementMetrics.set(userId, { ...existing, ...metrics });

    // Ensure user profile exists before updating scores
    const profile = this.getUserProfile(userId, 'unknown');
    if (profile) {
      profile.engagementScore = this.calculateEngagementScore(userId);
      profile.sophisticationScore = this.calculateSophisticationScore(userId);
      profile.progressionScore = (profile.sophisticationScore + profile.engagementScore) / 2;
      profile.lastActivity = new Date();
      profile.updatedAt = new Date();
    }
  }

  /**
   * Check if user is ready for level progression
   */
  checkLevelProgression(userId: string): { canProgress: boolean; nextLevel?: ComplexityLevel; requirements: string[] } {
    const profile = this.getUserProfile(userId, '');
    const currentLevel = profile.currentLevel;
    const nextLevelOrder = currentLevel.order + 1;

    // Find next level
    const nextLevel = Array.from(this.complexityLevels.values())
      .find(level => level.order === nextLevelOrder);

    if (!nextLevel) {
      return { canProgress: false, requirements: ['Already at maximum level'] };
    }

    const requirements: string[] = [];
    let canProgress = true;

    // Check score requirement
    if (profile.progressionScore < nextLevel.requiredScore) {
      requirements.push(`Progression score must be ${nextLevel.requiredScore} (current: ${profile.progressionScore.toFixed(1)})`);
      canProgress = false;
    }

    // Check current level criteria
    const criteria = currentLevel.progressionCriteria;

    if (profile.engagementScore < criteria.minimumEngagement) {
      requirements.push(`Engagement score must be ${criteria.minimumEngagement} (current: ${profile.engagementScore.toFixed(1)})`);
      canProgress = false;
    }

    // Check time in level
    const timeInLevel = (Date.now() - profile.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (timeInLevel < criteria.timeInLevel) {
      requirements.push(`Must spend ${criteria.timeInLevel} days in current level (current: ${Math.floor(timeInLevel)})`);
      canProgress = false;
    }

    // Check required milestones
    const completedMilestones = new Set(profile.completedMilestones);
    for (const requiredMilestone of criteria.requiredMilestones) {
      if (!completedMilestones.has(requiredMilestone)) {
        requirements.push(`Must complete milestone: ${requiredMilestone}`);
        canProgress = false;
      }
    }

    return { canProgress, nextLevel: canProgress ? nextLevel : undefined, requirements };
  }

  /**
   * Progress user to next level
   */
  progressUserLevel(userId: string): { success: boolean; newLevel?: ComplexityLevel; unlockedFeatures: string[] } {
    const progressionCheck = this.checkLevelProgression(userId);

    if (!progressionCheck.canProgress || !progressionCheck.nextLevel) {
      return { success: false, unlockedFeatures: [] };
    }

    const profile = this.getUserProfile(userId, '');
    const newLevel = progressionCheck.nextLevel;

    // Update user profile
    profile.currentLevel = newLevel;
    profile.updatedAt = new Date();

    // Unlock new features
    const newFeatures = newLevel.features.map(f => f.id);
    const previousFeatures = new Set(profile.unlockedFeatures);
    const unlockedFeatures = newFeatures.filter(f => !previousFeatures.has(f));

    profile.unlockedFeatures.push(...unlockedFeatures);

    return { success: true, newLevel, unlockedFeatures };
  }

  /**
   * Get feature recommendations based on user level and engagement
   */
  getFeatureRecommendations(userId: string): ProgressionRecommendation[] {
    const profile = this.getUserProfile(userId, '');
    const recommendations: ProgressionRecommendation[] = [];

    // Check for level progression
    const progressionCheck = this.checkLevelProgression(userId);
    if (progressionCheck.canProgress) {
      recommendations.push({
        type: 'unlock',
        target: progressionCheck.nextLevel!.name,
        reason: 'You\'ve met all requirements for the next complexity level',
        expectedBenefit: `Unlock ${progressionCheck.nextLevel!.features.length} new features`,
        requiredAction: 'Click to progress to the next level',
        estimatedTime: 5
      });
    } else {
      // Recommendations to help with progression
      for (const requirement of progressionCheck.requirements.slice(0, 2)) {
        recommendations.push({
          type: 'guidance',
          target: 'progression',
          reason: requirement,
          expectedBenefit: 'Progress towards next complexity level',
          requiredAction: 'Focus on engagement and feature usage'
        });
      }
    }

    // Feature-specific recommendations
    const availableFeatures = profile.currentLevel.features
      .filter(f => !profile.unlockedFeatures.includes(f.id));

    for (const feature of availableFeatures.slice(0, 3)) {
      recommendations.push({
        type: 'unlock',
        target: feature.name,
        reason: `${feature.name} can help improve your workflow efficiency`,
        expectedBenefit: feature.description,
        requiredAction: 'Complete prerequisite features',
        estimatedTime: feature.onboardingSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive complexity report
   */
  generateComplexityReport(userId: string): ComplexityReport {
    const profile = this.getUserProfile(userId, '');
    const progressionCheck = this.checkLevelProgression(userId);
    const metrics = this.engagementMetrics.get(userId);

    // Calculate progress to next level
    let progressToNext = 0;
    if (progressionCheck.nextLevel) {
      const currentScore = profile.progressionScore;
      const requiredScore = progressionCheck.nextLevel.requiredScore;
      const previousScore = profile.currentLevel.requiredScore;
      progressToNext = Math.min(((currentScore - previousScore) / (requiredScore - previousScore)) * 100, 100);
    }

    // Analyze engagement trends
    const engagementTrends: {
      trend: 'increasing' | 'stable' | 'decreasing';
      weeklyChange: number;
      monthlyChange: number;
    } = {
      trend: 'stable',
      weeklyChange: 0,
      monthlyChange: 0
    };

    if (metrics) {
      const weeklyRatio = metrics.weeklyActiveTime / Math.max(metrics.monthlyActiveTime / 4, 1);
      if (weeklyRatio > 1.2) engagementTrends.trend = 'increasing';
      else if (weeklyRatio < 0.8) engagementTrends.trend = 'decreasing';
    }

    // Identify risk factors
    const riskFactors: string[] = [];
    if (profile.engagementScore < 3) riskFactors.push('Low engagement may lead to churn');
    if (metrics && metrics.errorsEncountered > 10) riskFactors.push('High error rate may indicate usability issues');
    if (profile.unlockedFeatures.length > 0 && (!metrics || metrics.featuresUsed < profile.unlockedFeatures.length * 0.5)) {
      riskFactors.push('Low feature adoption despite availability');
    }

    // Identify opportunities
    const opportunities: string[] = [];
    if (profile.sophisticationScore > profile.engagementScore + 2) {
      opportunities.push('High sophistication suggests readiness for advanced features');
    }
    if (progressionCheck.canProgress) {
      opportunities.push('Ready for complexity level progression');
    }
    if (metrics && metrics.helpRequests === 0) {
      opportunities.push('May benefit from guided learning resources');
    }

    return {
      userId,
      currentLevel: profile.currentLevel,
      progressToNext,
      recommendations: this.getFeatureRecommendations(userId),
      engagementTrends,
      riskFactors,
      opportunities
    };
  }

  /**
   * Complete a milestone for a user
   */
  completeMilestone(userId: string, milestoneId: string): { success: boolean; reward?: any; levelProgression?: ComplexityLevel } {
    const profile = this.getUserProfile(userId, '');

    // Find milestone in current level
    const milestone = profile.currentLevel.milestones.find(m => m.id === milestoneId);
    if (!milestone || profile.completedMilestones.includes(milestoneId)) {
      return { success: false };
    }

    // Mark milestone as completed
    profile.completedMilestones.push(milestoneId);
    profile.updatedAt = new Date();

    // Apply reward
    let reward: any = null;
    if (milestone.reward.type === 'feature') {
      if (!profile.unlockedFeatures.includes(milestone.reward.value)) {
        profile.unlockedFeatures.push(milestone.reward.value);
        reward = { type: 'feature', feature: this.featureDefinitions.get(milestone.reward.value) };
      }
    } else {
      reward = milestone.reward;
    }

    // Check for level progression
    const progressionCheck = this.checkLevelProgression(userId);
    let levelProgression: ComplexityLevel | undefined;

    if (progressionCheck.canProgress) {
      const progression = this.progressUserLevel(userId);
      if (progression.success) {
        levelProgression = progression.newLevel;
      }
    }

    return { success: true, reward, levelProgression };
  }

  /**
   * Get available features for user's current level
   */
  getAvailableFeatures(userId: string): FeatureDefinition[] {
    const profile = this.getUserProfile(userId, '');
    return profile.currentLevel.features.filter(f =>
      profile.unlockedFeatures.includes(f.id)
    );
  }

  /**
   * Get locked features for user's current level
   */
  getLockedFeatures(userId: string): FeatureDefinition[] {
    const profile = this.getUserProfile(userId, '');
    return profile.currentLevel.features.filter(f =>
      !profile.unlockedFeatures.includes(f.id)
    );
  }

  /**
   * Get onboarding steps for a specific feature
   */
  getFeatureOnboarding(featureId: string): OnboardingStep[] {
    const feature = this.featureDefinitions.get(featureId);
    return feature?.onboardingSteps || [];
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(userId: string, featureId: string, action: string, metadata?: any): void {
    // Update engagement metrics
    const metrics = this.engagementMetrics.get(userId) || {
      dailyActiveTime: 0,
      weeklyActiveTime: 0,
      monthlyActiveTime: 0,
      featuresUsed: 0,
      widgetsInteracted: 0,
      dashboardsCreated: 0,
      helpRequests: 0,
      feedbackSubmitted: 0,
      errorsEncountered: 0
    };

    // Track feature usage
    if (action === 'used') {
      const profile = this.getUserProfile(userId, '');
      const usedFeatures = new Set(profile.unlockedFeatures.filter(f =>
        // This would typically check usage logs, simplified for this implementation
        Math.random() > 0.5 // Simulated usage check
      ));
      metrics.featuresUsed = usedFeatures.size;
    }

    // Track specific actions
    if (action === 'widget_interact') metrics.widgetsInteracted++;
    if (action === 'dashboard_create') metrics.dashboardsCreated++;
    if (action === 'help_request') metrics.helpRequests++;
    if (action === 'feedback') metrics.feedbackSubmitted++;
    if (action === 'error') metrics.errorsEncountered++;

    this.updateEngagementMetrics(userId, metrics);
  }
}

// Export singleton instance
export const progressiveComplexityManager = new ProgressiveComplexityManager();
