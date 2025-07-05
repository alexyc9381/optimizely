import {
  AlertCircle,
  CheckCircle,
  Download,
  ExternalLink,
  Loader,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
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
        console.warn(
          'Failed to fetch integrations from API, using mock data:',
          err
        );
        setError('Unable to connect to backend. Showing demo data.');
        setIntegrations(mockIntegrations);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const handleIntegrationAction = async (
    action: 'install' | 'uninstall',
    integrationName: string
  ) => {
    try {
      setActionLoading(integrationName);

      if (action === 'install') {
        await apiClient.installIntegration(integrationName);
        setIntegrations(prev =>
          prev.map(integration =>
            integration.name === integrationName
              ? { ...integration, status: 'Installed' }
              : integration
          )
        );
      } else {
        await apiClient.uninstallIntegration(integrationName);
        setIntegrations(prev =>
          prev.map(integration =>
            integration.name === integrationName
              ? { ...integration, status: 'Available' }
              : integration
          )
        );
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
      case 'Installed':
        return 'bg-green-100 text-green-800';
      case 'Available':
        return 'bg-blue-100 text-blue-800';
      case 'Setup Required':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Installed':
        return (
          <CheckCircle className='w-4 h-4 text-green-600' data-oid='4k_w2pj' />
        );

      case 'Available':
        return (
          <Download className='w-4 h-4 text-blue-600' data-oid='kbf6uxt' />
        );

      case 'Setup Required':
        return (
          <AlertCircle className='w-4 h-4 text-yellow-600' data-oid='gfnn0l7' />
        );

      default:
        return (
          <Settings className='w-4 h-4 text-gray-600' data-oid='3t-d-4m' />
        );
    }
  };

  // Calculate metrics from actual data
  const totalIntegrations = integrations.length;
  const installedIntegrations = integrations.filter(
    i => i.status === 'Installed'
  ).length;
  const availableIntegrations = integrations.filter(
    i => i.status === 'Available'
  ).length;

  const WebsiteIntegration = () => (
    <div className='space-y-8' data-oid='81v309i'>
      {/* Quick Start */}
      <div
        className='bg-blue-50 rounded-lg p-6 border border-blue-200'
        data-oid='uffes4l'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-4 flex items-center'
          data-oid='gd_v09m'
        >
          <svg
            className='w-5 h-5 text-blue-600 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            data-oid='fsuuup6'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 10V3L4 14h7v7l9-11h-7z'
              data-oid=':r4y_as'
            />
          </svg>
          Quick Start - Add to Any Website
        </h3>
        <p className='text-gray-700 mb-4' data-oid='r0c:m05'>
          Add this script tag to your website's &lt;head&gt; section to start
          collecting data and running A/B tests.
        </p>
        <div
          className='bg-gray-900 rounded-lg p-4 overflow-x-auto'
          data-oid='8gkt960'
        >
          <code className='text-green-400 text-sm font-mono' data-oid='nrk0ow0'>
            {`<!-- Universal AI Platform Integration -->
<script async src="https://cdn.universalai.com/tracker.js"></script>
<script>
  window.UniversalAI = window.UniversalAI || [];
  window.UniversalAI.push(['init', '${apiKey}']);
  window.UniversalAI.push(['page', 'pageview']);
</script>`}
          </code>
        </div>
        <div className='mt-4 flex space-x-3' data-oid='q1iamw3'>
          <button
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            data-oid='3_v2ij6'
          >
            Copy Code
          </button>
          <button
            className='bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            data-oid='vzh4f9k'
          >
            Download Script
          </button>
        </div>
      </div>

      {/* Available Integrations */}
      <div className='space-y-6' data-oid='i81sr.v'>
        <h3 className='text-lg font-semibold text-gray-900' data-oid='9uziz:p'>
          Available Integrations
        </h3>

        {loading ? (
          <div
            className='flex items-center justify-center h-32'
            data-oid='0g9m4b8'
          >
            <div
              className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
              data-oid='2zev1pq'
            ></div>
          </div>
        ) : (
          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            data-oid='6ii9a5.'
          >
            {integrations.map(integration => (
              <div
                key={integration.name}
                className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200'
                data-oid='kd.o_r_'
              >
                <div
                  className='flex items-center justify-between mb-4'
                  data-oid='_0:n-8a'
                >
                  <div className='flex items-center' data-oid='y2:3gb9'>
                    <span className='text-2xl mr-3' data-oid='zdz8dwr'>
                      {integration.logo}
                    </span>
                    <div data-oid='8amkg3o'>
                      <h4
                        className='text-lg font-semibold text-gray-900'
                        data-oid='11m2bo:'
                      >
                        {integration.name}
                      </h4>
                      <span
                        className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'
                        data-oid='spops50'
                      >
                        {integration.category}
                      </span>
                    </div>
                  </div>
                  {getStatusIcon(integration.status)}
                </div>

                <p className='text-gray-600 mb-4 text-sm' data-oid='kvh64sz'>
                  {integration.description}
                </p>

                <div
                  className='flex items-center justify-between'
                  data-oid='n2le9gn'
                >
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}
                    data-oid='_ly600u'
                  >
                    {integration.status}
                  </span>

                  <div
                    className='flex items-center space-x-2'
                    data-oid='2cwefe2'
                  >
                    {integration.status === 'Available' && (
                      <button
                        onClick={() =>
                          handleIntegrationAction('install', integration.name)
                        }
                        disabled={actionLoading === integration.name}
                        className='bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                        data-oid='65p_y73'
                      >
                        {actionLoading === integration.name ? (
                          <Loader
                            className='w-3 h-3 animate-spin'
                            data-oid='k2efkod'
                          />
                        ) : (
                          <Download className='w-3 h-3' data-oid='3itim9.' />
                        )}
                        <span data-oid='qj5008s'>Install</span>
                      </button>
                    )}

                    {integration.status === 'Installed' && (
                      <>
                        <button
                          className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                          data-oid='0kmeyzn'
                        >
                          <Settings className='w-3 h-3' data-oid='fbx6qr_' />
                          <span data-oid='pebksb:'>Configure</span>
                        </button>
                        <button
                          onClick={() =>
                            handleIntegrationAction(
                              'uninstall',
                              integration.name
                            )
                          }
                          disabled={actionLoading === integration.name}
                          className='bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                          data-oid='n:t8wu6'
                        >
                          {actionLoading === integration.name ? (
                            <Loader
                              className='w-3 h-3 animate-spin'
                              data-oid='c4nx6-k'
                            />
                          ) : (
                            <Trash2 className='w-3 h-3' data-oid='wijmiss' />
                          )}
                          <span data-oid='7jvj3lx'>Remove</span>
                        </button>
                      </>
                    )}

                    {integration.status === 'Setup Required' && (
                      <button
                        className='bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                        data-oid='.gga.4e'
                      >
                        <Settings className='w-3 h-3' data-oid='-_a21s9' />
                        <span data-oid='fc.zpu2'>Setup</span>
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
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6' data-oid='cxbtdh8'>
        {/* WordPress */}
        <div
          className='bg-blue-50 rounded-lg p-6 border border-blue-200'
          data-oid='0:hrl.l'
        >
          <h3
            className='text-lg font-semibold text-gray-900 mb-4 flex items-center'
            data-oid='ztlwm4n'
          >
            <span
              className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3'
              data-oid='gy-j5qs'
            >
              WP
            </span>
            WordPress Integration
          </h3>
          <div className='space-y-3' data-oid='xgc.flp'>
            <div className='flex items-center' data-oid='xi5gcob'>
              <span
                className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'
                data-oid='rqg5xls'
              >
                1
              </span>
              <p className='text-gray-700 text-sm' data-oid='k7vdwx8'>
                Install the Universal AI WordPress plugin
              </p>
            </div>
            <div className='flex items-center' data-oid='y_e6fvq'>
              <span
                className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'
                data-oid='ihi-:q6'
              >
                2
              </span>
              <p className='text-gray-700 text-sm' data-oid='-5z9rv5'>
                Add your API key in the plugin settings
              </p>
            </div>
            <div className='flex items-center' data-oid='wn_u34t'>
              <span
                className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'
                data-oid='7wflyjg'
              >
                3
              </span>
              <p className='text-gray-700 text-sm' data-oid='k00vxgf'>
                Configure A/B tests from your WordPress admin
              </p>
            </div>
            <button
              className='mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2'
              data-oid='v:ytb9q'
            >
              <Download className='w-4 h-4' data-oid='izfxyf4' />
              <span data-oid='3rqapvg'>Download Plugin</span>
            </button>
          </div>
        </div>

        {/* React/Next.js SDK */}
        <div
          className='bg-white rounded-lg border border-gray-200 p-6'
          data-oid='yww9uim'
        >
          <div className='flex items-center mb-4' data-oid=':0fxjcs'>
            <span className='text-2xl mr-3' data-oid='0wj0lkf'>
              ⚛️
            </span>
            <h4
              className='text-lg font-semibold text-gray-900'
              data-oid='y8:8qr-'
            >
              React/Next.js SDK
            </h4>
          </div>
          <p className='text-gray-600 mb-4' data-oid='xrwa-.6'>
            npm package for React and Next.js applications.
          </p>
          <div className='bg-gray-900 rounded-lg p-3 mb-4' data-oid='.7paa2m'>
            <code
              className='text-green-400 text-sm font-mono'
              data-oid='hii1-jl'
            >
              npm install @universal-ai/react
            </code>
          </div>
          <div className='bg-gray-900 rounded-lg p-3 mb-4' data-oid='anhtj3i'>
            <code
              className='text-green-400 text-sm font-mono'
              data-oid='v.9w5_f'
            >
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
          <button
            className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2'
            data-oid='ec7p0hq'
          >
            <ExternalLink className='w-4 h-4' data-oid=':b0oylm' />
            <span data-oid='.6q_20w'>View Documentation</span>
          </button>
        </div>
      </div>
    </div>
  );

  const APIKeysSection = () => (
    <div className='space-y-6' data-oid='rn_qxe_'>
      <div
        className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        data-oid='-sj:3ib'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-6'
          data-oid='bxm0mep'
        >
          API Configuration
        </h3>

        <div className='space-y-6' data-oid='xot.rq-'>
          <div data-oid='3gvep2p'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid=':38pw5u'
            >
              Production API Key
            </label>
            <div className='flex items-center space-x-3' data-oid='dy:w:n9'>
              <input
                type='text'
                readOnly
                value={apiKey}
                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm'
                data-oid='sfkkyr:'
              />

              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                data-oid='m0k014a'
              >
                Copy
              </button>
              <button
                className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
                data-oid='v8t6l4l'
              >
                <RefreshCw className='w-4 h-4' data-oid='h5kg:ad' />
                <span data-oid='y838-f9'>Regenerate</span>
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1' data-oid='iiuyp5u'>
              Keep this key secure. Never expose it in client-side code.
            </p>
          </div>

          <div data-oid='tckm5lz'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid='n:cwgko'
            >
              Test Environment Key
            </label>
            <div className='flex items-center space-x-3' data-oid='w:dr5t_'>
              <input
                type='text'
                readOnly
                value='ai_test_abcdef1234567890'
                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm'
                data-oid='oh2twvm'
              />

              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                data-oid='s83a-_t'
              >
                Copy
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1' data-oid='cidnyxh'>
              Use this key for development and testing environments.
            </p>
          </div>
        </div>
      </div>

      {/* REST API Documentation */}
      <div
        className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        data-oid='fhuuf9r'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-4'
          data-oid='7y-oc8x'
        >
          REST API Endpoints
        </h3>

        <div className='space-y-4' data-oid='oi9xg41'>
          <div className='bg-gray-50 rounded-lg p-4' data-oid='cc64zzg'>
            <div
              className='flex items-center justify-between mb-2'
              data-oid='v5sq.m_'
            >
              <span
                className='text-sm font-mono text-gray-900'
                data-oid='-6jwq-o'
              >
                POST /api/events
              </span>
              <span
                className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'
                data-oid='_p0y85k'
              >
                Track Events
              </span>
            </div>
            <p className='text-sm text-gray-600' data-oid='kvpi7el'>
              Send custom events and conversions to your account
            </p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4' data-oid='fp_girr'>
            <div
              className='flex items-center justify-between mb-2'
              data-oid='v2b9is8'
            >
              <span
                className='text-sm font-mono text-gray-900'
                data-oid='juoofm1'
              >
                GET /api/tests
              </span>
              <span
                className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'
                data-oid='c-h.1a3'
              >
                A/B Tests
              </span>
            </div>
            <p className='text-sm text-gray-600' data-oid='_x8pdu-'>
              Retrieve active A/B tests and configurations
            </p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4' data-oid='7hp.0p_'>
            <div
              className='flex items-center justify-between mb-2'
              data-oid='5l4l9.3'
            >
              <span
                className='text-sm font-mono text-gray-900'
                data-oid='quf6szf'
              >
                GET /api/analytics
              </span>
              <span
                className='text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'
                data-oid='bvs8ode'
              >
                Analytics
              </span>
            </div>
            <p className='text-sm text-gray-600' data-oid='cb-k_do'>
              Access detailed analytics and performance metrics
            </p>
          </div>
        </div>

        <button
          className='mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
          data-oid='doddpo-'
        >
          <ExternalLink className='w-4 h-4' data-oid='bp1r.3f' />
          <span data-oid='tuss434'>View Full API Documentation</span>
        </button>
      </div>
    </div>
  );

  const WebhooksSection = () => (
    <div className='space-y-6' data-oid='823wmki'>
      <div
        className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        data-oid='flk1yef'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-6'
          data-oid='b3fcwhd'
        >
          Webhook Configuration
        </h3>

        <div className='space-y-6' data-oid='..uz2d4'>
          <div data-oid='lod-:a:'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid='h59:nf2'
            >
              Endpoint URL
            </label>
            <input
              type='url'
              placeholder='https://your-app.com/webhooks/universal-ai'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              data-oid='scac02g'
            />

            <p className='text-xs text-gray-500 mt-1' data-oid='ytka_31'>
              We'll send POST requests to this URL when events occur.
            </p>
          </div>

          <div data-oid='oxi.837'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid='xk0-u.2'
            >
              Events to Send
            </label>
            <div className='space-y-2' data-oid='bpmzgsk'>
              {[
                'Test Started',
                'Test Completed',
                'Significant Result',
                'Conversion Event',
              ].map(event => (
                <label
                  key={event}
                  className='flex items-center'
                  data-oid='jeyec7p'
                >
                  <input
                    type='checkbox'
                    defaultChecked
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    data-oid='9o13h9a'
                  />

                  <span
                    className='ml-2 text-sm text-gray-700'
                    data-oid='f15um_q'
                  >
                    {event}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div data-oid='laf4bd1'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid='vzmlj83'
            >
              Secret Key (Optional)
            </label>
            <input
              type='text'
              placeholder='webhook_secret_key'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              data-oid='w3_6.z8'
            />

            <p className='text-xs text-gray-500 mt-1' data-oid='2-dr-37'>
              Used to verify webhook authenticity via HMAC signature.
            </p>
          </div>

          <button
            className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors'
            data-oid='5ylsqfi'
          >
            Save Webhook Configuration
          </button>
        </div>
      </div>
    </div>
  );

  const ConnectedAppsSection = () => (
    <div className='space-y-6' data-oid='30awy:u'>
      <div
        className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        data-oid='vkp.0z1'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-6'
          data-oid='mghbpso'
        >
          Connected Applications
        </h3>

        <div className='space-y-4' data-oid=':1epk9f'>
          {integrations
            .filter(i => i.status === 'Installed')
            .map(app => (
              <div
                key={app.name}
                className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                data-oid='h70jrk4'
              >
                <div className='flex items-center' data-oid='-7wz83:'>
                  <span className='text-2xl mr-3' data-oid='17lu1v5'>
                    {app.logo}
                  </span>
                  <div data-oid='g6k9dyy'>
                    <h4
                      className='font-medium text-gray-900'
                      data-oid='mu4mjee'
                    >
                      {app.name}
                    </h4>
                    <p className='text-sm text-gray-500' data-oid='cot3yur'>
                      {app.description}
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-2' data-oid='01g-mhj'>
                  <span
                    className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'
                    data-oid='nbboi:c'
                  >
                    Connected
                  </span>
                  <button
                    className='text-gray-400 hover:text-gray-600 transition-colors'
                    data-oid='jr1b_an'
                  >
                    <Settings className='w-4 h-4' data-oid='int.f9.' />
                  </button>
                  <button
                    onClick={() =>
                      handleIntegrationAction('uninstall', app.name)
                    }
                    className='text-red-400 hover:text-red-600 transition-colors'
                    data-oid='kqsputr'
                  >
                    <Trash2 className='w-4 h-4' data-oid='j1u:f5s' />
                  </button>
                </div>
              </div>
            ))}

          {integrations.filter(i => i.status === 'Installed').length === 0 && (
            <div className='text-center py-8' data-oid='6fkfuz7'>
              <p className='text-gray-500' data-oid='u6t78jn'>
                No connected applications yet.
              </p>
              <button
                onClick={() => setSelectedTab('website')}
                className='mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium'
                data-oid='4kibc6-'
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
      <DashboardLayout
        title='Integrations - Universal AI Platform'
        data-oid='s9a6o:7'
      >
        <div
          className='flex items-center justify-center h-64'
          data-oid='w2wf5un'
        >
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
            data-oid='b6tet36'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title='Integrations - Universal AI Platform'
      data-oid='g89yrk9'
    >
      <div className='space-y-6' data-oid='jfltn51'>
        {error && (
          <div
            className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'
            data-oid=':0s1o24'
          >
            <div className='flex' data-oid='2jrk_oj'>
              <div className='flex-shrink-0' data-oid='e.1.:wa'>
                <svg
                  className='h-5 w-5 text-yellow-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  data-oid='r8voywg'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                    data-oid='9vptc3j'
                  />
                </svg>
              </div>
              <div className='ml-3' data-oid='u1p48ai'>
                <p className='text-sm text-yellow-700' data-oid='j-w4dmg'>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex items-center justify-between' data-oid='v6h3k33'>
          <div data-oid='oy1x4hj'>
            <h1 className='text-2xl font-bold text-gray-900' data-oid='lt-0jmd'>
              Integrations
            </h1>
            <p className='text-sm text-gray-500 mt-1' data-oid='ve3y451'>
              Connect Universal AI Platform with your favorite tools and
              services
            </p>
          </div>

          <div className='flex items-center space-x-3' data-oid='zc8p-qj'>
            <button
              className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
              data-oid='h.yjn27'
            >
              <ExternalLink className='h-4 w-4' data-oid=':6esh7-' />
              <span data-oid='j.5hj6s'>Documentation</span>
            </button>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
              data-oid='6vlx5tq'
            >
              <Download className='h-4 w-4' data-oid='fax.xpc' />
              <span data-oid='2zt0.ut'>Request Integration</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div
          className='grid grid-cols-1 md:grid-cols-3 gap-6'
          data-oid='o5q2hjo'
        >
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='srfgxqo'
          >
            <div className='flex items-center' data-oid='n6mtp6h'>
              <div className='flex-1' data-oid=':7vh5av'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='qes4xbx'
                >
                  Total Integrations
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='d-rsglq'
                >
                  {totalIntegrations}
                </p>
                <p className='text-xs text-blue-600 mt-1' data-oid='3s8ucm3'>
                  +2 this month
                </p>
              </div>
              <div
                className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='0wsc.5r'
              >
                <Settings
                  className='w-4 h-4 text-blue-600'
                  data-oid='5o3ehw3'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='noncbwm'
          >
            <div className='flex items-center' data-oid='zed1ehm'>
              <div className='flex-1' data-oid='p7k6lq1'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='ei2_f4q'
                >
                  Installed
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='t2.8hf1'
                >
                  {installedIntegrations}
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid=':b8ta9q'>
                  Active connections
                </p>
              </div>
              <div
                className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='s:noszi'
              >
                <CheckCircle
                  className='w-4 h-4 text-green-600'
                  data-oid='wr779qf'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='2ffq2gy'
          >
            <div className='flex items-center' data-oid='sq8ehph'>
              <div className='flex-1' data-oid='xjcnw94'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid=':sac2rp'
                >
                  Available
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='d_akbov'
                >
                  {availableIntegrations}
                </p>
                <p className='text-xs text-gray-600 mt-1' data-oid='869k5-p'>
                  Ready to install
                </p>
              </div>
              <div
                className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center'
                data-oid='_-jmc58'
              >
                <Download
                  className='w-4 h-4 text-gray-600'
                  data-oid='2g.28bc'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Integration Tabs */}
        <div className='border-b border-gray-200' data-oid='m4-q:av'>
          <nav className='-mb-px flex space-x-8' data-oid='xw2rkmt'>
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
                data-oid='-72y35s'
              >
                <span data-oid='hncfzx9'>{tab.icon}</span>
                <span data-oid='.1:yswy'>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='py-6' data-oid='kffe.-8'>
          {selectedTab === 'website' && (
            <WebsiteIntegration data-oid='aywzorb' />
          )}
          {selectedTab === 'api' && <APIKeysSection data-oid='jqi6qcq' />}
          {selectedTab === 'webhooks' && <WebhooksSection data-oid='1jar_vp' />}
          {selectedTab === 'apps' && (
            <ConnectedAppsSection data-oid='9a3byvl' />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsPage;
