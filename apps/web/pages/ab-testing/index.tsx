import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';

interface ABTest {
  id: string;
  name: string;
  status: 'Running' | 'Paused' | 'Completed' | 'Draft';
  industry: string;
  startDate: string;
  endDate?: string;
  visitors: number;
  conversionRate: {
    control: number;
    variant: number;
  };
  confidence: number;
  uplift: number;
}

const ABTestingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'drafts'>(
    'active'
  );

  // Mock data - replace with API calls
  const mockTests: ABTest[] = [
    {
      id: '1',
      name: 'SaaS Pricing Page Optimization',
      status: 'Running',
      industry: 'SaaS',
      startDate: '2024-01-15',
      visitors: 5420,
      conversionRate: { control: 8.2, variant: 12.4 },
      confidence: 98,
      uplift: 51.2,
    },
    {
      id: '2',
      name: 'College Consulting CTA Button',
      status: 'Running',
      industry: 'Education',
      startDate: '2024-01-20',
      visitors: 3210,
      conversionRate: { control: 6.1, variant: 8.7 },
      confidence: 87,
      uplift: 42.6,
    },
    {
      id: '3',
      name: 'FinTech Dashboard Layout',
      status: 'Completed',
      industry: 'FinTech',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      visitors: 8920,
      conversionRate: { control: 11.3, variant: 15.2 },
      confidence: 99,
      uplift: 34.5,
    },
    {
      id: '4',
      name: 'Healthcare Contact Form',
      status: 'Draft',
      industry: 'Healthcare',
      startDate: '2024-02-01',
      visitors: 0,
      conversionRate: { control: 0, variant: 0 },
      confidence: 0,
      uplift: 0,
    },
  ];

  const filteredTests = mockTests.filter(test => {
    switch (activeTab) {
      case 'active':
        return test.status === 'Running' || test.status === 'Paused';
      case 'completed':
        return test.status === 'Completed';
      case 'drafts':
        return test.status === 'Draft';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return 'bg-green-100 text-green-800';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const TestCard: React.FC<{ test: ABTest }> = ({ test }) => (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
      <div className='flex items-start justify-between mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-1'>
            {test.name}
          </h3>
          <div className='flex items-center space-x-2'>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}
            >
              {test.status}
            </span>
            <span className='text-sm text-gray-500'>{test.industry}</span>
          </div>
        </div>
        <div className='flex space-x-2'>
          <button className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg'>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
              />
            </svg>
          </button>
          <button className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg'>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
          </button>
        </div>
      </div>

      {test.status !== 'Draft' && (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
          <div>
            <p className='text-sm text-gray-500'>Visitors</p>
            <p className='text-lg font-semibold text-gray-900'>
              {test.visitors.toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Control CR</p>
            <p className='text-lg font-semibold text-gray-900'>
              {test.conversionRate.control}%
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Variant CR</p>
            <p className='text-lg font-semibold text-gray-900'>
              {test.conversionRate.variant}%
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Confidence</p>
            <p className='text-lg font-semibold text-gray-900'>
              {test.confidence}%
            </p>
          </div>
        </div>
      )}

      {test.status !== 'Draft' && test.uplift > 0 && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
          <div className='flex items-center'>
            <svg
              className='w-4 h-4 text-green-500 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
              />
            </svg>
            <span className='text-sm font-medium text-green-800'>
              +{test.uplift}% improvement over control
            </span>
          </div>
        </div>
      )}

      <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200'>
        <span className='text-sm text-gray-500'>
          Started: {new Date(test.startDate).toLocaleDateString()}
          {test.endDate &&
            ` • Ended: ${new Date(test.endDate).toLocaleDateString()}`}
        </span>
        <button className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
          View Details →
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout title='Universal AI Platform - A/B Testing'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>A/B Testing</h1>
            <p className='text-gray-600 mt-1'>
              Manage and monitor your A/B tests across all industries
            </p>
          </div>
          <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2'>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
            <span>Create New Test</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <svg
                  className='w-6 h-6 text-blue-600'
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
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Active Tests
                </p>
                <p className='text-2xl font-bold text-gray-900'>12</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <svg
                  className='w-6 h-6 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Avg. Uplift</p>
                <p className='text-2xl font-bold text-gray-900'>+24.3%</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Total Visitors
                </p>
                <p className='text-2xl font-bold text-gray-900'>47.2K</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-yellow-100 rounded-lg'>
                <svg
                  className='w-6 h-6 text-yellow-600'
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
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Confidence</p>
                <p className='text-2xl font-bold text-gray-900'>94.2%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            {[
              { key: 'active', label: 'Active Tests', count: 2 },
              { key: 'completed', label: 'Completed', count: 1 },
              { key: 'drafts', label: 'Drafts', count: 1 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className='ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs'>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Test Cards */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {filteredTests.map(test => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
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
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No tests found
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Get started by creating your first A/B test.
            </p>
            <div className='mt-6'>
              <button className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'>
                <svg
                  className='-ml-1 mr-2 h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                Create Test
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ABTestingPage;
