import { Eye, EyeOff, Key, Mail, Save, Shield, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { apiClient } from '../../src/services/apiClient';

interface UserSettings {
  profile: {
    fullName: string;
    email: string;
    company: string;
    role: string;
  };
  business: {
    businessType: string;
    companySize: string;
    monthlyTraffic: string;
    timezone: string;
  };
  preferences: {
    emailNotifications: boolean;
    testAlerts: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    ipRestriction: boolean;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

interface BillingInfo {
  plan: string;
  status: string;
  nextBilling: string;
  amount: number;
  usage: {
    visitors: number;
    tests: number;
    limit: number;
  };
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'team' | 'billing' | 'security' | 'integrations'>('account');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState('ai_live_1234567890abcdef_hidden');

  // Mock data as fallback
  const mockSettings: UserSettings = {
    profile: {
      fullName: 'John Doe',
      email: 'john@company.com',
      company: 'Acme Corp',
      role: 'Marketing Director',
    },
    business: {
      businessType: 'saas',
      companySize: 'medium',
      monthlyTraffic: 'medium',
      timezone: 'America/New_York',
    },
    preferences: {
      emailNotifications: true,
      testAlerts: true,
      weeklyReports: false,
      marketingEmails: false,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      ipRestriction: false,
    },
  };

  const mockTeamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@company.com',
      role: 'Owner',
      status: 'Active',
      lastActive: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@company.com',
      role: 'Admin',
      status: 'Active',
      lastActive: '2024-01-14T15:45:00Z',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@company.com',
      role: 'Editor',
      status: 'Invited',
      lastActive: '2024-01-10T09:15:00Z',
    },
  ];

  const mockBillingInfo: BillingInfo = {
    plan: 'Professional',
    status: 'Active',
    nextBilling: '2024-02-15',
    amount: 299,
    usage: {
      visitors: 87500,
      tests: 8,
      limit: 100000,
    },
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getSettings();
        setSettings(data);
      } catch (err) {
        console.warn('Failed to fetch settings from API, using mock data:', err);
        setError('Unable to connect to backend. Showing demo data.');
        setSettings(mockSettings);
        setTeamMembers(mockTeamMembers);
        setBillingInfo(mockBillingInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (updates: Partial<UserSettings>) => {
    try {
      setSaving(true);
      if (!settings) return;
      const updatedSettings: UserSettings = { ...settings, ...updates };
      await apiClient.updateSettings(updatedSettings);
      setSettings(updatedSettings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await handleSaveSettings({ profile: settings.profile });
  };

  const handlePreferencesUpdate = async (updates: Partial<UserSettings['preferences']>) => {
    if (!settings) return;
    const updatedPreferences = { ...settings.preferences, ...updates };
    await handleSaveSettings({ preferences: updatedPreferences });
  };

  if (loading) {
    return (
      <DashboardLayout title='Settings - Universal AI Platform'>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Settings - Universal AI Platform'>
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
              { key: 'account', label: 'Account', icon: <Users className="w-4 h-4" /> },
              { key: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
              { key: 'billing', label: 'Billing', icon: <Key className="w-4 h-4" /> },
              { key: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
              { key: 'integrations', label: 'Integrations', icon: <Mail className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Account Settings */}
        {activeTab === 'account' && settings && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-6'>Account Information</h3>

            <form onSubmit={handleProfileUpdate} className='space-y-6'>
              <div>
                <h4 className='text-sm font-medium text-gray-900 mb-3'>Profile Information</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Full Name</label>
                    <input
                      type='text'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.profile.fullName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, fullName: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Email Address</label>
                    <input
                      type='email'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.profile.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, email: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Company</label>
                    <input
                      type='text'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.profile.company}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, company: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Role</label>
                    <input
                      type='text'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.profile.role}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, role: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Business Configuration */}
              <div>
                <h4 className='text-sm font-medium text-gray-900 mb-3'>Business Configuration</h4>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Primary Business Type</label>
                    <select
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.business.businessType}
                      onChange={(e) => setSettings({
                        ...settings,
                        business: { ...settings.business, businessType: e.target.value }
                      })}
                    >
                      <option value='saas'>SaaS - Software as a Service</option>
                      <option value='manufacturing'>Manufacturing</option>
                      <option value='healthcare'>Healthcare</option>
                      <option value='fintech'>FinTech</option>
                      <option value='college-consulting'>College Consulting</option>
                      <option value='ecommerce'>E-commerce</option>
                    </select>
                    <p className='text-xs text-gray-500 mt-1'>
                      This configures your dashboard metrics, A/B testing templates, and industry-specific analytics
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Company Size</label>
                    <select
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.business.companySize}
                      onChange={(e) => setSettings({
                        ...settings,
                        business: { ...settings.business, companySize: e.target.value }
                      })}
                    >
                      <option value='startup'>Startup (1-10 employees)</option>
                      <option value='small'>Small Business (11-50 employees)</option>
                      <option value='medium'>Medium Business (51-200 employees)</option>
                      <option value='enterprise'>Enterprise (200+ employees)</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Monthly Traffic Volume</label>
                    <select
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.business.monthlyTraffic}
                      onChange={(e) => setSettings({
                        ...settings,
                        business: { ...settings.business, monthlyTraffic: e.target.value }
                      })}
                    >
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
                <h4 className='text-sm font-medium text-gray-900 mb-3'>Preferences</h4>
                <div className='space-y-4'>
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates about your tests and campaigns' },
                    { key: 'testAlerts', label: 'Test Alerts', description: 'Get notified when tests reach significance' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly performance summaries' },
                    { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive product updates and tips' },
                  ].map((pref) => (
                    <div key={pref.key} className='flex items-center justify-between'>
                      <div>
                        <h5 className='font-medium text-gray-900'>{pref.label}</h5>
                        <p className='text-sm text-gray-500'>{pref.description}</p>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={settings.preferences[pref.key as keyof UserSettings['preferences']]}
                          onChange={(e) => handlePreferencesUpdate({ [pref.key]: e.target.checked })}
                          className='sr-only peer'
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className='mt-6 pt-6 border-t border-gray-200'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-gray-600'>
                    Changes will be applied to your dashboard and analytics configuration
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Team Settings */}
        {activeTab === 'team' && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>Team Management</h3>
              <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
                Invite Member
              </button>
            </div>

            <div className='space-y-4'>
              {teamMembers.map((member) => (
                <div key={member.id} className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-sm font-medium text-blue-600'>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className='font-medium text-gray-900'>{member.name}</h4>
                      <p className='text-sm text-gray-500'>{member.email}</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4'>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status}
                    </span>
                    <span className='text-sm text-gray-500'>{member.role}</span>
                    <button className='text-red-600 hover:text-red-700 text-sm'>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Settings */}
        {activeTab === 'billing' && billingInfo && (
          <div className='space-y-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6'>Billing Information</h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <p className='text-sm text-blue-600 mb-1'>Current Plan</p>
                  <p className='text-xl font-bold text-blue-900'>{billingInfo.plan}</p>
                </div>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <p className='text-sm text-green-600 mb-1'>Monthly Cost</p>
                  <p className='text-xl font-bold text-green-900'>${billingInfo.amount}</p>
                </div>
                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <p className='text-sm text-purple-600 mb-1'>Next Billing</p>
                  <p className='text-xl font-bold text-purple-900'>{new Date(billingInfo.nextBilling).toLocaleDateString()}</p>
                </div>
              </div>

              <div className='border-t pt-6'>
                <h4 className='font-medium text-gray-900 mb-4'>Usage This Month</h4>
                <div className='space-y-3'>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span>Visitors Tracked</span>
                      <span>{billingInfo.usage.visitors.toLocaleString()} / {billingInfo.usage.limit.toLocaleString()}</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{ width: `${(billingInfo.usage.visitors / billingInfo.usage.limit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span>Active Tests</span>
                      <span>{billingInfo.usage.tests} / 25</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-600 h-2 rounded-full'
                        style={{ width: `${(billingInfo.usage.tests / 25) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && settings && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-6'>Security Settings</h3>

            <div className='space-y-6'>
              <div>
                <h4 className='text-sm font-medium text-gray-900 mb-3'>API Access</h4>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <label className='text-sm font-medium text-gray-700'>API Key</label>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className='text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1'
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showApiKey ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className='font-mono text-sm bg-white p-2 rounded border'>
                    {showApiKey ? apiKey : apiKey.replace(/[a-z0-9]/g, '•')}
                  </div>
                  <button className='mt-2 text-blue-600 hover:text-blue-700 text-sm'>
                    Regenerate API Key
                  </button>
                </div>
              </div>

              <div>
                <h4 className='text-sm font-medium text-gray-900 mb-3'>Security Options</h4>
                <div className='space-y-4'>
                  {[
                    { key: 'twoFactorEnabled', label: 'Two-Factor Authentication', description: 'Add an extra layer of security to your account' },
                    { key: 'ipRestriction', label: 'IP Restriction', description: 'Only allow access from specific IP addresses' },
                  ].map((option) => (
                    <div key={option.key} className='flex items-center justify-between'>
                      <div>
                        <h5 className='font-medium text-gray-900'>{option.label}</h5>
                        <p className='text-sm text-gray-500'>{option.description}</p>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={settings.security[option.key as keyof UserSettings['security']] as boolean}
                          onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, [option.key]: e.target.checked }
                          })}
                          className='sr-only peer'
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Settings */}
        {activeTab === 'integrations' && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-6'>Integration Settings</h3>

            <div className='space-y-4'>
              <div className='text-center p-8 border-2 border-dashed border-gray-300 rounded-lg'>
                <Mail className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <h4 className='text-lg font-medium text-gray-900 mb-2'>No Integrations Configured</h4>
                <p className='text-gray-500 mb-4'>
                  Connect your favorite tools to sync data and automate workflows
                </p>
                <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
                  Browse Integrations
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
