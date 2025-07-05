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
    <div className='analytics-example' data-oid='.a6fy01'>
      <div className='example-header' data-oid='vzz2i6q'>
        <h1 data-oid='u6mtwrj'>
          🧠 Advanced Analytics & Statistical Tools Demo
        </h1>
        <p data-oid=':rp2zow'>
          This example demonstrates the comprehensive statistical analysis
          capabilities of the Advanced Analytics Engine using real business data
          scenarios.
        </p>

        <div className='example-stats' data-oid='fw3o-st'>
          {results && (
            <div className='stats-grid' data-oid='lx78dbq'>
              <div className='stat-card' data-oid='i06m86d'>
                <h3 data-oid='ma0g6oj'>Statistical Tests</h3>
                <div className='stat-value' data-oid='gpzmaqb'>
                  {results.summary.totalTests}
                </div>
                <div className='stat-label' data-oid='s9hs..h'>
                  Tests Performed
                </div>
              </div>

              <div className='stat-card' data-oid='rxmp-ca'>
                <h3 data-oid='dg9dm1z'>Correlations</h3>
                <div className='stat-value' data-oid='7l3i--6'>
                  {results.summary.significantCorrelations}/
                  {results.summary.totalCorrelations}
                </div>
                <div className='stat-label' data-oid='st2k9r9'>
                  Significant Correlations
                </div>
              </div>

              <div className='stat-card' data-oid='8k3l0xw'>
                <h3 data-oid='kqla.vs'>Model Accuracy</h3>
                <div className='stat-value' data-oid='dd1i32c'>
                  {(results.summary.regressionRSquared * 100).toFixed(1)}%
                </div>
                <div className='stat-label' data-oid=':vnk.l7'>
                  R-Squared Value
                </div>
              </div>

              <div className='stat-card' data-oid='o7aisl6'>
                <h3 data-oid='l28oo_m'>Key Insights</h3>
                <div className='stat-value' data-oid='bi1zy27'>
                  {results.summary.highPriorityInsights}
                </div>
                <div className='stat-label' data-oid='ab-2f_i'>
                  High Priority
                </div>
              </div>
            </div>
          )}
        </div>

        <div className='example-actions' data-oid='9n8472o'>
          <button
            onClick={runAdvancedAnalysis}
            disabled={loading}
            className='btn btn-primary'
            data-oid='xkc:8r-'
          >
            {loading ? 'Analyzing...' : 'Run Advanced Analysis'}
          </button>

          <button
            onClick={() => console.log('Sample Data:', sampleBusinessData)}
            className='btn btn-outline'
            data-oid='nicamho'
          >
            View Sample Data
          </button>
        </div>
      </div>

      <div className='example-content' data-oid='wd-65q4'>
        <h2 data-oid='zmu:vyh'>Interactive Analytics Interface</h2>
        <p data-oid='dxr00qo'>
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
          data-oid='x:g5t6g'
        />
      </div>

      {results && (
        <div className='analysis-summary' data-oid='dq.h9zw'>
          <h2 data-oid=':jlg:z:'>Analysis Summary</h2>

          <div className='summary-section' data-oid='6.2hc3t'>
            <h3 data-oid='tw0zc_o'>🧪 Statistical Test Results</h3>
            <ul data-oid='g:cf:z0'>
              <li data-oid='xovtdf7'>
                <strong data-oid='ts:o_6:'>A/B Test Analysis:</strong> Group B
                shows{' '}
                {results.statisticalTests[0].isSignificant
                  ? 'statistically significant'
                  : 'no significant'}{' '}
                improvement over Group A (p ={' '}
                {results.statisticalTests[0].pValue.toFixed(4)})
              </li>
              <li data-oid='4c_6d:s'>
                <strong data-oid='6wo2brg'>Sales Target Analysis:</strong>{' '}
                Monthly sales{' '}
                {results.statisticalTests[1].isSignificant
                  ? 'significantly exceed'
                  : 'do not significantly differ from'}{' '}
                the $200K target (t ={' '}
                {results.statisticalTests[1].statistic.toFixed(2)})
              </li>
            </ul>
          </div>

          <div className='summary-section' data-oid='2q_s5td'>
            <h3 data-oid='cg5jj8a'>📊 Key Correlations Discovered</h3>
            <ul data-oid='onymbst'>
              <li data-oid='7blzt22'>
                <strong data-oid='bt839g9'>Sales ↔ Advertising:</strong>{' '}
                {results.correlations[0].strength.replace('_', ' ')}{' '}
                {results.correlations[0].direction} correlation (r ={' '}
                {results.correlations[0].coefficient.toFixed(3)})
              </li>
              <li data-oid='1.o0qn:'>
                <strong data-oid=':5ludk9'>
                  Satisfaction ↔ Support Tickets:
                </strong>{' '}
                {results.correlations[1].strength.replace('_', ' ')}{' '}
                {results.correlations[1].direction} correlation (ρ ={' '}
                {results.correlations[1].coefficient.toFixed(3)})
              </li>
            </ul>
          </div>

          <div className='summary-section' data-oid='-l2cb9n'>
            <h3 data-oid='0_-p12x'>📈 Predictive Models</h3>
            <ul data-oid='8n-wxzu'>
              <li data-oid='lxpz12_'>
                <strong data-oid='5vjwm4k'>Sales Prediction Model:</strong> R² ={' '}
                {(results.regressions[0].rSquared * 100).toFixed(1)}% -{' '}
                {results.regressions[0].isSignificant
                  ? 'Highly predictive'
                  : 'Needs improvement'}
              </li>
              <li data-oid='o9h8:21'>
                <strong data-oid='xw4p_0:'>Model Equation:</strong>{' '}
                <code data-oid='lo2zxyl'>
                  {results.regressions[0].equation}
                </code>
              </li>
              {results.regressions[0].outliers.length > 0 && (
                <li data-oid='ncd2z4a'>
                  <strong data-oid='2o3ws:x'>Outliers Detected:</strong>{' '}
                  {results.regressions[0].outliers.length} data points require
                  investigation
                </li>
              )}
            </ul>
          </div>

          <div className='summary-section' data-oid='c98nr4d'>
            <h3 data-oid='nnr__di'>📉 Trend Analysis</h3>
            <ul data-oid='_rfs697'>
              <li data-oid='q-bvz7n'>
                <strong data-oid='j-xu7w6'>Seasonal Sales:</strong>{' '}
                {results.trends.seasonalSales.trend} trend detected with{' '}
                {results.trends.seasonalSales.anomalies.indices.length}{' '}
                anomalies
              </li>
              <li data-oid='1b7rrrl'>
                <strong data-oid='lorpr-i'>Customer Satisfaction:</strong>{' '}
                {results.trends.customerSatisfaction.trend} trend (strength:{' '}
                {results.trends.customerSatisfaction.strength.toFixed(3)})
              </li>
            </ul>
          </div>

          <div className='summary-section' data-oid='.6t9.r6'>
            <h3 data-oid='.1vrrt_'>🤖 Automated Insights</h3>
            <div className='insights-preview' data-oid='odyb6o7'>
              {results.insights
                .slice(0, 3)
                .map((insight: any, index: number) => (
                  <div
                    key={index}
                    className={`insight-preview significance-${insight.significance}`}
                    data-oid='7sj7-i2'
                  >
                    <div className='insight-title' data-oid='svzerkh'>
                      {insight.title}
                    </div>
                    <div className='insight-confidence' data-oid='7-t2_e8'>
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className='example-footer' data-oid='82901ty'>
        <h3 data-oid='vk4_-3h'>🔬 Technical Capabilities Demonstrated</h3>
        <div className='capabilities-grid' data-oid='ym-95y_'>
          <div className='capability' data-oid='115m1dy'>
            <h4 data-oid='g4jnu:a'>Statistical Testing</h4>
            <ul data-oid='ow11vin'>
              <li data-oid='8iztpcn'>
                One-sample, two-sample, and paired t-tests
              </li>
              <li data-oid='n2:.0da'>Chi-square goodness of fit tests</li>
              <li data-oid='oj1dyf1'>
                Proper p-value calculations and interpretations
              </li>
              <li data-oid='i8wlwk3'>Confidence interval estimation</li>
            </ul>
          </div>

          <div className='capability' data-oid='yy.b1ir'>
            <h4 data-oid='bbvrul7'>Correlation Analysis</h4>
            <ul data-oid='n2us6p6'>
              <li data-oid='qgd.tz-'>
                Pearson, Spearman, and Kendall correlations
              </li>
              <li data-oid='i8jin9i'>Statistical significance testing</li>
              <li data-oid='2i2:_61'>Fisher's z-transformation for CI</li>
              <li data-oid='ycxuv9z'>Strength and direction classification</li>
            </ul>
          </div>

          <div className='capability' data-oid='w26mebb'>
            <h4 data-oid='jkm.jrn'>Regression Modeling</h4>
            <ul data-oid='d164o-3'>
              <li data-oid='vt4yq3m'>Simple and multiple linear regression</li>
              <li data-oid='kkw_fql'>R-squared and adjusted R-squared</li>
              <li data-oid='pylpesm'>F-statistic significance testing</li>
              <li data-oid='4tqbqxk'>Outlier detection and analysis</li>
            </ul>
          </div>

          <div className='capability' data-oid='hai7573'>
            <h4 data-oid='9wck3vv'>Trend Analysis</h4>
            <ul data-oid='5g_71w.'>
              <li data-oid='hg6bcvv'>Trend direction and strength detection</li>
              <li data-oid='k:2ijf_'>
                Seasonality analysis via autocorrelation
              </li>
              <li data-oid='7rmaue4'>Change point detection</li>
              <li data-oid='fagj3bl'>Anomaly identification</li>
              <li data-oid='vbt-u1b'>Forecasting with confidence intervals</li>
            </ul>
          </div>

          <div className='capability' data-oid='vi688eo'>
            <h4 data-oid='go7nlrk'>Automated Insights</h4>
            <ul data-oid='rgjf59t'>
              <li data-oid='94xvv0t'>Pattern recognition across variables</li>
              <li data-oid='inippr5'>Contextual interpretation generation</li>
              <li data-oid='84hh8ka'>Significance-based prioritization</li>
              <li data-oid='s2es7ma'>Actionable business recommendations</li>
            </ul>
          </div>

          <div className='capability' data-oid='wkzennk'>
            <h4 data-oid='u:rygvt'>Enterprise Features</h4>
            <ul data-oid='dd32smx'>
              <li data-oid='1bcem-h'>Configurable significance levels</li>
              <li data-oid='ed13g86'>
                Performance optimization for large datasets
              </li>
              <li data-oid='t-r--_:'>Robust error handling</li>
              <li data-oid='lsh1:lg'>Event-driven architecture</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsExample;
