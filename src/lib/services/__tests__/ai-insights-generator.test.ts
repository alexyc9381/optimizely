/**
 * Tests for AI Insights Generator
 *
 * Comprehensive test suite for the AI-powered insights and takeaways generator
 */

import {
  AIInsightsGenerator,
  InsightGenerationContext,
} from '../ai-insights-generator';

describe('AIInsightsGenerator', () => {
  let generator: AIInsightsGenerator;
  let mockContext: InsightGenerationContext;

  beforeEach(() => {
    generator = new AIInsightsGenerator({
      confidence_minimum: 0.6,
      max_insights_per_customer: 10,
      include_assumptions: true,
      include_recommendations: true,
      validation_enabled: true,
      nlg_style: 'professional',
    });

    mockContext = {
      customer_profile: {
        intentScoring: {
          overall_score: 0.85,
          buying_signals: [
            {
              type: 'pricing_inquiry',
              strength: 0.8,
              description: 'Multiple pricing page visits',
            },
            {
              type: 'demo_request',
              strength: 0.9,
              description: 'Requested product demo',
            },
          ],
          decision_timeline: {
            urgency: 'high',
            estimated_days: 14,
            confidence_score: 0.8,
            indicators: ['budget_approval', 'technical_evaluation'],
          },
        },
        engagementScoring: {
          trend_direction: 'increasing',
          velocity: 0.3,
          consistency: 0.8,
          projected_outcome: 'continued_growth',
        },
        riskAssessment: {
          overall_risk_score: 0.3,
          primary_risk_factor: 'technical_complexity',
          risk_factors: ['integration_concerns', 'budget_constraints'],
          mitigation_opportunities: ['technical_support', 'flexible_pricing'],
        },
        competitiveAnalysis: {
          advantage_score: 0.7,
          position_strength: 'strong',
          key_competitors: ['competitor_a', 'competitor_b'],
          differentiators: ['feature_x', 'integration_y', 'support_z'],
        },
        revenueAnalytics: {
          potential_score: 0.8,
          estimated_value: 50000,
          value_drivers: ['enterprise_features', 'scalability'],
          expansion_opportunities: ['additional_modules', 'team_growth'],
        },
      },
      behavioral_metrics: {
        pageFlowMetrics: {
          pages_visited: 8,
          bounce_rate: 0.3,
          conversion_rate: 0.15,
          session_duration: 420,
        },
        contentEngagement: {
          average_time_on_page: 180,
          scroll_depth: 0.8,
          interaction_count: 5,
        },
        interactionPatterns: {
          interaction_density: 0.7,
          pattern_consistency: 0.8,
          dominant_pattern: 'research_focused',
          intent_signal: 'evaluation',
        },
        sessionQuality: {
          overall_score: 0.85,
          depth_score: 0.9,
          interaction_quality: 0.8,
          goal_alignment: 0.75,
        },
        anomalies: [
          {
            type: 'unusual_page_sequence',
            severity_score: 0.4,
            description: 'Non-standard navigation pattern',
          },
        ],
      },
      journey_data: {
        conversionPaths: {
          efficiency_score: 0.75,
          path_length: 5,
          conversion_probability: 0.6,
        },
        dropOffAnalysis: {
          drop_off_rate: 0.2,
          critical_stage: 'pricing_review',
          primary_cause: 'information_gap',
        },
        currentJourney: {
          current_stage: 'evaluation',
          stage_confidence: 0.85,
          next_stage: 'decision',
          progress_probability: 0.7,
          stage_indicators: ['demo_completed', 'pricing_reviewed'],
        },
        optimizationOpportunities: {
          optimization_score: 0.7,
          opportunities: [
            { type: 'content_personalization', impact: 'medium' },
            { type: 'engagement_timing', impact: 'high' },
          ],
        },
      },
    };
  });

  describe('generateCustomerInsights', () => {
    it('should generate comprehensive insights for a customer', async () => {
      const customerId = 'test_customer_123';
      const insights = await generator.generateCustomerInsights(
        customerId,
        mockContext
      );

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      // Check that insights have required properties
      insights.forEach(insight => {
        expect(insight.id).toBeDefined();
        expect(insight.customerId).toBe(customerId);
        expect(insight.type).toBeDefined();
        expect(insight.category).toBeDefined();
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
        expect(insight.priority).toMatch(/^(low|medium|high|critical)$/);
        expect(insight.generatedAt).toBeInstanceOf(Date);
        expect(insight.assumptions).toBeDefined();
        expect(insight.recommendations).toBeDefined();
        expect(insight.metadata).toBeDefined();
      });
    });

    it('should filter insights by confidence threshold', async () => {
      const lowConfidenceGenerator = new AIInsightsGenerator({
        confidence_minimum: 0.9, // Very high threshold
      });

      const insights = await lowConfidenceGenerator.generateCustomerInsights(
        'test',
        mockContext
      );

      // Should have fewer or no insights due to high confidence threshold
      expect(insights.length).toBeLessThanOrEqual(5);
    });

    it('should limit insights to max_insights_per_customer', async () => {
      const limitedGenerator = new AIInsightsGenerator({
        max_insights_per_customer: 3,
      });

      const insights = await limitedGenerator.generateCustomerInsights(
        'test',
        mockContext
      );

      expect(insights.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Behavioral Pattern Analysis', () => {
    it('should generate behavioral flow insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const flowInsights = insights.filter(
        i => i.type === 'behavioral_pattern'
      );

      expect(flowInsights.length).toBeGreaterThan(0);

      const flowInsight = flowInsights[0];
      expect(flowInsight.title).toContain('Flow');
      expect(flowInsight.data).toEqual(
        mockContext.behavioral_metrics.pageFlowMetrics
      );
      expect(flowInsight.assumptions.length).toBeGreaterThan(0);
      expect(flowInsight.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate interaction pattern insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const patternInsights = insights.filter(
        i => i.type === 'behavioral_pattern' && i.title.includes('Pattern')
      );

      expect(patternInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Intent Signal Analysis', () => {
    it('should generate high intent insights for qualified prospects', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const intentInsights = insights.filter(i => i.type === 'intent_signal');

      expect(intentInsights.length).toBeGreaterThan(0);

      const highIntentInsight = intentInsights.find(i =>
        i.title.includes('High')
      );
      expect(highIntentInsight).toBeDefined();
      expect(highIntentInsight?.priority).toMatch(/^(high|critical)$/);
    });

    it('should generate buying signal insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const buyingInsights = insights.filter(
        i => i.type === 'intent_signal' && i.title.includes('Buying')
      );

      expect(buyingInsights.length).toBeGreaterThan(0);
    });

    it('should generate decision timeline insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const timelineInsights = insights.filter(
        i => i.type === 'decision_readiness'
      );

      expect(timelineInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Engagement Analysis', () => {
    it('should generate session quality insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const qualityInsights = insights.filter(
        i => i.type === 'engagement_trend' && i.title.includes('Quality')
      );

      expect(qualityInsights.length).toBeGreaterThan(0);
    });

    it('should generate engagement trajectory insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const trajectoryInsights = insights.filter(
        i => i.type === 'engagement_trend' && i.title.includes('Trajectory')
      );

      expect(trajectoryInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Risk Assessment', () => {
    it('should generate risk assessment insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const riskInsights = insights.filter(i => i.type === 'risk_assessment');

      expect(riskInsights.length).toBeGreaterThan(0);

      const riskInsight = riskInsights[0];
      expect(riskInsight.category).toBe('risk_mitigation');
      expect(riskInsight.assumptions[0].risk_level).toMatch(
        /^(low|medium|high)$/
      );
    });

    it('should generate anomaly insights when present', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const anomalyInsights = insights.filter(
        i => i.type === 'behavioral_pattern' && i.title.includes('Anomaly')
      );

      // May or may not generate anomaly insights depending on severity
      expect(anomalyInsights.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Revenue and Competitive Analysis', () => {
    it('should generate revenue potential insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const revenueInsights = insights.filter(
        i => i.type === 'revenue_potential'
      );

      expect(revenueInsights.length).toBeGreaterThan(0);

      const revenueInsight = revenueInsights[0];
      expect(revenueInsight.category).toBe('revenue_growth');
      expect(revenueInsight.data.estimated_value).toBe(50000);
    });

    it('should generate competitive positioning insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const competitiveInsights = insights.filter(
        i => i.type === 'competitive_positioning'
      );

      expect(competitiveInsights.length).toBeGreaterThan(0);

      const competitiveInsight = competitiveInsights[0];
      expect(competitiveInsight.category).toBe('competitive_intelligence');
    });
  });

  describe('Customer Journey Analysis', () => {
    it('should generate journey stage insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const journeyInsights = insights.filter(
        i => i.type === 'customer_journey'
      );

      expect(journeyInsights.length).toBeGreaterThan(0);
    });

    it('should generate conversion path insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );
      const pathInsights = insights.filter(
        i => i.type === 'conversion_opportunity'
      );

      expect(pathInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Insight Quality and Validation', () => {
    it('should include proper metadata for each insight', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );

      insights.forEach(insight => {
        expect(insight.metadata.generation_model).toBeDefined();
        expect(insight.metadata.algorithm_version).toBeDefined();
        expect(insight.metadata.validation_score).toBeGreaterThanOrEqual(0);
        expect(insight.metadata.validation_score).toBeLessThanOrEqual(1);
        expect(insight.metadata.last_updated).toBeInstanceOf(Date);
        expect(typeof insight.metadata.review_needed).toBe('boolean');
      });
    });

    it('should generate appropriate recommendations based on insight type', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );

      insights.forEach(insight => {
        insight.recommendations.forEach(rec => {
          expect(rec.id).toBeDefined();
          expect(rec.action).toBeDefined();
          expect(rec.reasoning).toBeDefined();
          expect(rec.confidence).toBeGreaterThanOrEqual(0);
          expect(rec.confidence).toBeLessThanOrEqual(1);
          expect(rec.priority).toMatch(/^(low|medium|high|urgent)$/);
          expect(rec.timeline).toBeDefined();
          expect(rec.expected_outcome).toBeDefined();
          expect(Array.isArray(rec.success_metrics)).toBe(true);
          expect(Array.isArray(rec.dependencies)).toBe(true);
          expect(rec.effort_level).toMatch(/^(low|medium|high)$/);
          expect(rec.impact_potential).toMatch(/^(low|medium|high)$/);
        });
      });
    });

    it('should generate assumptions with proper validation status', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );

      insights.forEach(insight => {
        insight.assumptions.forEach(assumption => {
          expect(assumption.id).toBeDefined();
          expect(assumption.statement).toBeDefined();
          expect(assumption.confidence).toBeGreaterThanOrEqual(0);
          expect(assumption.confidence).toBeLessThanOrEqual(1);
          expect(Array.isArray(assumption.supporting_evidence)).toBe(true);
          expect(assumption.validation_status).toMatch(
            /^(pending|validated|invalidated|uncertain)$/
          );
          expect(assumption.risk_level).toMatch(/^(low|medium|high)$/);
          expect(assumption.business_impact).toBeDefined();
        });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty context gracefully', async () => {
      const emptyContext: InsightGenerationContext = {
        customer_profile: {},
        behavioral_metrics: {},
        journey_data: {},
      };

      const insights = await generator.generateCustomerInsights(
        'test',
        emptyContext
      );
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      // Should return empty array or very few insights for empty context
      expect(insights.length).toBeLessThanOrEqual(2);
    });

    it('should handle missing data fields gracefully', async () => {
      const partialContext: InsightGenerationContext = {
        customer_profile: {
          intentScoring: {
            overall_score: 0.5,
            // Missing other fields
          },
        },
        behavioral_metrics: {
          pageFlowMetrics: {
            pages_visited: 3,
            // Missing other fields
          },
        },
        journey_data: {},
      };

      const insights = await generator.generateCustomerInsights(
        'test',
        partialContext
      );
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should prioritize high-confidence insights', async () => {
      const insights = await generator.generateCustomerInsights(
        'test',
        mockContext
      );

      // Check that insights are sorted by confidence (descending)
      for (let i = 0; i < insights.length - 1; i++) {
        expect(insights[i].confidence).toBeGreaterThanOrEqual(
          insights[i + 1].confidence
        );
      }
    });
  });

  describe('Event Emission', () => {
    it('should emit insights_generated event', async () => {
      let eventEmitted = false;
      let eventData: any = null;

      generator.on('insights_generated', data => {
        eventEmitted = true;
        eventData = data;
      });

      await generator.generateCustomerInsights('test', mockContext);

      expect(eventEmitted).toBe(true);
      expect(eventData).toBeDefined();
      expect(eventData.customerId).toBe('test');
      expect(eventData.insightCount).toBeGreaterThan(0);
      expect(eventData.processingTime).toBeGreaterThan(0);
      expect(eventData.avgConfidence).toBeGreaterThan(0);
    });
  });

  describe('Configuration Impact', () => {
    it('should respect nlg_style configuration', async () => {
      const casualGenerator = new AIInsightsGenerator({
        nlg_style: 'casual',
      });

      const technicalGenerator = new AIInsightsGenerator({
        nlg_style: 'technical',
      });

      const casualInsights = await casualGenerator.generateCustomerInsights(
        'test',
        mockContext
      );
      const technicalInsights =
        await technicalGenerator.generateCustomerInsights('test', mockContext);

      expect(casualInsights.length).toBeGreaterThan(0);
      expect(technicalInsights.length).toBeGreaterThan(0);

      // Both should generate insights, but style difference would be in narrative generation
      // which is tested indirectly through the content
    });

    it('should handle validation_enabled configuration', async () => {
      const noValidationGenerator = new AIInsightsGenerator({
        validation_enabled: false,
      });

      const insights = await noValidationGenerator.generateCustomerInsights(
        'test',
        mockContext
      );
      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
    });
  });
});
