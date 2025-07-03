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
          <CheckCircle className='w-4 h-4 text-green-600' data-oid='xyh.rel' />
        );

      case 'Available':
        return (
          <Download className='w-4 h-4 text-blue-600' data-oid='wwabwsh' />
        );

      case 'Setup Required':
        return (
          <AlertCircle className='w-4 h-4 text-yellow-600' data-oid='e85x0mf' />
        );

      default:
        return (
          <Settings className='w-4 h-4 text-gray-600' data-oid='bvd-88:' />
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
    <div className='space-y-8' data-oid='goomosg'>
      {/* Quick Start */}
      <div
        className='bg-blue-50 rounded-lg p-6 border border-blue-200'
        data-oid='yp9cqnb'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-4 flex items-center'
          data-oid='z1s5yru'
        >
          <svg
            className='w-5 h-5 text-blue-600 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            data-oid='8pf.m-r'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 10V3L4 14h7v7l9-11h-7z'
              data-oid='9mfiu:3'
            />
          </svg>
          Quick Start - Add to Any Website
        </h3>
        <p className='text-gray-700 mb-4' data-oid='jkvsht-'>
          Add this script tag to your website's &lt;head&gt; section to start
          collecting data and running A/B tests.
        </p>
        <div
          className='bg-gray-900 rounded-lg p-4 overflow-x-auto'
          data-oid='t51eog3'
        >
          <code className='text-green-400 text-sm font-mono' data-oid='z8a_5td'>
            {`<!-- Universal AI Platform Integration -->
<script async src="https://cdn.universalai.com/tracker.js"></script>
<script>
  window.UniversalAI = window.UniversalAI || [];
  window.UniversalAI.push(['init', '${apiKey}']);
  window.UniversalAI.push(['page', 'pageview']);
</script>`}
          </code>
        </div>
        <div className='mt-4 flex space-x-3' data-oid='by0pqwu'>
          <button
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            data-oid='ud3r5__'
          >
            Copy Code
          </button>
          <button
            className='bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            data-oid='8roks65'
          >
            Download Script
          </button>
        </div>
      </div>

      {/* Available Integrations */}
      <div className='space-y-6' data-oid='qfy2k4d'>
        <h3 className='text-lg font-semibold text-gray-900' data-oid='4art8qk'>
          Available Integrations
        </h3>

        {loading ? (
          <div
            className='flex items-center justify-center h-32'
            data-oid='vi4ik:f'
          >
            <div
              className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
              data-oid='0htpjij'
            ></div>
          </div>
        ) : (
          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            data-oid='2teg-f-'
          >
            {integrations.map(integration => (
              <div
                key={integration.name}
                className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200'
                data-oid='madm8__'
              >
                <div
                  className='flex items-center justify-between mb-4'
                  data-oid='.p1v2gp'
                >
                  <div className='flex items-center' data-oid='xt4zpcd'>
                    <span className='text-2xl mr-3' data-oid='dgp7rko'>
                      {integration.logo}
                    </span>
                    <div data-oid='ohrs0ki'>
                      <h4
                        className='text-lg font-semibold text-gray-900'
                        data-oid='b.15yei'
                      >
                        {integration.name}
                      </h4>
                      <span
                        className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'
                        data-oid='0h23e77'
                      >
                        {integration.category}
                      </span>
                    </div>
                  </div>
                  {getStatusIcon(integration.status)}
                </div>

                <p className='text-gray-600 mb-4 text-sm' data-oid='k9abnl5'>
                  {integration.description}
                </p>

                <div
                  className='flex items-center justify-between'
                  data-oid='i1kltby'
                >
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}
                    data-oid='j6y0m.b'
                  >
                    {integration.status}
                  </span>

                  <div
                    className='flex items-center space-x-2'
                    data-oid='m5p08ln'
                  >
                    {integration.status === 'Available' && (
                      <button
                        onClick={() =>
                          handleIntegrationAction('install', integration.name)
                        }
                        disabled={actionLoading === integration.name}
                        className='bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                        data-oid='vb-7up4'
                      >
                        {actionLoading === integration.name ? (
                          <Loader
                            className='w-3 h-3 animate-spin'
                            data-oid='w9a-h3z'
                          />
                        ) : (
                          <Download className='w-3 h-3' data-oid='ivi6r3f' />
                        )}
                        <span data-oid='xfi0tba'>Install</span>
                      </button>
                    )}

                    {integration.status === 'Installed' && (
                      <>
                        <button
                          className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                          data-oid='n8fi76g'
                        >
                          <Settings className='w-3 h-3' data-oid='3gtnq-t' />
                          <span data-oid='_.d.2d.'>Configure</span>
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
                          data-oid='sc8y9qc'
                        >
                          {actionLoading === integration.name ? (
                            <Loader
                              className='w-3 h-3 animate-spin'
                              data-oid='bmb2e3m'
                            />
                          ) : (
                            <Trash2 className='w-3 h-3' data-oid='x:v_t_b' />
                          )}
                          <span data-oid='0g2cmed'>Remove</span>
                        </button>
                      </>
                    )}

                    {integration.status === 'Setup Required' && (
                      <button
                        className='bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1'
                        data-oid='qq4rv2:'
                      >
                        <Settings className='w-3 h-3' data-oid='h-.uhur' />
                        <span data-oid='n290:ho'>Setup</span>
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
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6' data-oid='69e_pcg'>
        {/* WordPress */}
        <div
          className='bg-blue-50 rounded-lg p-6 border border-blue-200'
          data-oid=':r4fqa9'
        >
          <h3
            className='text-lg font-semibold text-gray-900 mb-4 flex items-center'
            data-oid='hazjn7_'
          >
            <span
              className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3'
              data-oid='c9.h408'
            >
              WP
            </span>
            WordPress Integration
          </h3>
          <div className='space-y-3' data-oid=':bnvioq'>
            <div className='flex items-center' data-oid='qjrji3d'>
              <span
                className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'
                data-oid='on0aeh1'
              >
                1
              </span>
              <p className='text-gray-700 text-sm' data-oid='6fw7yfw'>
                Install the Universal AI WordPress plugin
              </p>
            </div>
            <div className='flex items-center' data-oid='svomkxc'>
              <span
                className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'
                data-oid='ixf8seg'
              >
                2
              </span>
              <p className='text-gray-700 text-sm' data-oid='x7uf9tz'>
                Add your API key in the plugin settings
              </p>
            </div>
            <div className='flex items-center' data-oid='-nwni6f'>
              <span
                className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3'
                data-oid='9swmw-v'
              >
                3
              </span>
              <p className='text-gray-700 text-sm' data-oid='y.r5557'>
                Configure A/B tests from your WordPress admin
              </p>
            </div>
            <button
              className='mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2'
              data-oid='c51a36h'
            >
              <Download className='w-4 h-4' data-oid=':tmhv3s' />
              <span data-oid='._bdeno'>Download Plugin</span>
            </button>
          </div>
        </div>

        {/* React/Next.js SDK */}
        <div
          className='bg-white rounded-lg border border-gray-200 p-6'
          data-oid='_f96s-m'
        >
          <div className='flex items-center mb-4' data-oid='8bvkn7_'>
            <span className='text-2xl mr-3' data-oid='_:hv4bg'>
              ⚛️
            </span>
            <h4
              className='text-lg font-semibold text-gray-900'
              data-oid='9z5sktu'
            >
              React/Next.js SDK
            </h4>
          </div>
          <p className='text-gray-600 mb-4' data-oid='_j-0h_p'>
            npm package for React and Next.js applications.
          </p>
          <div className='bg-gray-900 rounded-lg p-3 mb-4' data-oid='bbvma96'>
            <code
              className='text-green-400 text-sm font-mono'
              data-oid='_ovk:u-'
            >
              npm install @universal-ai/react
            </code>
          </div>
          <div className='bg-gray-900 rounded-lg p-3 mb-4' data-oid='3i_3vqc'>
            <code
              className='text-green-400 text-sm font-mono'
              data-oid='584.y1.'
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
            data-oid='4mawtw7'
          >
            <ExternalLink className='w-4 h-4' data-oid='z4gzdhi' />
            <span data-oid=':87p-pu'>View Documentation</span>
          </button>
        </div>
      </div>
    </div>
  );

  const APIKeysSection = () => (
    <div className='space-y-6' data-oid='zdw_ri5'>
      <div
        className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        data-oid='flmvbpm'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-6'
          data-oid='.vpmo07'
        >
          API Configuration
        </h3>

        <div className='space-y-6' data-oid='yq0sloc'>
          <div data-oid='dttzwl4'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid='e:b:y9u'
            >
              Production API Key
            </label>
            <div className='flex items-center space-x-3' data-oid='17m001f'>
              <input
                type='text'
                readOnly
                value={apiKey}
                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm'
                data-oid='ls56ndj'
              />

              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                data-oid='6b-3h7t'
              >
                Copy
              </button>
              <button
                className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
                data-oid='5bde:4z'
              >
                <RefreshCw className='w-4 h-4' data-oid='7f8ek9w' />
                <span data-oid='54o7zw4'>Regenerate</span>
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1' data-oid='78wu:86'>
              Keep this key secure. Never expose it in client-side code.
            </p>
          </div>

          <div data-oid='karqgg4'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid='cd.wo:q'
            >
              Test Environment Key
            </label>
            <div className='flex items-center space-x-3' data-oid='45x96oi'>
              <input
                type='text'
                readOnly
                value='ai_test_abcdef1234567890'
                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm'
                data-oid='qr666x.'
              />

              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                data-oid='cdmj66:'
              >
                Copy
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1' data-oid='1-h2gb2'>
              Use this key for development and testing environments.
            </p>
          </div>
        </div>
      </div>

      {/* REST API Documentation */}
      <div
        className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        data-oid='e0s6nzb'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-4'
          data-oid='ooih0jh'
        >
          REST API Endpoints
        </h3>

        <div className='space-y-4' data-oid='5wlxn.e'>
          <div className='bg-gray-50 rounded-lg p-4' data-oid='t4vslcq'>
            <div
              className='flex items-center justify-between mb-2'
              data-oid='ucseowo'
            >
              <span
                className='text-sm font-mono text-gray-900'
                data-oid='fdu6xlg'
              >
                POST /api/events
              </span>
              <span
                className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'
                data-oid='qrk_a8f'
              >
                Track Events
              </span>
            </div>
            <p className='text-sm text-gray-600' data-oid='6_6ifn2'>
              Send custom events and conversions to your account
            </p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4' data-oid='l.uleyk'>
            <div
              className='flex items-center justify-between mb-2'
              data-oid='hlxzthl'
            >
              <span
                className='text-sm font-mono text-gray-900'
                data-oid='dq-n_fl'
              >
                GET /api/tests
              </span>
              <span
                className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'
                data-oid='._ev--9'
              >
                A/B Tests
              </span>
            </div>
            <p className='text-sm text-gray-600' data-oid='389f6jt'>
              Retrieve active A/B tests and configurations
            </p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4' data-oid='348x26a'>
            <div
              className='flex items-center justify-between mb-2'
              data-oid='gkn7:27'
            >
              <span
                className='text-sm font-mono text-gray-900'
                data-oid='d-o460x'
              >
                GET /api/analytics
              </span>
              <span
                className='text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'
                data-oid='mk9de5z'
              >
                Analytics
              </span>
            </div>
            <p className='text-sm text-gray-600' data-oid='doghj_2'>
              Access detailed analytics and performance metrics
            </p>
          </div>
        </div>

        <button
          className='mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
          data-oid='h96l0bl'
        >
          <ExternalLink className='w-4 h-4' data-oid='nnwtsrs' />
          <span data-oid='7fc-i8e'>View Full API Documentation</span>
        </button>
      </div>
    </div>
  );

  const WebhooksSection = () => (
    <div className='space-y-6' data-oid='47gq72j'>
      <div
        className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        data-oid='ckyvge2'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-6'
          data-oid='9lel.o3'
        >
          Webhook Configuration
        </h3>

        <div className='space-y-6' data-oid='9kvm.a1'>
          <div data-oid='0-c-exi'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid='05htcek'
            >
              Endpoint URL
            </label>
            <input
              type='url'
              placeholder='https://your-app.com/webhooks/universal-ai'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              data-oid='ihepxdj'
            />

            <p className='text-xs text-gray-500 mt-1' data-oid='tkj325j'>
              We'll send POST requests to this URL when events occur.
            </p>
          </div>

          <div data-oid='u3osksr'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid='f-lg6mm'
            >
              Events to Send
            </label>
            <div className='space-y-2' data-oid='vralzrf'>
              {[
                'Test Started',
                'Test Completed',
                'Significant Result',
                'Conversion Event',
              ].map(event => (
                <label
                  key={event}
                  className='flex items-center'
                  data-oid='4.dmkgo'
                >
                  <input
                    type='checkbox'
                    defaultChecked
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    data-oid='a00t9a2'
                  />

                  <span
                    className='ml-2 text-sm text-gray-700'
                    data-oid='d_ogar4'
                  >
                    {event}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div data-oid='auqvuhj'>
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              data-oid=':amvhul'
            >
              Secret Key (Optional)
            </label>
            <input
              type='text'
              placeholder='webhook_secret_key'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              data-oid='z.fnjzh'
            />

            <p className='text-xs text-gray-500 mt-1' data-oid='samxxkj'>
              Used to verify webhook authenticity via HMAC signature.
            </p>
          </div>

          <button
            className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors'
            data-oid='yp6wqeu'
          >
            Save Webhook Configuration
          </button>
        </div>
      </div>
    </div>
  );

  const ConnectedAppsSection = () => (
    <div className='space-y-6' data-oid='.u8165a'>
      <div
        className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        data-oid='7_963r-'
      >
        <h3
          className='text-lg font-semibold text-gray-900 mb-6'
          data-oid='iwgk_c.'
        >
          Connected Applications
        </h3>

        <div className='space-y-4' data-oid='6l::m::'>
          {integrations
            .filter(i => i.status === 'Installed')
            .map(app => (
              <div
                key={app.name}
                className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                data-oid='.o18rxq'
              >
                <div className='flex items-center' data-oid=':9ab8-f'>
                  <span className='text-2xl mr-3' data-oid='34bot42'>
                    {app.logo}
                  </span>
                  <div data-oid='21fkcfg'>
                    <h4
                      className='font-medium text-gray-900'
                      data-oid='0i5.qia'
                    >
                      {app.name}
                    </h4>
                    <p className='text-sm text-gray-500' data-oid='ryb4-h2'>
                      {app.description}
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-2' data-oid='2b:0gta'>
                  <span
                    className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'
                    data-oid='ptp:h9p'
                  >
                    Connected
                  </span>
                  <button
                    className='text-gray-400 hover:text-gray-600 transition-colors'
                    data-oid='.x394by'
                  >
                    <Settings className='w-4 h-4' data-oid='ply189i' />
                  </button>
                  <button
                    onClick={() =>
                      handleIntegrationAction('uninstall', app.name)
                    }
                    className='text-red-400 hover:text-red-600 transition-colors'
                    data-oid='ktzqhc:'
                  >
                    <Trash2 className='w-4 h-4' data-oid='gmh8yb:' />
                  </button>
                </div>
              </div>
            ))}

          {integrations.filter(i => i.status === 'Installed').length === 0 && (
            <div className='text-center py-8' data-oid='g-::rml'>
              <p className='text-gray-500' data-oid='cknvbis'>
                No connected applications yet.
              </p>
              <button
                onClick={() => setSelectedTab('website')}
                className='mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium'
                data-oid='nhrw65k'
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
        data-oid='.5od7em'
      >
        <div
          className='flex items-center justify-center h-64'
          data-oid='f.yez-f'
        >
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
            data-oid='h:lo4ee'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title='Integrations - Universal AI Platform'
      data-oid='f8q2q6v'
    >
      <div className='space-y-6' data-oid='ktmo5h8'>
        {error && (
          <div
            className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'
            data-oid='g282kw3'
          >
            <div className='flex' data-oid='bj3ox3c'>
              <div className='flex-shrink-0' data-oid='ba96rhj'>
                <svg
                  className='h-5 w-5 text-yellow-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  data-oid='3nd5nu1'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                    data-oid='_bhf:dg'
                  />
                </svg>
              </div>
              <div className='ml-3' data-oid=':_a1zi8'>
                <p className='text-sm text-yellow-700' data-oid='7.j_h75'>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex items-center justify-between' data-oid='gdgmet9'>
          <div data-oid='fqibgn.'>
            <h1 className='text-2xl font-bold text-gray-900' data-oid='ha5acgs'>
              Integrations
            </h1>
            <p className='text-sm text-gray-500 mt-1' data-oid='nry5piq'>
              Connect Universal AI Platform with your favorite tools and
              services
            </p>
          </div>

          <div className='flex items-center space-x-3' data-oid='1mb:v.c'>
            <button
              className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
              data-oid='kwhtx-n'
            >
              <ExternalLink className='h-4 w-4' data-oid='7qch6c_' />
              <span data-oid='pq9p1_b'>Documentation</span>
            </button>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
              data-oid='_aur9rv'
            >
              <Download className='h-4 w-4' data-oid='doqzlgu' />
              <span data-oid='b2gf:0n'>Request Integration</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div
          className='grid grid-cols-1 md:grid-cols-3 gap-6'
          data-oid='nv1lm6o'
        >
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='6m8u8ep'
          >
            <div className='flex items-center' data-oid='el8xxk0'>
              <div className='flex-1' data-oid='.bx1zim'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='shres0m'
                >
                  Total Integrations
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='v3pi.6m'
                >
                  {totalIntegrations}
                </p>
                <p className='text-xs text-blue-600 mt-1' data-oid='epux_76'>
                  +2 this month
                </p>
              </div>
              <div
                className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='0jg_mwd'
              >
                <Settings
                  className='w-4 h-4 text-blue-600'
                  data-oid='g967wrb'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='3z6aj6n'
          >
            <div className='flex items-center' data-oid='4-zo73.'>
              <div className='flex-1' data-oid='8q2.nba'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='p1c2asf'
                >
                  Installed
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='7y9hiiz'
                >
                  {installedIntegrations}
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='x3zxdj2'>
                  Active connections
                </p>
              </div>
              <div
                className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='.4cvhj7'
              >
                <CheckCircle
                  className='w-4 h-4 text-green-600'
                  data-oid='s6s6-qi'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
            data-oid='xaxcogv'
          >
            <div className='flex items-center' data-oid='xdfv6qs'>
              <div className='flex-1' data-oid='y7t-b9-'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='r189zqz'
                >
                  Available
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='0oue09m'
                >
                  {availableIntegrations}
                </p>
                <p className='text-xs text-gray-600 mt-1' data-oid='znc91p3'>
                  Ready to install
                </p>
              </div>
              <div
                className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center'
                data-oid='n.xg7i5'
              >
                <Download
                  className='w-4 h-4 text-gray-600'
                  data-oid=':re96ms'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Integration Tabs */}
        <div className='border-b border-gray-200' data-oid='fdpxfnb'>
          <nav className='-mb-px flex space-x-8' data-oid='hy7meur'>
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
                data-oid='.z-4yqh'
              >
                <span data-oid='ypq3o92'>{tab.icon}</span>
                <span data-oid='54.6_oi'>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='py-6' data-oid='l3a_20g'>
          {selectedTab === 'website' && (
            <WebsiteIntegration data-oid='mcdrf5-' />
          )}
          {selectedTab === 'api' && <APIKeysSection data-oid='er1.c3c' />}
          {selectedTab === 'webhooks' && <WebhooksSection data-oid='vl9b89z' />}
          {selectedTab === 'apps' && (
            <ConnectedAppsSection data-oid='6tcasij' />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsPage;
