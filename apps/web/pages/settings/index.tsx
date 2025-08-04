import { Eye, EyeOffIcon as EyeOff, Key, Mail, Save, Shield, Users } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<
    'account' | 'team' | 'billing' | 'security' | 'integrations'
  >('account');
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
      } catch {
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

  // Handle URL parameters for tab navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new window.URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['account', 'team', 'billing', 'security', 'integrations'].includes(tab)) {
        setActiveTab(tab as 'account' | 'team' | 'billing' | 'security' | 'integrations');
      }
    }
  }, []);

  const handleSaveSettings = async (updates: Partial<UserSettings>) => {
    try {
      setSaving(true);
      if (!settings) return;
      const updatedSettings: UserSettings = { ...settings, ...updates };
      await apiClient.updateSettings(updatedSettings);
      setSettings(updatedSettings);
      alert('Settings saved successfully!');
    } catch {
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

  const handlePreferencesUpdate = async (
    updates: Partial<UserSettings['preferences']>
  ) => {
    if (!settings) return;
    const updatedPreferences = { ...settings.preferences, ...updates };
    await handleSaveSettings({ preferences: updatedPreferences });
  };

  if (loading) {
    return (
      <DashboardLayout
        title='Settings - Universal AI Platform'
        data-oid='giqr76x'
      >
        <div
          className='flex items-center justify-center h-64'
          data-oid='15a0b42'
        >
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
            data-oid='_fiy709'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title='Settings - Universal AI Platform'
      data-oid='gxgm10i'
    >
      <div className='space-y-6' data-oid='i6:uj5p'>
        {error && (
          <div
            className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'
            data-oid='hg9:_:p'
          >
            <div className='flex' data-oid='4bol5kg'>
              <div className='flex-shrink-0' data-oid='y.t6k67'>
                <svg
                  className='h-5 w-5 text-yellow-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  data-oid='u0v:xnj'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                    data-oid='t3o3ajo'
                  />
                </svg>
              </div>
              <div className='ml-3' data-oid='nwqcd7.'>
                <p className='text-sm text-yellow-700' data-oid='z1qpl3k'>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex items-center justify-between' data-oid='_-2-d_z'>
          <div data-oid='9pc4w5_'>
            <h1 className='text-2xl font-bold text-gray-900' data-oid='-rqa0ja'>
              Settings
            </h1>
            <p className='text-sm text-gray-500 mt-1' data-oid='1_-la9j'>
              Manage your account, team, billing, and security preferences
            </p>
          </div>
        </div>

        {/* Settings Navigation */}
        <div className='border-b border-gray-200' data-oid='8y3ck8-'>
          <nav className='-mb-px flex space-x-8' data-oid='lvitv.s'>
            {[
              {
                key: 'account',
                label: 'Account',
                icon: <Users className='w-4 h-4' data-oid='v8qcwr0' />,
              },
              {
                key: 'team',
                label: 'Team',
                icon: <Users className='w-4 h-4' data-oid='cczyn:_' />,
              },
              {
                key: 'billing',
                label: 'Billing',
                icon: <Key className='w-4 h-4' data-oid='9ehlzj5' />,
              },
              {
                key: 'security',
                label: 'Security',
                icon: <Shield className='w-4 h-4' data-oid='5ytagmi' />,
              },
              {
                key: 'integrations',
                label: 'Integrations',
                icon: <Mail className='w-4 h-4' data-oid='129rms9' />,
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as 'account' | 'team' | 'billing' | 'security' | 'integrations');
                  // Update URL without router for SSR compatibility
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', `/settings?tab=${tab.key}`);
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-oid='5k6tx.g'
              >
                {tab.icon}
                <span data-oid='5e.weuc'>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Account Settings */}
        {activeTab === 'account' && settings && (
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='40bz.:0'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-6'
              data-oid='-1b69he'
            >
              Account Information
            </h3>

            <form
              onSubmit={handleProfileUpdate}
              className='space-y-6'
              data-oid='p5gfp6q'
            >
              <div data-oid=':hg9:hs'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='iystpne'
                >
                  Profile Information
                </h4>
                <div
                  className='grid grid-cols-1 md:grid-cols-2 gap-4'
                  data-oid='k16n5g_'
                >
                  <div data-oid='2jbic:u'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-1'
                      data-oid='sjy3v2:'
                    >
                      Full Name
                    </label>
                    <input
                      type='text'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.profile.fullName}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            fullName: e.target.value,
                          },
                        })
                      }
                      required
                      data-oid='ek247.i'
                    />
                  </div>
                  <div data-oid='53xibbj'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-1'
                      data-oid='j1-rk2v'
                    >
                      Email Address
                    </label>
                    <input
                      type='email'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.profile.email}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            email: e.target.value,
                          },
                        })
                      }
                      required
                      data-oid='.6lm970'
                    />
                  </div>
                  <div data-oid='xzzurzb'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-1'
                      data-oid='uriz-i4'
                    >
                      Company
                    </label>
                    <input
                      type='text'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.profile.company}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            company: e.target.value,
                          },
                        })
                      }
                      data-oid='nasnn2n'
                    />
                  </div>
                  <div data-oid='17pqhkb'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-1'
                      data-oid='io80h.-'
                    >
                      Role
                    </label>
                    <input
                      type='text'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.profile.role}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            role: e.target.value,
                          },
                        })
                      }
                      data-oid='q.p3x-_'
                    />
                  </div>
                </div>
              </div>

              {/* Business Configuration */}
              <div data-oid='vhi16_i'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='aprc-9h'
                >
                  Business Configuration
                </h4>
                <div className='space-y-4' data-oid='pfwnrws'>
                  <div data-oid='3js083c'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-2'
                      data-oid='_8.1zsp'
                    >
                      Primary Business Type
                    </label>
                    <select
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.business.businessType}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          business: {
                            ...settings.business,
                            businessType: e.target.value,
                          },
                        })
                      }
                      data-oid='q1ow9.s'
                    >
                      <option value='saas' data-oid='hymhq45'>
                        SaaS - Software as a Service
                      </option>
                      <option value='manufacturing' data-oid='3cn20gf'>
                        Manufacturing
                      </option>
                      <option value='healthcare' data-oid='fs3pkfe'>
                        Healthcare
                      </option>
                      <option value='fintech' data-oid='damh93w'>
                        FinTech
                      </option>
                      <option value='college-consulting' data-oid=':o1xxh5'>
                        College Consulting
                      </option>
                      <option value='ecommerce' data-oid='ef8n25-'>
                        E-commerce
                      </option>
                    </select>
                    <p
                      className='text-xs text-gray-500 mt-1'
                      data-oid='fyyy:vo'
                    >
                      This configures your dashboard metrics, A/B testing
                      templates, and industry-specific analytics
                    </p>
                  </div>
                  <div data-oid='7f12ovl'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-2'
                      data-oid='14m1wiy'
                    >
                      Company Size
                    </label>
                    <select
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.business.companySize}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          business: {
                            ...settings.business,
                            companySize: e.target.value,
                          },
                        })
                      }
                      data-oid='4zysoj0'
                    >
                      <option value='startup' data-oid='lw:iu6o'>
                        Startup (1-10 employees)
                      </option>
                      <option value='small' data-oid='u2lp3eo'>
                        Small Business (11-50 employees)
                      </option>
                      <option value='medium' data-oid='5v95o92'>
                        Medium Business (51-200 employees)
                      </option>
                      <option value='enterprise' data-oid='4s1myuu'>
                        Enterprise (200+ employees)
                      </option>
                    </select>
                  </div>
                  <div data-oid='jw635yo'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-2'
                      data-oid='bhz-jz7'
                    >
                      Monthly Traffic Volume
                    </label>
                    <select
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={settings.business.monthlyTraffic}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          business: {
                            ...settings.business,
                            monthlyTraffic: e.target.value,
                          },
                        })
                      }
                      data-oid='ga32iqm'
                    >
                      <option value='low' data-oid='i5vk63n'>
                        Under 10K visitors/month
                      </option>
                      <option value='medium' data-oid='4knz:sv'>
                        10K - 100K visitors/month
                      </option>
                      <option value='high' data-oid='hhatygk'>
                        100K - 1M visitors/month
                      </option>
                      <option value='enterprise' data-oid='e8_1n_3'>
                        1M+ visitors/month
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div data-oid='.w4_j:c'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='raov36a'
                >
                  Preferences
                </h4>
                <div className='space-y-4' data-oid='qcwk9k2'>
                  {[
                    {
                      key: 'emailNotifications',
                      label: 'Email Notifications',
                      description:
                        'Receive updates about your tests and campaigns',
                    },
                    {
                      key: 'testAlerts',
                      label: 'Test Alerts',
                      description: 'Get notified when tests reach significance',
                    },
                    {
                      key: 'weeklyReports',
                      label: 'Weekly Reports',
                      description: 'Receive weekly performance summaries',
                    },
                    {
                      key: 'marketingEmails',
                      label: 'Marketing Emails',
                      description: 'Receive product updates and tips',
                    },
                  ].map(pref => (
                    <div
                      key={pref.key}
                      className='flex items-center justify-between'
                      data-oid='a8s:rsx'
                    >
                      <div data-oid='wu309-r'>
                        <h5
                          className='font-medium text-gray-900'
                          data-oid='feey8:a'
                        >
                          {pref.label}
                        </h5>
                        <p className='text-sm text-gray-500' data-oid='dnz7t2n'>
                          {pref.description}
                        </p>
                      </div>
                      <label
                        className='relative inline-flex items-center cursor-pointer'
                        data-oid='a4._ocy'
                      >
                        <input
                          type='checkbox'
                          checked={
                            settings.preferences[
                              pref.key as keyof UserSettings['preferences']
                            ]
                          }
                          onChange={e =>
                            handlePreferencesUpdate({
                              [pref.key]: e.target.checked,
                            })
                          }
                          className='sr-only peer'
                          data-oid='hw8i2id'
                        />

                        <div
                          className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                          data-oid='75n55sw'
                        ></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div
                className='mt-6 pt-6 border-t border-gray-200'
                data-oid='yfy77ln'
              >
                <div
                  className='flex items-center justify-between'
                  data-oid='goc9k7s'
                >
                  <p className='text-sm text-gray-600' data-oid='6nytlyl'>
                    Changes will be applied to your dashboard and analytics
                    configuration
                  </p>
                  <button
                    type='submit'
                    disabled={saving}
                    className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
                    data-oid='2kfush0'
                  >
                    {saving ? (
                      <>
                        <div
                          className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'
                          data-oid='gbp55cu'
                        ></div>
                        <span data-oid='8.gbgg2'>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className='w-4 h-4' data-oid='6t1tcdx' />
                        <span data-oid='8nr4wa5'>Save Changes</span>
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
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='_:8.u-x'
          >
            <div
              className='flex items-center justify-between mb-6'
              data-oid='tsh67r.'
            >
              <h3
                className='text-lg font-semibold text-gray-900'
                data-oid='n5u3w17'
              >
                Team Management
              </h3>
              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                data-oid='tr4eig_'
              >
                Invite Member
              </button>
            </div>

            <div className='space-y-4' data-oid='g6ovtht'>
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                  data-oid='y5zl_1-'
                >
                  <div
                    className='flex items-center space-x-4'
                    data-oid='ubg4i4k'
                  >
                    <div
                      className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'
                      data-oid='ok7n7w7'
                    >
                      <span
                        className='text-sm font-medium text-blue-600'
                        data-oid='2tarqb8'
                      >
                        {member.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div data-oid='13ukbbv'>
                      <h4
                        className='font-medium text-gray-900'
                        data-oid='a3oc4a:'
                      >
                        {member.name}
                      </h4>
                      <p className='text-sm text-gray-500' data-oid='sf9en7a'>
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div
                    className='flex items-center space-x-4'
                    data-oid='re2g6r9'
                  >
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                      data-oid='sckq1a_'
                    >
                      {member.status}
                    </span>
                    <span className='text-sm text-gray-500' data-oid='fg_mm0v'>
                      {member.role}
                    </span>
                    <button
                      className='text-red-600 hover:text-red-700 text-sm'
                      data-oid='g_zkw-2'
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Settings */}
        {activeTab === 'billing' && billingInfo && (
          <div className='space-y-6' data-oid='t719tyd'>
            <div
              className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              data-oid='xfull7q'
            >
              <h3
                className='text-lg font-semibold text-gray-900 mb-6'
                data-oid='wsmnbfl'
              >
                Billing Information
              </h3>

              <div
                className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'
                data-oid='nq97zaj'
              >
                <div
                  className='text-center p-4 bg-blue-50 rounded-lg'
                  data-oid='l_j6jux'
                >
                  <p className='text-sm text-blue-600 mb-1' data-oid='4ju4o1z'>
                    Current Plan
                  </p>
                  <p
                    className='text-xl font-bold text-blue-900'
                    data-oid='z3hqcmb'
                  >
                    {billingInfo.plan}
                  </p>
                </div>
                <div
                  className='text-center p-4 bg-green-50 rounded-lg'
                  data-oid='s8sfm:c'
                >
                  <p className='text-sm text-green-600 mb-1' data-oid='ju2723e'>
                    Monthly Cost
                  </p>
                  <p
                    className='text-xl font-bold text-green-900'
                    data-oid='lpe4712'
                  >
                    ${billingInfo.amount}
                  </p>
                </div>
                <div
                  className='text-center p-4 bg-blue-50 rounded-lg'
                  data-oid='z38ehou'
                >
                  <p
                    className='text-sm text-blue-600 mb-1'
                    data-oid='k47zyu_'
                  >
                    Next Billing
                  </p>
                  <p
                    className='text-xl font-bold text-blue-900'
                    data-oid='1_m.cvy'
                  >
                    {new Date(billingInfo.nextBilling).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className='border-t pt-6' data-oid='_.s6rmq'>
                <h4
                  className='font-medium text-gray-900 mb-4'
                  data-oid='6-1iv_l'
                >
                  Usage This Month
                </h4>
                <div className='space-y-3' data-oid='oli_ld_'>
                  <div data-oid='.4sr:l1'>
                    <div
                      className='flex justify-between text-sm mb-1'
                      data-oid='bzu83at'
                    >
                      <span data-oid='qn.kezr'>Visitors Tracked</span>
                      <span data-oid='k.j2dib'>
                        {billingInfo.usage.visitors.toLocaleString()} /{' '}
                        {billingInfo.usage.limit.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className='w-full bg-gray-200 rounded-full h-2'
                      data-oid='v1d.j1t'
                    >
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{
                          width: `${(billingInfo.usage.visitors / billingInfo.usage.limit) * 100}%`,
                        }}
                        data-oid='4ea0n3q'
                      ></div>
                    </div>
                  </div>
                  <div data-oid='rolc0xq'>
                    <div
                      className='flex justify-between text-sm mb-1'
                      data-oid='yxkl98m'
                    >
                      <span data-oid='ru-0-m7'>Active Tests</span>
                      <span data-oid='27ro7py'>
                        {billingInfo.usage.tests} / 25
                      </span>
                    </div>
                    <div
                      className='w-full bg-gray-200 rounded-full h-2'
                      data-oid='.onhx_3'
                    >
                      <div
                        className='bg-green-600 h-2 rounded-full'
                        style={{
                          width: `${(billingInfo.usage.tests / 25) * 100}%`,
                        }}
                        data-oid='bky72-g'
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
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='iufa76k'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-6'
              data-oid='4lr21il'
            >
              Security Settings
            </h3>

            <div className='space-y-6' data-oid='nx9c-n_'>
              <div data-oid='.28zfa:'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='xm2u.w5'
                >
                  API Access
                </h4>
                <div className='bg-gray-50 p-4 rounded-lg' data-oid='a-lnedj'>
                  <div
                    className='flex items-center justify-between mb-2'
                    data-oid='i4ofe1c'
                  >
                    <label
                      className='text-sm font-medium text-gray-700'
                      data-oid='9_:77k_'
                    >
                      API Key
                    </label>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className='text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1'
                      data-oid='ysa8djm'
                    >
                      {showApiKey ? (
                        <EyeOff className='w-4 h-4' data-oid='62mcav7' />
                      ) : (
                        <Eye className='w-4 h-4' data-oid='rn_pbvu' />
                      )}
                      <span data-oid='wbj5je2'>
                        {showApiKey ? 'Hide' : 'Show'}
                      </span>
                    </button>
                  </div>
                  <div
                    className='font-mono text-sm bg-white p-2 rounded border'
                    data-oid='4o922w_'
                  >
                    {showApiKey ? apiKey : apiKey.replace(/[a-z0-9]/g, '•')}
                  </div>
                  <button
                    className='mt-2 text-blue-600 hover:text-blue-700 text-sm'
                    data-oid='5_uvedx'
                  >
                    Regenerate API Key
                  </button>
                </div>
              </div>

              <div data-oid='9g8.cdl'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='kkoh:tn'
                >
                  Security Options
                </h4>
                <div className='space-y-4' data-oid='-w:ljuo'>
                  {[
                    {
                      key: 'twoFactorEnabled',
                      label: 'Two-Factor Authentication',
                      description:
                        'Add an extra layer of security to your account',
                    },
                    {
                      key: 'ipRestriction',
                      label: 'IP Restriction',
                      description:
                        'Only allow access from specific IP addresses',
                    },
                  ].map(option => (
                    <div
                      key={option.key}
                      className='flex items-center justify-between'
                      data-oid='xxi:9c.'
                    >
                      <div data-oid='ebu9ewm'>
                        <h5
                          className='font-medium text-gray-900'
                          data-oid='m16683m'
                        >
                          {option.label}
                        </h5>
                        <p className='text-sm text-gray-500' data-oid='ur6nvar'>
                          {option.description}
                        </p>
                      </div>
                      <label
                        className='relative inline-flex items-center cursor-pointer'
                        data-oid='9g:e5b2'
                      >
                        <input
                          type='checkbox'
                          checked={
                            settings.security[
                              option.key as keyof UserSettings['security']
                            ] as boolean
                          }
                          onChange={e =>
                            setSettings({
                              ...settings,
                              security: {
                                ...settings.security,
                                [option.key]: e.target.checked,
                              },
                            })
                          }
                          className='sr-only peer'
                          data-oid='s-w9ak9'
                        />

                        <div
                          className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                          data-oid='0sdmik_'
                        ></div>
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
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='.81e:.x'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-6'
              data-oid='64rn0un'
            >
              Integration Settings
            </h3>

            <div className='space-y-4' data-oid='h_tk55l'>
              <div
                className='text-center p-8 border-2 border-dashed border-gray-300 rounded-lg'
                data-oid='g9amwkn'
              >
                <Mail
                  className='w-12 h-12 text-gray-400 mx-auto mb-4'
                  data-oid='ql6g1e2'
                />

                <h4
                  className='text-lg font-medium text-gray-900 mb-2'
                  data-oid='2yzpt4l'
                >
                  No Integrations Configured
                </h4>
                <p className='text-gray-500 mb-4' data-oid='lev5hix'>
                  Connect your favorite tools to sync data and automate
                  workflows
                </p>
                <button
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                  data-oid='eutvicd'
                >
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
