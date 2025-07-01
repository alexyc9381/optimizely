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

import { Award, RefreshCw, Target, TrendingDown, TrendingUp, Users } from 'lucide-react';
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
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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

const CrossIndustryPerformanceDashboard: React.FC = () => {
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

      const response = await fetch(`/api/v1/cross-industry-performance/dashboard?${params}`);
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading performance analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <Button onClick={refreshData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Performers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overallStats.totalPerformers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industries Tracked</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overallStats.industriesTracked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Performance Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overallStats.averagePerformanceScore}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Industry</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {INDUSTRY_DISPLAY_NAMES[dashboardData.crossIndustryComparison.insights.highestPerformingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||
               dashboardData.crossIndustryComparison.insights.highestPerformingIndustry}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Filter Tabs */}
      <Tabs value={selectedIndustry || 'all'} onValueChange={(value) => setSelectedIndustry(value === 'all' ? null : value)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Industries</TabsTrigger>
          <TabsTrigger value="college_consulting">College Consulting</TabsTrigger>
          <TabsTrigger value="saas">SaaS</TabsTrigger>
          <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
          <TabsTrigger value="healthcare">Healthcare</TabsTrigger>
          <TabsTrigger value="fintech">FinTech</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedIndustry || 'all'} className="space-y-6">
          {/* Industry Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Industry Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Level Distribution</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Industry Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Rankings</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Table - Only show when industry is selected */}
          {selectedIndustry && dashboardData.industryData && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Top Performers - {INDUSTRY_DISPLAY_NAMES[selectedIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Rank</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Department</th>
                        <th className="text-left p-2">Score</th>
                        <th className="text-left p-2">Percentile</th>
                        <th className="text-left p-2">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPerformersData.map((performer, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-bold">{index + 1}</td>
                          <td className="p-2">{performer.name}</td>
                          <td className="p-2">{performer.department}</td>
                          <td className="p-2">
                            <Badge variant="secondary">{performer.score}</Badge>
                          </td>
                          <td className="p-2">{performer.percentileRank}%</td>
                          <td className="p-2">
                            <div className="flex items-center space-x-1">
                              {performer.trending === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {performer.trending === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
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
              </CardContent>
            </Card>
          )}

          {/* Insights Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
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

              <div className="mt-6 pt-6 border-t">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrossIndustryPerformanceDashboard;
