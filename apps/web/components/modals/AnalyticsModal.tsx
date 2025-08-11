import React from 'react';
import { X, BarChart3, TrendingUp, Users, Target, Calendar } from 'lucide-react';
import { ABTest } from '../../src/services/apiClient';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: ABTest | null;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, test }) => {
  if (!isOpen || !test) return null;

  // Mock analytics data - replace with real API call
  const analyticsData = {
    totalVisitors: test.visitors,
    conversionRates: test.conversionRate,
    confidence: test.confidence,
    uplift: test.uplift,
    timeSeriesData: [
      { date: '2024-01-01', control: 8.2, variant: 9.1 },
      { date: '2024-01-02', control: 8.4, variant: 9.3 },
      { date: '2024-01-03', control: 8.1, variant: 9.5 },
      { date: '2024-01-04', control: 8.6, variant: 9.8 },
      { date: '2024-01-05', control: 8.3, variant: 9.6 },
    ],
    demographics: {
      desktop: { control: 8.1, variant: 9.4 },
      mobile: { control: 8.5, variant: 9.7 },
      tablet: { control: 7.9, variant: 9.2 },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{test.name} - Analytics</h2>
              <p className="text-sm text-gray-500">Detailed performance metrics and insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Key Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.totalVisitors.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confidence Level</p>
                    <p className="text-2xl font-bold text-blue-900">{analyticsData.confidence}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uplift</p>
                    <p className="text-2xl font-bold text-green-900">+{analyticsData.uplift}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Test Duration</p>
                    <p className="text-2xl font-bold text-purple-900">14 days</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Rates Comparison */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Rate Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Control</h4>
                <div className="flex items-end space-x-4">
                  <div className="text-3xl font-bold text-gray-700">{analyticsData.conversionRates.control}%</div>
                  <div className="text-sm text-gray-500 mb-1">conversion rate</div>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${analyticsData.conversionRates.control * 10}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Variant</h4>
                <div className="flex items-end space-x-4">
                  <div className="text-3xl font-bold text-blue-700">{analyticsData.conversionRates.variant}%</div>
                  <div className="text-sm text-gray-500 mb-1">conversion rate</div>
                </div>
                <div className="mt-3 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analyticsData.conversionRates.variant * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance by Device */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance by Device</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Device</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Control</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Variant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(analyticsData.demographics).map(([device, data]) => (
                    <tr key={device} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900 capitalize">{device}</td>
                      <td className="py-3 px-4 text-gray-700">{data.control}%</td>
                      <td className="py-3 px-4 text-blue-700 font-medium">{data.variant}%</td>
                      <td className="py-3 px-4">
                        <span className="text-green-600 font-medium">
                          +{((data.variant - data.control) / data.control * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time Series Chart Placeholder */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Rate Over Time</h3>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Time series chart would be rendered here</p>
              <p className="text-sm text-gray-500 mt-2">
                Showing daily conversion rates for control vs variant over the test period
              </p>
            </div>
          </div>

          {/* Test Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    test.status === 'Running' ? 'bg-green-100 text-green-800' :
                    test.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
                    test.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {test.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Industry:</span>
                  <span className="ml-2 text-gray-900">{test.industry}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Start Date:</span>
                  <span className="ml-2 text-gray-900">{new Date(test.startDate).toLocaleDateString()}</span>
                </div>
                {test.endDate && (
                  <div>
                    <span className="font-medium text-gray-600">End Date:</span>
                    <span className="ml-2 text-gray-900">{new Date(test.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;
