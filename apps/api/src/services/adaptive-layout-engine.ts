/**
 * Adaptive Layout Engine
 * Dynamically arranges dashboard layouts based on industry workflows and user preferences
 */

import { industryMetricMappingService } from './industry-metric-mapping-service';

export interface LayoutWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'kpi' | 'action' | 'navigation';
  title: string;
  component: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  priority: number;
  industry?: string[];
  businessModel?: string[];
  userRole?: string[];
}

export interface LayoutGrid {
  id: string;
  name: string;
  description: string;
  industry: string;
  businessModel?: string;
  userRole?: string;
  isTemplate: boolean;
  isDefault: boolean;
  widgets: LayoutWidget[];
  layout: LayoutPosition[];
  metadata: {
    created: Date;
    lastModified: Date;
    usage: number;
    effectiveness: number;
  };
}

export interface LayoutPosition {
  widgetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface UserBehaviorPattern {
  userId: string;
  industry: string;
  interactions: {
    widgetId: string;
    action: 'view' | 'click' | 'drag' | 'resize' | 'configure';
    timestamp: Date;
    duration?: number;
    value?: any;
  }[];
  preferences: {
    preferredSize: Record<string, 'small' | 'medium' | 'large' | 'xlarge'>;
    widgetPriority: Record<string, number>;
    layoutStyle: 'compact' | 'spacious' | 'balanced';
  };
}

export interface LayoutOptimizationResult {
  score: number;
  improvements: {
    type: 'move' | 'resize' | 'add' | 'remove' | 'replace';
    widgetId: string;
    suggestion: string;
    expectedImprovement: number;
  }[];
  recommendedLayout: LayoutPosition[];
}

export class AdaptiveLayoutEngine {
  private layoutTemplates: Map<string, LayoutGrid> = new Map();
  private userBehavior: Map<string, UserBehaviorPattern> = new Map();
  private widgetLibrary: Map<string, LayoutWidget> = new Map();

  constructor() {
    this.initializeWidgetLibrary();
    this.initializeLayoutTemplates();
  }

