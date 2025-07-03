import React, { useEffect, useState } from 'react';
import { AdvancedAnalyticsEngine, AnalyticsInterface } from '../index';

// Sample business data for demonstration
const sampleBusinessData = {
  // Sales performance data
  monthlySales: [
    150000, 165000, 180000, 172000, 195000, 210000, 225000, 240000, 255000,
    270000, 285000, 300000,
  ],

  // Marketing metrics
  advertisingSpend: [
    15000, 16500, 18000, 17200, 19500, 21000, 22500, 24000, 25500, 27000, 28500,
    30000,
  ],

  // Customer engagement
  websiteTraffic: [
    45000, 48000, 52000, 49000, 55000, 58000, 61000, 64000, 67000, 70000, 73000,
    76000,
  ],

  // Conversion metrics
  conversionRate: [2.3, 2.5, 2.8, 2.4, 3.1, 3.3, 3.5, 3.8, 4.0, 4.2, 4.4, 4.6],

  // Customer satisfaction scores
  customerSatisfaction: [
    4.2, 4.3, 4.1, 4.4, 4.5, 4.6, 4.3, 4.7, 4.8, 4.6, 4.9, 5.0,
  ],

  // Support ticket volume
  supportTickets: [120, 115, 135, 128, 110, 105, 98, 92, 88, 85, 82, 78],

  // Revenue by channel
  organicRevenue: [
    60000, 66000, 72000, 68000, 78000, 84000, 90000, 96000, 102000, 108000,
    114000, 120000,
  ],

  paidRevenue: [
    45000, 49500, 54000, 51000, 58500, 63000, 67500, 72000, 76500, 81000, 85500,
    90000,
  ],

  socialRevenue: [
    25000, 27500, 30000, 28000, 32500, 35000, 37500, 40000, 42500, 45000, 47500,
    50000,
  ],

  // User engagement metrics
  avgSessionDuration: [
    4.2, 4.5, 4.8, 4.3, 5.1, 5.3, 5.5, 5.8, 6.0, 6.2, 6.4, 6.6,
  ],

  pagesPerSession: [3.1, 3.3, 3.6, 3.2, 3.8, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 5.2],

  // A/B test results
  experimentGroupA: [
    2.1, 2.3, 2.0, 2.4, 2.6, 2.2, 2.5, 2.7, 2.3, 2.8, 2.9, 2.6,
  ],

  experimentGroupB: [
    2.8, 3.1, 2.9, 3.3, 3.5, 3.2, 3.6, 3.8, 3.4, 3.9, 4.1, 3.7,
  ],

  // Seasonal trend data
  seasonalSales: [
    200000, 180000, 160000, 140000, 155000, 175000, 220000, 250000, 280000,
    260000, 240000, 320000,
  ],
};

