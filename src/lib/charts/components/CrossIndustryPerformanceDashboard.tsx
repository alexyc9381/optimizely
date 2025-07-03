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
  YAxis } from
'recharts';

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

interface DashboardProps {
  className?: string;
  apiBaseUrl?: string;
}

const CrossIndustryPerformanceDashboard: React.FC<DashboardProps> = ({
  className = '',
  apiBaseUrl = '/api/v1'
}) => {
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
        `${apiBaseUrl}/cross-industry-performance/dashboard?${params}`
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
      <div
        className={`flex items-center justify-center h-64 ${className}`} data-oid="1dkf6rm">


        <div className='text-center' data-oid="3pwy0h5">
          <div
            className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4' data-oid="t05bt1-">

          </div>
          <p data-oid="qyt6n2s">Loading performance analytics...</p>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`} data-oid="rn4dnto">


        <h3 className='text-red-800 font-medium' data-oid="_rc70_d">
          Error Loading Dashboard
        </h3>
        <p className='text-red-600 mt-2' data-oid="o.-dg5f">
          {error}
        </p>
        <button
          onClick={refreshData}
          className='mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700' data-oid="a-yh5-2">


          Retry
        </button>
      </div>);

  }

  if (!dashboardData) {
    return (
      <div className={`text-center py-8 ${className}`} data-oid="9m149ma">
        <p data-oid="t8zvi67">No data available</p>
      </div>);

  }

  return (
    <div className={`space-y-6 ${className}`} data-oid="4ezsk1t">
      {/* Header */}
      <div className='flex justify-between items-center' data-oid="fhmver-">
        <div data-oid="-y:1j_8">
          <h1 className='text-3xl font-bold text-gray-900' data-oid="0f14vyq">
            Cross-Industry Performance Analytics
          </h1>
          <p className='text-gray-500 mt-2' data-oid="52wu0th">
            Performance tracking across College Consulting, SaaS, Manufacturing,
            Healthcare, and FinTech
          </p>
        </div>
        <div className='flex items-center space-x-4' data-oid="xu:eb9q">
          <div className='text-sm text-gray-500' data-oid="36syf6_">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={refreshData}
            className='px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50'
            disabled={loading} data-oid="o.u-:ua">


            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6' data-oid="_bc9wqp">
        <div className='bg-white rounded-lg border p-6' data-oid="cfcy6f.">
          <div className='flex items-center justify-between' data-oid="p_9v-d-">
            <div data-oid="s3f-j79">
              <p
                className='text-sm font-medium text-gray-500' data-oid="vm0_zay">


                Total Performers
              </p>
              <p
                className='text-2xl font-bold text-gray-900' data-oid="eyfn_.0">


                {dashboardData.overallStats.totalPerformers.toLocaleString()}
              </p>
            </div>
            <div
              className='h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center' data-oid="p:e.1-l">


              <svg
                className='h-6 w-6 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24' data-oid="zbvvawa">


                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' data-oid="9otqgi5" />


              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border p-6' data-oid="potojo7">
          <div className='flex items-center justify-between' data-oid="y-dablk">
            <div data-oid="k9vacr.">
              <p
                className='text-sm font-medium text-gray-500' data-oid=".x0pdm8">


                Industries Tracked
              </p>
              <p
                className='text-2xl font-bold text-gray-900' data-oid="itwy_6.">


                {dashboardData.overallStats.industriesTracked}
              </p>
            </div>
            <div
              className='h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center' data-oid="53y:akm">


              <svg
                className='h-6 w-6 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24' data-oid="krpecwb">


                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' data-oid="imgguwq" />


              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border p-6' data-oid="vq98sgj">
          <div className='flex items-center justify-between' data-oid="87uv3hl">
            <div data-oid=":wk1oku">
              <p
                className='text-sm font-medium text-gray-500' data-oid="5msd5oh">


                Average Performance
              </p>
              <p
                className='text-2xl font-bold text-gray-900' data-oid="bjv70i6">


                {dashboardData.overallStats.averagePerformanceScore}
              </p>
            </div>
            <div
              className='h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center' data-oid="81sahe5">


              <svg
                className='h-6 w-6 text-yellow-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24' data-oid="8q9.zbo">


                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' data-oid="l3zmn5p" />


              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border p-6' data-oid="ap1iy7j">
          <div className='flex items-center justify-between' data-oid="kde.-zq">
            <div data-oid="h0c9l5e">
              <p
                className='text-sm font-medium text-gray-500' data-oid="qt1x5fi">


                Top Industry
              </p>
              <p className='text-lg font-bold text-gray-900' data-oid="5loxa23">
                {INDUSTRY_DISPLAY_NAMES[
                dashboardData.crossIndustryComparison.insights.
                highestPerformingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                dashboardData.crossIndustryComparison.insights.
                highestPerformingIndustry}
              </p>
            </div>
            <div
              className='h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center' data-oid="1gvr1fy">


              <svg
                className='h-6 w-6 text-purple-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24' data-oid="93t3r4i">


                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' data-oid="cij8x6w" />


              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Filter Tabs */}
      <div className='bg-white rounded-lg border' data-oid="zaca4-y">
        <div className='border-b border-gray-200' data-oid="b3rpq:v">
          <nav className='-mb-px flex space-x-8 px-6' data-oid="1jx8ojs">
            {[
            { id: null, label: 'All Industries' },
            { id: 'college_consulting', label: 'College Consulting' },
            { id: 'saas', label: 'SaaS' },
            { id: 'manufacturing', label: 'Manufacturing' },
            { id: 'healthcare', label: 'Healthcare' },
            { id: 'fintech', label: 'FinTech' }].
            map((tab) =>
            <button
              key={tab.id || 'all'}
              onClick={() => setSelectedIndustry(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              selectedIndustry === tab.id ?
              'border-blue-500 text-blue-600' :
              'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
              } data-oid="bt0872a">


                {tab.label}
              </button>
            )}
          </nav>
        </div>

        <div className='p-6 space-y-6' data-oid="rn5ebn-">
          {/* Industry Comparison Chart */}
          <div data-oid="yjhi9ya">
            <h3
              className='text-lg font-medium text-gray-900 mb-4' data-oid="3owh4nf">


              Industry Performance Comparison
            </h3>
            <ResponsiveContainer width='100%' height={400} data-oid="phc.biw">
              <BarChart data={industryComparisonData} data-oid="58wc-pb">
                <CartesianGrid strokeDasharray='3 3' data-oid="1.rz3dx" />
                <XAxis
                  dataKey='displayName'
                  angle={-45}
                  textAnchor='end'
                  height={80} data-oid="2hqf:my" />



                <YAxis data-oid="exucxz8" />
                <Tooltip
                  formatter={(value, name) => [value, 'Average Score']}
                  labelFormatter={(label) => `Industry: ${label}`} data-oid="7t19ub8" />



                <Bar
                  dataKey='averageScore'
                  fill='#8884d8'
                  radius={[4, 4, 0, 0]} data-oid="btigliz" />


              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6' data-oid="fypd92q">


            {/* Performance Level Distribution */}
            <div data-oid="yzus3uf">
              <h3
                className='text-lg font-medium text-gray-900 mb-4' data-oid="9oin696">


                Performance Level Distribution
              </h3>
              <ResponsiveContainer width='100%' height={300} data-oid="ck7pb.5">
                <PieChart data-oid="2:-whwx">
                  <Pie
                    data={performanceLevelData}
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='count'
                    label={({ level, count }) => `${level}: ${count}`} data-oid="dp16h0l">


                    {performanceLevelData.map((entry, index) =>
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color} data-oid="q6:_p8y" />


                    )}
                  </Pie>
                  <Tooltip data-oid=":ffk3fz" />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Industry Rankings */}
            <div data-oid="_6rg:pg">
              <h3
                className='text-lg font-medium text-gray-900 mb-4' data-oid="5h0glhu">


                Industry Rankings
              </h3>
              <div className='space-y-3' data-oid="3hc1dfg">
                {industryComparisonData.map((industry, index) =>
                <div
                  key={industry.industry}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg' data-oid=":h6m66x">


                    <div
                    className='flex items-center space-x-3' data-oid=":tts:hx">


                      <div
                      className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm' data-oid="r7jek1x">


                        {industry.rank}
                      </div>
                      <div data-oid="ih6yz4x">
                        <div className='font-medium' data-oid="6ymfc8o">
                          {industry.displayName}
                        </div>
                        <div
                        className='text-sm text-gray-500' data-oid="s6bi4t8">


                          {industry.performerCount} performers
                        </div>
                      </div>
                    </div>
                    <div className='text-right' data-oid="g1uop30">
                      <div className='font-bold text-lg' data-oid="-59925n">
                        {industry.averageScore}
                      </div>
                      <div className='text-sm text-gray-500' data-oid="-n2:rlb">
                        avg score
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Performers Table - Only show when industry is selected */}
          {selectedIndustry && dashboardData.industryData &&
          <div data-oid="leh8v:d">
              <h3
              className='text-lg font-medium text-gray-900 mb-4' data-oid="zadz807">


                Top Performers -{' '}
                {
              INDUSTRY_DISPLAY_NAMES[
              selectedIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES]

              }
              </h3>
              <div className='overflow-x-auto' data-oid="c8p_nkq">
                <table className='w-full border-collapse' data-oid="hgym_f4">
                  <thead data-oid="0k3x78g">
                    <tr className='border-b bg-gray-50' data-oid="3.:rukg">
                      <th
                      className='text-left p-3 font-medium' data-oid="yc6sjgn">


                        Rank
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="0j30gsj">


                        Name
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="ltnsho3">


                        Department
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="iqze7.6">


                        Score
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="hjilvzn">


                        Percentile
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="iizoia:">


                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody data-oid="rxe1a7w">
                    {topPerformersData.map((performer, index) =>
                  <tr
                    key={index}
                    className='border-b hover:bg-gray-50' data-oid="e8w80y4">


                        <td className='p-3 font-bold' data-oid="-3at7q8">
                          {index + 1}
                        </td>
                        <td className='p-3' data-oid="8cwr9lf">
                          {performer.name}
                        </td>
                        <td className='p-3' data-oid="qcwi7_b">
                          {performer.department}
                        </td>
                        <td className='p-3' data-oid="l-r2z:i">
                          <span
                        className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm' data-oid="1gi43k7">


                            {performer.score}
                          </span>
                        </td>
                        <td className='p-3' data-oid="fq:xdcu">
                          {performer.percentileRank}%
                        </td>
                        <td className='p-3' data-oid="ks65z08">
                          <div
                        className='flex items-center space-x-1' data-oid="h815g98">


                            {performer.trending === 'up' &&
                        <svg
                          className='h-4 w-4 text-green-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24' data-oid="kybnq0:">


                                <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' data-oid="yz0j:5r" />


                              </svg>
                        }
                            {performer.trending === 'down' &&
                        <svg
                          className='h-4 w-4 text-red-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24' data-oid="_ghs2mo">


                                <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' data-oid="zu8kqve" />


                              </svg>
                        }
                            <span
                          className={`text-sm ${
                          performer.trending === 'up' ?
                          'text-green-600' :
                          performer.trending === 'down' ?
                          'text-red-600' :
                          'text-gray-600'}`
                          } data-oid="gw4sk9f">


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
            </div>
          }

          {/* Insights Panel */}
          <div className='bg-gray-50 rounded-lg p-6' data-oid="1m_mhv9">
            <h3
              className='text-lg font-medium text-gray-900 mb-4' data-oid="aae803e">


              Key Insights
            </h3>
            <div
              className='grid grid-cols-1 md:grid-cols-2 gap-6' data-oid="9-_ju:e">


              <div data-oid="29rz2qt">
                <h4 className='font-medium mb-3' data-oid="7wrkbei">
                  Cross-Industry Trends
                </h4>
                <ul className='space-y-2' data-oid="mh1x6oe">
                  {dashboardData.crossIndustryComparison.insights.crossIndustryTrends.map(
                    (trend, index) =>
                    <li
                      key={index}
                      className='text-sm text-gray-600 flex items-start' data-oid=".mi7o7t">


                        <span
                        className='w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0' data-oid="452fjnv">

                      </span>
                        {trend}
                      </li>

                  )}
                </ul>
              </div>
              <div data-oid="x2beahe">
                <h4 className='font-medium mb-3' data-oid="5oi_op6">
                  Opportunity Areas
                </h4>
                <ul className='space-y-2' data-oid="__k4s5y">
                  {dashboardData.crossIndustryComparison.insights.opportunityAreas.map(
                    (area, index) =>
                    <li
                      key={index}
                      className='text-sm text-gray-600 flex items-start' data-oid="ly0bp2-">


                        <span
                        className='w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0' data-oid="aio.j64">

                      </span>
                        {area}
                      </li>

                  )}
                </ul>
              </div>
            </div>

            <div
              className='mt-6 pt-6 border-t border-gray-200' data-oid="rxz0x5f">


              <div
                className='grid grid-cols-1 md:grid-cols-3 gap-4' data-oid="dirmmvo">


                <div className='text-center' data-oid="jvr0n:z">
                  <div className='text-sm text-gray-500' data-oid="_21ubds">
                    Fastest Improving
                  </div>
                  <div className='font-medium' data-oid="h1s.y9d">
                    {INDUSTRY_DISPLAY_NAMES[
                    dashboardData.crossIndustryComparison.insights.
                    fastestImprovingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                    dashboardData.crossIndustryComparison.insights.
                    fastestImprovingIndustry}
                  </div>
                </div>
                <div className='text-center' data-oid="ag48em2">
                  <div className='text-sm text-gray-500' data-oid="1lg-k3k">
                    Most Consistent
                  </div>
                  <div className='font-medium' data-oid="8_sj4_b">
                    {INDUSTRY_DISPLAY_NAMES[
                    dashboardData.crossIndustryComparison.insights.
                    mostConsistentIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                    dashboardData.crossIndustryComparison.insights.
                    mostConsistentIndustry}
                  </div>
                </div>
                <div className='text-center' data-oid="64xakzl">
                  <div className='text-sm text-gray-500' data-oid="-vybotg">
                    Top Performing
                  </div>
                  <div className='font-medium' data-oid="j0j40zn">
                    {INDUSTRY_DISPLAY_NAMES[
                    dashboardData.crossIndustryComparison.insights.
                    highestPerformingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                    dashboardData.crossIndustryComparison.insights.
                    highestPerformingIndustry}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default CrossIndustryPerformanceDashboard;