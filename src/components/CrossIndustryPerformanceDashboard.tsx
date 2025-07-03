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
      <div className='flex items-center justify-center h-64' data-oid="wyb.i86">
        <div className='text-center' data-oid="u6w:54h">
          <RefreshCw
            className='h-8 w-8 animate-spin mx-auto mb-4' data-oid="hqna5io" />


          <p data-oid="z8rk-av">Loading performance analytics...</p>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div
        className='bg-red-50 border border-red-200 rounded-lg p-6' data-oid="a.l8z76">


        <h3 className='text-red-800 font-medium' data-oid="xxgtk.n">
          Error Loading Dashboard
        </h3>
        <p className='text-red-600 mt-2' data-oid="u-.jp1x">
          {error}
        </p>
        <Button onClick={refreshData} className='mt-4' data-oid="jimqh_v">
          <RefreshCw className='h-4 w-4 mr-2' data-oid="p8s7epu" />
          Retry
        </Button>
      </div>);

  }

  if (!dashboardData) {
    return (
      <div className='text-center py-8' data-oid="lu:r942">
        <p data-oid="3vkibvp">No data available</p>
      </div>);

  }

  return (
    <div className='space-y-6' data-oid="9fxy5m3">
      {/* Header */}
      <div className='flex justify-between items-center' data-oid="y8p6ysg">
        <div data-oid="1nyzy.2">
          <h1 className='text-3xl font-bold text-gray-900' data-oid="d396s86">
            Cross-Industry Performance Analytics
          </h1>
          <p className='text-gray-500 mt-2' data-oid="kd59mrv">
            Performance tracking across College Consulting, SaaS, Manufacturing,
            Healthcare, and FinTech
          </p>
        </div>
        <div className='flex items-center space-x-4' data-oid="63w8o03">
          <div className='text-sm text-gray-500' data-oid="tjx6dfq">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            onClick={refreshData}
            variant='outline'
            size='sm' data-oid=":6yxylx">


            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} data-oid="-r0rgcs" />


            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6' data-oid="118a:7s">
        <Card data-oid="39fdo_f">
          <CardHeader
            className='flex flex-row items-center justify-between space-y-0 pb-2' data-oid="64iwhlc">


            <CardTitle className='text-sm font-medium' data-oid="o_y4h:k">
              Total Performers
            </CardTitle>
            <Users
              className='h-4 w-4 text-muted-foreground' data-oid="fc2mr78" />


          </CardHeader>
          <CardContent data-oid="d.dpizt">
            <div className='text-2xl font-bold' data-oid="6uhgk5v">
              {dashboardData.overallStats.totalPerformers.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="0hj2ou4">
          <CardHeader
            className='flex flex-row items-center justify-between space-y-0 pb-2' data-oid="k1-w2m5">


            <CardTitle className='text-sm font-medium' data-oid=".sbv.dx">
              Industries Tracked
            </CardTitle>
            <Target
              className='h-4 w-4 text-muted-foreground' data-oid="-_x4ezg" />


          </CardHeader>
          <CardContent data-oid="acy-x9m">
            <div className='text-2xl font-bold' data-oid="3jw-:oi">
              {dashboardData.overallStats.industriesTracked}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="y09gs13">
          <CardHeader
            className='flex flex-row items-center justify-between space-y-0 pb-2' data-oid="a3f8ir1">


            <CardTitle className='text-sm font-medium' data-oid="9ccwn2d">
              Average Performance Score
            </CardTitle>
            <Award
              className='h-4 w-4 text-muted-foreground' data-oid="z.y2gtt" />


          </CardHeader>
          <CardContent data-oid="yen3xmn">
            <div className='text-2xl font-bold' data-oid="o4-kj9t">
              {dashboardData.overallStats.averagePerformanceScore}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="24yuy0z">
          <CardHeader
            className='flex flex-row items-center justify-between space-y-0 pb-2' data-oid="mzx3fn9">


            <CardTitle className='text-sm font-medium' data-oid="7:bbjk6">
              Top Industry
            </CardTitle>
            <TrendingUp
              className='h-4 w-4 text-muted-foreground' data-oid="2hq52ki" />


          </CardHeader>
          <CardContent data-oid="85ql61t">
            <div className='text-lg font-bold' data-oid="si0alqg">
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
        } data-oid="n4flp4w">


        <TabsList className='grid w-full grid-cols-6' data-oid="8.d2dy6">
          <TabsTrigger value='all' data-oid="-oa40v7">
            All Industries
          </TabsTrigger>
          <TabsTrigger value='college_consulting' data-oid="t445qki">
            College Consulting
          </TabsTrigger>
          <TabsTrigger value='saas' data-oid="2cs07bf">
            SaaS
          </TabsTrigger>
          <TabsTrigger value='manufacturing' data-oid="9qy:yi:">
            Manufacturing
          </TabsTrigger>
          <TabsTrigger value='healthcare' data-oid="x0-jl8d">
            Healthcare
          </TabsTrigger>
          <TabsTrigger value='fintech' data-oid="mg7.son">
            FinTech
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value={selectedIndustry || 'all'}
          className='space-y-6' data-oid="rjdmi05">


          {/* Industry Comparison Chart */}
          <Card data-oid="fng5gri">
            <CardHeader data-oid="50p:75.">
              <CardTitle data-oid="p3vxgkd">
                Industry Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="7erxk-:">
              <ResponsiveContainer width='100%' height={400} data-oid="lyu2w4g">
                <BarChart data={industryComparisonData} data-oid="9cws:._">
                  <CartesianGrid strokeDasharray='3 3' data-oid="3g_2u-a" />
                  <XAxis
                    dataKey='displayName'
                    angle={-45}
                    textAnchor='end'
                    height={80} data-oid="7i514tb" />



                  <YAxis data-oid="3p91o-:" />
                  <Tooltip
                    formatter={(value, name) => [value, 'Average Score']}
                    labelFormatter={(label) => `Industry: ${label}`} data-oid="9v1a.3j" />



                  <Bar
                    dataKey='averageScore'
                    fill='#8884d8'
                    radius={[4, 4, 0, 0]} data-oid="3c4ourb" />


                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6' data-oid="52_.ptv">


            {/* Performance Level Distribution */}
            <Card data-oid=".remtly">
              <CardHeader data-oid="1wai3dj">
                <CardTitle data-oid="qcciu::">
                  Performance Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="xpwc-k.">
                <ResponsiveContainer
                  width='100%'
                  height={300} data-oid="a-wbajr">


                  <PieChart data-oid="6gmhsf4">
                    <Pie
                      data={performanceLevelData}
                      cx='50%'
                      cy='50%'
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='count'
                      label={({ level, count }) => `${level}: ${count}`} data-oid="jd:vaac">


                      {performanceLevelData.map((entry, index) =>
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color} data-oid="-uddk3k" />


                      )}
                    </Pie>
                    <Tooltip data-oid="4c6qi_l" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Industry Rankings */}
            <Card data-oid="rcdu-6z">
              <CardHeader data-oid="8g_2vfv">
                <CardTitle data-oid=".b6-i86">Industry Rankings</CardTitle>
              </CardHeader>
              <CardContent data-oid="8:g_uvy">
                <div className='space-y-3' data-oid="gbjf3uj">
                  {industryComparisonData.map((industry, index) =>
                  <div
                    key={industry.industry}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg' data-oid="536ngag">


                      <div
                      className='flex items-center space-x-3' data-oid="fr9iweh">


                        <div
                        className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm' data-oid="4uhfg56">


                          {industry.rank}
                        </div>
                        <div data-oid="92o1p-w">
                          <div className='font-medium' data-oid="2c55.1r">
                            {industry.displayName}
                          </div>
                          <div
                          className='text-sm text-gray-500' data-oid="uwwi7mf">


                            {industry.performerCount} performers
                          </div>
                        </div>
                      </div>
                      <div className='text-right' data-oid="gugv104">
                        <div className='font-bold text-lg' data-oid=".sopq.r">
                          {industry.averageScore}
                        </div>
                        <div
                        className='text-sm text-gray-500' data-oid=".gtkore">


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
          <Card data-oid="qy3d9fn">
              <CardHeader data-oid="c1n4trz">
                <CardTitle data-oid="ncqo4_1">
                  Top Performers -{' '}
                  {
                INDUSTRY_DISPLAY_NAMES[
                selectedIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES]

                }
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="qj8xxbv">
                <div className='overflow-x-auto' data-oid="sp3-f3f">
                  <table className='w-full' data-oid="v0a.9d2">
                    <thead data-oid="f4e.2rl">
                      <tr className='border-b' data-oid="h-.ryps">
                        <th className='text-left p-2' data-oid="25jpenm">
                          Rank
                        </th>
                        <th className='text-left p-2' data-oid="v3jg4u-">
                          Name
                        </th>
                        <th className='text-left p-2' data-oid="ebi2val">
                          Department
                        </th>
                        <th className='text-left p-2' data-oid="frsc2u2">
                          Score
                        </th>
                        <th className='text-left p-2' data-oid="ik:y:h4">
                          Percentile
                        </th>
                        <th className='text-left p-2' data-oid=".0uf8fh">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody data-oid="686xu3l">
                      {topPerformersData.map((performer, index) =>
                    <tr key={index} className='border-b' data-oid="tyt_hts">
                          <td className='p-2 font-bold' data-oid="p58bu_9">
                            {index + 1}
                          </td>
                          <td className='p-2' data-oid="l_825:e">
                            {performer.name}
                          </td>
                          <td className='p-2' data-oid="rdc11r-">
                            {performer.department}
                          </td>
                          <td className='p-2' data-oid="q6rl-q.">
                            <Badge variant='secondary' data-oid="-ao3k7h">
                              {performer.score}
                            </Badge>
                          </td>
                          <td className='p-2' data-oid="6w374.q">
                            {performer.percentileRank}%
                          </td>
                          <td className='p-2' data-oid="9_xeqte">
                            <div
                          className='flex items-center space-x-1' data-oid="1z92viv">


                              {performer.trending === 'up' &&
                          <TrendingUp
                            className='h-4 w-4 text-green-500' data-oid="aqfqn1-" />


                          }
                              {performer.trending === 'down' &&
                          <TrendingDown
                            className='h-4 w-4 text-red-500' data-oid="gqwseyb" />


                          }
                              <span
                            className={`text-sm ${
                            performer.trending === 'up' ?
                            'text-green-600' :
                            performer.trending === 'down' ?
                            'text-red-600' :
                            'text-gray-600'}`
                            } data-oid=".r68xxi">


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
          <Card data-oid="89w8n8_">
            <CardHeader data-oid="s521qxs">
              <CardTitle data-oid="6adi28z">Key Insights</CardTitle>
            </CardHeader>
            <CardContent data-oid="pe:2l74">
              <div
                className='grid grid-cols-1 md:grid-cols-2 gap-6' data-oid="xsrj1x_">


                <div data-oid="mt78bun">
                  <h4 className='font-medium mb-3' data-oid="z8mpgwk">
                    Cross-Industry Trends
                  </h4>
                  <ul className='space-y-2' data-oid="_9rp4qg">
                    {dashboardData.crossIndustryComparison.insights.crossIndustryTrends.map(
                      (trend, index) =>
                      <li
                        key={index}
                        className='text-sm text-gray-600 flex items-start' data-oid="43x1vv1">


                          <span
                          className='w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0' data-oid="ue:pyax">

                        </span>
                          {trend}
                        </li>

                    )}
                  </ul>
                </div>
                <div data-oid="hk2.:7e">
                  <h4 className='font-medium mb-3' data-oid="-v7q3t_">
                    Opportunity Areas
                  </h4>
                  <ul className='space-y-2' data-oid="_ur6z1v">
                    {dashboardData.crossIndustryComparison.insights.opportunityAreas.map(
                      (area, index) =>
                      <li
                        key={index}
                        className='text-sm text-gray-600 flex items-start' data-oid="9isnaqs">


                          <span
                          className='w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0' data-oid="4c_5j:m">

                        </span>
                          {area}
                        </li>

                    )}
                  </ul>
                </div>
              </div>

              <div className='mt-6 pt-6 border-t' data-oid="88ejpjn">
                <div
                  className='grid grid-cols-1 md:grid-cols-3 gap-4' data-oid="0w43u0w">


                  <div className='text-center' data-oid="fkmdp63">
                    <div className='text-sm text-gray-500' data-oid="p.1wf8d">
                      Fastest Improving
                    </div>
                    <div className='font-medium' data-oid="q6yyos5">
                      {INDUSTRY_DISPLAY_NAMES[
                      dashboardData.crossIndustryComparison.insights.
                      fastestImprovingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                      dashboardData.crossIndustryComparison.insights.
                      fastestImprovingIndustry}
                    </div>
                  </div>
                  <div className='text-center' data-oid="f6ucmxp">
                    <div className='text-sm text-gray-500' data-oid=".v5wqge">
                      Most Consistent
                    </div>
                    <div className='font-medium' data-oid="bwcq_3p">
                      {INDUSTRY_DISPLAY_NAMES[
                      dashboardData.crossIndustryComparison.insights.
                      mostConsistentIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                      dashboardData.crossIndustryComparison.insights.
                      mostConsistentIndustry}
                    </div>
                  </div>
                  <div className='text-center' data-oid="4pa8ups">
                    <div className='text-sm text-gray-500' data-oid="hd9yf9v">
                      Top Performing
                    </div>
                    <div className='font-medium' data-oid="-d.izbd">
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