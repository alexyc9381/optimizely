import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const IntegrationsPage: React.FC = () => {
  const [apiKey] = useState('ai_live_1234567890abcdef');
  const [selectedTab, setSelectedTab] = useState<
    'website' | 'api' | 'webhooks' | 'apps'
  >('website');

  const integrations = [
    {
      name: 'WordPress',
      logo: '🔵',
      description: 'Easy plugin installation for WordPress sites',
      status: 'Available',
      category: 'CMS',
    },
    {
      name: 'Shopify',
      logo: '🛍️',
      description: 'E-commerce integration for product testing',
      status: 'Available',
      category: 'E-commerce',
    },
    {
      name: 'React/Next.js',
      logo: '⚛️',
      description: 'JavaScript SDK for React applications',
      status: 'Available',
      category: 'Framework',
    },
    {
      name: 'Google Analytics',
      logo: '📊',
      description: 'Sync test data with GA4',
      status: 'Available',
      category: 'Analytics',
    },
    {
      name: 'Stripe',
      logo: '💳',
      description: 'Revenue tracking for financial tests',
      status: 'Available',
      category: 'Payment',
    },
    {
      name: 'Salesforce',
      logo: '☁️',
      description: 'Lead scoring and CRM integration',
      status: 'Available',
      category: 'CRM',
    },
    {
      name: 'Docker',
      logo: '🐳',
      description: 'Containerized deployment and development environment',
      status: 'Setup Required',
      category: 'DevOps',
    },
  ];

  const WebsiteIntegration = () => (
    <div className='space-y-8'>
      {/* Quick Start */}
      <div className='bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
          <svg
            className='w-5 h-5 text-blue-600 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 10V3L4 14h7v7l9-11h-7z'
            />
          </svg>
          Quick Start - Add to Any Website
        </h3>
        <p className='text-gray-700 mb-4'>
          Add this script tag to your website's &lt;head&gt; section to start
          collecting data and running A/B tests.
        </p>
        <div className='bg-gray-900 rounded-lg p-4 overflow-x-auto'>
          <code className='text-green-400 text-sm font-mono'>
            {`<!-- Universal AI Platform Integration -->
<script async src="https://cdn.universalai.com/tracker.js"></script>
<script>
  window.UniversalAI = window.UniversalAI || [];
  window.UniversalAI.push(['init', '${apiKey}']);
  window.UniversalAI.push(['page', 'pageview']);
</script>`}
          </code>
        </div>
        <div className='mt-4 flex space-x-3'>
          <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
            Copy Code
          </button>
          <button className='bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium'>
            Download Script
          </button>
        </div>
      </div>

      {/* Installation Methods */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* WordPress */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>🔵</span>
            <h4 className='text-lg font-semibold text-gray-900'>
              WordPress Plugin
            </h4>
          </div>
          <p className='text-gray-600 mb-4'>
            Install our WordPress plugin for easy integration without code.
          </p>
          <div className='space-y-3'>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                1
              </span>
              Download the Universal AI plugin
            </div>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                2
              </span>
              Upload to WordPress admin → Plugins
            </div>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                3
              </span>
              Enter your API key in settings
            </div>
          </div>
          <button className='mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium'>
            Download Plugin
          </button>
        </div>

        {/* Shopify */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>🛍️</span>
            <h4 className='text-lg font-semibold text-gray-900'>Shopify App</h4>
          </div>
          <p className='text-gray-600 mb-4'>
            Install directly from the Shopify App Store for e-commerce testing.
          </p>
          <div className='space-y-3'>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                1
              </span>
              Visit Shopify App Store
            </div>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                2
              </span>
              Search "Universal AI Platform"
            </div>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                3
              </span>
              Install and connect your account
            </div>
          </div>
          <button className='mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium'>
            Install from Store
          </button>
        </div>

        {/* React/Next.js */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>⚛️</span>
            <h4 className='text-lg font-semibold text-gray-900'>
              React/Next.js SDK
            </h4>
          </div>
          <p className='text-gray-600 mb-4'>
            npm package for React and Next.js applications.
          </p>
          <div className='bg-gray-900 rounded-lg p-3 mb-4'>
            <code className='text-green-400 text-sm font-mono'>
              npm install @universal-ai/react
            </code>
          </div>
          <div className='bg-gray-900 rounded-lg p-3'>
            <code className='text-green-400 text-sm font-mono'>
              {`import { UniversalAI } from '@universal-ai/react';

function App() {
  return (
    <UniversalAI apiKey="${apiKey}">
      <YourApp />
    </UniversalAI>
  );
}`}
            </code>
          </div>
        </div>

        {/* Custom Implementation */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>⚙️</span>
            <h4 className='text-lg font-semibold text-gray-900'>
              Custom Implementation
            </h4>
          </div>
          <p className='text-gray-600 mb-4'>
            Full control with our REST API and JavaScript SDK.
          </p>
          <div className='space-y-3'>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                1
              </span>
              Review API documentation
            </div>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                2
              </span>
              Implement tracking events
            </div>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                3
              </span>
              Set up A/B test variations
            </div>
          </div>
          <button className='mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium'>
            View API Docs
          </button>
        </div>

        {/* Docker Setup */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>🐳</span>
            <h4 className='text-lg font-semibold text-gray-900'>
              Docker Container
            </h4>
          </div>
          <p className='text-gray-600 mb-4'>
            Run Universal AI Platform in a containerized environment.
          </p>
          <div className='bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 text-orange-600 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              <span className='text-sm font-medium text-orange-800'>
                Docker Not Installed
              </span>
            </div>
            <p className='text-sm text-orange-700 mt-1'>
              Docker is required to run containerized services. Install Docker
              first.
            </p>
          </div>
          <div className='space-y-3'>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                1
              </span>
              Install Docker Desktop for your OS
            </div>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                2
              </span>
              Pull Universal AI Docker image
            </div>
            <div className='flex items-center text-sm text-gray-700'>
              <span className='w-6 h-6 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                3
              </span>
              Configure environment variables
            </div>
          </div>
          <div className='bg-gray-900 rounded-lg p-3 mt-4 mb-4'>
            <code className='text-green-400 text-sm font-mono'>
              {`# Install Docker (macOS)
brew install --cask docker

# Pull and run Universal AI
docker pull universalai/platform:latest
docker run -p 3001:3001 \\
  -e API_KEY=${apiKey} \\
  universalai/platform:latest`}
            </code>
          </div>
          <div className='flex space-x-2'>
            <button className='flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium'>
              Install Docker
            </button>
            <button className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium'>
              View Docs
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h4 className='text-lg font-semibold text-gray-900 mb-4'>
          What You Get After Integration
        </h4>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='flex items-start'>
            <div className='p-2 bg-blue-100 rounded-lg mr-3'>
              <svg
                className='w-5 h-5 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <div>
              <h5 className='font-medium text-gray-900'>Real-time Analytics</h5>
              <p className='text-sm text-gray-600'>
                Track user behavior and conversions instantly
              </p>
            </div>
          </div>
          <div className='flex items-start'>
            <div className='p-2 bg-green-100 rounded-lg mr-3'>
              <svg
                className='w-5 h-5 text-green-600'
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
            <div>
              <h5 className='font-medium text-gray-900'>A/B Testing</h5>
              <p className='text-sm text-gray-600'>
                Run experiments without affecting performance
              </p>
            </div>
          </div>
          <div className='flex items-start'>
            <div className='p-2 bg-purple-100 rounded-lg mr-3'>
              <svg
                className='w-5 h-5 text-purple-600'
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
            <div>
              <h5 className='font-medium text-gray-900'>AI Insights</h5>
              <p className='text-sm text-gray-600'>
                Get automated recommendations for optimization
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const APIKeysSection = () => (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>API Keys</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Live API Key
            </label>
            <div className='flex items-center space-x-3'>
              <input
                type='text'
                value={apiKey}
                readOnly
                className='flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono'
              />
              <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
                Copy
              </button>
              <button className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium'>
                Regenerate
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Use this key for production websites
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Test API Key
            </label>
            <div className='flex items-center space-x-3'>
              <input
                type='text'
                value='ai_test_abcdef1234567890'
                readOnly
                className='flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono'
              />
              <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
                Copy
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Use this key for testing and development
            </p>
          </div>
        </div>
      </div>

      {/* API Usage */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          API Usage This Month
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div>
            <p className='text-2xl font-bold text-gray-900'>847,293</p>
            <p className='text-sm text-gray-600'>API Calls</p>
            <p className='text-xs text-green-600'>↗ 12% from last month</p>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-900'>2.4ms</p>
            <p className='text-sm text-gray-600'>Avg Response Time</p>
            <p className='text-xs text-green-600'>↗ 8% improvement</p>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-900'>99.98%</p>
            <p className='text-sm text-gray-600'>Uptime</p>
            <p className='text-xs text-gray-500'>Last 30 days</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title='Universal AI Platform - Integrations'>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Integrations</h1>
          <p className='text-gray-600 mt-1'>
            Connect your websites and applications to the Universal AI Platform
          </p>
        </div>

        {/* Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            {[
              { key: 'website', label: 'Website Integration', icon: '🌐' },
              { key: 'api', label: 'API Keys', icon: '🔑' },
              { key: 'webhooks', label: 'Webhooks', icon: '🔗' },
              { key: 'apps', label: 'Connected Apps', icon: '📱' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() =>
                  setSelectedTab(
                    tab.key as 'website' | 'api' | 'webhooks' | 'apps'
                  )
                }
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'website' && <WebsiteIntegration />}
        {selectedTab === 'api' && <APIKeysSection />}

        {selectedTab === 'apps' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {integrations.map((integration, index) => (
              <div
                key={index}
                className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow'
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <span className='text-2xl mr-3'>{integration.logo}</span>
                    <div>
                      <h3 className='font-semibold text-gray-900'>
                        {integration.name}
                      </h3>
                      <span className='text-xs text-gray-500'>
                        {integration.category}
                      </span>
                    </div>
                  </div>
                  <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full'>
                    {integration.status}
                  </span>
                </div>
                <p className='text-sm text-gray-600 mb-4'>
                  {integration.description}
                </p>
                <button className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium'>
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'webhooks' && (
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Webhook Endpoints
            </h3>
            <p className='text-gray-600 mb-6'>
              Configure webhooks to receive real-time notifications about test
              results and events.
            </p>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium'>
              Add Webhook
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsPage;
