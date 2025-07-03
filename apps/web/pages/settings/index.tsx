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
      } catch (err) {
        console.warn(
          'Failed to fetch settings from API, using mock data:',
          err
        );
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
        data-oid='liub.qa'
      >
        <div
          className='flex items-center justify-center h-64'
          data-oid='ve3k3uq'
        >
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
            data-oid='wm0zrxs'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title='Settings - Universal AI Platform'
      data-oid='6mywqww'
    >
      <div className='space-y-6' data-oid=':j5.pxr'>
        {error && (
          <div
            className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'
            data-oid='_lgce49'
          >
            <div className='flex' data-oid='j7ly5_1'>
              <div className='flex-shrink-0' data-oid='_9dy_j.'>
                <svg
                  className='h-5 w-5 text-yellow-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  data-oid='50oydry'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                    data-oid='itclwh7'
                  />
                </svg>
              </div>
              <div className='ml-3' data-oid='--m.xbk'>
                <p className='text-sm text-yellow-700' data-oid='etx3.tr'>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex items-center justify-between' data-oid='jprj5o1'>
          <div data-oid='_1xrso.'>
            <h1 className='text-2xl font-bold text-gray-900' data-oid='bb5-u_x'>
              Settings
            </h1>
            <p className='text-sm text-gray-500 mt-1' data-oid='jar.h_u'>
              Manage your account, team, billing, and security preferences
            </p>
          </div>
        </div>

        {/* Settings Navigation */}
        <div className='border-b border-gray-200' data-oid='zmonzsm'>
          <nav className='-mb-px flex space-x-8' data-oid='v3c1_mo'>
            {[
              {
                key: 'account',
                label: 'Account',
                icon: <Users className='w-4 h-4' data-oid='siejiia' />,
              },
              {
                key: 'team',
                label: 'Team',
                icon: <Users className='w-4 h-4' data-oid='n05.hv0' />,
              },
              {
                key: 'billing',
                label: 'Billing',
                icon: <Key className='w-4 h-4' data-oid='e9w2q5h' />,
              },
              {
                key: 'security',
                label: 'Security',
                icon: <Shield className='w-4 h-4' data-oid='hwahvga' />,
              },
              {
                key: 'integrations',
                label: 'Integrations',
                icon: <Mail className='w-4 h-4' data-oid='n.-0e_j' />,
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-oid='.iz_tsu'
              >
                {tab.icon}
                <span data-oid=':b41m_t'>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Account Settings */}
        {activeTab === 'account' && settings && (
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='6i_ql3m'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-6'
              data-oid='8-g0sfm'
            >
              Account Information
            </h3>

            <form
              onSubmit={handleProfileUpdate}
              className='space-y-6'
              data-oid='kva2lo6'
            >
              <div data-oid='d.efj1s'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='f6npo58'
                >
                  Profile Information
                </h4>
                <div
                  className='grid grid-cols-1 md:grid-cols-2 gap-4'
                  data-oid='jeyz0lr'
                >
                  <div data-oid='6ky:i29'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-1'
                      data-oid='-dyrocm'
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
                      data-oid='bgt4p-a'
                    />
                  </div>
                  <div data-oid='vmoc2sy'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-1'
                      data-oid='j-_e_a9'
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
                      data-oid='cw1tw7r'
                    />
                  </div>
                  <div data-oid='tzzv84a'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-1'
                      data-oid='23o4wl8'
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
                      data-oid='063.5cs'
                    />
                  </div>
                  <div data-oid='rb7f:02'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-1'
                      data-oid='f3vowez'
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
                      data-oid='1veun5_'
                    />
                  </div>
                </div>
              </div>

              {/* Business Configuration */}
              <div data-oid='fazk-rj'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='fvzdyyi'
                >
                  Business Configuration
                </h4>
                <div className='space-y-4' data-oid='_0smvf2'>
                  <div data-oid='b93gxss'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-2'
                      data-oid='_ww6rdw'
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
                      data-oid='ne0_wma'
                    >
                      <option value='saas' data-oid='nxr9_m2'>
                        SaaS - Software as a Service
                      </option>
                      <option value='manufacturing' data-oid='wqpk1.c'>
                        Manufacturing
                      </option>
                      <option value='healthcare' data-oid='65fv0fx'>
                        Healthcare
                      </option>
                      <option value='fintech' data-oid='owb2dv_'>
                        FinTech
                      </option>
                      <option value='college-consulting' data-oid='2l9xq6q'>
                        College Consulting
                      </option>
                      <option value='ecommerce' data-oid='eak_799'>
                        E-commerce
                      </option>
                    </select>
                    <p
                      className='text-xs text-gray-500 mt-1'
                      data-oid='i_-6f2q'
                    >
                      This configures your dashboard metrics, A/B testing
                      templates, and industry-specific analytics
                    </p>
                  </div>
                  <div data-oid='k62ch-g'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-2'
                      data-oid='twsyalq'
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
                      data-oid='hiws5qe'
                    >
                      <option value='startup' data-oid='e1eki_v'>
                        Startup (1-10 employees)
                      </option>
                      <option value='small' data-oid='68ubl9d'>
                        Small Business (11-50 employees)
                      </option>
                      <option value='medium' data-oid='k4pyab2'>
                        Medium Business (51-200 employees)
                      </option>
                      <option value='enterprise' data-oid='31r-rhu'>
                        Enterprise (200+ employees)
                      </option>
                    </select>
                  </div>
                  <div data-oid='g2pubk1'>
                    <label
                      className='block text-sm font-medium text-gray-700 mb-2'
                      data-oid='bqdt.sv'
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
                      data-oid='8n679jp'
                    >
                      <option value='low' data-oid='e_i4c5a'>
                        Under 10K visitors/month
                      </option>
                      <option value='medium' data-oid='fsufne7'>
                        10K - 100K visitors/month
                      </option>
                      <option value='high' data-oid='h--3gzh'>
                        100K - 1M visitors/month
                      </option>
                      <option value='enterprise' data-oid='zusnvqk'>
                        1M+ visitors/month
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div data-oid='1pl2tjv'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='71y2380'
                >
                  Preferences
                </h4>
                <div className='space-y-4' data-oid='-puekhw'>
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
                      data-oid='oh3vs9_'
                    >
                      <div data-oid=':m99rc:'>
                        <h5
                          className='font-medium text-gray-900'
                          data-oid='ifn.522'
                        >
                          {pref.label}
                        </h5>
                        <p className='text-sm text-gray-500' data-oid='lfycjp.'>
                          {pref.description}
                        </p>
                      </div>
                      <label
                        className='relative inline-flex items-center cursor-pointer'
                        data-oid='r8ka.by'
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
                          data-oid='t6ag3yi'
                        />

                        <div
                          className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                          data-oid='0g0n1gy'
                        ></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div
                className='mt-6 pt-6 border-t border-gray-200'
                data-oid='b1.pb5.'
              >
                <div
                  className='flex items-center justify-between'
                  data-oid='f.s0hyy'
                >
                  <p className='text-sm text-gray-600' data-oid='427e7uj'>
                    Changes will be applied to your dashboard and analytics
                    configuration
                  </p>
                  <button
                    type='submit'
                    disabled={saving}
                    className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
                    data-oid='ywon7mx'
                  >
                    {saving ? (
                      <>
                        <div
                          className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'
                          data-oid='i:qem_4'
                        ></div>
                        <span data-oid='_6wso1f'>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className='w-4 h-4' data-oid='0r41-j:' />
                        <span data-oid='qwa6lab'>Save Changes</span>
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
            data-oid='o_wa5no'
          >
            <div
              className='flex items-center justify-between mb-6'
              data-oid='1gv3gwp'
            >
              <h3
                className='text-lg font-semibold text-gray-900'
                data-oid='8qp70.y'
              >
                Team Management
              </h3>
              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                data-oid='b1wd2kx'
              >
                Invite Member
              </button>
            </div>

            <div className='space-y-4' data-oid='kvix085'>
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                  data-oid=':m1l-85'
                >
                  <div
                    className='flex items-center space-x-4'
                    data-oid='gk6ystn'
                  >
                    <div
                      className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'
                      data-oid='cpwcxnc'
                    >
                      <span
                        className='text-sm font-medium text-blue-600'
                        data-oid='j.e:h6a'
                      >
                        {member.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div data-oid='vrzp._1'>
                      <h4
                        className='font-medium text-gray-900'
                        data-oid='eu9baqn'
                      >
                        {member.name}
                      </h4>
                      <p className='text-sm text-gray-500' data-oid='8t50vkv'>
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div
                    className='flex items-center space-x-4'
                    data-oid='axca.0s'
                  >
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                      data-oid='okba.6f'
                    >
                      {member.status}
                    </span>
                    <span className='text-sm text-gray-500' data-oid='ed421.u'>
                      {member.role}
                    </span>
                    <button
                      className='text-red-600 hover:text-red-700 text-sm'
                      data-oid='2cb7xtx'
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
          <div className='space-y-6' data-oid='batmylw'>
            <div
              className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              data-oid='rgbfidi'
            >
              <h3
                className='text-lg font-semibold text-gray-900 mb-6'
                data-oid='urxxq3_'
              >
                Billing Information
              </h3>

              <div
                className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'
                data-oid='cq4-zkb'
              >
                <div
                  className='text-center p-4 bg-blue-50 rounded-lg'
                  data-oid='8lc9zw1'
                >
                  <p className='text-sm text-blue-600 mb-1' data-oid='tik.bte'>
                    Current Plan
                  </p>
                  <p
                    className='text-xl font-bold text-blue-900'
                    data-oid='c9ra5zh'
                  >
                    {billingInfo.plan}
                  </p>
                </div>
                <div
                  className='text-center p-4 bg-green-50 rounded-lg'
                  data-oid='u.wd4uq'
                >
                  <p className='text-sm text-green-600 mb-1' data-oid='gi7td0i'>
                    Monthly Cost
                  </p>
                  <p
                    className='text-xl font-bold text-green-900'
                    data-oid='mecz8xl'
                  >
                    ${billingInfo.amount}
                  </p>
                </div>
                <div
                  className='text-center p-4 bg-purple-50 rounded-lg'
                  data-oid=':5z5ep-'
                >
                  <p
                    className='text-sm text-purple-600 mb-1'
                    data-oid='9zlzcmv'
                  >
                    Next Billing
                  </p>
                  <p
                    className='text-xl font-bold text-purple-900'
                    data-oid='1078vck'
                  >
                    {new Date(billingInfo.nextBilling).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className='border-t pt-6' data-oid='ad2sjh_'>
                <h4
                  className='font-medium text-gray-900 mb-4'
                  data-oid='p:k3ml5'
                >
                  Usage This Month
                </h4>
                <div className='space-y-3' data-oid='a2oft6w'>
                  <div data-oid='91jz_o.'>
                    <div
                      className='flex justify-between text-sm mb-1'
                      data-oid='kwf2.:2'
                    >
                      <span data-oid='f2ppyrb'>Visitors Tracked</span>
                      <span data-oid='az5jt29'>
                        {billingInfo.usage.visitors.toLocaleString()} /{' '}
                        {billingInfo.usage.limit.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className='w-full bg-gray-200 rounded-full h-2'
                      data-oid='pwvph-9'
                    >
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{
                          width: `${(billingInfo.usage.visitors / billingInfo.usage.limit) * 100}%`,
                        }}
                        data-oid='m1ow.9w'
                      ></div>
                    </div>
                  </div>
                  <div data-oid='f04wxrq'>
                    <div
                      className='flex justify-between text-sm mb-1'
                      data-oid='ezi:wt6'
                    >
                      <span data-oid='89-06lu'>Active Tests</span>
                      <span data-oid='-9ccotl'>
                        {billingInfo.usage.tests} / 25
                      </span>
                    </div>
                    <div
                      className='w-full bg-gray-200 rounded-full h-2'
                      data-oid='gz6uk97'
                    >
                      <div
                        className='bg-green-600 h-2 rounded-full'
                        style={{
                          width: `${(billingInfo.usage.tests / 25) * 100}%`,
                        }}
                        data-oid='hjf810i'
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
            data-oid='.9efba_'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-6'
              data-oid='a2nzdi_'
            >
              Security Settings
            </h3>

            <div className='space-y-6' data-oid='b:6o346'>
              <div data-oid='qd2u2ai'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='geik-a_'
                >
                  API Access
                </h4>
                <div className='bg-gray-50 p-4 rounded-lg' data-oid='g4sl5l1'>
                  <div
                    className='flex items-center justify-between mb-2'
                    data-oid='tedo-y_'
                  >
                    <label
                      className='text-sm font-medium text-gray-700'
                      data-oid='u6mki9.'
                    >
                      API Key
                    </label>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className='text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1'
                      data-oid='v1qdmw-'
                    >
                      {showApiKey ? (
                        <EyeOff className='w-4 h-4' data-oid='qum7crz' />
                      ) : (
                        <Eye className='w-4 h-4' data-oid='z3g5w65' />
                      )}
                      <span data-oid='1uhr-wi'>
                        {showApiKey ? 'Hide' : 'Show'}
                      </span>
                    </button>
                  </div>
                  <div
                    className='font-mono text-sm bg-white p-2 rounded border'
                    data-oid='8ps34x:'
                  >
                    {showApiKey ? apiKey : apiKey.replace(/[a-z0-9]/g, '•')}
                  </div>
                  <button
                    className='mt-2 text-blue-600 hover:text-blue-700 text-sm'
                    data-oid='d.e9an6'
                  >
                    Regenerate API Key
                  </button>
                </div>
              </div>

              <div data-oid='ldzpvk6'>
                <h4
                  className='text-sm font-medium text-gray-900 mb-3'
                  data-oid='vg84t7j'
                >
                  Security Options
                </h4>
                <div className='space-y-4' data-oid='qe8:s7h'>
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
                      data-oid='4p:s_7.'
                    >
                      <div data-oid='lcx849p'>
                        <h5
                          className='font-medium text-gray-900'
                          data-oid='sjqu0hw'
                        >
                          {option.label}
                        </h5>
                        <p className='text-sm text-gray-500' data-oid='u9gjhui'>
                          {option.description}
                        </p>
                      </div>
                      <label
                        className='relative inline-flex items-center cursor-pointer'
                        data-oid='-0h9y22'
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
                          data-oid='juctxsp'
                        />

                        <div
                          className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                          data-oid='nn0ksfz'
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
            data-oid='mujfjbq'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-6'
              data-oid='6wq-e-j'
            >
              Integration Settings
            </h3>

            <div className='space-y-4' data-oid='qqvhcua'>
              <div
                className='text-center p-8 border-2 border-dashed border-gray-300 rounded-lg'
                data-oid='i-5c0kw'
              >
                <Mail
                  className='w-12 h-12 text-gray-400 mx-auto mb-4'
                  data-oid='32ebez.'
                />

                <h4
                  className='text-lg font-medium text-gray-900 mb-2'
                  data-oid='jm1b.rk'
                >
                  No Integrations Configured
                </h4>
                <p className='text-gray-500 mb-4' data-oid='-qftg-t'>
                  Connect your favorite tools to sync data and automate
                  workflows
                </p>
                <button
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                  data-oid='mb4y4wf'
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