  private initializeWidgetLibrary(): void {
    // Core metric widgets
    this.widgetLibrary.set('mrr-kpi', {
      id: 'mrr-kpi',
      type: 'kpi',
      title: 'Monthly Recurring Revenue',
      component: 'MRRKPIWidget',
      size: 'medium',
      priority: 10,
      industry: ['saas'],
      businessModel: ['b2b', 'b2c'],
      userRole: ['executive', 'finance', 'sales']
    });

    this.widgetLibrary.set('conversion-rate-chart', {
      id: 'conversion-rate-chart',
      type: 'chart',
      title: 'Conversion Rate Trends',
      component: 'ConversionRateChart',
      size: 'large',
      priority: 9,
      industry: ['saas', 'ecommerce'],
      businessModel: ['b2b', 'b2c'],
      userRole: ['marketing', 'growth', 'executive']
    });

    this.widgetLibrary.set('churn-analysis', {
      id: 'churn-analysis',
      type: 'chart',
      title: 'Churn Analysis',
      component: 'ChurnAnalysisWidget',
      size: 'large',
      priority: 9,
      industry: ['saas'],
      businessModel: ['b2b', 'b2c'],
      userRole: ['executive', 'customer-success']
    });

    this.widgetLibrary.set('revenue-chart', {
      id: 'revenue-chart',
      type: 'chart',
      title: 'Revenue Overview',
      component: 'RevenueChart',
      size: 'xlarge',
      priority: 10,
      industry: ['saas', 'ecommerce', 'manufacturing'],
      businessModel: ['b2b', 'b2c'],
      userRole: ['executive', 'finance']
    });

    this.widgetLibrary.set('aov-kpi', {
      id: 'aov-kpi',
      type: 'kpi',
      title: 'Average Order Value',
      component: 'AOVKPIWidget',
      size: 'medium',
      priority: 8,
      industry: ['ecommerce'],
      businessModel: ['b2c'],
      userRole: ['marketing', 'sales', 'executive']
    });

    this.widgetLibrary.set('cart-abandonment', {
      id: 'cart-abandonment',
      type: 'metric',
      title: 'Cart Abandonment Rate',
      component: 'CartAbandonmentWidget',
      size: 'medium',
      priority: 9,
      industry: ['ecommerce'],
      businessModel: ['b2c'],
      userRole: ['marketing', 'growth']
    });

    this.widgetLibrary.set('ab-test-results', {
      id: 'ab-test-results',
      type: 'table',
      title: 'Active A/B Tests',
      component: 'ABTestResultsTable',
      size: 'large',
      priority: 8,
      industry: ['saas', 'ecommerce'],
      businessModel: ['b2b', 'b2c'],
      userRole: ['growth', 'marketing', 'product']
    });

    this.widgetLibrary.set('customer-acquisition', {
      id: 'customer-acquisition',
      type: 'chart',
      title: 'Customer Acquisition',
      component: 'CustomerAcquisitionChart',
      size: 'large',
      priority: 8,
      industry: ['saas', 'ecommerce'],
      businessModel: ['b2b', 'b2c'],
      userRole: ['marketing', 'sales', 'executive']
    });

    this.widgetLibrary.set('quick-actions', {
      id: 'quick-actions',
      type: 'action',
      title: 'Quick Actions',
      component: 'QuickActionsWidget',
      size: 'small',
      priority: 6,
      industry: ['saas', 'ecommerce', 'manufacturing'],
      businessModel: ['b2b', 'b2c'],
      userRole: ['all']
    });

    this.widgetLibrary.set('alerts-notifications', {
      id: 'alerts-notifications',
      type: 'action',
      title: 'Alerts & Notifications',
      component: 'AlertsWidget',
      size: 'medium',
      priority: 7,
      industry: ['saas', 'ecommerce', 'manufacturing'],
      businessModel: ['b2b', 'b2c'],
      userRole: ['all']
    });
  }

