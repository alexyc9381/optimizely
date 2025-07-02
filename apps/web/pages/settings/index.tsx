import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'account' | 'team' | 'billing' | 'security' | 'integrations'
  >('account');

  return (
    <DashboardLayout title='Settings - Universal AI Platform'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Settings</h1>
            <p className='text-sm text-gray-500 mt-1'>
              Manage your account, team, billing, and security preferences
            </p>
          </div>
        </div>

        {/* Settings Navigation */}
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            {[
              { key: 'account', label: 'Account', icon: '👤' },
              { key: 'team', label: 'Team', icon: '👥' },
              { key: 'billing', label: 'Billing', icon: '💳' },
              { key: 'security', label: 'Security', icon: '🔒' },
              { key: 'integrations', label: 'Integrations', icon: '🔗' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() =>
                  setActiveTab(
                    tab.key as
                      | 'account'
                      | 'team'
                      | 'billing'
                      | 'security'
                      | 'integrations'
                  )
                }
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
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

        {/* Account Settings */}
        {activeTab === 'account' && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-6'>
              Account Information
            </h3>
            <div className='space-y-6'>
              <div>
                <h4 className='text-sm font-medium text-gray-900 mb-3'>
                  Profile Information
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Full Name
                    </label>
                    <input
                      type='text'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='Enter your name'
                      defaultValue='John Doe'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email Address
                    </label>
                    <input
                      type='email'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='Enter your email'
                      defaultValue='john@company.com'
                    />
                  </div>
                </div>
              </div>

              {/* Business Type Selection */}
              <div>
                <h4 className='text-sm font-medium text-gray-900 mb-3'>
                  Business Configuration
                </h4>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Primary Business Type
                    </label>
                    <select className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option value='saas'>SaaS - Software as a Service</option>
                      <option value='manufacturing'>Manufacturing</option>
                      <option value='healthcare'>Healthcare</option>
                      <option value='fintech'>FinTech</option>
                      <option value='college-consulting'>
                        College Consulting
                      </option>
                      <option value='ecommerce'>E-commerce</option>
                    </select>
                    <p className='text-xs text-gray-500 mt-1'>
                      This configures your dashboard metrics, A/B testing
                      templates, and industry-specific analytics
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Company Size
                    </label>
                    <select className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option value='startup'>Startup (1-10 employees)</option>
                      <option value='small'>
                        Small Business (11-50 employees)
                      </option>
                      <option value='medium'>
                        Medium Business (51-200 employees)
                      </option>
                      <option value='enterprise'>
                        Enterprise (200+ employees)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Monthly Traffic Volume
                    </label>
                    <select className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option value='low'>Under 10K visitors/month</option>
                      <option value='medium'>10K - 100K visitors/month</option>
                      <option value='high'>100K - 1M visitors/month</option>
                      <option value='enterprise'>1M+ visitors/month</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div>
                <h4 className='text-sm font-medium text-gray-900 mb-3'>
                  Preferences
                </h4>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h5 className='font-medium text-gray-900'>
                        Email Notifications
                      </h5>
                      <p className='text-sm text-gray-500'>
                        Receive updates about your tests and campaigns
                      </p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        defaultChecked
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h5 className='font-medium text-gray-900'>Test Alerts</h5>
                      <p className='text-sm text-gray-500'>
                        Get notified when tests reach significance
                      </p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        defaultChecked
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className='mt-6 pt-6 border-t border-gray-200'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-gray-600'>
                    Changes will be applied to your dashboard and analytics
                    configuration
                  </p>
                  <button className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors'>
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Settings */}
        {activeTab === 'team' && (
          <div className='space-y-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Team Members
                </h3>
                <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
                  Invite Member
                </button>
              </div>
              <div className='space-y-4'>
                {[
                  {
                    name: 'John Doe',
                    email: 'john.doe@company.com',
                    role: 'Admin',
                    status: 'Active',
                  },
                  {
                    name: 'Jane Smith',
                    email: 'jane.smith@company.com',
                    role: 'Manager',
                    status: 'Active',
                  },
                  {
                    name: 'Mike Johnson',
                    email: 'mike.johnson@company.com',
                    role: 'Analyst',
                    status: 'Pending',
                  },
                ].map((member, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                  >
                    <div className='flex items-center'>
                      <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3'>
                        <span className='text-white font-semibold text-sm'>
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {member.name}
                        </p>
                        <p className='text-sm text-gray-500'>{member.email}</p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-4'>
                      <span className='text-sm text-gray-600'>
                        {member.role}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {member.status}
                      </span>
                      <button className='text-gray-400 hover:text-gray-600'>
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
                            d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Billing Settings */}
        {activeTab === 'billing' && (
          <div className='space-y-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                Current Plan
              </h3>
              <div className='border border-blue-200 bg-blue-50 rounded-lg p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='text-xl font-bold text-blue-900'>
                      Professional Plan
                    </h4>
                    <p className='text-blue-700'>$99/month • Billed annually</p>
                    <p className='text-sm text-blue-600 mt-2'>
                      Next billing date: February 15, 2024
                    </p>
                  </div>
                  <div className='text-right'>
                    <button className='border border-blue-300 hover:border-blue-400 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium mr-2'>
                      Change Plan
                    </button>
                    <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
                      Manage Billing
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                Usage Overview
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='text-center p-4 border border-gray-200 rounded-lg'>
                  <p className='text-2xl font-bold text-gray-900'>12</p>
                  <p className='text-sm text-gray-500'>Active Tests</p>
                  <p className='text-xs text-gray-400'>of 50 allowed</p>
                </div>
                <div className='text-center p-4 border border-gray-200 rounded-lg'>
                  <p className='text-2xl font-bold text-gray-900'>47.5K</p>
                  <p className='text-sm text-gray-500'>Monthly Visitors</p>
                  <p className='text-xs text-gray-400'>of 100K allowed</p>
                </div>
                <div className='text-center p-4 border border-gray-200 rounded-lg'>
                  <p className='text-2xl font-bold text-gray-900'>3</p>
                  <p className='text-sm text-gray-500'>Team Members</p>
                  <p className='text-xs text-gray-400'>of 10 allowed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className='space-y-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                Security
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                  <div>
                    <h4 className='font-medium text-gray-900'>
                      Two-Factor Authentication
                    </h4>
                    <p className='text-sm text-gray-500'>
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
                    Enabled
                  </button>
                </div>
                <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                  <div>
                    <h4 className='font-medium text-gray-900'>API Keys</h4>
                    <p className='text-sm text-gray-500'>
                      Manage your API access keys
                    </p>
                  </div>
                  <button className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium'>
                    Manage
                  </button>
                </div>
                <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                  <div>
                    <h4 className='font-medium text-gray-900'>Login History</h4>
                    <p className='text-sm text-gray-500'>
                      View your recent login activity
                    </p>
                  </div>
                  <button className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium'>
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Settings */}
        {activeTab === 'integrations' && (
          <div className='space-y-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                Connected Integrations
              </h3>
              <div className='space-y-4'>
                {[
                  { name: 'Google Analytics', status: 'Connected', icon: '📊' },
                  { name: 'Shopify', status: 'Connected', icon: '🛍️' },
                  { name: 'WordPress', status: 'Disconnected', icon: '🔵' },
                  { name: 'Slack', status: 'Connected', icon: '💬' },
                ].map((integration, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                  >
                    <div className='flex items-center'>
                      <span className='text-2xl mr-3'>{integration.icon}</span>
                      <div>
                        <h4 className='font-medium text-gray-900'>
                          {integration.name}
                        </h4>
                        <p className='text-sm text-gray-500'>
                          Integration for data sync and notifications
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-3'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          integration.status === 'Connected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {integration.status}
                      </span>
                      <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                        {integration.status === 'Connected'
                          ? 'Configure'
                          : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
