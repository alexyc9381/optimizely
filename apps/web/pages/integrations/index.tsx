import { AlertCircle, CheckCircle, Download, ExternalLink, Loader, RefreshCw, Settings, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { apiClient, Integration } from '../../src/services/apiClient';

const IntegrationsPage: React.FC = () => {
  const [apiKey] = useState('ai_live_1234567890abcdef');
  const [selectedTab, setSelectedTab] = useState<
    'website' | 'api' | 'webhooks' | 'apps'
  >('website');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock data as fallback
  const mockIntegrations: Integration[] = [
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
      status: 'Installed',
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
      status: 'Installed',
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
      status: 'Installed',
      category: 'CRM',
    },
    {
      name: 'Docker',
      logo: '🐳',
      description: 'Containerized deployment and development environment',
      status: 'Setup Required',
      category: 'DevOps',
    },
    {
      name: 'HubSpot',
      logo: '🧡',
      description: 'Marketing automation and CRM integration',
      status: 'Available',
      category: 'CRM',
    },
  ];

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getIntegrations();
        setIntegrations(data);
      } catch (err) {
        console.warn('Failed to fetch integrations from API, using mock data:', err);
        setError('Unable to connect to backend. Showing demo data.');
        setIntegrations(mockIntegrations);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const handleIntegrationAction = async (action: 'install' | 'uninstall', integrationName: string) => {
    try {
      setActionLoading(integrationName);

      if (action === 'install') {
        await apiClient.installIntegration(integrationName);
        setIntegrations(prev => prev.map(integration =>
          integration.name === integrationName
            ? { ...integration, status: 'Installed' }
            : integration
        ));
      } else {
        await apiClient.uninstallIntegration(integrationName);
        setIntegrations(prev => prev.map(integration =>
          integration.name === integrationName
            ? { ...integration, status: 'Available' }
            : integration
        ));
      }
    } catch (err) {
      console.error(`Failed to ${action} integration:`, err);
      alert(`Failed to ${action} integration. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Installed': return 'bg-green-100 text-green-800';
      case 'Available': return 'bg-blue-100 text-blue-800';
      case 'Setup Required': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Installed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Available': return <Download className="w-4 h-4 text-blue-600" />;
      case 'Setup Required': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate metrics from actual data
  const totalIntegrations = integrations.length;
  const installedIntegrations = integrations.filter(i => i.status === 'Installed').length;
  const availableIntegrations = integrations.filter(i => i.status === 'Available').length;

  const WebsiteIntegration = () => (
    <div className='space-y-8'>
      {/* Quick Start */}
      <div className='bg-blue-50 rounded-lg p-6 border border-blue-200'>
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
          <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
            Copy Code
          </button>
          <button className='bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
            Download Script
          </button>
        </div>
      </div>

      {/* Available Integrations */}
      <div className='space-y-6'>
        <h3 className='text-lg font-semibold text-gray-900'>Available Integrations</h3>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {integrations.map((integration) => (
              <div key={integration.name} className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <span className='text-2xl mr-3'>{integration.logo}</span>
                    <div>
                      <h4 className='text-lg font-semibold text-gray-900'>{integration.name}</h4>
                      <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                        {integration.category}
                      </span>
                    </div>
                  </div>
                  {getStatusIcon(integration.status)}
                </div>

                <p className='text-gray-600 mb-4 text-sm'>{integration.description}</p>

                <div className='flex items-center justify-between'>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                    {integration.status}
                  </span>

                  <div className='flex items-center space-x-2'>
                    {integration.status === 'Available' && (
                      <button
                        onClick={() => handleIntegrationAction('install', integration.name)}
                        disabled={actionLoading === integration.name}
                        className='bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                      >
                        {actionLoading === integration.name ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>Install</span>
                      </button>
                    )}

                    {integration.status === 'Installed' && (
                      <>
                        <button className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'>
                          <Settings className="w-3 h-3" />
                          <span>Configure</span>
                        </button>
                        <button
                          onClick={() => handleIntegrationAction('uninstall', integration.name)}
                          disabled={actionLoading === integration.name}
                          className='bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                        >
                          {actionLoading === integration.name ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>Remove</span>
                        </button>
                      </>
                    )}

                    {integration.status === 'Setup Required' && (
                      <button className='bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'>
                        <Settings className="w-3 h-3" />
                        <span>Setup</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Installation Methods */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* WordPress */}
        <div className='bg-blue-50 rounded-lg p-6 border border-blue-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
            <span className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3'>
              WP
            </span>
            WordPress Integration
          </h3>
          <div className='space-y-3'>
            <div className='flex items-center'>
              <span className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                1
              </span>
              <p className='text-gray-700 text-sm'>
                Install the Universal AI WordPress plugin
              </p>
            </div>
            <div className='flex items-center'>
              <span className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                2
              </span>
              <p className='text-gray-700 text-sm'>
                Add your API key in the plugin settings
              </p>
            </div>
            <div className='flex items-center'>
              <span className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                3
              </span>
              <p className='text-gray-700 text-sm'>
                Configure A/B tests from your WordPress admin
              </p>
            </div>
            <button className='mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2'>
              <Download className="w-4 h-4" />
              <span>Download Plugin</span>
            </button>
          </div>
        </div>

        {/* React/Next.js SDK */}
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
          <div className='bg-gray-900 rounded-lg p-3 mb-4'>
            <code className='text-green-400 text-sm font-mono'>
              {`import { UniversalAI } from '@universal-ai/react';

export default function App() {
  return (
    <UniversalAI apiKey="${apiKey}">
      <YourApp />
    </UniversalAI>
  );
}`}
            </code>
          </div>
          <button className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2'>
            <ExternalLink className="w-4 h-4" />
            <span>View Documentation</span>
          </button>
        </div>
      </div>
    </div>
  );

  const APIKeysSection = () => (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-6'>API Configuration</h3>

        <div className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Production API Key
            </label>
            <div className='flex items-center space-x-3'>
              <input
                type='text'
                readOnly
                value={apiKey}
                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm'
              />
              <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
                Copy
              </button>
              <button className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'>
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Keep this key secure. Never expose it in client-side code.
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Test Environment Key
            </label>
            <div className='flex items-center space-x-3'>
              <input
                type='text'
                readOnly
                value='ai_test_abcdef1234567890'
                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm'
              />
              <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
                Copy
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Use this key for development and testing environments.
            </p>
          </div>
        </div>
      </div>

      {/* REST API Documentation */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>REST API Endpoints</h3>

        <div className='space-y-4'>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-mono text-gray-900'>POST /api/events</span>
              <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>Track Events</span>
            </div>
            <p className='text-sm text-gray-600'>Send custom events and conversions to your account</p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-mono text-gray-900'>GET /api/tests</span>
              <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>A/B Tests</span>
            </div>
            <p className='text-sm text-gray-600'>Retrieve active A/B tests and configurations</p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-mono text-gray-900'>GET /api/analytics</span>
              <span className='text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'>Analytics</span>
            </div>
            <p className='text-sm text-gray-600'>Access detailed analytics and performance metrics</p>
          </div>
        </div>

        <button className='mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'>
          <ExternalLink className="w-4 h-4" />
          <span>View Full API Documentation</span>
        </button>
      </div>
    </div>
  );

  const WebhooksSection = () => (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-6'>Webhook Configuration</h3>

        <div className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Endpoint URL
            </label>
            <input
              type='url'
              placeholder='https://your-app.com/webhooks/universal-ai'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
            <p className='text-xs text-gray-500 mt-1'>
              We'll send POST requests to this URL when events occur.
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Events to Send
            </label>
            <div className='space-y-2'>
              {['Test Started', 'Test Completed', 'Significant Result', 'Conversion Event'].map((event) => (
                <label key={event} className='flex items-center'>
                  <input
                    type='checkbox'
                    defaultChecked
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700'>{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Secret Key (Optional)
            </label>
            <input
              type='text'
              placeholder='webhook_secret_key'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Used to verify webhook authenticity via HMAC signature.
            </p>
          </div>

          <button className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors'>
            Save Webhook Configuration
          </button>
        </div>
      </div>
    </div>
  );

  const ConnectedAppsSection = () => (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-6'>Connected Applications</h3>

        <div className='space-y-4'>
          {integrations.filter(i => i.status === 'Installed').map((app) => (
            <div key={app.name} className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
              <div className='flex items-center'>
                <span className='text-2xl mr-3'>{app.logo}</span>
                <div>
                  <h4 className='font-medium text-gray-900'>{app.name}</h4>
                  <p className='text-sm text-gray-500'>{app.description}</p>
                </div>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>Connected</span>
                <button className='text-gray-400 hover:text-gray-600 transition-colors'>
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleIntegrationAction('uninstall', app.name)}
                  className='text-red-400 hover:text-red-600 transition-colors'
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {integrations.filter(i => i.status === 'Installed').length === 0 && (
            <div className='text-center py-8'>
              <p className='text-gray-500'>No connected applications yet.</p>
              <button
                onClick={() => setSelectedTab('website')}
                className='mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium'
              >
                Browse available integrations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title='Integrations - Universal AI Platform'>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Integrations - Universal AI Platform'>
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

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Integrations</h1>
            <p className='text-sm text-gray-500 mt-1'>
              Connect Universal AI Platform with your favorite tools and services
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            <button className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'>
              <ExternalLink className="h-4 w-4" />
              <span>Documentation</span>
            </button>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'>
              <Download className="h-4 w-4" />
              <span>Request Integration</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Total Integrations</p>
                <p className='text-2xl font-bold text-gray-900'>{totalIntegrations}</p>
                <p className='text-xs text-blue-600 mt-1'>+2 this month</p>
              </div>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Settings className='w-4 h-4 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Installed</p>
                <p className='text-2xl font-bold text-gray-900'>{installedIntegrations}</p>
                <p className='text-xs text-green-600 mt-1'>Active connections</p>
              </div>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-4 h-4 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Available</p>
                <p className='text-2xl font-bold text-gray-900'>{availableIntegrations}</p>
                <p className='text-xs text-gray-600 mt-1'>Ready to install</p>
              </div>
              <div className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center'>
                <Download className='w-4 h-4 text-gray-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Integration Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            {[
              { key: 'website', label: 'Website', icon: '🌐' },
              { key: 'api', label: 'API & SDK', icon: '⚡' },
              { key: 'webhooks', label: 'Webhooks', icon: '🔗' },
              { key: 'apps', label: 'Connected Apps', icon: '📱' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
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
        <div className='py-6'>
          {selectedTab === 'website' && <WebsiteIntegration />}
          {selectedTab === 'api' && <APIKeysSection />}
          {selectedTab === 'webhooks' && <WebhooksSection />}
          {selectedTab === 'apps' && <ConnectedAppsSection />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsPage;
