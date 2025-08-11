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
import TrainModelModal from '../../components/modals/TrainModelModal';
import { AIModel, apiClient } from '../../src/services/apiClient';

const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showTrainModal, setShowTrainModal] = useState(false);

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

  const handleTrainingStarted = (jobId: string) => {
    console.log('Training job started:', jobId);
    // You could add a notification here or update the UI to show training status
    alert(`Training job ${jobId} has been started successfully!`);
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
        return 'bg-blue-100 text-blue-800';
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
        data-oid='_5qvjca'
      >
        <div
          className='flex items-center justify-center h-64'
          data-oid='6x_jsqg'
        >
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
            data-oid='a5qlwfx'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title='AI Models - Universal AI Platform'
      data-oid='0eqmsti'
    >
      <div className='space-y-6' data-oid='ib_8mnr'>
        {error && (
          <div
            className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'
            data-oid='p93fwz8'
          >
            <div className='flex' data-oid='9tuggjb'>
              <div className='flex-shrink-0' data-oid='z4.t75h'>
                <svg
                  className='h-5 w-5 text-yellow-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  data-oid='97hzw9d'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                    data-oid='wa0oevy'
                  />
                </svg>
              </div>
              <div className='ml-3' data-oid='h-t7o75'>
                <p className='text-sm text-yellow-700' data-oid='ccphkpc'>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between' data-oid='-4r3pme'>
          <div data-oid='chptn:o'>
            <h1 className='text-2xl font-bold text-gray-900' data-oid='faulq:6'>
              AI Models
            </h1>
            <p className='text-sm text-gray-500 mt-1' data-oid='_563h25'>
              Manage and monitor your AI models across all industries and use
              cases
            </p>
          </div>

          <div className='flex items-center space-x-3' data-oid='7ltwo37'>
            <button
              className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
              data-oid='5w.sye6'
            >
              <Settings className='h-4 w-4' data-oid='08-66om' />
              <span data-oid='e4mnosn'>Import Model</span>
            </button>
            <button
              onClick={() => setShowTrainModal(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
              data-oid='8ktyx54'
            >
              <Brain className='h-4 w-4' data-oid='h8-6xb7' />
              <span data-oid='xl98i-h'>Train New Model</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div
          className='grid grid-cols-1 md:grid-cols-4 gap-6'
          data-oid='068o1mc'
        >
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='23h8d83'
          >
            <div className='flex items-center' data-oid='bb8hywc'>
              <div className='flex-1' data-oid='ei08--5'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='lbpk9zo'
                >
                  Total Models
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='9qdk1._'
                >
                  {totalModels}
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='5nljpr1'>
                  +3 this month
                </p>
              </div>
              <div
                className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='dmfd5nv'
              >
                <Brain className='w-4 h-4 text-blue-600' data-oid='94-rpy3' />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='j90-riy'
          >
            <div className='flex items-center' data-oid='ck1r:yl'>
              <div className='flex-1' data-oid='rlyku:l'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='iwnam.f'
                >
                  Active Models
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='p9w13u0'
                >
                  {activeModels}
                </p>
                <p className='text-xs text-blue-600 mt-1' data-oid='tt_v:-1'>
                  {((activeModels / totalModels) * 100).toFixed(0)}% deployment
                  rate
                </p>
              </div>
              <div
                className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='yoj_x63'
              >
                <CheckCircle
                  className='w-4 h-4 text-green-600'
                  data-oid='wam7oh1'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='l382lbb'
          >
            <div className='flex items-center' data-oid='bzkehsl'>
              <div className='flex-1' data-oid='nschnsg'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='fuxc9_b'
                >
                  Average Accuracy
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='rj1sc-8'
                >
                  {avgAccuracy}%
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='hsg9mkd'>
                  +2.1% improvement
                </p>
              </div>
              <div
                className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid=':cy1375'
              >
                <TrendingUp
                  className='w-4 h-4 text-blue-600'
                  data-oid='e694_0l'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='unfsyzg'
          >
            <div className='flex items-center' data-oid='gccxpyf'>
              <div className='flex-1' data-oid='hz:-3va'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='lrjcw48'
                >
                  Total Predictions
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='5n:y-_2'
                >
                  {totalPredictions.toLocaleString()}
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='auu1hh-'>
                  +15.3% this week
                </p>
              </div>
              <div
                className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'
                data-oid='3luf5zq'
              >
                <Activity
                  className='w-4 h-4 text-orange-600'
                  data-oid='65lo4j-'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Models Table */}
        <div
          className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'
          data-oid='roj05:5'
        >
          <div
            className='px-6 py-4 border-b border-gray-200'
            data-oid='8at4eq4'
          >
            <h3
              className='text-lg font-semibold text-gray-900'
              data-oid='.up5397'
            >
              Model Inventory
            </h3>
          </div>

          <div className='overflow-x-auto' data-oid='tz91w9a'>
            <table className='w-full' data-oid='3w_z9d7'>
              <thead className='bg-gray-50' data-oid='w-ijgf2'>
                <tr data-oid='s3vokz8'>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='pq0nhga'
                  >
                    Model Name
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='fca:1ar'
                  >
                    Type
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='5vs-:6o'
                  >
                    Industry
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='dhn_u1o'
                  >
                    Status
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='d4wdilz'
                  >
                    Accuracy
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='n:gda2_'
                  >
                    Usage
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='-c-t6hm'
                  >
                    Version
                  </th>
                  <th
                    className='text-left py-3 px-6 font-medium text-gray-700'
                    data-oid='ja1jt4j'
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody data-oid='o0ljw9p'>
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
                    data-oid='yfczigr'
                  >
                    <td className='py-4 px-6' data-oid='c4r2h8d'>
                      <div className='flex items-center' data-oid='p291qay'>
                        <div
                          className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3'
                          data-oid='x7s9ium'
                        >
                          <span
                            className='text-white font-medium text-xs'
                            data-oid='9k0nddz'
                          >
                            {model.name
                              .split(' ')
                              .map(word => word[0])
                              .join('')
                              .substring(0, 2)}
                          </span>
                        </div>
                        <div data-oid='560zr34'>
                          <p
                            className='font-medium text-gray-900'
                            data-oid='919st3g'
                          >
                            {model.name}
                          </p>
                          <p
                            className='text-sm text-gray-500'
                            data-oid='o0my6o9'
                          >
                            Machine Learning Model
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6' data-oid='poasi7b'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(model.type)}`}
                        data-oid='_t7pjfk'
                      >
                        {model.type}
                      </span>
                    </td>
                    <td className='py-4 px-6' data-oid='lgpj.l5'>
                      <span className='text-gray-900' data-oid='35t.yov'>
                        {model.industry}
                      </span>
                    </td>
                    <td className='py-4 px-6' data-oid='6zg6xuc'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}
                        data-oid='164c_ef'
                      >
                        {model.status}
                      </span>
                    </td>
                    <td className='py-4 px-6' data-oid='m-73u6-'>
                      <div className='flex items-center' data-oid='z5-p_72'>
                        <span
                          className='text-gray-900 font-medium'
                          data-oid='2ne_lvb'
                        >
                          {model.accuracy}%
                        </span>
                        <div
                          className='ml-2 w-16 bg-gray-200 rounded-full h-2'
                          data-oid='531fgf0'
                        >
                          <div
                            className='bg-green-600 h-2 rounded-full'
                            style={{ width: `${model.accuracy}%` }}
                            data-oid='yya150j'
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6' data-oid='sbblgwu'>
                      <div className='flex items-center' data-oid='2pg3yl0'>
                        <span className='text-gray-900' data-oid='3p43ic0'>
                          {model.usage}%
                        </span>
                        <div
                          className='ml-2 w-12 bg-gray-200 rounded-full h-2'
                          data-oid='l:36n-y'
                        >
                          <div
                            className='bg-blue-600 h-2 rounded-full'
                            style={{ width: `${model.usage}%` }}
                            data-oid='o3tpk__'
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6' data-oid='_3qx8d4'>
                      <span
                        className='text-gray-900 font-mono text-sm'
                        data-oid='_0gqqq8'
                      >
                        {model.version}
                      </span>
                    </td>
                    <td className='py-4 px-6' data-oid='4d20rbj'>
                      <div
                        className='flex items-center space-x-2'
                        data-oid='u7ndinr'
                      >
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            // Handle view action
                          }}
                          className='text-blue-600 hover:text-blue-700 p-1 rounded transition-colors'
                          title='View Details'
                          data-oid='yf1seq3'
                        >
                          <Eye className='h-4 w-4' data-oid='r8bp77z' />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            // Handle edit action
                          }}
                          className='text-gray-600 hover:text-gray-700 p-1 rounded transition-colors'
                          title='Edit Model'
                          data-oid='gpcc1md'
                        >
                          <Edit2 className='h-4 w-4' data-oid='o73uaif' />
                        </button>
                        {model.status === 'Active' ? (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleModelAction('pause', model.id);
                            }}
                            className='text-yellow-600 hover:text-yellow-700 p-1 rounded transition-colors'
                            title='Pause Model'
                            data-oid='9b8m3og'
                          >
                            <Pause className='h-4 w-4' data-oid='vbba2oy' />
                          </button>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleModelAction('activate', model.id);
                            }}
                            className='text-green-600 hover:text-green-700 p-1 rounded transition-colors'
                            title='Activate Model'
                            data-oid='shd56jr'
                          >
                            <Play className='h-4 w-4' data-oid='6jw:4ne' />
                          </button>
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleModelAction('delete', model.id);
                          }}
                          className='text-red-600 hover:text-red-700 p-1 rounded transition-colors'
                          title='Delete Model'
                          data-oid='s6cep4m'
                        >
                          <Trash2 className='h-4 w-4' data-oid='lo.d6jy' />
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
          data-oid='nlqjf53'
        >
          <div
            className='flex items-center justify-between mb-6'
            data-oid='o2377is'
          >
            <div className='flex items-center' data-oid='-xm7teq'>
              <div
                className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='-lmn4f-'
              >
                <Brain className='w-4 h-4 text-blue-600' data-oid='.:al060' />
              </div>
              <div className='ml-3' data-oid='ot:fl1m'>
                <h3
                  className='text-lg font-semibold text-gray-900'
                  data-oid='9xgfm-u'
                >
                  Model Insights
                </h3>
                <p className='text-sm text-gray-600' data-oid='31153gq'>
                  Performance analytics and recommendations
                </p>
              </div>
            </div>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
              data-oid='swb6mky'
            >
              <TrendingUp className='h-4 w-4' data-oid='ffhro:w' />
              <span data-oid='t08bu4u'>View Performance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Training Modal */}
      <TrainModelModal
        isOpen={showTrainModal}
        onClose={() => setShowTrainModal(false)}
        onTrainingStarted={handleTrainingStarted}
      />
    </DashboardLayout>
  );
};

export default ModelsPage;
