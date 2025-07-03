import React, { useCallback, useEffect, useState } from 'react';
import {
  AdvancedAnalyticsEngine,
  AutomatedInsight,
  CorrelationAnalysis,
  RegressionResult,
  StatisticalTest,
  TrendAnalysis,
} from '../AdvancedAnalyticsEngine';

// Interface Props
interface AnalyticsInterfaceProps {
  data: { [key: string]: number[] };
  onResultChange?: (results: AnalyticsResults) => void;
  config?: {
    significanceLevel?: number;
    confidenceLevel?: number;
    autoRefresh?: boolean;
  };
}

interface AnalyticsResults {
  statisticalTests: StatisticalTest[];
  correlations: CorrelationAnalysis[];
  regressions: RegressionResult[];
  trends: { [variable: string]: TrendAnalysis };
  insights: AutomatedInsight[];
}

interface TestConfiguration {
  testType: 'one-sample' | 'two-sample' | 'paired' | 'chi-square';
  variable1: string;
  variable2?: string;
  hypothesizedMean?: number;
  expectedValues?: number[];
}

interface RegressionConfiguration {
  dependent: string;
  independent: string[];
  type: 'simple' | 'multiple' | 'polynomial';
  degree?: number;
}

// Main Analytics Interface Component
export const AnalyticsInterface: React.FC<AnalyticsInterfaceProps> = ({
  data,
  onResultChange,
  config = {},
}) => {
  const [analyticsEngine] = useState(() =>
    AdvancedAnalyticsEngine.getInstance()
  );
  const [activeTab, setActiveTab] = useState<
    'insights' | 'tests' | 'correlations' | 'regression' | 'trends'
  >('insights');
  const [results, setResults] = useState<AnalyticsResults>({
    statisticalTests: [],
    correlations: [],
    regressions: [],
    trends: {},
    insights: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration
  const [testConfig, setTestConfig] = useState<TestConfiguration>({
    testType: 'two-sample',
    variable1: '',
    variable2: '',
    hypothesizedMean: 0,
  });

  const [regressionConfig, setRegressionConfig] =
    useState<RegressionConfiguration>({
      dependent: '',
      independent: [],
      type: 'simple',
    });

  const variables = Object.keys(data);

  // Initialize analytics engine configuration
  useEffect(() => {
    if (config.significanceLevel) {
      analyticsEngine.updateConfig({
        significanceLevel: config.significanceLevel,
      });
    }
    if (config.confidenceLevel) {
      analyticsEngine.updateConfig({ confidenceLevel: config.confidenceLevel });
    }
  }, [analyticsEngine, config]);

  // Auto-generate insights when data changes
  useEffect(() => {
    if (config.autoRefresh !== false && variables.length > 0) {
      generateAutomatedInsights();
    }
  }, [data, config.autoRefresh]);

  // Generate automated insights
  const generateAutomatedInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const insights = analyticsEngine.generateInsights(data);

      setResults(prev => ({
        ...prev,
        insights,
      }));

      onResultChange?.({
        ...results,
        insights,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate insights'
      );
    } finally {
      setLoading(false);
    }
  }, [analyticsEngine, data, onResultChange, results]);

  // Perform statistical test
  const performStatisticalTest = useCallback(async () => {
    if (!testConfig.variable1) {
      setError('Please select a variable for testing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let test: StatisticalTest;
      const sample1 = data[testConfig.variable1];

      switch (testConfig.testType) {
        case 'one-sample':
          test = analyticsEngine.tTest(
            sample1,
            undefined,
            'one-sample',
            testConfig.hypothesizedMean || 0
          );
          break;
        case 'two-sample':
          if (!testConfig.variable2) {
            throw new Error('Two-sample test requires a second variable');
          }
          const sample2 = data[testConfig.variable2];
          test = analyticsEngine.tTest(sample1, sample2, 'two-sample');
          break;
        case 'paired':
          if (!testConfig.variable2) {
            throw new Error('Paired test requires a second variable');
          }
          const pairedSample2 = data[testConfig.variable2];
          test = analyticsEngine.tTest(sample1, pairedSample2, 'paired');
          break;
        case 'chi-square':
          test = analyticsEngine.chiSquareTest(
            sample1,
            testConfig.expectedValues
          );
          break;
        default:
          throw new Error('Invalid test type');
      }

      setResults(prev => ({
        ...prev,
        statisticalTests: [...prev.statisticalTests, test],
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to perform statistical test'
      );
    } finally {
      setLoading(false);
    }
  }, [analyticsEngine, data, testConfig]);

  // Generate correlation matrix
  const generateCorrelationMatrix = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const correlations: CorrelationAnalysis[] = [];

      for (let i = 0; i < variables.length; i++) {
        for (let j = i + 1; j < variables.length; j++) {
          const varX = variables[i];
          const varY = variables[j];

          if (
            data[varX] &&
            data[varY] &&
            data[varX].length > 0 &&
            data[varY].length > 0
          ) {
            const correlation = analyticsEngine.correlationAnalysis(
              data[varX],
              data[varY],
              'pearson'
            );
            correlations.push(correlation);
          }
        }
      }

      setResults(prev => ({
        ...prev,
        correlations,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate correlation matrix'
      );
    } finally {
      setLoading(false);
    }
  }, [analyticsEngine, data, variables]);

  // Perform regression analysis
  const performRegression = useCallback(async () => {
    if (
      !regressionConfig.dependent ||
      regressionConfig.independent.length === 0
    ) {
      setError('Please select dependent and independent variables');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const y = data[regressionConfig.dependent];
      let regression: RegressionResult;

      if (
        regressionConfig.type === 'simple' &&
        regressionConfig.independent.length === 1
      ) {
        const x = data[regressionConfig.independent[0]];
        const xMatrix = x.map(val => [val]);
        regression = analyticsEngine.multipleRegression(y, xMatrix);
      } else {
        const X = regressionConfig.independent.map(varName => data[varName]);
        const XMatrix = X[0].map((_, i) => X.map(row => row[i]));
        regression = analyticsEngine.multipleRegression(y, XMatrix);
      }

      setResults(prev => ({
        ...prev,
        regressions: [...prev.regressions, regression],
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to perform regression analysis'
      );
    } finally {
      setLoading(false);
    }
  }, [analyticsEngine, data, regressionConfig]);

  // Generate trend analysis for all variables
  const generateTrendAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const trends: { [variable: string]: TrendAnalysis } = {};

      for (const variable of variables) {
        if (data[variable] && data[variable].length > 0) {
          trends[variable] = analyticsEngine.trendAnalysis(data[variable]);
        }
      }

      setResults(prev => ({
        ...prev,
        trends,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate trend analysis'
      );
    } finally {
      setLoading(false);
    }
  }, [analyticsEngine, data, variables]);

  // Clear all results
  const clearResults = useCallback(() => {
    setResults({
      statisticalTests: [],
      correlations: [],
      regressions: [],
      trends: {},
      insights: [],
    });
    setError(null);
  }, []);

  const significanceOrder = { high: 3, medium: 2, low: 1 };
  const sortedInsights = results.insights.sort(
    (a, b) =>
      significanceOrder[b.significance] - significanceOrder[a.significance]
  );

  return (
    <div className='analytics-interface' data-oid='tstrr-t'>
      <div className='analytics-header' data-oid='8pj8pkd'>
        <h2 data-oid='1m638pj'>Advanced Analytics & Statistical Tools</h2>
        <div className='analytics-controls' data-oid=':8xu6-x'>
          <button
            onClick={clearResults}
            className='btn btn-secondary'
            data-oid='8x05gjz'
          >
            Clear Results
          </button>
          <button
            onClick={generateAutomatedInsights}
            disabled={loading}
            className='btn btn-primary'
            data-oid='k4eugyt'
          >
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
      </div>

      {error && (
        <div className='error-message' data-oid='0xz3:vh'>
          <span className='error-icon' data-oid='j-u-wyh'>
            ⚠️
          </span>
          {error}
        </div>
      )}

      <div className='analytics-tabs' data-oid='df75thj'>
        <nav className='tab-navigation' data-oid='evtaigw'>
          <button
            onClick={() => setActiveTab('insights')}
            className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
            data-oid='ge.z-.1'
          >
            Automated Insights
            {results.insights.length > 0 && (
              <span className='badge' data-oid='m:jcgm-'>
                {results.insights.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`}
            data-oid='4:.8oh1'
          >
            Statistical Tests
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`tab-button ${activeTab === 'correlations' ? 'active' : ''}`}
            data-oid='a48vr0i'
          >
            Correlations
          </button>
          <button
            onClick={() => setActiveTab('regression')}
            className={`tab-button ${activeTab === 'regression' ? 'active' : ''}`}
            data-oid='ahndqld'
          >
            Regression
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
            data-oid='pldko_p'
          >
            Trend Analysis
          </button>
        </nav>

        <div className='tab-content' data-oid='cncf:1_'>
          {activeTab === 'insights' && (
            <div className='insights-panel' data-oid='fcv1rsr'>
              <div className='panel-header' data-oid='8p-8-qr'>
                <h3 data-oid='1e8_ubi'>Automated Statistical Insights</h3>
              </div>

              {sortedInsights.length === 0 ? (
                <div className='empty-state' data-oid='jb2:_19'>
                  <p data-oid=':va_wu2'>
                    No insights generated yet. The system will analyze your data
                    automatically.
                  </p>
                </div>
              ) : (
                <div className='insights-list' data-oid='3s.zx_y'>
                  {sortedInsights.map((insight, index) => (
                    <div
                      key={index}
                      className={`insight-card significance-${insight.significance}`}
                      data-oid='90kxmmt'
                    >
                      <div className='insight-header' data-oid='exgsh8b'>
                        <h4 data-oid='ifg1m8.'>{insight.title}</h4>
                        <div className='insight-meta' data-oid='ccs__h4'>
                          <span
                            className={`significance-badge ${insight.significance}`}
                            data-oid=':oagnwp'
                          >
                            {insight.significance.toUpperCase()}
                          </span>
                          <span className='confidence-score' data-oid='55jj2gk'>
                            {(insight.confidence * 100).toFixed(1)}% confidence
                          </span>
                        </div>
                      </div>

                      <p className='insight-description' data-oid='tx0ttry'>
                        {insight.description}
                      </p>

                      {insight.supportingEvidence.length > 0 && (
                        <div className='supporting-evidence' data-oid='o-3ire3'>
                          <h5 data-oid='8yc7w-9'>Supporting Evidence:</h5>
                          <ul data-oid='t:-l063'>
                            {insight.supportingEvidence.map((evidence, i) => (
                              <li key={i} data-oid='ypw2tgv'>
                                {evidence}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.recommendations.length > 0 && (
                        <div className='recommendations' data-oid='h0v8jmx'>
                          <h5 data-oid='b51b_or'>Recommendations:</h5>
                          <ul data-oid='uk:7pyb'>
                            {insight.recommendations.map(
                              (recommendation, i) => (
                                <li key={i} data-oid='i4i7_1g'>
                                  {recommendation}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className='statistical-tests-panel' data-oid='hjx8nlr'>
              <div className='panel-header' data-oid='mr_8l4b'>
                <h3 data-oid='8ey6ou-'>Statistical Testing Suite</h3>
              </div>
              <p data-oid='r5:phu4'>
                Advanced statistical tests (t-tests, chi-square, ANOVA) coming
                soon!
              </p>
            </div>
          )}

          {activeTab === 'correlations' && (
            <div className='correlations-panel' data-oid='4irfyk5'>
              <div className='panel-header' data-oid='buq301m'>
                <h3 data-oid=':ioktiz'>Correlation Analysis</h3>
              </div>
              <p data-oid='5t7yc3j'>
                Pearson, Spearman, and Kendall correlation analysis coming soon!
              </p>
            </div>
          )}

          {activeTab === 'regression' && (
            <div className='regression-panel' data-oid='qqxbge_'>
              <div className='panel-header' data-oid='2-t0dai'>
                <h3 data-oid='7epg3l_'>Regression Analysis</h3>
              </div>
              <p data-oid='17wft1b'>
                Multiple regression and polynomial regression tools coming soon!
              </p>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className='trend-analysis-panel' data-oid='5ney4qw'>
              <div className='panel-header' data-oid='spwmn7_'>
                <h3 data-oid='7fo_k7l'>Trend Analysis & Forecasting</h3>
              </div>
              <p data-oid='ue1_ih:'>
                Time series analysis and forecasting tools coming soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsInterface;
