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
        className={`flex items-center justify-center h-64 ${className}`} data-oid="1eun1lk">


        <div className='text-center' data-oid="ln9i6kd">
          <div
            className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4' data-oid="9:4-zdc">

          </div>
          <p data-oid="cym292-">Loading performance analytics...</p>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`} data-oid="56qiitv">


        <h3 className='text-red-800 font-medium' data-oid="2rshs_z">
          Error Loading Dashboard
        </h3>
        <p className='text-red-600 mt-2' data-oid="2riv3.2">
          {error}
        </p>
        <button
          onClick={refreshData}
          className='mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700' data-oid="j.13szq">


          Retry
        </button>
      </div>);

  }

  if (!dashboardData) {
    return (
      <div className={`text-center py-8 ${className}`} data-oid="huqc3s9">
        <p data-oid="2sf1koh">No data available</p>
      </div>);

  }

  return (
    <div className={`space-y-6 ${className}`} data-oid="qasf1fw">
      {/* Header */}
      <div className='flex justify-between items-center' data-oid="hwkbzlg">
        <div data-oid="-uoe9.n">
          <h1 className='text-3xl font-bold text-gray-900' data-oid="i57ygwu">
            Cross-Industry Performance Analytics
          </h1>
          <p className='text-gray-500 mt-2' data-oid="1mx8inh">
            Performance tracking across College Consulting, SaaS, Manufacturing,
            Healthcare, and FinTech
          </p>
        </div>
        <div className='flex items-center space-x-4' data-oid="ef0pobk">
          <div className='text-sm text-gray-500' data-oid="tdf2e:n">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={refreshData}
            className='px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50'
            disabled={loading} data-oid="e_izb6e">


            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6' data-oid="11lnidu">
        <div className='bg-white rounded-lg border p-6' data-oid="22szhia">
          <div className='flex items-center justify-between' data-oid="r33hr4z">
            <div data-oid="jfg7s:j">
              <p
                className='text-sm font-medium text-gray-500' data-oid="fawn3_z">


                Total Performers
              </p>
              <p
                className='text-2xl font-bold text-gray-900' data-oid="6:q97ij">


                {dashboardData.overallStats.totalPerformers.toLocaleString()}
              </p>
            </div>
            <div
              className='h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center' data-oid="j93z3bt">


              <svg
                className='h-6 w-6 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24' data-oid="bdn--fw">


                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' data-oid="aev0y0:" />


              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border p-6' data-oid="2yc34y4">
          <div className='flex items-center justify-between' data-oid="ccr3v3a">
            <div data-oid="kurjwtc">
              <p
                className='text-sm font-medium text-gray-500' data-oid="utbz19x">


                Industries Tracked
              </p>
              <p
                className='text-2xl font-bold text-gray-900' data-oid="yr3o91x">


                {dashboardData.overallStats.industriesTracked}
              </p>
            </div>
            <div
              className='h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center' data-oid="a:iux4m">


              <svg
                className='h-6 w-6 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24' data-oid="t9dmih.">


                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' data-oid="gk3mmek" />


              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border p-6' data-oid="0unc0cw">
          <div className='flex items-center justify-between' data-oid="9zpthx8">
            <div data-oid="72pg25w">
              <p
                className='text-sm font-medium text-gray-500' data-oid="nmye.xy">


                Average Performance
              </p>
              <p
                className='text-2xl font-bold text-gray-900' data-oid="bxq.75u">


                {dashboardData.overallStats.averagePerformanceScore}
              </p>
            </div>
            <div
              className='h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center' data-oid="j0efv7d">


              <svg
                className='h-6 w-6 text-yellow-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24' data-oid="3.rrzhk">


                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' data-oid="nnjkmud" />


              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border p-6' data-oid="_vg_11m">
          <div className='flex items-center justify-between' data-oid="36.fy.n">
            <div data-oid="a4odt1h">
              <p
                className='text-sm font-medium text-gray-500' data-oid="n0x6dve">


                Top Industry
              </p>
              <p className='text-lg font-bold text-gray-900' data-oid="uiwr4pb">
                {INDUSTRY_DISPLAY_NAMES[
                dashboardData.crossIndustryComparison.insights.
                highestPerformingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                dashboardData.crossIndustryComparison.insights.
                highestPerformingIndustry}
              </p>
            </div>
            <div
              className='h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center' data-oid="zedwim-">


              <svg
                className='h-6 w-6 text-purple-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24' data-oid="sa663f8">


                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' data-oid="e7vgqga" />


              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Filter Tabs */}
      <div className='bg-white rounded-lg border' data-oid="x2120wh">
        <div className='border-b border-gray-200' data-oid="ctxfp7h">
          <nav className='-mb-px flex space-x-8 px-6' data-oid="6pmtynd">
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
              } data-oid="1kzs:rx">


                {tab.label}
              </button>
            )}
          </nav>
        </div>

        <div className='p-6 space-y-6' data-oid="qb7eap2">
          {/* Industry Comparison Chart */}
          <div data-oid="emcuash">
            <h3
              className='text-lg font-medium text-gray-900 mb-4' data-oid="9tcfo..">


              Industry Performance Comparison
            </h3>
            <ResponsiveContainer width='100%' height={400} data-oid="9t06cmd">
              <BarChart data={industryComparisonData} data-oid="3.pikkz">
                <CartesianGrid strokeDasharray='3 3' data-oid="h92y-ue" />
                <XAxis
                  dataKey='displayName'
                  angle={-45}
                  textAnchor='end'
                  height={80} data-oid="ny81xht" />



                <YAxis data-oid="v_kdwsw" />
                <Tooltip
                  formatter={(value, name) => [value, 'Average Score']}
                  labelFormatter={(label) => `Industry: ${label}`} data-oid="jworfca" />



                <Bar
                  dataKey='averageScore'
                  fill='#8884d8'
                  radius={[4, 4, 0, 0]} data-oid="e7_u-gt" />


              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6' data-oid="8b5amh6">


            {/* Performance Level Distribution */}
            <div data-oid="z4:a8cu">
              <h3
                className='text-lg font-medium text-gray-900 mb-4' data-oid="8tdn7c7">


                Performance Level Distribution
              </h3>
              <ResponsiveContainer width='100%' height={300} data-oid="51qnbct">
                <PieChart data-oid="xg-9-1r">
                  <Pie
                    data={performanceLevelData}
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='count'
                    label={({ level, count }) => `${level}: ${count}`} data-oid="2ig0l8q">


                    {performanceLevelData.map((entry, index) =>
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color} data-oid="ll1ej53" />


                    )}
                  </Pie>
                  <Tooltip data-oid="odv0gan" />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Industry Rankings */}
            <div data-oid="j0:4wi1">
              <h3
                className='text-lg font-medium text-gray-900 mb-4' data-oid="x3kgopj">


                Industry Rankings
              </h3>
              <div className='space-y-3' data-oid=":nuzdo6">
                {industryComparisonData.map((industry, index) =>
                <div
                  key={industry.industry}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg' data-oid="i3exx.7">


                    <div
                    className='flex items-center space-x-3' data-oid="fw.fs6-">


                      <div
                      className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm' data-oid="4aop283">


                        {industry.rank}
                      </div>
                      <div data-oid="g.rfm-h">
                        <div className='font-medium' data-oid="ua.q_4w">
                          {industry.displayName}
                        </div>
                        <div
                        className='text-sm text-gray-500' data-oid="du2y85t">


                          {industry.performerCount} performers
                        </div>
                      </div>
                    </div>
                    <div className='text-right' data-oid="diw7-b2">
                      <div className='font-bold text-lg' data-oid="hoaa1a_">
                        {industry.averageScore}
                      </div>
                      <div className='text-sm text-gray-500' data-oid="9779bto">
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
          <div data-oid="0yk5w78">
              <h3
              className='text-lg font-medium text-gray-900 mb-4' data-oid="ea0tl3f">


                Top Performers -{' '}
                {
              INDUSTRY_DISPLAY_NAMES[
              selectedIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES]

              }
              </h3>
              <div className='overflow-x-auto' data-oid="248w9mh">
                <table className='w-full border-collapse' data-oid="h:1j81r">
                  <thead data-oid="v.04kmf">
                    <tr className='border-b bg-gray-50' data-oid="z8muh.p">
                      <th
                      className='text-left p-3 font-medium' data-oid=":327p-p">


                        Rank
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="mdp9gu7">


                        Name
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="x535tlp">


                        Department
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="9na.z73">


                        Score
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="-ozdf5b">


                        Percentile
                      </th>
                      <th
                      className='text-left p-3 font-medium' data-oid="659.8l.">


                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody data-oid="tm1bo9v">
                    {topPerformersData.map((performer, index) =>
                  <tr
                    key={index}
                    className='border-b hover:bg-gray-50' data-oid="-zu-hfm">


                        <td className='p-3 font-bold' data-oid="-ns2eh_">
                          {index + 1}
                        </td>
                        <td className='p-3' data-oid="kqhdpnr">
                          {performer.name}
                        </td>
                        <td className='p-3' data-oid="zxj3nwq">
                          {performer.department}
                        </td>
                        <td className='p-3' data-oid="_8lf.v5">
                          <span
                        className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm' data-oid="o_hd15_">


                            {performer.score}
                          </span>
                        </td>
                        <td className='p-3' data-oid=":2j9dsd">
                          {performer.percentileRank}%
                        </td>
                        <td className='p-3' data-oid="13d0ami">
                          <div
                        className='flex items-center space-x-1' data-oid="2qr5w:6">


                            {performer.trending === 'up' &&
                        <svg
                          className='h-4 w-4 text-green-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24' data-oid="hu:islk">


                                <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' data-oid="47za3jx" />


                              </svg>
                        }
                            {performer.trending === 'down' &&
                        <svg
                          className='h-4 w-4 text-red-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24' data-oid="ja6rl:e">


                                <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' data-oid="621o9xd" />


                              </svg>
                        }
                            <span
                          className={`text-sm ${
                          performer.trending === 'up' ?
                          'text-green-600' :
                          performer.trending === 'down' ?
                          'text-red-600' :
                          'text-gray-600'}`
                          } data-oid="15cv2ry">


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
          <div className='bg-gray-50 rounded-lg p-6' data-oid="zjtusnj">
            <h3
              className='text-lg font-medium text-gray-900 mb-4' data-oid="-0pzb.6">


              Key Insights
            </h3>
            <div
              className='grid grid-cols-1 md:grid-cols-2 gap-6' data-oid="i4i0l9r">


              <div data-oid="l7v9gi:">
                <h4 className='font-medium mb-3' data-oid="nympmm4">
                  Cross-Industry Trends
                </h4>
                <ul className='space-y-2' data-oid="a4d3tp4">
                  {dashboardData.crossIndustryComparison.insights.crossIndustryTrends.map(
                    (trend, index) =>
                    <li
                      key={index}
                      className='text-sm text-gray-600 flex items-start' data-oid="d5r1li6">


                        <span
                        className='w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0' data-oid="qdvg7zu">

                      </span>
                        {trend}
                      </li>

                  )}
                </ul>
              </div>
              <div data-oid="4ps03lb">
                <h4 className='font-medium mb-3' data-oid="q5nbw6v">
                  Opportunity Areas
                </h4>
                <ul className='space-y-2' data-oid="4rv7lun">
                  {dashboardData.crossIndustryComparison.insights.opportunityAreas.map(
                    (area, index) =>
                    <li
                      key={index}
                      className='text-sm text-gray-600 flex items-start' data-oid="zsdtwy4">


                        <span
                        className='w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0' data-oid="tghz_ef">

                      </span>
                        {area}
                      </li>

                  )}
                </ul>
              </div>
            </div>

            <div
              className='mt-6 pt-6 border-t border-gray-200' data-oid="r2hkmkm">


              <div
                className='grid grid-cols-1 md:grid-cols-3 gap-4' data-oid=".u6rxf4">


                <div className='text-center' data-oid="xl7cn0s">
                  <div className='text-sm text-gray-500' data-oid="sj3bp9p">
                    Fastest Improving
                  </div>
                  <div className='font-medium' data-oid="8qzqqyr">
                    {INDUSTRY_DISPLAY_NAMES[
                    dashboardData.crossIndustryComparison.insights.
                    fastestImprovingIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                    dashboardData.crossIndustryComparison.insights.
                    fastestImprovingIndustry}
                  </div>
                </div>
                <div className='text-center' data-oid="d14hkyy">
                  <div className='text-sm text-gray-500' data-oid="jhawxs5">
                    Most Consistent
                  </div>
                  <div className='font-medium' data-oid="lbcfnk2">
                    {INDUSTRY_DISPLAY_NAMES[
                    dashboardData.crossIndustryComparison.insights.
                    mostConsistentIndustry as keyof typeof INDUSTRY_DISPLAY_NAMES] ||

                    dashboardData.crossIndustryComparison.insights.
                    mostConsistentIndustry}
                  </div>
                </div>
                <div className='text-center' data-oid="s.d6b.b">
                  <div className='text-sm text-gray-500' data-oid="ai31o6.">
                    Top Performing
                  </div>
                  <div className='font-medium' data-oid="izs6kvj">
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