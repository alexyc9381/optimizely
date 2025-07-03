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
    <div className='analytics-example' data-oid='hri9l_o'>
      <div className='example-header' data-oid='wy-_snz'>
        <h1 data-oid='d3zk3j0'>
          🧠 Advanced Analytics & Statistical Tools Demo
        </h1>
        <p data-oid='d50yawn'>
          This example demonstrates the comprehensive statistical analysis
          capabilities of the Advanced Analytics Engine using real business data
          scenarios.
        </p>

        <div className='example-stats' data-oid='d4ltuyk'>
          {results && (
            <div className='stats-grid' data-oid='fr:6av5'>
              <div className='stat-card' data-oid='0i6_0er'>
                <h3 data-oid='wzgq4k3'>Statistical Tests</h3>
                <div className='stat-value' data-oid='b4kk77w'>
                  {results.summary.totalTests}
                </div>
                <div className='stat-label' data-oid='3:.4bpr'>
                  Tests Performed
                </div>
              </div>

              <div className='stat-card' data-oid='2n2q9jo'>
                <h3 data-oid='6fjkif-'>Correlations</h3>
                <div className='stat-value' data-oid='.ydxzli'>
                  {results.summary.significantCorrelations}/
                  {results.summary.totalCorrelations}
                </div>
                <div className='stat-label' data-oid='6.oe.vz'>
                  Significant Correlations
                </div>
              </div>

              <div className='stat-card' data-oid='g.5v-t8'>
                <h3 data-oid='g2:55-o'>Model Accuracy</h3>
                <div className='stat-value' data-oid='jft.3hv'>
                  {(results.summary.regressionRSquared * 100).toFixed(1)}%
                </div>
                <div className='stat-label' data-oid='d_et_0o'>
                  R-Squared Value
                </div>
              </div>

              <div className='stat-card' data-oid='8zao1wb'>
                <h3 data-oid='3xeg93_'>Key Insights</h3>
                <div className='stat-value' data-oid='1tlkuw0'>
                  {results.summary.highPriorityInsights}
                </div>
                <div className='stat-label' data-oid='7utoj3l'>
                  High Priority
                </div>
              </div>
            </div>
          )}
        </div>

        <div className='example-actions' data-oid='-zehsj3'>
          <button
            onClick={runAdvancedAnalysis}
            disabled={loading}
            className='btn btn-primary'
            data-oid='0mmwcsn'
          >
            {loading ? 'Analyzing...' : 'Run Advanced Analysis'}
          </button>

          <button
            onClick={() => console.log('Sample Data:', sampleBusinessData)}
            className='btn btn-outline'
            data-oid='d7tyyqs'
          >
            View Sample Data
          </button>
        </div>
      </div>

      <div className='example-content' data-oid='jba8k:9'>
        <h2 data-oid='lassonl'>Interactive Analytics Interface</h2>
        <p data-oid='17.dpky'>
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
          data-oid='9-q2.d9'
        />
      </div>

      {results && (
        <div className='analysis-summary' data-oid='gvjxb3v'>
          <h2 data-oid='9kklyzu'>Analysis Summary</h2>

          <div className='summary-section' data-oid='zd2tiw6'>
            <h3 data-oid='uevtol7'>🧪 Statistical Test Results</h3>
            <ul data-oid='u:eqkj5'>
              <li data-oid='kq3ks:_'>
                <strong data-oid='ila0nfh'>A/B Test Analysis:</strong> Group B
                shows{' '}
                {results.statisticalTests[0].isSignificant
                  ? 'statistically significant'
                  : 'no significant'}{' '}
                improvement over Group A (p ={' '}
                {results.statisticalTests[0].pValue.toFixed(4)})
              </li>
              <li data-oid=':y:2lb_'>
                <strong data-oid='wppn2.0'>Sales Target Analysis:</strong>{' '}
                Monthly sales{' '}
                {results.statisticalTests[1].isSignificant
                  ? 'significantly exceed'
                  : 'do not significantly differ from'}{' '}
                the $200K target (t ={' '}
                {results.statisticalTests[1].statistic.toFixed(2)})
              </li>
            </ul>
          </div>

          <div className='summary-section' data-oid='n6soyz1'>
            <h3 data-oid='h3fgk_c'>📊 Key Correlations Discovered</h3>
            <ul data-oid='ysoky3v'>
              <li data-oid='kbm40n6'>
                <strong data-oid='g1yr.4l'>Sales ↔ Advertising:</strong>{' '}
                {results.correlations[0].strength.replace('_', ' ')}{' '}
                {results.correlations[0].direction} correlation (r ={' '}
                {results.correlations[0].coefficient.toFixed(3)})
              </li>
              <li data-oid='bvyktnh'>
                <strong data-oid='tfikxdr'>
                  Satisfaction ↔ Support Tickets:
                </strong>{' '}
                {results.correlations[1].strength.replace('_', ' ')}{' '}
                {results.correlations[1].direction} correlation (ρ ={' '}
                {results.correlations[1].coefficient.toFixed(3)})
              </li>
            </ul>
          </div>

          <div className='summary-section' data-oid='qvle5jw'>
            <h3 data-oid='.vuw5_c'>📈 Predictive Models</h3>
            <ul data-oid='cmspkzb'>
              <li data-oid='mq5ezyi'>
                <strong data-oid='5pomq9h'>Sales Prediction Model:</strong> R² ={' '}
                {(results.regressions[0].rSquared * 100).toFixed(1)}% -{' '}
                {results.regressions[0].isSignificant
                  ? 'Highly predictive'
                  : 'Needs improvement'}
              </li>
              <li data-oid='q4n:gfy'>
                <strong data-oid='bt0_gf4'>Model Equation:</strong>{' '}
                <code data-oid='ms4o04s'>
                  {results.regressions[0].equation}
                </code>
              </li>
              {results.regressions[0].outliers.length > 0 && (
                <li data-oid='uvs:577'>
                  <strong data-oid='ydq4-u9'>Outliers Detected:</strong>{' '}
                  {results.regressions[0].outliers.length} data points require
                  investigation
                </li>
              )}
            </ul>
          </div>

          <div className='summary-section' data-oid='ueytm20'>
            <h3 data-oid='6.1_b9r'>📉 Trend Analysis</h3>
            <ul data-oid='5_f-n6o'>
              <li data-oid='mfr5uoy'>
                <strong data-oid='shqn._o'>Seasonal Sales:</strong>{' '}
                {results.trends.seasonalSales.trend} trend detected with{' '}
                {results.trends.seasonalSales.anomalies.indices.length}{' '}
                anomalies
              </li>
              <li data-oid='bb48wf5'>
                <strong data-oid='y33wht7'>Customer Satisfaction:</strong>{' '}
                {results.trends.customerSatisfaction.trend} trend (strength:{' '}
                {results.trends.customerSatisfaction.strength.toFixed(3)})
              </li>
            </ul>
          </div>

          <div className='summary-section' data-oid='83a1-e4'>
            <h3 data-oid='tnhh7bv'>🤖 Automated Insights</h3>
            <div className='insights-preview' data-oid='si:s.4c'>
              {results.insights
                .slice(0, 3)
                .map((insight: any, index: number) => (
                  <div
                    key={index}
                    className={`insight-preview significance-${insight.significance}`}
                    data-oid='r8j_u-n'
                  >
                    <div className='insight-title' data-oid='bva8d4n'>
                      {insight.title}
                    </div>
                    <div className='insight-confidence' data-oid='metu5eq'>
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className='example-footer' data-oid='jp8s_xq'>
        <h3 data-oid='u:20tyn'>🔬 Technical Capabilities Demonstrated</h3>
        <div className='capabilities-grid' data-oid='huzu1m5'>
          <div className='capability' data-oid='ov2mt8r'>
            <h4 data-oid='0fk2zmz'>Statistical Testing</h4>
            <ul data-oid='wqt-gq7'>
              <li data-oid='wu::ip7'>
                One-sample, two-sample, and paired t-tests
              </li>
              <li data-oid='2cf_jy_'>Chi-square goodness of fit tests</li>
              <li data-oid='n10zdq9'>
                Proper p-value calculations and interpretations
              </li>
              <li data-oid='fwjcl86'>Confidence interval estimation</li>
            </ul>
          </div>

          <div className='capability' data-oid='of_g5w6'>
            <h4 data-oid='u2g83_6'>Correlation Analysis</h4>
            <ul data-oid='9ks0avt'>
              <li data-oid='bnx3tll'>
                Pearson, Spearman, and Kendall correlations
              </li>
              <li data-oid='c1tms:1'>Statistical significance testing</li>
              <li data-oid='1rmi0l3'>Fisher's z-transformation for CI</li>
              <li data-oid='kz0:7cn'>Strength and direction classification</li>
            </ul>
          </div>

          <div className='capability' data-oid='j_7pevv'>
            <h4 data-oid='f:o:xrc'>Regression Modeling</h4>
            <ul data-oid='kf.a3fj'>
              <li data-oid='o-v8-ic'>Simple and multiple linear regression</li>
              <li data-oid='hd.0:5o'>R-squared and adjusted R-squared</li>
              <li data-oid='3pqvr5x'>F-statistic significance testing</li>
              <li data-oid='8ogc3u8'>Outlier detection and analysis</li>
            </ul>
          </div>

          <div className='capability' data-oid='w1anb37'>
            <h4 data-oid='m6cm0y4'>Trend Analysis</h4>
            <ul data-oid='dgj_9kj'>
              <li data-oid='3gzua3q'>Trend direction and strength detection</li>
              <li data-oid='6nqlrw5'>
                Seasonality analysis via autocorrelation
              </li>
              <li data-oid='zr4a2-z'>Change point detection</li>
              <li data-oid='_l4kg:m'>Anomaly identification</li>
              <li data-oid='39fpjmt'>Forecasting with confidence intervals</li>
            </ul>
          </div>

          <div className='capability' data-oid='uf0:15j'>
            <h4 data-oid='m5xw9en'>Automated Insights</h4>
            <ul data-oid='4.kauz6'>
              <li data-oid='u:ucfmw'>Pattern recognition across variables</li>
              <li data-oid='3vyjhk1'>Contextual interpretation generation</li>
              <li data-oid='8j8hxsc'>Significance-based prioritization</li>
              <li data-oid='57v39wn'>Actionable business recommendations</li>
            </ul>
          </div>

          <div className='capability' data-oid='bvafuf5'>
            <h4 data-oid='lgtlzig'>Enterprise Features</h4>
            <ul data-oid='6q38f4c'>
              <li data-oid='h3xw9.7'>Configurable significance levels</li>
              <li data-oid='7nz:blo'>
                Performance optimization for large datasets
              </li>
              <li data-oid='zdje_wv'>Robust error handling</li>
              <li data-oid='g_pp85:'>Event-driven architecture</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsExample;