  private initializeLayoutTemplates(): void {
    // SaaS Executive Dashboard Template
    this.layoutTemplates.set('saas-executive', {
      id: 'saas-executive',
      name: 'SaaS Executive Dashboard',
      description: 'High-level metrics and KPIs for SaaS executives',
      industry: 'saas',
      businessModel: 'b2b',
      userRole: 'executive',
      isTemplate: true,
      isDefault: true,
      widgets: [
        this.widgetLibrary.get('mrr-kpi')!,
        this.widgetLibrary.get('revenue-chart')!,
        this.widgetLibrary.get('churn-analysis')!,
        this.widgetLibrary.get('conversion-rate-chart')!,
        this.widgetLibrary.get('customer-acquisition')!,
        this.widgetLibrary.get('ab-test-results')!,
        this.widgetLibrary.get('alerts-notifications')!
      ],
      layout: [
        { widgetId: 'mrr-kpi', x: 0, y: 0, width: 3, height: 2 },
        { widgetId: 'revenue-chart', x: 3, y: 0, width: 9, height: 4 },
        { widgetId: 'churn-analysis', x: 0, y: 2, width: 6, height: 3 },
        { widgetId: 'conversion-rate-chart', x: 6, y: 4, width: 6, height: 3 },
        { widgetId: 'customer-acquisition', x: 0, y: 5, width: 6, height: 3 },
        { widgetId: 'ab-test-results', x: 6, y: 7, width: 6, height: 4 },
        { widgetId: 'alerts-notifications', x: 0, y: 8, width: 6, height: 2 }
      ],
      metadata: {
        created: new Date(),
        lastModified: new Date(),
        usage: 0,
        effectiveness: 8.5
      }
    });

    // E-commerce Marketing Dashboard Template
    this.layoutTemplates.set('ecommerce-marketing', {
      id: 'ecommerce-marketing',
      name: 'E-commerce Marketing Dashboard',
      description: 'Conversion and revenue metrics for e-commerce marketing teams',
      industry: 'ecommerce',
      businessModel: 'b2c',
      userRole: 'marketing',
      isTemplate: true,
      isDefault: true,
      widgets: [
        this.widgetLibrary.get('conversion-rate-chart')!,
        this.widgetLibrary.get('aov-kpi')!,
        this.widgetLibrary.get('cart-abandonment')!,
        this.widgetLibrary.get('revenue-chart')!,
        this.widgetLibrary.get('customer-acquisition')!,
        this.widgetLibrary.get('ab-test-results')!,
        this.widgetLibrary.get('quick-actions')!
      ],
      layout: [
        { widgetId: 'conversion-rate-chart', x: 0, y: 0, width: 8, height: 4 },
        { widgetId: 'aov-kpi', x: 8, y: 0, width: 4, height: 2 },
        { widgetId: 'cart-abandonment', x: 8, y: 2, width: 4, height: 2 },
        { widgetId: 'revenue-chart', x: 0, y: 4, width: 12, height: 3 },
        { widgetId: 'customer-acquisition', x: 0, y: 7, width: 8, height: 3 },
        { widgetId: 'ab-test-results', x: 8, y: 7, width: 4, height: 3 },
        { widgetId: 'quick-actions', x: 8, y: 4, width: 4, height: 2 }
      ],
      metadata: {
        created: new Date(),
        lastModified: new Date(),
        usage: 0,
        effectiveness: 8.2
      }
    });

    // SaaS Growth Team Dashboard Template
    this.layoutTemplates.set('saas-growth', {
      id: 'saas-growth',
      name: 'SaaS Growth Dashboard',
      description: 'Growth metrics and A/B testing focus for SaaS growth teams',
      industry: 'saas',
      businessModel: 'b2b',
      userRole: 'growth',
      isTemplate: true,
      isDefault: false,
      widgets: [
        this.widgetLibrary.get('conversion-rate-chart')!,
        this.widgetLibrary.get('ab-test-results')!,
        this.widgetLibrary.get('customer-acquisition')!,
        this.widgetLibrary.get('mrr-kpi')!,
        this.widgetLibrary.get('churn-analysis')!,
        this.widgetLibrary.get('alerts-notifications')!,
        this.widgetLibrary.get('quick-actions')!
      ],
      layout: [
        { widgetId: 'ab-test-results', x: 0, y: 0, width: 8, height: 4 },
        { widgetId: 'conversion-rate-chart', x: 8, y: 0, width: 4, height: 4 },
        { widgetId: 'customer-acquisition', x: 0, y: 4, width: 6, height: 3 },
        { widgetId: 'mrr-kpi', x: 6, y: 4, width: 3, height: 2 },
        { widgetId: 'churn-analysis', x: 0, y: 7, width: 9, height: 3 },
        { widgetId: 'alerts-notifications', x: 9, y: 6, width: 3, height: 2 },
        { widgetId: 'quick-actions', x: 9, y: 8, width: 3, height: 2 }
      ],
      metadata: {
        created: new Date(),
        lastModified: new Date(),
        usage: 0,
        effectiveness: 8.7
      }
    });
  }

  /**
   * Get layout template recommendations based on industry and user role
   */
  getLayoutRecommendations(industry: string): LayoutGrid[] {
    // Get all templates that match the industry
    const recommendations: LayoutGrid[] = [];

    for (const template of this.layoutTemplates.values()) {
      if (template.industry === industry && template.isTemplate) {
        recommendations.push(template);
      }
    }

    // Sort by effectiveness score (descending)
    recommendations.sort((a, b) => b.metadata.effectiveness - a.metadata.effectiveness);

    return recommendations;
  }

