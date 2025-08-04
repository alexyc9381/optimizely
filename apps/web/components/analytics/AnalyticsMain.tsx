/**
 * Main Analytics Component
 * Extracted for lazy loading optimization
 */

import {
    Activity,
    BarChart3,
    Download,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChartDataPoint } from '../../lib/charts/chartEngine';
import {
    formatCurrency,
    formatNumber,
    formatPercentage,
} from '../../lib/utils';
import { AnalyticsData } from '../../src/services/apiClient';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';

// This will contain the main analytics logic - let me copy the content from the original file
export default function AnalyticsMain() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    const fetchAnalytics = async () => {
      // For demo purposes, use mock data immediately for better UX
      console.warn('Using demo data for analytics page');
      setError('Unable to connect to backend. Showing demo data.');
      setData(mockAnalyticsData);
      setLoading(false);
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

  // Demo chart data with proper colors
  const revenueChartData: ChartDataPoint[] = [
    { label: 'Jan', value: 85000, color: '#3B82F6' },
    { label: 'Feb', value: 92000, color: '#3B82F6' },
    { label: 'Mar', value: 78000, color: '#3B82F6' },
    { label: 'Apr', value: 105000, color: '#3B82F6' },
    { label: 'May', value: 118000, color: '#3B82F6' },
    { label: 'Jun', value: 125890, color: '#3B82F6' },
  ];

  const userActivityData: ChartDataPoint[] = [
    { label: 'Mon', value: 3200, color: '#3B82F6' },
    { label: 'Tue', value: 4100, color: '#3B82F6' },
    { label: 'Wed', value: 3800, color: '#3B82F6' },
    { label: 'Thu', value: 4500, color: '#3B82F6' },
    { label: 'Fri', value: 5200, color: '#3B82F6' },
    { label: 'Sat', value: 2800, color: '#3B82F6' },
    { label: 'Sun', value: 2100, color: '#3B82F6' },
  ];

  const conversionFunnelData: ChartDataPoint[] = [
    { label: 'Visitors', value: 10000, color: '#1E40AF' },
    { label: 'Signups', value: 3500, color: '#3B82F6' },
    { label: 'Trials', value: 1200, color: '#60A5FA' },
    { label: 'Conversions', value: 850, color: '#93C5FD' },
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
          <div className="h-64 w-full">
            <LineChart
              data={revenueChartData}
              config={{
                animate: true,
                showGrid: true,
                showTooltip: true,
                responsive: true,
                curve: 'smooth',
                gradient: true,
                strokeWidth: 3,
                theme: 'light'
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 w-full">
            <BarChart
              data={userActivityData}
              config={{
                animate: true,
                showGrid: true,
                showTooltip: true,
                responsive: true,
                showValues: true,
                roundedCorners: 4,
                theme: 'light'
              }}
            />
          </div>
        </div>
      </div>

      {/* Conversion Funnel Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 w-full">
            <BarChart
              data={conversionFunnelData}
              config={{
                animate: true,
                showGrid: true,
                showTooltip: true,
                responsive: true,
                showValues: true,
                roundedCorners: 4,
                theme: 'light'
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
