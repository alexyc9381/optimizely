/**
 * Main Analytics Component
 * Extracted for lazy loading optimization
 */

import {
    Activity,
    BarChart3,
    DollarSign,
    Download,
    Target,
    TrendingUp,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    formatCurrency,
    formatNumber,
    formatPercentage,
} from '../../lib/utils';
import { AnalyticsData, apiClient } from '../../src/services/apiClient';
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { ChartDataPoint } from '../../lib/charts/chartEngine';

// This will contain the main analytics logic - let me copy the content from the original file
export default function AnalyticsMain() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analyticsData = await apiClient.getAnalytics();
        setData(analyticsData);
        setError(null);
      } catch (err) {
        console.warn('Failed to fetch analytics from API, using demo data:', err);
        setError('Unable to connect to backend. Showing demo data.');
        // Fallback to mock data if API fails
        setData(mockAnalyticsData);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedTimeRange, selectedMetric]);

  // Mock data fallback
  const mockAnalyticsData: AnalyticsData = {
    totalVisitors: 24789,
    conversionRate: 8.6,
    revenue: 125890,
    testsRunning: 12,
    avgTestDuration: 14,
    significantResults: 8
  };

  // Demo chart data
  const revenueChartData: ChartDataPoint[] = [
    { label: 'Jan', value: 85000 },
    { label: 'Feb', value: 92000 },
    { label: 'Mar', value: 78000 },
    { label: 'Apr', value: 105000 },
    { label: 'May', value: 118000 },
    { label: 'Jun', value: 125890 },
  ];

  const userActivityData: ChartDataPoint[] = [
    { label: 'Mon', value: 3200 },
    { label: 'Tue', value: 4100 },
    { label: 'Wed', value: 3800 },
    { label: 'Thu', value: 4500 },
    { label: 'Fri', value: 5200 },
    { label: 'Sat', value: 2800 },
    { label: 'Sun', value: 2100 },
  ];

  const industryPerformanceData: ChartDataPoint[] = [
    { label: 'SaaS', value: 24.5 },
    { label: 'E-commerce', value: 18.3 },
    { label: 'FinTech', value: 31.2 },
    { label: 'Healthcare', value: 15.7 },
    { label: 'Education', value: 22.8 },
  ];

  const conversionFunnelData: ChartDataPoint[] = [
    { label: 'Visitors', value: 10000 },
    { label: 'Signups', value: 3500 },
    { label: 'Trials', value: 1200 },
    { label: 'Conversions', value: 850 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  // Note: We don't return early on error anymore since we have demo data fallback

  return (
    <div className="space-y-6">
      {/* Error Warning Banner */}
      {error && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-yellow-400'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <p className='text-sm text-yellow-700'>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your performance and insights</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          {/* Export Button */}
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {data ? formatCurrency(data.revenue) : '$0'}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {data ? formatNumber(data.totalVisitors) : '0'}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8.2%</span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data ? formatPercentage(data.conversionRate) : '0%'}
              </p>
            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+3.1%</span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {data ? formatNumber(data.testsRunning) : '0'}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+15.3%</span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <LineChart 
              data={revenueChartData}
              config={{
                animate: true,
                showGrid: true,
                showTooltip: true,
                responsive: true,
                curve: 'smooth',
                gradient: true
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <BarChart 
              data={userActivityData}
              config={{
                animate: true,
                showGrid: true,
                showTooltip: true,
                responsive: true,
                showValues: true,
                roundedCorners: 4
              }}
            />
          </div>
        </div>
      </div>

      {/* Industry Performance Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Performance Comparison</h3>
        <div className="h-64 mb-6">
          <BarChart 
            data={industryPerformanceData}
            config={{
              animate: true,
              showGrid: true,
              showTooltip: true,
              responsive: true,
              showValues: true,
              orientation: 'horizontal',
              roundedCorners: 6
            }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-900">Top Performer</div>
            <div className="text-blue-700">FinTech: 31.2%</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-900">Industry Average</div>
            <div className="text-green-700">22.5%</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="font-semibold text-orange-900">Your Performance</div>
            <div className="text-orange-700">Above Average</div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <BarChart 
              data={conversionFunnelData}
              config={{
                animate: true,
                showGrid: true,
                showTooltip: true,
                responsive: true,
                showValues: true,
                roundedCorners: 4
              }}
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Visitor → Signup Rate</span>
              <span className="font-bold text-blue-600">35%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Signup → Trial Rate</span>
              <span className="font-bold text-green-600">34.3%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Trial → Conversion Rate</span>
              <span className="font-bold text-purple-600">70.8%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-medium text-blue-700">Overall Conversion Rate</span>
              <span className="font-bold text-blue-600">8.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