  /**
   * Generate custom layout based on industry metrics and user preferences
   */
  generateCustomLayout(
    industry: string,
    businessModel?: string,
    userRole?: string,
    preferences?: any
  ): LayoutGrid {
    // Get relevant widgets for industry
    const availableWidgets = this.getAvailableWidgets(industry, businessModel, userRole);

    // Limit to 8 widgets for clean layout
    const selectedWidgets = availableWidgets.slice(0, 8);

    // Generate optimal layout positions
    const layout = this.generateOptimalLayout(selectedWidgets, preferences?.layoutStyle || 'balanced');

    // Fix case sensitivity for industry names
    const industryName = industry === 'saas' ? 'SaaS' :
                        industry.charAt(0).toUpperCase() + industry.slice(1);

    return {
      id: `custom-${industry}-${Date.now()}`,
      name: `Custom ${industryName} Dashboard`,
      description: `Customized dashboard for ${industryName} ${userRole || 'user'}`,
      industry,
      businessModel,
      userRole,
      isTemplate: false,
      isDefault: false,
      widgets: selectedWidgets,
      layout,
      metadata: {
        created: new Date(),
        lastModified: new Date(),
        usage: 0,
        effectiveness: 8.0
      }
    };
  }

  /**
   * Generate optimal widget layout positions
   */
  private generateOptimalLayout(
    widgets: LayoutWidget[],
    style: 'compact' | 'spacious' | 'balanced' = 'balanced'
  ): LayoutPosition[] {
    const layout: LayoutPosition[] = [];
    const gridWidth = 12;
    let currentY = 0;

    // Define size mappings
    const sizeMap = {
      small: { width: 3, height: 2 },
      medium: { width: 4, height: 3 },
      large: { width: 6, height: 4 },
      xlarge: { width: 12, height: 4 }
    };

    // Adjust for layout style with default fallback
    const styleMod = {
      compact: { widthMod: 0.8, heightMod: 0.8 },
      spacious: { widthMod: 1.2, heightMod: 1.2 },
      balanced: { widthMod: 1.0, heightMod: 1.0 }
    };

    // Default to balanced if style is invalid
    const validStyle = styleMod[style as keyof typeof styleMod] ? style : 'balanced';
    const modifiers = styleMod[validStyle as keyof typeof styleMod];

    let currentX = 0;
    let rowHeight = 0;

    for (const widget of widgets) {
      const baseSize = sizeMap[widget.size];
      const width = Math.floor(baseSize.width * modifiers.widthMod);
      const height = Math.floor(baseSize.height * modifiers.heightMod);

      // Check if widget fits in current row
      if (currentX + width > gridWidth) {
        currentY += rowHeight;
        currentX = 0;
        rowHeight = 0;
      }

      layout.push({
        widgetId: widget.id,
        x: currentX,
        y: currentY,
        width,
        height,
        minWidth: Math.max(2, Math.floor(width * 0.7)),
        minHeight: Math.max(2, Math.floor(height * 0.7)),
        maxWidth: Math.min(gridWidth, Math.floor(width * 1.5)),
        maxHeight: Math.floor(height * 1.5)
      });

      currentX += width;
      rowHeight = Math.max(rowHeight, height);
    }

    return layout;
  }

  /**
   * Track user behavior for layout optimization
   */
  trackUserBehavior(
    userId: string,
    industry: string,
    action: string,
    widgetId: string,
    data?: any
  ): void {
    if (!this.userBehavior.has(userId)) {
      this.userBehavior.set(userId, {
        userId,
        industry,
        interactions: [],
        preferences: {
          preferredSize: {},
          widgetPriority: {},
          layoutStyle: 'balanced'
        }
      });
    }

    const behavior = this.userBehavior.get(userId)!;
    behavior.interactions.push({
      widgetId,
      action: action as any,
      timestamp: new Date(),
      duration: data?.duration,
      value: data?.value
    });

    // Update preferences based on interactions
    this.updateUserPreferences(userId);
  }