// Advanced Analytics Example Component
export const AnalyticsExample: React.FC = () => {
  const [analyticsEngine] = useState(() =>
    AdvancedAnalyticsEngine.getInstance()
  );
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Demonstrate advanced statistical analysis
  const runAdvancedAnalysis = async () => {
    setLoading(true);

    try {
      // 1. Statistical Testing Examples
      console.log('🧪 Running Statistical Tests...');

      // A/B Test Analysis
      const abTestResult = analyticsEngine.tTest(
        sampleBusinessData.experimentGroupA,
        sampleBusinessData.experimentGroupB,
        'two-sample'
      );
      console.log('A/B Test Results:', abTestResult);

      // Monthly Sales Trend Test (one-sample against target)
      const salesTrendTest = analyticsEngine.tTest(
        sampleBusinessData.monthlySales,
        undefined,
        'one-sample',
        200000 // Target monthly sales
      );
      console.log('Sales Trend Test:', salesTrendTest);

      // 2. Correlation Analysis Examples
      console.log('📊 Running Correlation Analysis...');

      // Sales vs Advertising Correlation
      const salesAdvertisingCorr = analyticsEngine.correlationAnalysis(
        sampleBusinessData.monthlySales,
        sampleBusinessData.advertisingSpend,
        'pearson'
      );
      console.log('Sales-Advertising Correlation:', salesAdvertisingCorr);

      // Customer Satisfaction vs Support Tickets (Spearman)
      const satisfactionTicketsCorr = analyticsEngine.correlationAnalysis(
        sampleBusinessData.customerSatisfaction,
        sampleBusinessData.supportTickets,
        'spearman'
      );
      console.log('Satisfaction-Tickets Correlation:', satisfactionTicketsCorr);

      // 3. Multiple Regression Analysis
      console.log('📈 Running Regression Analysis...');

      // Predict Sales based on multiple factors
      const X = sampleBusinessData.monthlySales.map((_, i) => [
        sampleBusinessData.advertisingSpend[i],
        sampleBusinessData.websiteTraffic[i],
        sampleBusinessData.conversionRate[i],
      ]);

      const salesRegressionResult = analyticsEngine.multipleRegression(
        sampleBusinessData.monthlySales,
        X
      );
      console.log('Sales Prediction Model:', salesRegressionResult);

      // 4. Trend Analysis Examples
      console.log('📉 Running Trend Analysis...');

      // Seasonal Sales Trend
      const seasonalTrend = analyticsEngine.trendAnalysis(
        sampleBusinessData.seasonalSales
      );
      console.log('Seasonal Sales Trend:', seasonalTrend);

      // Customer Satisfaction Trend
      const satisfactionTrend = analyticsEngine.trendAnalysis(
        sampleBusinessData.customerSatisfaction
      );
      console.log('Customer Satisfaction Trend:', satisfactionTrend);

      // 5. Automated Insights Generation
      console.log('🤖 Generating Automated Insights...');

      const insights = analyticsEngine.generateInsights(sampleBusinessData);
      console.log('Business Insights:', insights);

      // Compile results for display
      const analysisResults = {
        statisticalTests: [abTestResult, salesTrendTest],
        correlations: [salesAdvertisingCorr, satisfactionTicketsCorr],
        regressions: [salesRegressionResult],
        trends: {
          seasonalSales: seasonalTrend,
          customerSatisfaction: satisfactionTrend,
        },
        insights: insights,
        summary: {
          totalTests: 2,
          totalCorrelations: 2,
          significantCorrelations: [
            salesAdvertisingCorr,
            satisfactionTicketsCorr,
          ].filter(c => c.isSignificant).length,
          highPriorityInsights: insights.filter(i => i.significance === 'high')
            .length,
          regressionRSquared: salesRegressionResult.rSquared,
        },
      };

      setResults(analysisResults);
      console.log('✅ Advanced Analysis Complete!', analysisResults);
    } catch (error) {
      console.error('❌ Analysis Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run analysis on component mount
  useEffect(() => {
    runAdvancedAnalysis();
  }, []);

  return (
    <div className='analytics-example'>
      <div className='example-header'>
        <h1>🧠 Advanced Analytics & Statistical Tools Demo</h1>
        <p>
          This example demonstrates the comprehensive statistical analysis
          capabilities of the Advanced Analytics Engine using real business data
          scenarios.
        </p>

        <div className='example-stats'>
          {results && (
            <div className='stats-grid'>
              <div className='stat-card'>
                <h3>Statistical Tests</h3>
                <div className='stat-value'>{results.summary.totalTests}</div>
                <div className='stat-label'>Tests Performed</div>
              </div>

              <div className='stat-card'>
                <h3>Correlations</h3>
                <div className='stat-value'>
                  {results.summary.significantCorrelations}/
                  {results.summary.totalCorrelations}
                </div>
                <div className='stat-label'>Significant Correlations</div>
              </div>

              <div className='stat-card'>
                <h3>Model Accuracy</h3>
                <div className='stat-value'>
                  {(results.summary.regressionRSquared * 100).toFixed(1)}%
                </div>
                <div className='stat-label'>R-Squared Value</div>
              </div>

              <div className='stat-card'>
                <h3>Key Insights</h3>
                <div className='stat-value'>
                  {results.summary.highPriorityInsights}
                </div>
                <div className='stat-label'>High Priority</div>
              </div>
            </div>
          )}
        </div>

        <div className='example-actions'>
          <button
            onClick={runAdvancedAnalysis}
            disabled={loading}
            className='btn btn-primary'
          >
            {loading ? 'Analyzing...' : 'Run Advanced Analysis'}
          </button>

          <button
            onClick={() => console.log('Sample Data:', sampleBusinessData)}
            className='btn btn-outline'
          >
            View Sample Data
          </button>
        </div>
      </div>

      <div className='example-content'>
        <h2>Interactive Analytics Interface</h2>
        <p>
          The interface below provides interactive access to all advanced
          statistical tools. The sample business data includes sales, marketing,
          and customer metrics from a typical SaaS business.
        </p>

        <AnalyticsInterface
          data={sampleBusinessData}
          onResultChange={newResults => {
            console.log('Analytics Results Updated:', newResults);
          }}
          config={{
            significanceLevel: 0.05,
            confidenceLevel: 0.95,
          }}
        />
      </div>

      {results && (
        <div className='analysis-summary'>
          <h2>Analysis Summary</h2>

          <div className='summary-section'>
            <h3>🧪 Statistical Test Results</h3>
            <ul>
              <li>
                <strong>A/B Test Analysis:</strong> Group B shows{' '}
                {results.statisticalTests[0].isSignificant
                  ? 'statistically significant'
                  : 'no significant'}{' '}
                improvement over Group A (p ={' '}
                {results.statisticalTests[0].pValue.toFixed(4)})
              </li>
              <li>
                <strong>Sales Target Analysis:</strong> Monthly sales{' '}
                {results.statisticalTests[1].isSignificant
                  ? 'significantly exceed'
                  : 'do not significantly differ from'}{' '}
                the $200K target (t ={' '}
                {results.statisticalTests[1].statistic.toFixed(2)})
              </li>
            </ul>
          </div>

          <div className='summary-section'>
            <h3>📊 Key Correlations Discovered</h3>
            <ul>
              <li>
                <strong>Sales ↔ Advertising:</strong>{' '}
                {results.correlations[0].strength.replace('_', ' ')}{' '}
                {results.correlations[0].direction} correlation (r ={' '}
                {results.correlations[0].coefficient.toFixed(3)})
              </li>
              <li>
                <strong>Satisfaction ↔ Support Tickets:</strong>{' '}
                {results.correlations[1].strength.replace('_', ' ')}{' '}
                {results.correlations[1].direction} correlation (ρ ={' '}
                {results.correlations[1].coefficient.toFixed(3)})
              </li>
            </ul>
          </div>

          <div className='summary-section'>
            <h3>📈 Predictive Models</h3>
            <ul>
              <li>
                <strong>Sales Prediction Model:</strong> R² ={' '}
                {(results.regressions[0].rSquared * 100).toFixed(1)}% -{' '}
                {results.regressions[0].isSignificant
                  ? 'Highly predictive'
                  : 'Needs improvement'}
              </li>
              <li>
                <strong>Model Equation:</strong>{' '}
                <code>{results.regressions[0].equation}</code>
              </li>
              {results.regressions[0].outliers.length > 0 && (
                <li>
                  <strong>Outliers Detected:</strong>{' '}
                  {results.regressions[0].outliers.length} data points require
                  investigation
                </li>
              )}
            </ul>
          </div>

          <div className='summary-section'>
            <h3>📉 Trend Analysis</h3>
            <ul>
              <li>
                <strong>Seasonal Sales:</strong>{' '}
                {results.trends.seasonalSales.trend} trend detected with{' '}
                {results.trends.seasonalSales.anomalies.indices.length}{' '}
                anomalies
              </li>
              <li>
                <strong>Customer Satisfaction:</strong>{' '}
                {results.trends.customerSatisfaction.trend} trend (strength:{' '}
                {results.trends.customerSatisfaction.strength.toFixed(3)})
              </li>
            </ul>
          </div>

          <div className='summary-section'>
            <h3>🤖 Automated Insights</h3>
            <div className='insights-preview'>
              {results.insights
                .slice(0, 3)
                .map((insight: any, index: number) => (
                  <div
                    key={index}
                    className={`insight-preview significance-${insight.significance}`}
                  >
                    <div className='insight-title'>{insight.title}</div>
                    <div className='insight-confidence'>
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className='example-footer'>
        <h3>🔬 Technical Capabilities Demonstrated</h3>
        <div className='capabilities-grid'>
          <div className='capability'>
            <h4>Statistical Testing</h4>
            <ul>
              <li>One-sample, two-sample, and paired t-tests</li>
              <li>Chi-square goodness of fit tests</li>
              <li>Proper p-value calculations and interpretations</li>
              <li>Confidence interval estimation</li>
            </ul>
          </div>

          <div className='capability'>
            <h4>Correlation Analysis</h4>
            <ul>
              <li>Pearson, Spearman, and Kendall correlations</li>
              <li>Statistical significance testing</li>
              <li>Fisher's z-transformation for CI</li>
              <li>Strength and direction classification</li>
            </ul>
          </div>

          <div className='capability'>
            <h4>Regression Modeling</h4>
            <ul>
              <li>Simple and multiple linear regression</li>
              <li>R-squared and adjusted R-squared</li>
              <li>F-statistic significance testing</li>
              <li>Outlier detection and analysis</li>
            </ul>
          </div>

          <div className='capability'>
            <h4>Trend Analysis</h4>
            <ul>
              <li>Trend direction and strength detection</li>
              <li>Seasonality analysis via autocorrelation</li>
              <li>Change point detection</li>
              <li>Anomaly identification</li>
              <li>Forecasting with confidence intervals</li>
            </ul>
          </div>

          <div className='capability'>
            <h4>Automated Insights</h4>
            <ul>
              <li>Pattern recognition across variables</li>
              <li>Contextual interpretation generation</li>
              <li>Significance-based prioritization</li>
              <li>Actionable business recommendations</li>
            </ul>
          </div>

          <div className='capability'>
            <h4>Enterprise Features</h4>
            <ul>
              <li>Configurable significance levels</li>
              <li>Performance optimization for large datasets</li>
              <li>Robust error handling</li>
              <li>Event-driven architecture</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsExample;
