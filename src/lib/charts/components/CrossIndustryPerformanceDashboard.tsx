/**
 * Cross-Industry Performance Analytics Dashboard
 *
 * Comprehensive React component for visualizing performance metrics across:
 * - College Consulting (counselor effectiveness)
 * - SaaS (sales rep performance)
 * - Manufacturing (account manager success)
 * - Healthcare (clinical outcome tracking)
 * - FinTech (advisor performance)
 *
 * Features:
 * - Real-time performance metrics
 * - Cross-industry benchmarking
 * - Top performer rankings
 * - Industry-specific insights
 * - Interactive charts and visualizations
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// Types for the dashboard data
interface IndustryPerformanceData {
  industry: string;
  averageScore: number;
  performerCount: number;
  topPerformingMetrics: string[];
  rank: number;
}

interface PerformerProfile {
  id: string;
  performerId: string;
  industry: string;
  name: string;
  department: string;
  overallScore: number;
  performanceLevel: 'exceptional' | 'high' | 'average' | 'below_average' | 'poor';
  trends: {
    trending: 'up' | 'down' | 'stable';
    changePercent: number;
  };
  benchmarks: {
    industryAverage: number;
    departmentAverage: number;
    percentileRank: number;
  };
}

interface DashboardData {
  overallStats: {
    totalPerformers: number;
    industriesTracked: number;
    averagePerformanceScore: number;
    performanceLevelDistribution: Record<string, number>;
  };
  crossIndustryComparison: {
    performanceComparison: IndustryPerformanceData[];
    insights: {
      highestPerformingIndustry: string;
      fastestImprovingIndustry: string;
      mostConsistentIndustry: string;
      crossIndustryTrends: string[];
      opportunityAreas: string[];
    };
  };
  industryData?: {
    industry: string;
    topPerformers: PerformerProfile[];
  };
}

const INDUSTRY_COLORS = {
  'college_consulting': '#8884d8',
  'saas': '#82ca9d',
  'manufacturing': '#ffc658',
  'healthcare': '#ff7c7c',
  'fintech': '#8dd1e1'
};

const PERFORMANCE_LEVEL_COLORS = {
  'exceptional': '#22c55e',
  'high': '#84cc16',
  'average': '#eab308',
  'below_average': '#f97316',
  'poor': '#ef4444'
};

const INDUSTRY_DISPLAY_NAMES = {
  'college_consulting': 'College Consulting',
  'saas': 'SaaS',
  'manufacturing': 'Manufacturing',
  'healthcare': 'Healthcare',
  'fintech': 'FinTech'
};

interface DashboardProps {
  className?: string;
  apiBaseUrl?: string;
}

const CrossIndustryPerformanceDashboard: React.FC<DashboardProps> = ({
  className = '',
  apiBaseUrl = '/api/v1'
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch dashboard data
  const fetchDashboardData = async (industry?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (industry) {
        params.append('industry', industry);
      }

      const response = await fetch(`${apiBaseUrl}/cross-industry-performance/dashboard?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }

      setDashboardData(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData(selectedIndustry || undefined);
  }, [selectedIndustry]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(selectedIndustry || undefined);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedIndustry]);

  // Prepared chart data
  const industryComparisonData = useMemo(() => {
    if (!dashboardData) return [];

    return dashboardData.crossIndustryComparison.performanceComparison.map(item => ({
      ...item,
      displayName: INDUSTRY_DISPLAY_NAMES[item.industry as keyof typeof INDUSTRY_DISPLAY_NAMES] || item.industry,
      color: INDUSTRY_COLORS[item.industry as keyof typeof INDUSTRY_COLORS] || '#8884d8'
    }));
  }, [dashboardData]);

  const performanceLevelData = useMemo(() => {
    if (!dashboardData) return [];

    return Object.entries(dashboardData.overallStats.performanceLevelDistribution).map(([level, count]) => ({
      level: level.replace('_', ' ').toUpperCase(),
      count,
      color: PERFORMANCE_LEVEL_COLORS[level as keyof typeof PERFORMANCE_LEVEL_COLORS] || '#8884d8'
    }));
  }, [dashboardData]);

  const topPerformersData = useMemo(() => {
    if (!dashboardData?.industryData?.topPerformers) return [];

    return dashboardData.industryData.topPerformers.slice(0, 10).map(performer => ({
      name: performer.name,
      score: performer.overallScore,
      department: performer.department,
      percentileRank: performer.benchmarks.percentileRank,
      trending: performer.trends.trending,
      changePercent: performer.trends.changePercent
    }));
  }, [dashboardData]);

  const refreshData = () => {
    fetchDashboardData(selectedIndustry || undefined);
  };

  if (loading && !dashboardData) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading performance analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={refreshData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cross-Industry Performance Analytics
          </h1>
          <p className="text-gray-500 mt-2">
            Performance tracking across College Consulting, SaaS, Manufacturing, Healthcare, and FinTech
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={refreshData}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Performers</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.overallStats.totalPerformers.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Industries Tracked</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.overallStats.industriesTracked}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.overallStats.averagePerformanceScore}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Top Industry</p>
              <p className="text-lg font-bold text-gray-900">
                {INDUSTRY_DISPLAY_NAMES[dashboardData.crossIndustryComparison.insights.highestPerformingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||
                 dashboardData.crossIndustryComparison.insights.highestPerformingIndustry}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Filter Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: null, label: 'All Industries' },
              { id: 'college_consulting', label: 'College Consulting' },
              { id: 'saas', label: 'SaaS' },
              { id: 'manufacturing', label: 'Manufacturing' },
              { id: 'healthcare', label: 'Healthcare' },
              { id: 'fintech', label: 'FinTech' }
            ].map((tab) => (
              <button
                key={tab.id || 'all'}
                onClick={() => setSelectedIndustry(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  selectedIndustry === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* Industry Comparison Chart */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Industry Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={industryComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="displayName"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [value, 'Average Score']}
                  labelFormatter={(label) => `Industry: ${label}`}
                />
                <Bar
                  dataKey="averageScore"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Level Distribution */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Level Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={performanceLevelData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ level, count }) => `${level}: ${count}`}
                  >
                    {performanceLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Industry Rankings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Industry Rankings</h3>
              <div className="space-y-3">
                {industryComparisonData.map((industry, index) => (
                  <div key={industry.industry} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                        {industry.rank}
                      </div>
                      <div>
                        <div className="font-medium">{industry.displayName}</div>
                        <div className="text-sm text-gray-500">{industry.performerCount} performers</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{industry.averageScore}</div>
                      <div className="text-sm text-gray-500">avg score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performers Table - Only show when industry is selected */}
          {selectedIndustry && dashboardData.industryData && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Top Performers - {INDUSTRY_DISPLAY_NAMES[selectedIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES]}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Rank</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Score</th>
                      <th className="text-left p-3 font-medium">Percentile</th>
                      <th className="text-left p-3 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformersData.map((performer, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-bold">{index + 1}</td>
                        <td className="p-3">{performer.name}</td>
                        <td className="p-3">{performer.department}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {performer.score}
                          </span>
                        </td>
                        <td className="p-3">{performer.percentileRank}%</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            {performer.trending === 'up' && (
                              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            )}
                            {performer.trending === 'down' && (
                              <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                              </svg>
                            )}
                            <span className={`text-sm ${
                              performer.trending === 'up' ? 'text-green-600' :
                              performer.trending === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {performer.changePercent > 0 ? '+' : ''}{performer.changePercent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Insights Panel */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Cross-Industry Trends</h4>
                <ul className="space-y-2">
                  {dashboardData.crossIndustryComparison.insights.crossIndustryTrends.map((trend, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {trend}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Opportunity Areas</h4>
                <ul className="space-y-2">
                  {dashboardData.crossIndustryComparison.insights.opportunityAreas.map((area, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Fastest Improving</div>
                  <div className="font-medium">
                    {INDUSTRY_DISPLAY_NAMES[dashboardData.crossIndustryComparison.insights.fastestImprovingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||
                     dashboardData.crossIndustryComparison.insights.fastestImprovingIndustry}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Most Consistent</div>
                  <div className="font-medium">
                    {INDUSTRY_DISPLAY_NAMES[dashboardData.crossIndustryComparison.insights.mostConsistentIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||
                     dashboardData.crossIndustryComparison.insights.mostConsistentIndustry}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Top Performing</div>
                  <div className="font-medium">
                    {INDUSTRY_DISPLAY_NAMES[dashboardData.crossIndustryComparison.insights.highestPerformingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||
                     dashboardData.crossIndustryComparison.insights.highestPerformingIndustry}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossIndustryPerformanceDashboard;
