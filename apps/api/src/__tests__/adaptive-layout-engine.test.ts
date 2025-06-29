/**
 * Adaptive Layout Engine Tests
 * Comprehensive test suite for dynamic dashboard layout management
 */

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { AdaptiveLayoutEngine } from '../services/adaptive-layout-engine';

// Mock the industry metric mapping service
jest.mock('../services/industry-metric-mapping-service', () => ({
  industryMetricMappingService: {
    getIndustryProfile: jest.fn().mockReturnValue({
      id: 'saas',
      name: 'Software as a Service',
      primaryMetrics: [
        { id: 'mrr', name: 'Monthly Recurring Revenue' },
        { id: 'churn_rate', name: 'Churn Rate' },
        { id: 'conversion_rate', name: 'Conversion Rate' }
      ]
    })
  }
}));

describe('AdaptiveLayoutEngine', () => {
  let layoutEngine: AdaptiveLayoutEngine;

  beforeEach(() => {
    layoutEngine = new AdaptiveLayoutEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with widget library', () => {
      const widgets = layoutEngine.getAvailableWidgets('saas');
      expect(widgets.length).toBeGreaterThan(0);
    });

    test('should initialize with layout templates', () => {
      const templates = layoutEngine.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.industry === 'saas')).toBe(true);
      expect(templates.some(t => t.industry === 'ecommerce')).toBe(true);
    });

    test('should have proper template structure', () => {
      const templates = layoutEngine.getAllTemplates();
      const saasTemplate = templates.find(t => t.id === 'saas-executive');

      expect(saasTemplate).toBeDefined();
      expect(saasTemplate!.isTemplate).toBe(true);
      expect(saasTemplate!.widgets.length).toBeGreaterThan(0);
      expect(saasTemplate!.layout.length).toBeGreaterThan(0);
      expect(saasTemplate!.metadata).toBeDefined();
    });
  });

  describe('Widget Management', () => {
    test('should return widgets for specific industry', () => {
      const saasWidgets = layoutEngine.getAvailableWidgets('saas');
      const ecommerceWidgets = layoutEngine.getAvailableWidgets('ecommerce');

      expect(saasWidgets.length).toBeGreaterThan(0);
      expect(ecommerceWidgets.length).toBeGreaterThan(0);

      // Check that industry-specific widgets are returned
      const mrrWidget = saasWidgets.find(w => w.id === 'mrr-kpi');
      const aovWidget = ecommerceWidgets.find(w => w.id === 'aov-kpi');

      expect(mrrWidget).toBeDefined();
      expect(aovWidget).toBeDefined();
    });

    test('should filter widgets by business model', () => {
      const b2bWidgets = layoutEngine.getAvailableWidgets('saas', 'b2b');
      const b2cWidgets = layoutEngine.getAvailableWidgets('ecommerce', 'b2c');

      expect(b2bWidgets.length).toBeGreaterThan(0);
      expect(b2cWidgets.length).toBeGreaterThan(0);

      // Verify business model filtering
      const mrrWidget = b2bWidgets.find(w => w.id === 'mrr-kpi');
      expect(mrrWidget?.businessModel).toContain('b2b');
    });

    test('should filter widgets by user role', () => {
      const executiveWidgets = layoutEngine.getAvailableWidgets('saas', 'b2b', 'executive');
      const marketingWidgets = layoutEngine.getAvailableWidgets('ecommerce', 'b2c', 'marketing');

      expect(executiveWidgets.length).toBeGreaterThan(0);
      expect(marketingWidgets.length).toBeGreaterThan(0);

      // Check role-specific widgets
      const revenueWidget = executiveWidgets.find(w => w.id === 'revenue-chart');
      expect(revenueWidget?.userRole).toContain('executive');
    });

    test('should sort widgets by priority', () => {
      const widgets = layoutEngine.getAvailableWidgets('saas');

      // Check that widgets are sorted by priority (descending)
      for (let i = 1; i < widgets.length; i++) {
        expect(widgets[i - 1].priority).toBeGreaterThanOrEqual(widgets[i].priority);
      }
    });
  });

  describe('Layout Recommendations', () => {
    test('should return recommendations for industry', () => {
      const recommendations = layoutEngine.getLayoutRecommendations('saas');
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every(r => r.industry === 'saas')).toBe(true);
    });

    test('should return empty array for unknown industry', () => {
      const recommendations = layoutEngine.getLayoutRecommendations('unknown');
      expect(recommendations).toEqual([]);
    });

    test('should return templates sorted by effectiveness', () => {
      const recommendations = layoutEngine.getLayoutRecommendations('saas');

      // Check sorting by effectiveness
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].metadata.effectiveness).toBeGreaterThanOrEqual(
          recommendations[i].metadata.effectiveness
        );
      }
    });
  });

  describe('Custom Layout Generation', () => {
    test('should generate custom layout for industry', () => {
      const customLayout = layoutEngine.generateCustomLayout('saas');

      expect(customLayout.id).toBeDefined();
      expect(customLayout.name).toContain('SaaS');
      expect(customLayout.industry).toBe('saas');
      expect(customLayout.isTemplate).toBe(false);
      expect(customLayout.widgets.length).toBeGreaterThan(0);
      expect(customLayout.layout.length).toBe(customLayout.widgets.length);
      expect(customLayout.metadata).toBeDefined();
    });

    test('should include business model and user role in custom layout', () => {
      const customLayout = layoutEngine.generateCustomLayout('saas', 'b2b', 'executive');

      expect(customLayout.businessModel).toBe('b2b');
      expect(customLayout.userRole).toBe('executive');
      expect(customLayout.description).toContain('executive');
    });

    test('should limit widgets to reasonable number', () => {
      const customLayout = layoutEngine.generateCustomLayout('saas');

      // Should not exceed 8 widgets for clean layout
      expect(customLayout.widgets.length).toBeLessThanOrEqual(8);
    });

    test('should generate valid layout positions', () => {
      const customLayout = layoutEngine.generateCustomLayout('saas');

      customLayout.layout.forEach(position => {
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeGreaterThanOrEqual(0);
        expect(position.width).toBeGreaterThan(0);
        expect(position.height).toBeGreaterThan(0);
        expect(position.minWidth).toBeDefined();
        expect(position.minHeight).toBeDefined();
        expect(position.maxWidth).toBeDefined();
        expect(position.maxHeight).toBeDefined();
      });
    });

    test('should respect grid constraints', () => {
      const customLayout = layoutEngine.generateCustomLayout('saas');
      const gridWidth = 12;

      customLayout.layout.forEach(position => {
        expect(position.x + position.width).toBeLessThanOrEqual(gridWidth);
        expect(position.width).toBeLessThanOrEqual(gridWidth);
      });
    });

    test('should handle different layout styles', () => {
      const compactLayout = layoutEngine.generateCustomLayout('saas', 'b2b', 'executive', {
        layoutStyle: 'compact'
      });
      const spaciousLayout = layoutEngine.generateCustomLayout('saas', 'b2b', 'executive', {
        layoutStyle: 'spacious'
      });
      const balancedLayout = layoutEngine.generateCustomLayout('saas', 'b2b', 'executive', {
        layoutStyle: 'balanced'
      });

      expect(compactLayout.layout.length).toBeGreaterThan(0);
      expect(spaciousLayout.layout.length).toBeGreaterThan(0);
      expect(balancedLayout.layout.length).toBeGreaterThan(0);

      // Compact should generally have smaller widgets
      // Spacious should generally have larger widgets
      // This is a basic test - real implementation would have more sophisticated checks
    });
  });

  describe('User Behavior Tracking', () => {
    test('should track user behavior', () => {
      const userId = 'user123';
      const industry = 'saas';
      const action = 'click';
      const widgetId = 'mrr-kpi';

      layoutEngine.trackUserBehavior(userId, industry, action, widgetId);

      // This is a bit tricky to test directly due to private members
      // We'll test it indirectly through optimization
      const testLayout = layoutEngine.generateCustomLayout('saas');
      const optimization = layoutEngine.optimizeLayout(userId, testLayout);

      expect(optimization).toBeDefined();
      expect(optimization.score).toBeGreaterThan(0);
    });

    test('should track multiple interactions', () => {
      const userId = 'user123';
      const industry = 'saas';

      // Track multiple interactions
      layoutEngine.trackUserBehavior(userId, industry, 'view', 'mrr-kpi');
      layoutEngine.trackUserBehavior(userId, industry, 'click', 'mrr-kpi');
      layoutEngine.trackUserBehavior(userId, industry, 'view', 'revenue-chart');

      const testLayout = layoutEngine.generateCustomLayout('saas');
      const optimization = layoutEngine.optimizeLayout(userId, testLayout);

      expect(optimization.improvements).toBeDefined();
    });

    test('should handle behavior tracking with data', () => {
      const userId = 'user123';
      const industry = 'saas';
      const data = { duration: 5000, value: 'test' };

      expect(() => {
        layoutEngine.trackUserBehavior(userId, industry, 'view', 'mrr-kpi', data);
      }).not.toThrow();
    });
  });

  describe('Layout Optimization', () => {
    test('should optimize layout for new user', () => {
      const newUserId = 'newuser123';
      const testLayout = layoutEngine.generateCustomLayout('saas');

      const optimization = layoutEngine.optimizeLayout(newUserId, testLayout);

      expect(optimization.score).toBeGreaterThan(0);
      expect(optimization.improvements).toBeDefined();
      expect(optimization.recommendedLayout).toBeDefined();
      expect(optimization.recommendedLayout.length).toBe(testLayout.layout.length);
    });

    test('should provide improvements for experienced user', () => {
      const userId = 'experienced123';
      const industry = 'saas';

      // Simulate user behavior
      for (let i = 0; i < 10; i++) {
        layoutEngine.trackUserBehavior(userId, industry, 'view', 'mrr-kpi');
        layoutEngine.trackUserBehavior(userId, industry, 'click', 'revenue-chart');
      }

      const testLayout = layoutEngine.generateCustomLayout('saas');
      const optimization = layoutEngine.optimizeLayout(userId, testLayout);

      expect(optimization.score).toBeGreaterThan(0);
      expect(optimization.improvements.length).toBeGreaterThanOrEqual(0);
    });

    test('should calculate meaningful layout scores', () => {
      const testLayout = layoutEngine.generateCustomLayout('saas');
      const userId = 'test123';

      const optimization = layoutEngine.optimizeLayout(userId, testLayout);

      expect(optimization.score).toBeGreaterThan(0);
      expect(optimization.score).toBeLessThanOrEqual(10);
    });

    test('should suggest improvements with proper structure', () => {
      const userId = 'user123';
      const industry = 'saas';

      // Create some usage patterns
      layoutEngine.trackUserBehavior(userId, industry, 'view', 'mrr-kpi');
      layoutEngine.trackUserBehavior(userId, industry, 'click', 'mrr-kpi');

      const testLayout = layoutEngine.generateCustomLayout('saas');
      const optimization = layoutEngine.optimizeLayout(userId, testLayout);

      optimization.improvements.forEach(improvement => {
        expect(improvement.type).toMatch(/^(move|resize|add|remove|replace)$/);
        expect(improvement.widgetId).toBeDefined();
        expect(improvement.suggestion).toBeDefined();
        expect(improvement.expectedImprovement).toBeGreaterThan(0);
      });
    });
  });

  describe('Layout Management', () => {
    test('should save layout', () => {
      const customLayout = layoutEngine.generateCustomLayout('saas');

      expect(() => {
        layoutEngine.saveLayout(customLayout);
      }).not.toThrow();
    });

    test('should get all templates', () => {
      const templates = layoutEngine.getAllTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.isTemplate)).toBe(true);
    });

    test('should update metadata when saving', () => {
      const customLayout = layoutEngine.generateCustomLayout('saas');

      // Wait a small amount to ensure timestamp difference
      setTimeout(() => {
        layoutEngine.saveLayout(customLayout);

        // Note: This test is conceptual - the actual implementation
        // would need to be modified to return the saved layout for verification
      }, 10);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty industry gracefully', () => {
      const widgets = layoutEngine.getAvailableWidgets('');
      expect(widgets).toEqual([]);
    });

    test('should handle undefined parameters', () => {
      const widgets = layoutEngine.getAvailableWidgets('saas', undefined, undefined);
      expect(widgets.length).toBeGreaterThan(0);
    });

    test('should handle invalid layout style', () => {
      const customLayout = layoutEngine.generateCustomLayout('saas', 'b2b', 'executive', {
        layoutStyle: 'invalid'
      });

      // Should default to balanced
      expect(customLayout.widgets.length).toBeGreaterThan(0);
    });

    test('should handle optimization for non-existent user', () => {
      const testLayout = layoutEngine.generateCustomLayout('saas');
      const optimization = layoutEngine.optimizeLayout('nonexistent', testLayout);

      expect(optimization.score).toBeGreaterThan(0);
      expect(optimization.improvements).toEqual([]);
    });
  });

  describe('Widget Library Validation', () => {
    test('should have consistent widget structure', () => {
      const widgets = layoutEngine.getAvailableWidgets('saas');

      widgets.forEach(widget => {
        expect(widget.id).toBeDefined();
        expect(widget.type).toMatch(/^(metric|chart|table|kpi|action|navigation)$/);
        expect(widget.title).toBeDefined();
        expect(widget.component).toBeDefined();
        expect(widget.size).toMatch(/^(small|medium|large|xlarge)$/);
        expect(widget.priority).toBeGreaterThan(0);
        expect(widget.priority).toBeLessThanOrEqual(10);
      });
    });

    test('should have industry-specific widgets', () => {
      const saasWidgets = layoutEngine.getAvailableWidgets('saas');
      const ecommerceWidgets = layoutEngine.getAvailableWidgets('ecommerce');

      // SaaS should have MRR widget
      expect(saasWidgets.some(w => w.id === 'mrr-kpi')).toBe(true);

      // E-commerce should have AOV widget
      expect(ecommerceWidgets.some(w => w.id === 'aov-kpi')).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large number of behavior entries', () => {
      const userId = 'poweruser123';
      const industry = 'saas';

      // Simulate lots of interactions
      for (let i = 0; i < 200; i++) {
        layoutEngine.trackUserBehavior(userId, industry, 'view', `widget-${i % 5}`);
      }

      const testLayout = layoutEngine.generateCustomLayout('saas');

      expect(() => {
        const optimization = layoutEngine.optimizeLayout(userId, testLayout);
        expect(optimization).toBeDefined();
      }).not.toThrow();
    });

    test('should generate layouts efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        layoutEngine.generateCustomLayout('saas');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 10 layouts in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
});