  /**
   * Update user preferences based on behavior patterns
   */
  private updateUserPreferences(userId: string): void {
    const behavior = this.userBehavior.get(userId);
    if (!behavior) return;

    const recentInteractions = behavior.interactions.slice(-100); // Last 100 interactions
    const widgetUsage: Record<string, number> = {};

    // Calculate widget usage frequency
    for (const interaction of recentInteractions) {
      widgetUsage[interaction.widgetId] = (widgetUsage[interaction.widgetId] || 0) + 1;
    }

    // Update widget priorities based on usage
    for (const [widgetId, usage] of Object.entries(widgetUsage)) {
      behavior.preferences.widgetPriority[widgetId] = Math.min(10, usage * 0.5);
    }
  }

  /**
   * Optimize layout based on user behavior
   */
  optimizeLayout(userId: string, currentLayout: LayoutGrid): LayoutOptimizationResult {
    const behavior = this.userBehavior.get(userId);
    if (!behavior) {
      return {
        score: 8.0,
        improvements: [],
        recommendedLayout: currentLayout.layout
      };
    }

    const improvements: LayoutOptimizationResult['improvements'] = [];
    let optimizedLayout = [...currentLayout.layout];

    // Analyze widget usage patterns
    const widgetUsage: Record<string, number> = {};
    for (const interaction of behavior.interactions.slice(-50)) {
      widgetUsage[interaction.widgetId] = (widgetUsage[interaction.widgetId] || 0) + 1;
    }

    // Suggest moving frequently used widgets to top-left
    const sortedByUsage = Object.entries(widgetUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [widgetId] of sortedByUsage) {
      const currentPos = optimizedLayout.find(p => p.widgetId === widgetId);
      if (currentPos && (currentPos.x > 6 || currentPos.y > 4)) {
        improvements.push({
          type: 'move',
          widgetId,
          suggestion: 'Move frequently used widget to more prominent position',
          expectedImprovement: 15
        });
      }
    }

    // Calculate overall layout score
    const score = this.calculateLayoutScore(currentLayout, behavior);

    return {
      score,
      improvements,
      recommendedLayout: optimizedLayout
    };
  }

  /**
   * Calculate layout effectiveness score
   */
  private calculateLayoutScore(layout: LayoutGrid, behavior: UserBehaviorPattern): number {
    let score = 8.0;

    // Check widget relevance to industry
    const industryProfile = industryMetricMappingService.getIndustryProfile(layout.industry);
    if (industryProfile) {
      const relevantMetrics = industryProfile.primaryMetrics.map(m => m.id);
      const layoutMetrics = layout.widgets.filter(w =>
        relevantMetrics.some(rm => w.id.includes(rm.replace('_', '-')))
      );
      score += (layoutMetrics.length / layout.widgets.length) * 2;
    }

    // Check user engagement
    const recentInteractions = behavior.interactions.slice(-20);
    const uniqueWidgets = new Set(recentInteractions.map(i => i.widgetId));
    const engagementRate = uniqueWidgets.size / layout.widgets.length;
    score += engagementRate * 2;

    return Math.min(10, Math.max(1, score));
  }

  /**
   * Get available widgets for an industry
   */
  getAvailableWidgets(
    industry: string,
    businessModel?: string,
    userRole?: string
  ): LayoutWidget[] {
    const widgets: LayoutWidget[] = [];

    for (const widget of this.widgetLibrary.values()) {
      if (widget.industry?.includes(industry)) {
        // Check additional filters
        if (businessModel && widget.businessModel && !widget.businessModel.includes(businessModel)) {
          continue;
        }
        if (userRole && widget.userRole && !widget.userRole.includes(userRole) && !widget.userRole.includes('all')) {
          continue;
        }
        widgets.push(widget);
      }
    }

    return widgets.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Save custom layout
   */
  saveLayout(layout: LayoutGrid): void {
    this.layoutTemplates.set(layout.id, {
      ...layout,
    });
  }

  /**
   * Get all layout templates
   */
  getAllTemplates(): LayoutGrid[] {
    return Array.from(this.layoutTemplates.values())
      .filter(template => template.isTemplate);
  }
}

// Export singleton instance
export const adaptiveLayoutEngine = new AdaptiveLayoutEngine();
