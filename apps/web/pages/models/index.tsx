import { Activity, Brain, CheckCircle, Edit2, Eye, Pause, Play, Settings, Trash2, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { AIModel, apiClient } from '../../src/services/apiClient';

const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Mock data as fallback
  const mockModels: AIModel[] = [
    {
      id: '1',
      name: 'SaaS Conversion Optimizer',
      type: 'Optimization',
      status: 'Active',
      accuracy: 96.7,
      industry: 'SaaS',
      usage: 89,
      version: 'v2.1.4',
    },
    {
      id: '2',
      name: 'E-commerce Revenue Predictor',
      type: 'Prediction',
      status: 'Active',
      accuracy: 94.3,
      industry: 'E-commerce',
      usage: 76,
      version: 'v1.8.2',
    },
    {
      id: '3',
      name: 'Healthcare Engagement Classifier',
      type: 'Classification',
      status: 'Training',
      accuracy: 91.8,
      industry: 'Healthcare',
      usage: 45,
      version: 'v3.0.1',
    },
    {
      id: '4',
      name: 'FinTech Risk Assessment Model',
      type: 'Risk Analysis',
      status: 'Active',
      accuracy: 98.2,
      industry: 'FinTech',
      usage: 92,
      version: 'v1.5.7',
    },
    {
      id: '5',
      name: 'Manufacturing Quality Predictor',
      type: 'Quality Control',
      status: 'Paused',
      accuracy: 88.9,
      industry: 'Manufacturing',
      usage: 34,
      version: 'v2.0.3',
    },
  ];

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getModels();
        setModels(data);
      } catch (err) {
        console.warn('Failed to fetch models from API, using mock data:', err);
        setError('Unable to connect to backend. Showing demo data.');
        setModels(mockModels);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleModelAction = async (action: string, modelId: string) => {
    try {
      switch (action) {
        case 'activate':
          await apiClient.updateModel(modelId, { status: 'Active' });
          setModels(prev => prev.map(model =>
            model.id === modelId ? { ...model, status: 'Active' } : model
          ));
          break;
        case 'pause':
          await apiClient.updateModel(modelId, { status: 'Paused' });
          setModels(prev => prev.map(model =>
            model.id === modelId ? { ...model, status: 'Paused' } : model
          ));
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this model?')) {
            await apiClient.deleteModel(modelId);
            setModels(prev => prev.filter(model => model.id !== modelId));
          }
          break;
      }
    } catch (err) {
      console.error(`Failed to ${action} model:`, err);
      alert(`Failed to ${action} model. Please try again.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Training': return 'bg-yellow-100 text-yellow-800';
      case 'Paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Optimization': return 'bg-blue-100 text-blue-800';
      case 'Prediction': return 'bg-purple-100 text-purple-800';
      case 'Classification': return 'bg-green-100 text-green-800';
      case 'Risk Analysis': return 'bg-orange-100 text-orange-800';
      case 'Quality Control': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate metrics from actual data
  const totalModels = models.length;
  const activeModels = models.filter(m => m.status === 'Active').length;
  const avgAccuracy = models.length > 0 ?
    (models.reduce((sum, m) => sum + m.accuracy, 0) / models.length).toFixed(1) : '0';
  const totalPredictions = models.reduce((sum, m) => sum + (m.usage * 1000), 0);

  if (loading) {
    return (
      <DashboardLayout title='AI Models - Universal AI Platform'>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='AI Models - Universal AI Platform'>
      <div className='space-y-6'>
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>AI Models</h1>
            <p className='text-sm text-gray-500 mt-1'>
              Manage and monitor your AI models across all industries and use cases
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            <button className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'>
              <Settings className="h-4 w-4" />
              <span>Import Model</span>
            </button>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'>
              <Brain className="h-4 w-4" />
              <span>Train New Model</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Total Models</p>
                <p className='text-2xl font-bold text-gray-900'>{totalModels}</p>
                <p className='text-xs text-green-600 mt-1'>+3 this month</p>
              </div>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Brain className='w-4 h-4 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Active Models</p>
                <p className='text-2xl font-bold text-gray-900'>{activeModels}</p>
                <p className='text-xs text-blue-600 mt-1'>
                  {((activeModels / totalModels) * 100).toFixed(0)}% deployment rate
                </p>
              </div>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-4 h-4 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Average Accuracy</p>
                <p className='text-2xl font-bold text-gray-900'>{avgAccuracy}%</p>
                <p className='text-xs text-green-600 mt-1'>+2.1% improvement</p>
              </div>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-4 h-4 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Total Predictions</p>
                <p className='text-2xl font-bold text-gray-900'>{totalPredictions.toLocaleString()}</p>
                <p className='text-xs text-green-600 mt-1'>+15.3% this week</p>
              </div>
              <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
                <Activity className='w-4 h-4 text-orange-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Models Table */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900'>Model Inventory</h3>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>Model Name</th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>Type</th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>Industry</th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>Status</th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>Accuracy</th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>Usage</th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>Version</th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map(model => (
                  <tr
                    key={model.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedModel === model.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
                  >
                    <td className='py-4 px-6'>
                      <div className='flex items-center'>
                        <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3'>
                          <span className='text-white font-medium text-xs'>
                            {model.name
                              .split(' ')
                              .map(word => word[0])
                              .join('')
                              .substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className='font-medium text-gray-900'>{model.name}</p>
                          <p className='text-sm text-gray-500'>Machine Learning Model</p>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(model.type)}`}>
                        {model.type}
                      </span>
                    </td>
                    <td className='py-4 px-6'>
                      <span className='text-gray-900'>{model.industry}</span>
                    </td>
                    <td className='py-4 px-6'>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center'>
                        <span className='text-gray-900 font-medium'>{model.accuracy}%</span>
                        <div className='ml-2 w-16 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-green-600 h-2 rounded-full'
                            style={{ width: `${model.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center'>
                        <span className='text-gray-900'>{model.usage}%</span>
                        <div className='ml-2 w-12 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-blue-600 h-2 rounded-full'
                            style={{ width: `${model.usage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <span className='text-gray-900 font-mono text-sm'>{model.version}</span>
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle view action
                          }}
                          className='text-blue-600 hover:text-blue-700 p-1 rounded transition-colors'
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle edit action
                          }}
                          className='text-gray-600 hover:text-gray-700 p-1 rounded transition-colors'
                          title="Edit Model"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {model.status === 'Active' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModelAction('pause', model.id);
                            }}
                            className='text-yellow-600 hover:text-yellow-700 p-1 rounded transition-colors'
                            title="Pause Model"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModelAction('activate', model.id);
                            }}
                            className='text-green-600 hover:text-green-700 p-1 rounded transition-colors'
                            title="Activate Model"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelAction('delete', model.id);
                          }}
                          className='text-red-600 hover:text-red-700 p-1 rounded transition-colors'
                          title="Delete Model"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Insights Card */}
        <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Brain className='w-4 h-4 text-blue-600' />
              </div>
              <div className='ml-3'>
                <h3 className='text-lg font-semibold text-gray-900'>Model Insights</h3>
                <p className='text-sm text-gray-600'>Performance analytics and recommendations</p>
              </div>
            </div>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'>
              <TrendingUp className="h-4 w-4" />
              <span>View Performance</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ModelsPage;
