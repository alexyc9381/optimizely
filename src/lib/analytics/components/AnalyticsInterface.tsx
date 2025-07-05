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
    <div className='analytics-interface' data-oid='bsc83qk'>
      <div className='analytics-header' data-oid='4:i2mm6'>
        <h2 data-oid='pr7q8f3'>Advanced Analytics & Statistical Tools</h2>
        <div className='analytics-controls' data-oid='zy3p6bh'>
          <button
            onClick={clearResults}
            className='btn btn-secondary'
            data-oid='on:hhho'
          >
            Clear Results
          </button>
          <button
            onClick={generateAutomatedInsights}
            disabled={loading}
            className='btn btn-primary'
            data-oid='i58rm7d'
          >
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
      </div>

      {error && (
        <div className='error-message' data-oid='vxs7ch7'>
          <span className='error-icon' data-oid='6eyftfe'>
            ⚠️
          </span>
          {error}
        </div>
      )}

      <div className='analytics-tabs' data-oid='wqf15m-'>
        <nav className='tab-navigation' data-oid='o3oget4'>
          <button
            onClick={() => setActiveTab('insights')}
            className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
            data-oid='5vqief0'
          >
            Automated Insights
            {results.insights.length > 0 && (
              <span className='badge' data-oid='zk1di31'>
                {results.insights.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`}
            data-oid='3d-g8cq'
          >
            Statistical Tests
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`tab-button ${activeTab === 'correlations' ? 'active' : ''}`}
            data-oid='j6p4q6e'
          >
            Correlations
          </button>
          <button
            onClick={() => setActiveTab('regression')}
            className={`tab-button ${activeTab === 'regression' ? 'active' : ''}`}
            data-oid=':eyy:eb'
          >
            Regression
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
            data-oid='tz1rk5a'
          >
            Trend Analysis
          </button>
        </nav>

        <div className='tab-content' data-oid='pp014cf'>
          {activeTab === 'insights' && (
            <div className='insights-panel' data-oid='h6lwjhr'>
              <div className='panel-header' data-oid=':dcalma'>
                <h3 data-oid='y:u6lva'>Automated Statistical Insights</h3>
              </div>

              {sortedInsights.length === 0 ? (
                <div className='empty-state' data-oid='nq5bhrq'>
                  <p data-oid='f4_g7am'>
                    No insights generated yet. The system will analyze your data
                    automatically.
                  </p>
                </div>
              ) : (
                <div className='insights-list' data-oid='xlpzre9'>
                  {sortedInsights.map((insight, index) => (
                    <div
                      key={index}
                      className={`insight-card significance-${insight.significance}`}
                      data-oid='k-vn_zl'
                    >
                      <div className='insight-header' data-oid='lizq2.g'>
                        <h4 data-oid='3tf5iue'>{insight.title}</h4>
                        <div className='insight-meta' data-oid='c:hu8p7'>
                          <span
                            className={`significance-badge ${insight.significance}`}
                            data-oid='fmt.c22'
                          >
                            {insight.significance.toUpperCase()}
                          </span>
                          <span className='confidence-score' data-oid='x_2jh.n'>
                            {(insight.confidence * 100).toFixed(1)}% confidence
                          </span>
                        </div>
                      </div>

                      <p className='insight-description' data-oid='r1f3mfa'>
                        {insight.description}
                      </p>

                      {insight.supportingEvidence.length > 0 && (
                        <div className='supporting-evidence' data-oid='k2bvc9l'>
                          <h5 data-oid='u0rv-50'>Supporting Evidence:</h5>
                          <ul data-oid='41a.xau'>
                            {insight.supportingEvidence.map((evidence, i) => (
                              <li key={i} data-oid='zthfbeq'>
                                {evidence}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.recommendations.length > 0 && (
                        <div className='recommendations' data-oid='s5eot:4'>
                          <h5 data-oid='wsiaa.w'>Recommendations:</h5>
                          <ul data-oid='90sxol_'>
                            {insight.recommendations.map(
                              (recommendation, i) => (
                                <li key={i} data-oid='dlj2h7s'>
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
            <div className='statistical-tests-panel' data-oid='tgldzjw'>
              <div className='panel-header' data-oid='9v3mau9'>
                <h3 data-oid='-j8-68.'>Statistical Testing Suite</h3>
              </div>
              <p data-oid='e2jmhg.'>
                Advanced statistical tests (t-tests, chi-square, ANOVA) coming
                soon!
              </p>
            </div>
          )}

          {activeTab === 'correlations' && (
            <div className='correlations-panel' data-oid='yr-9reu'>
              <div className='panel-header' data-oid='rtd:-os'>
                <h3 data-oid='a-j.g3m'>Correlation Analysis</h3>
              </div>
              <p data-oid='whf7wj1'>
                Pearson, Spearman, and Kendall correlation analysis coming soon!
              </p>
            </div>
          )}

          {activeTab === 'regression' && (
            <div className='regression-panel' data-oid='42d51hg'>
              <div className='panel-header' data-oid='p74rjly'>
                <h3 data-oid='.hbm73:'>Regression Analysis</h3>
              </div>
              <p data-oid='8gtjafx'>
                Multiple regression and polynomial regression tools coming soon!
              </p>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className='trend-analysis-panel' data-oid='03j_64n'>
              <div className='panel-header' data-oid='9u:6zcs'>
                <h3 data-oid='x0-fcq4'>Trend Analysis & Forecasting</h3>
              </div>
              <p data-oid='p4k0ehl'>
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
