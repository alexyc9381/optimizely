import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const ModelsPage: React.FC = () => {
  const models = [
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
  ];

  return (
    <DashboardLayout title='AI Models - Universal AI Platform'>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>AI Models</h1>
            <p className='text-sm text-gray-500 mt-1'>
              Manage and monitor your AI models across all industries and use
              cases
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            <button className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium'>
              Import Model
            </button>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
              Train New Model
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Total Models
                </p>
                <p className='text-2xl font-bold text-gray-900'>24</p>
                <p className='text-xs text-green-600 mt-1'>+3 this month</p>
              </div>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Active Models
                </p>
                <p className='text-2xl font-bold text-gray-900'>18</p>
                <p className='text-xs text-blue-600 mt-1'>
                  75% deployment rate
                </p>
              </div>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Average Accuracy
                </p>
                <p className='text-2xl font-bold text-gray-900'>94.2%</p>
                <p className='text-xs text-green-600 mt-1'>+2.1% improvement</p>
              </div>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Total Predictions
                </p>
                <p className='text-2xl font-bold text-gray-900'>1,547,832</p>
                <p className='text-xs text-green-600 mt-1'>+15.3% this week</p>
              </div>
              <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-orange-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Models Table */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Model Inventory
            </h3>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>
                    Model Name
                  </th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>
                    Type
                  </th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>
                    Industry
                  </th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>
                    Status
                  </th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>
                    Accuracy
                  </th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>
                    Usage
                  </th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>
                    Version
                  </th>
                  <th className='text-left py-3 px-6 font-medium text-gray-700'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {models.map(model => (
                  <tr
                    key={model.id}
                    className='border-b border-gray-100 hover:bg-gray-50'
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
                          <p className='font-medium text-gray-900'>
                            {model.name}
                          </p>
                          <p className='text-sm text-gray-500'>
                            Machine Learning Model
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                        {model.type}
                      </span>
                    </td>
                    <td className='py-4 px-6'>
                      <span className='text-gray-900'>{model.industry}</span>
                    </td>
                    <td className='py-4 px-6'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          model.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {model.status}
                      </span>
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center'>
                        <span className='text-gray-900 font-medium'>
                          {model.accuracy}%
                        </span>
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
                      <span className='text-gray-900 font-mono text-sm'>
                        {model.version}
                      </span>
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center space-x-2'>
                        <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                          View
                        </button>
                        <button className='text-gray-600 hover:text-gray-700 text-sm font-medium'>
                          Edit
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
                <svg
                  className='w-4 h-4 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Model Insights
                </h3>
                <p className='text-sm text-gray-600'>Performance analytics</p>
              </div>
            </div>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
              View Performance
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ModelsPage;
