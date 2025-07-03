import {
  Activity,
  Brain,
  CheckCircle,
  Edit2,
  Eye,
  Pause,
  Play,
  Settings,
  Trash2,
  TrendingUp,
} from 'lucide-react';
/* eslint-disable no-undef */
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
          setModels(prev =>
            prev.map(model =>
              model.id === modelId ? { ...model, status: 'Active' } : model
            )
          );
          break;
        case 'pause':
          await apiClient.updateModel(modelId, { status: 'Paused' });
          setModels(prev =>
            prev.map(model =>
              model.id === modelId ? { ...model, status: 'Paused' } : model
            )
          );
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
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Training':
        return 'bg-yellow-100 text-yellow-800';
      case 'Paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Optimization':
        return 'bg-blue-100 text-blue-800';
      case 'Prediction':
        return 'bg-purple-100 text-purple-800';
      case 'Classification':
        return 'bg-green-100 text-green-800';
      case 'Risk Analysis':
        return 'bg-orange-100 text-orange-800';
      case 'Quality Control':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate metrics from actual data
  const totalModels = models.length;
  const activeModels = models.filter(m => m.status === 'Active').length;
  const avgAccuracy =
    models.length > 0
      ? (
          models.reduce((sum, m) => sum + m.accuracy, 0) / models.length
        ).toFixed(1)
      : '0';
  const totalPredictions = models.reduce((sum, m) => sum + m.usage * 1000, 0);

  if (loading) {
    return (
      <DashboardLayout
        title='AI Models - Universal AI Platform'
        data-oid='7w791.o'
      >
        <div
          className='flex items-center justify-center h-64'
          data-oid='j33gt8-'
        >
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
            data-oid='45sxg5k'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title='AI Models - Universal AI Platform'
      data-oid='ijhstbp'
    >
      <div className='space-y-6' data-oid='8mku-_1'>
        {error && (
          <div
            className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'
            data-oid='wjlv_zg'
          >
            <div className='flex' data-oid='rp9izwu'>
              <div className='flex-shrink-0' data-oid='wvk4n6.'>
                <svg
                  className='h-5 w-5 text-yellow-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  data-oid='g0wggr8'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                    data-oid='jq_zv.v'
                  />
                </svg>
              </div>
              <div className='ml-3' data-oid='b-244r3'>
                <p className='text-sm text-yellow-700' data-oid='q_s6jg0'>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between' data-oid='x-1tu-5'>
          <div data-oid='ynrs88_'>
            <h1 className='text-2xl font-bold text-gray-900' data-oid='pty3n.o'>
              AI Models
            </h1>
            <p className='text-sm text-gray-500 mt-1' data-oid='woso:i4'>
              Manage and monitor your AI models across all industries and use
              cases
            </p>
          </div>

          <div className='flex items-center space-x-3' data-oid='6jvkt4s'>
            <button
              className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
              data-oid='tlz1a:g'
            >
              <Settings className='h-4 w-4' data-oid='z0:j3kr' />
              <span data-oid='aif8siw'>Import Model</span>
            </button>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
              data-oid='-b_lktv'
            >
              <Brain className='h-4 w-4' data-oid='ryseko5' />
              <span data-oid='5ja-s.c'>Train New Model</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div
          className='grid grid-cols-1 md:grid-cols-4 gap-6'
          data-oid='1fzks5s'
        >
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='znwh53b'
          >
            <div className='flex items-center' data-oid='aqvvd6h'>
              <div className='flex-1' data-oid='.827za7'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='k5qvbcv'
                >
                  Total Models
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='2sd.ahh'
                >
                  {totalModels}
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='u5-16q:'>
                  +3 this month
                </p>
              </div>
              <div
                className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='j3947i2'
              >
                <Brain className='w-4 h-4 text-blue-600' data-oid='0x2:9nv' />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='o2dqaf_'
          >
            <div className='flex items-center' data-oid='_vofsda'>
              <div className='flex-1' data-oid='n_dgvqw'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='.x8qfha'
                >
                  Active Models
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='uon_fqg'
                >
                  {activeModels}
                </p>
                <p className='text-xs text-blue-600 mt-1' data-oid='143r7vd'>
                  {((activeModels / totalModels) * 100).toFixed(0)}% deployment
                  rate
                </p>
              </div>
              <div
                className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='9kkb7lw'
              >
                <CheckCircle
                  className='w-4 h-4 text-green-600'
                  data-oid='37pzqh1'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='qu3x6nu'
          >
            <div className='flex items-center' data-oid='k.77njn'>
              <div className='flex-1' data-oid='vft84n9'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='w7647j2'
                >
                  Average Accuracy
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='g5e8_rg'
                >
                  {avgAccuracy}%
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='xqk17j:'>
                  +2.1% improvement
                </p>
              </div>
              <div
                className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='ur3nh7p'
              >
                <TrendingUp
                  className='w-4 h-4 text-blue-600'
                  data-oid='2a7vqe.'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='8hy59dp'
          >
            <div className='flex items-center' data-oid='daf6mpv'>
              <div className='flex-1' data-oid='2t9q_ic'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='ovxxpeo'
                >
                  Total Predictions
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='dhsob0q'
                >
                  {totalPredictions.toLocaleString()}
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='8r7.9ya'>
                  +15.3% this week
                </p>
              </div>
              <div
                className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'
                data-oid='-6p7gvy'
              >
                <Activity
                  className='w-4 h-4 text-orange-600'
                  data-oid='5mt9npd'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Models Table */}
        <div
          className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'
          data-oid='lkhcwc1'
        >
          <div
            className='px-6 py-4 border-b border-gray-200'
            data-oid='qd_sc77'
          >
            <h3
              className='text-lg font-semibold text-gray-900'
              data-oid='8makqfg'
            >
              Model Inventory
            </h3>
          </div>

          <div className='overflow-x-auto' data-oid='h23i-q8'>
            <table className='w-full' data-oid='grhrps1'>
              <thead className='bg-gray-50' data-oid=':quilzn'>
                <tr data-oid='8rv8eib'>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='62td8h.'
                  >
                    Model Name
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='11bnpfb'
                  >
                    Type
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='w_3lhqa'
                  >
                    Industry
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='0r0bqcr'
                  >
                    Status
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='z3ffom8'
                  >
                    Accuracy
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='2g1sw44'
                  >
                    Usage
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='b3l1.pb'
                  >
                    Version
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='z80.1fk'
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody data-oid='wrfol.w'>
                {models.map(model => (
                  <tr
                    key={model.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedModel === model.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() =>
                      setSelectedModel(
                        selectedModel === model.id ? null : model.id
                      )
                    }
                    data-oid='yuiq3l7'
                  >
                    <td className='py-4 px-6' data-oid='vxabhj7'>
                      <div className='flex items-center' data-oid='j5t8z15'>
                        <div
                          className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3'
                          data-oid='nx5vmpx'
                        >
                          <span
                            className='text-white font-medium text-xs'
                            data-oid='9_kw_n7'
                          >
                            {model.name
                              .split(' ')
                              .map(word => word[0])
                              .join('')
                              .substring(0, 2)}
                          </span>
                        </div>
                        <div data-oid='-o0sffa'>
                          <p
                            className='font-medium text-gray-900'
                            data-oid='g4ed9eq'
                          >
                            {model.name}
                          </p>
                          <p
                            className='text-sm text-gray-500'
                            data-oid='9fm6_2g'
                          >
                            Machine Learning Model
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6' data-oid='.m4ebkd'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(model.type)}`}
                        data-oid='amugu0c'
                      >
                        {model.type}
                      </span>
                    </td>
                    <td className='py-4 px-6' data-oid='31ffzyo'>
                      <span className='text-gray-900' data-oid='cd6wtar'>
                        {model.industry}
                      </span>
                    </td>
                    <td className='py-4 px-6' data-oid='5zoumhq'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}
                        data-oid='v.6cra1'
                      >
                        {model.status}
                      </span>
                    </td>
                    <td className='py-4 px-6' data-oid='-mscuqe'>
                      <div className='flex items-center' data-oid='98c3rhu'>
                        <span
                          className='text-gray-900 font-medium'
                          data-oid='my69vmq'
                        >
                          {model.accuracy}%
                        </span>
                        <div
                          className='ml-2 w-16 bg-gray-200 rounded-full h-2'
                          data-oid='gad-t05'
                        >
                          <div
                            className='bg-green-600 h-2 rounded-full'
                            style={{ width: `${model.accuracy}%` }}
                            data-oid='wv_gtu-'
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6' data-oid='650nxux'>
                      <div className='flex items-center' data-oid='a:ihdy_'>
                        <span className='text-gray-900' data-oid='nhrqfb0'>
                          {model.usage}%
                        </span>
                        <div
                          className='ml-2 w-12 bg-gray-200 rounded-full h-2'
                          data-oid='4.om8m1'
                        >
                          <div
                            className='bg-blue-600 h-2 rounded-full'
                            style={{ width: `${model.usage}%` }}
                            data-oid='n..n8ac'
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6' data-oid='no74wxc'>
                      <span
                        className='text-gray-900 font-mono text-sm'
                        data-oid='.ih3h4r'
                      >
                        {model.version}
                      </span>
                    </td>
                    <td className='py-4 px-6' data-oid='-7qrr8.'>
                      <div
                        className='flex items-center space-x-2'
                        data-oid='7er-k:6'
                      >
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            // Handle view action
                          }}
                          className='text-blue-600 hover:text-blue-700 p-1 rounded transition-colors'
                          title='View Details'
                          data-oid='oi0x5:v'
                        >
                          <Eye className='h-4 w-4' data-oid='7s2npob' />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            // Handle edit action
                          }}
                          className='text-gray-600 hover:text-gray-700 p-1 rounded transition-colors'
                          title='Edit Model'
                          data-oid='kpsatz4'
                        >
                          <Edit2 className='h-4 w-4' data-oid='yp6-5s1' />
                        </button>
                        {model.status === 'Active' ? (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleModelAction('pause', model.id);
                            }}
                            className='text-yellow-600 hover:text-yellow-700 p-1 rounded transition-colors'
                            title='Pause Model'
                            data-oid='eqx2o6v'
                          >
                            <Pause className='h-4 w-4' data-oid='x1po0nm' />
                          </button>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleModelAction('activate', model.id);
                            }}
                            className='text-green-600 hover:text-green-700 p-1 rounded transition-colors'
                            title='Activate Model'
                            data-oid='seyeiyg'
                          >
                            <Play className='h-4 w-4' data-oid='q:.4z1i' />
                          </button>
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleModelAction('delete', model.id);
                          }}
                          className='text-red-600 hover:text-red-700 p-1 rounded transition-colors'
                          title='Delete Model'
                          data-oid='v9kcslb'
                        >
                          <Trash2 className='h-4 w-4' data-oid='526nrnt' />
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
        <div
          className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
          data-oid='o7nn25n'
        >
          <div
            className='flex items-center justify-between mb-6'
            data-oid=':yay_..'
          >
            <div className='flex items-center' data-oid='y4an-e:'>
              <div
                className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='3px4v22'
              >
                <Brain className='w-4 h-4 text-blue-600' data-oid='7vouz.x' />
              </div>
              <div className='ml-3' data-oid='_hm_im5'>
                <h3
                  className='text-lg font-semibold text-gray-900'
                  data-oid='zdi-b01'
                >
                  Model Insights
                </h3>
                <p className='text-sm text-gray-600' data-oid='29is7ab'>
                  Performance analytics and recommendations
                </p>
              </div>
            </div>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
              data-oid='en1baff'
            >
              <TrendingUp className='h-4 w-4' data-oid='pq7e:x_' />
              <span data-oid='s-7lze5'>View Performance</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ModelsPage;
