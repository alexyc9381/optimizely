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

import {
  Award,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users } from
'lucide-react';
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
  YAxis } from
'recharts';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  performanceLevel:
  'exceptional' |
  'high' |
  'average' |
  'below_average' |
  'poor';
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
  college_consulting: '#8884d8',
  saas: '#82ca9d',
  manufacturing: '#ffc658',
  healthcare: '#ff7c7c',
  fintech: '#8dd1e1'
};

const PERFORMANCE_LEVEL_COLORS = {
  exceptional: '#22c55e',
  high: '#84cc16',
  average: '#eab308',
  below_average: '#f97316',
  poor: '#ef4444'
};

const INDUSTRY_DISPLAY_NAMES = {
  college_consulting: 'College Consulting',
  saas: 'SaaS',
  manufacturing: 'Manufacturing',
  healthcare: 'Healthcare',
  fintech: 'FinTech'
};

const CrossIndustryPerformanceDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
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

      const response = await fetch(
        `/api/v1/cross-industry-performance/dashboard?${params}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch dashboard data: ${response.statusText}`
        );
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
    const interval = setInterval(
      () => {
        fetchDashboardData(selectedIndustry || undefined);
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [selectedIndustry]);

  // Prepared chart data
  const industryComparisonData = useMemo(() => {
    if (!dashboardData) return [];

    return dashboardData.crossIndustryComparison.performanceComparison.map(
      (item) => ({
        ...item,
        displayName:
        INDUSTRY_DISPLAY_NAMES[
        item.industry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||
        item.industry,
        color:
        INDUSTRY_COLORS[item.industry as keyof typeof INDUSTRY_COLORS] ||
        '#8884d8'
      })
    );
  }, [dashboardData]);

  const performanceLevelData = useMemo(() => {
    if (!dashboardData) return [];

    return Object.entries(
      dashboardData.overallStats.performanceLevelDistribution
    ).map(([level, count]) => ({
      level: level.replace('_', ' ').toUpperCase(),
      count,
      color:
      PERFORMANCE_LEVEL_COLORS[
      level as keyof typeof PERFORMANCE_LEVEL_COLORS] ||
      '#8884d8'
    }));
  }, [dashboardData]);

  const topPerformersData = useMemo(() => {
    if (!dashboardData?.industryData?.topPerformers) return [];

    return dashboardData.industryData.topPerformers.
    slice(0, 10).
    map((performer) => ({
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
      <div className='flex items-center justify-center h-64' data-oid="wf:n0do">
        <div className='text-center' data-oid="tauwi6l">
          <RefreshCw
            className='h-8 w-8 animate-spin mx-auto mb-4' data-oid="jg:o0c7" />


          <p data-oid="ceo_gc6">Loading performance analytics...</p>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div
        className='bg-red-50 border border-red-200 rounded-lg p-6' data-oid="f.4zxal">


        <h3 className='text-red-800 font-medium' data-oid="avq2uk.">
          Error Loading Dashboard
        </h3>
        <p className='text-red-600 mt-2' data-oid="qw8fwul">
          {error}
        </p>
        <Button onClick={refreshData} className='mt-4' data-oid="posm6uu">
          <RefreshCw className='h-4 w-4 mr-2' data-oid="gdnmd7l" />
          Retry
        </Button>
      </div>);

  }

  if (!dashboardData) {
    return (
      <div className='text-center py-8' data-oid="3ugs8az">
        <p data-oid="n9.qw:c">No data available</p>
      </div>);

  }

  return (
    <div className='space-y-6' data-oid="qygvmpz">
      {/* Header */}
      <div className='flex justify-between items-center' data-oid="km:4l4b">
        <div data-oid="9iwgn5j">
          <h1 className='text-3xl font-bold text-gray-900' data-oid="st.j-nm">
            Cross-Industry Performance Analytics
          </h1>
          <p className='text-gray-500 mt-2' data-oid="g-3:ypy">
            Performance tracking across College Consulting, SaaS, Manufacturing,
            Healthcare, and FinTech
          </p>
        </div>
        <div className='flex items-center space-x-4' data-oid="1hfohm1">
          <div className='text-sm text-gray-500' data-oid="7kgmj31">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            onClick={refreshData}
            variant='outline'
            size='sm' data-oid="blcxwr8">


            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} data-oid="21rg9v2" />


            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6' data-oid="l88flce">
        <Card data-oid="y8_1tlb">
          <CardHeader
            className='flex flex-row items-center justify-between space-y-0 pb-2' data-oid="3d2a27b">


            <CardTitle className='text-sm font-medium' data-oid="oq1-gfk">
              Total Performers
            </CardTitle>
            <Users
              className='h-4 w-4 text-muted-foreground' data-oid="-1ypgt8" />


          </CardHeader>
          <CardContent data-oid="pt-agg8">
            <div className='text-2xl font-bold' data-oid="lzz:f:3">
              {dashboardData.overallStats.totalPerformers.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="_r8xs_5">
          <CardHeader
            className='flex flex-row items-center justify-between space-y-0 pb-2' data-oid="y_6im_c">


            <CardTitle className='text-sm font-medium' data-oid="at1_e6n">
              Industries Tracked
            </CardTitle>
            <Target
              className='h-4 w-4 text-muted-foreground' data-oid="ge9s2gh" />


          </CardHeader>
          <CardContent data-oid="32bkz7a">
            <div className='text-2xl font-bold' data-oid="jywh-5z">
              {dashboardData.overallStats.industriesTracked}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="_991y70">
          <CardHeader
            className='flex flex-row items-center justify-between space-y-0 pb-2' data-oid="lx0o1cr">


            <CardTitle className='text-sm font-medium' data-oid="ae-2en:">
              Average Performance Score
            </CardTitle>
            <Award
              className='h-4 w-4 text-muted-foreground' data-oid="pvj51:k" />


          </CardHeader>
          <CardContent data-oid="cdje.iu">
            <div className='text-2xl font-bold' data-oid="n_n6tw4">
              {dashboardData.overallStats.averagePerformanceScore}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="ragjov9">
          <CardHeader
            className='flex flex-row items-center justify-between space-y-0 pb-2' data-oid="_k909a9">


            <CardTitle className='text-sm font-medium' data-oid="yiwk0sm">
              Top Industry
            </CardTitle>
            <TrendingUp
              className='h-4 w-4 text-muted-foreground' data-oid="gwf6azw" />


          </CardHeader>
          <CardContent data-oid="r7a-ye_">
            <div className='text-lg font-bold' data-oid="tknw:u5">
              {INDUSTRY_DISPLAY_NAMES[
              dashboardData.crossIndustryComparison.insights.
              highestPerformingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

              dashboardData.crossIndustryComparison.insights.
              highestPerformingIndustry}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Filter Tabs */}
      <Tabs
        value={selectedIndustry || 'all'}
        onValueChange={(value) =>
        setSelectedIndustry(value === 'all' ? null : value)
        } data-oid="yt_uvzh">


        <TabsList className='grid w-full grid-cols-6' data-oid="nfr3u1x">
          <TabsTrigger value='all' data-oid="nvt60_i">
            All Industries
          </TabsTrigger>
          <TabsTrigger value='college_consulting' data-oid="yq7vg3c">
            College Consulting
          </TabsTrigger>
          <TabsTrigger value='saas' data-oid="r324t_w">
            SaaS
          </TabsTrigger>
          <TabsTrigger value='manufacturing' data-oid="du52mlv">
            Manufacturing
          </TabsTrigger>
          <TabsTrigger value='healthcare' data-oid="vnry23:">
            Healthcare
          </TabsTrigger>
          <TabsTrigger value='fintech' data-oid="trdw80z">
            FinTech
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value={selectedIndustry || 'all'}
          className='space-y-6' data-oid="wxgrn.-">


          {/* Industry Comparison Chart */}
          <Card data-oid="lg4p18b">
            <CardHeader data-oid="q4a:8am">
              <CardTitle data-oid="sis08ul">
                Industry Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="pswq8t2">
              <ResponsiveContainer width='100%' height={400} data-oid="55-m5.v">
                <BarChart data={industryComparisonData} data-oid="5597qn8">
                  <CartesianGrid strokeDasharray='3 3' data-oid=".7-y8w5" />
                  <XAxis
                    dataKey='displayName'
                    angle={-45}
                    textAnchor='end'
                    height={80} data-oid="xcjk:u_" />



                  <YAxis data-oid="69d_9m8" />
                  <Tooltip
                    formatter={(value, name) => [value, 'Average Score']}
                    labelFormatter={(label) => `Industry: ${label}`} data-oid="ypscnbx" />



                  <Bar
                    dataKey='averageScore'
                    fill='#8884d8'
                    radius={[4, 4, 0, 0]} data-oid="qehmht5" />


                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6' data-oid="qj6_-7b">


            {/* Performance Level Distribution */}
            <Card data-oid="f9bx1g-">
              <CardHeader data-oid="5g_tgsc">
                <CardTitle data-oid=":k46tf.">
                  Performance Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="afxaxj.">
                <ResponsiveContainer
                  width='100%'
                  height={300} data-oid="c9t_6yp">


                  <PieChart data-oid="l-mwloj">
                    <Pie
                      data={performanceLevelData}
                      cx='50%'
                      cy='50%'
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='count'
                      label={({ level, count }) => `${level}: ${count}`} data-oid="e_s3d6t">


                      {performanceLevelData.map((entry, index) =>
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color} data-oid="db2vq4l" />


                      )}
                    </Pie>
                    <Tooltip data-oid="9oel54u" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Industry Rankings */}
            <Card data-oid="aeab8y5">
              <CardHeader data-oid="drarphz">
                <CardTitle data-oid="f42g5cz">Industry Rankings</CardTitle>
              </CardHeader>
              <CardContent data-oid="_tk024t">
                <div className='space-y-3' data-oid="h5-t63b">
                  {industryComparisonData.map((industry, index) =>
                  <div
                    key={industry.industry}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg' data-oid="_8zcz3j">


                      <div
                      className='flex items-center space-x-3' data-oid="wk:s22u">


                        <div
                        className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm' data-oid="nunatms">


                          {industry.rank}
                        </div>
                        <div data-oid="cojijyv">
                          <div className='font-medium' data-oid="3eegt1r">
                            {industry.displayName}
                          </div>
                          <div
                          className='text-sm text-gray-500' data-oid="q62fl3i">


                            {industry.performerCount} performers
                          </div>
                        </div>
                      </div>
                      <div className='text-right' data-oid="y_ejcc7">
                        <div className='font-bold text-lg' data-oid="vjs381.">
                          {industry.averageScore}
                        </div>
                        <div
                        className='text-sm text-gray-500' data-oid="odvbibt">


                          avg score
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Table - Only show when industry is selected */}
          {selectedIndustry && dashboardData.industryData &&
          <Card data-oid="q-6ijil">
              <CardHeader data-oid="1cppgr4">
                <CardTitle data-oid="rjb4vnl">
                  Top Performers -{' '}
                  {
                INDUSTRY_DISPLAY_NAMES[
                selectedIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES]

                }
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="qpdg9c5">
                <div className='overflow-x-auto' data-oid="t9p8p23">
                  <table className='w-full' data-oid="ozh6cou">
                    <thead data-oid="j5r8ari">
                      <tr className='border-b' data-oid="hf5vcu3">
                        <th className='text-left p-2' data-oid="8uq9hzq">
                          Rank
                        </th>
                        <th className='text-left p-2' data-oid="g-zdtq0">
                          Name
                        </th>
                        <th className='text-left p-2' data-oid="i1xgas-">
                          Department
                        </th>
                        <th className='text-left p-2' data-oid="o2ju08u">
                          Score
                        </th>
                        <th className='text-left p-2' data-oid="4an:g53">
                          Percentile
                        </th>
                        <th className='text-left p-2' data-oid="ccg8b7i">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody data-oid="0t2_8ke">
                      {topPerformersData.map((performer, index) =>
                    <tr key={index} className='border-b' data-oid="uj5.bzb">
                          <td className='p-2 font-bold' data-oid="fj.x4yn">
                            {index + 1}
                          </td>
                          <td className='p-2' data-oid=":w3_l.j">
                            {performer.name}
                          </td>
                          <td className='p-2' data-oid="nubtqwv">
                            {performer.department}
                          </td>
                          <td className='p-2' data-oid="rilopqi">
                            <Badge variant='secondary' data-oid="-d:dbs-">
                              {performer.score}
                            </Badge>
                          </td>
                          <td className='p-2' data-oid="3fxqnvm">
                            {performer.percentileRank}%
                          </td>
                          <td className='p-2' data-oid="7_1s0ua">
                            <div
                          className='flex items-center space-x-1' data-oid="8tbq8ol">


                              {performer.trending === 'up' &&
                          <TrendingUp
                            className='h-4 w-4 text-green-500' data-oid="0-1wzt_" />


                          }
                              {performer.trending === 'down' &&
                          <TrendingDown
                            className='h-4 w-4 text-red-500' data-oid="4gf-cuw" />


                          }
                              <span
                            className={`text-sm ${
                            performer.trending === 'up' ?
                            'text-green-600' :
                            performer.trending === 'down' ?
                            'text-red-600' :
                            'text-gray-600'}`
                            } data-oid="j1c:eth">


                                {performer.changePercent > 0 ? '+' : ''}
                                {performer.changePercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          }

          {/* Insights Panel */}
          <Card data-oid="t.t3rd-">
            <CardHeader data-oid="9p3mj41">
              <CardTitle data-oid="9u_ixvt">Key Insights</CardTitle>
            </CardHeader>
            <CardContent data-oid="_i9jcvq">
              <div
                className='grid grid-cols-1 md:grid-cols-2 gap-6' data-oid="he_vnm.">


                <div data-oid="omlw3c8">
                  <h4 className='font-medium mb-3' data-oid="s:d.x9n">
                    Cross-Industry Trends
                  </h4>
                  <ul className='space-y-2' data-oid=".uu07v7">
                    {dashboardData.crossIndustryComparison.insights.crossIndustryTrends.map(
                      (trend, index) =>
                      <li
                        key={index}
                        className='text-sm text-gray-600 flex items-start' data-oid="2otcc9z">


                          <span
                          className='w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0' data-oid="11zxov1">

                        </span>
                          {trend}
                        </li>

                    )}
                  </ul>
                </div>
                <div data-oid="i8mwdh3">
                  <h4 className='font-medium mb-3' data-oid="o8jwvf5">
                    Opportunity Areas
                  </h4>
                  <ul className='space-y-2' data-oid="okv0pdw">
                    {dashboardData.crossIndustryComparison.insights.opportunityAreas.map(
                      (area, index) =>
                      <li
                        key={index}
                        className='text-sm text-gray-600 flex items-start' data-oid="z33j-ew">


                          <span
                          className='w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0' data-oid="6vibfc2">

                        </span>
                          {area}
                        </li>

                    )}
                  </ul>
                </div>
              </div>

              <div className='mt-6 pt-6 border-t' data-oid="o9mfit_">
                <div
                  className='grid grid-cols-1 md:grid-cols-3 gap-4' data-oid="k93eg_e">


                  <div className='text-center' data-oid="uzn-isd">
                    <div className='text-sm text-gray-500' data-oid="n56xofe">
                      Fastest Improving
                    </div>
                    <div className='font-medium' data-oid="1usur0m">
                      {INDUSTRY_DISPLAY_NAMES[
                      dashboardData.crossIndustryComparison.insights.
                      fastestImprovingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                      dashboardData.crossIndustryComparison.insights.
                      fastestImprovingIndustry}
                    </div>
                  </div>
                  <div className='text-center' data-oid="qv0n._e">
                    <div className='text-sm text-gray-500' data-oid="8o60_m9">
                      Most Consistent
                    </div>
                    <div className='font-medium' data-oid="d:76taz">
                      {INDUSTRY_DISPLAY_NAMES[
                      dashboardData.crossIndustryComparison.insights.
                      mostConsistentIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                      dashboardData.crossIndustryComparison.insights.
                      mostConsistentIndustry}
                    </div>
                  </div>
                  <div className='text-center' data-oid="fg.g2o_">
                    <div className='text-sm text-gray-500' data-oid="53gz.im">
                      Top Performing
                    </div>
                    <div className='font-medium' data-oid="0z0l1sp">
                      {INDUSTRY_DISPLAY_NAMES[
                      dashboardData.crossIndustryComparison.insights.
                      highestPerformingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                      dashboardData.crossIndustryComparison.insights.
                      highestPerformingIndustry}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default CrossIndustryPerformanceDashboard;