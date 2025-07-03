import {
  BarChart3,
  Bell,
  Brain,
  ChevronDown,
  ChevronLeft,
  Clock,
  Code,
  CreditCard,
  DollarSign,
  Home,
  LucideProps,
  Menu,
  Search,
  Settings,
  Shield,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// --- TYPE DEFINITIONS ---
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.FC<LucideProps>;
  changeType: 'positive' | 'negative';
}

interface Page {
  title: string;
  subtitle: string;
  component: React.ReactNode;
}

interface PageCollection {
  [key: string]: Page;
}

// --- MOCK DATA (as before, can be moved to a separate file) ---
const revenueData = [
  { hour: '00:00', predicted: 45, actual: 42 },
  { hour: '04:00', predicted: 52, actual: 48 },
  { hour: '08:00', predicted: 78, actual: 75 },
  { hour: '12:00', predicted: 95, actual: 92 },
  { hour: '16:00', predicted: 120, actual: 118 },
  { hour: '20:00', predicted: 135, actual: 131 },
  { hour: '24:00', predicted: 142, actual: 139 },
];

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'prospects', label: 'Prospects', icon: Users },
  { id: 'decisions', label: 'AI Decisions', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// --- ANALYTICS MOCK DATA ---
const analyticsData = {
  overview: {
    totalRevenue: 2847000,
    revenueGrowth: 34.2,
    conversionRate: 8.7,
    conversionGrowth: 127.3,
    avgDealSize: 67000,
    dealSizeGrowth: 23.1,
    timeToConversion: 4.2,
    timeReduction: -35.8,
  },
  revenueByMonth: [
    { month: 'Jan', revenue: 185000 },
    { month: 'Feb', revenue: 230000 },
    { month: 'Mar', revenue: 278000 },
    { month: 'Apr', revenue: 345000 },
    { month: 'May', revenue: 412000 },
    { month: 'Jun', revenue: 489000 },
    { month: 'Jul', revenue: 567000 },
    { month: 'Aug', revenue: 634000 },
  ],

  interventionPerformance: [
    {
      type: 'Geographic Personalization',
      impressions: 8934,
      conversions: 892,
      rate: 9.98,
      lift: 156,
      revenue: 1240000,
    },
    {
      type: 'Competitive Defense',
      impressions: 2341,
      conversions: 387,
      rate: 16.53,
      lift: 234,
      revenue: 980000,
    },
    {
      type: 'Price Sensitivity Detection',
      impressions: 5627,
      conversions: 445,
      rate: 7.91,
      lift: 89,
      revenue: 670000,
    },
    {
      type: 'Urgency Triggers',
      impressions: 3892,
      conversions: 623,
      rate: 16.01,
      lift: 178,
      revenue: 1120000,
    },
    {
      type: 'Premium Showcase',
      impressions: 1456,
      conversions: 234,
      rate: 16.07,
      lift: 203,
      revenue: 890000,
    },
  ],

  geographicPerformance: [
    { region: 'North America', visitors: 18400, color: '#6366F1' },
    { region: 'Europe', visitors: 12300, color: '#8B5CF6' },
    { region: 'Asia Pacific', visitors: 9800, color: '#06B6D4' },
    { region: 'Other', visitors: 5100, color: '#10B981' },
  ],
};

// --- PROSPECTS MOCK DATA ---
const liveProspects = [
  {
    visitorId: 'V_2847',
    location: {
      country: 'US',
      region: 'California',
      city: 'San Francisco',
      flag: '🇺🇸',
    },
    behaviorScore: 89,
    revenueValue: 78000,
    confidence: 96,
    status: 'active',
    timeOnSite: '12m 34s',
    pagesVisited: 8,
    engagementLevel: 'high',
    aiInsights: {
      intent: 'Researching Stanford CS programs for child',
      nextAction: 'Auto-triggered: Stanford success popup in 30s',
    },
  },
  {
    visitorId: 'V_2851',
    location: { country: 'CA', region: 'Ontario', city: 'Toronto', flag: '🇨🇦' },
    behaviorScore: 67,
    revenueValue: 42000,
    confidence: 78,
    status: 'active',
    timeOnSite: '8m 12s',
    pagesVisited: 5,
    engagementLevel: 'medium',
    aiInsights: {
      intent: 'Looking for affordable university options',
      nextAction: 'Auto-triggering scholarship finder in 2m',
    },
  },
  {
    visitorId: 'V_2849',
    location: { country: 'GB', region: 'England', city: 'London', flag: '🇬🇧' },
    behaviorScore: 94,
    revenueValue: 89000,
    confidence: 91,
    status: 'active',
    timeOnSite: '18m 45s',
    pagesVisited: 12,
    engagementLevel: 'very_high',
    aiInsights: {
      intent: 'Researching premium Oxbridge admissions support',
      nextAction: 'Auto-executing: Exclusive Oxbridge popup NOW',
    },
  },
];

// --- AI DECISIONS MOCK DATA ---
const aiDecisionsData = {
  liveDecisions: [
    {
      id: 'D01',
      visitor: 'V_2847',
      trigger: 'High Engagement',
      decision: 'Triggered success story popup',
      confidence: 96,
      outcome: 'pending',
    },
    {
      id: 'D02',
      visitor: 'V_2851',
      trigger: 'Price Sensitivity',
      decision: 'Activated scholarship finder',
      confidence: 82,
      outcome: 'positive',
    },
    {
      id: 'D03',
      visitor: 'V_2849',
      trigger: 'Competitor Referrer',
      decision: 'Deployed competitive defense',
      confidence: 91,
      outcome: 'positive',
    },
    {
      id: 'D04',
      visitor: 'V_3102',
      trigger: 'Exit Intent',
      decision: 'Offered limited-time discount',
      confidence: 78,
      outcome: 'negative',
    },
  ],

  strategies: [
    { id: 'geo', name: 'Geographic Personalization', enabled: true },
    { id: 'defense', name: 'Competitive Defense', enabled: true },
    { id: 'price', name: 'Price Sensitivity Detection', enabled: false },
    { id: 'urgency', name: 'Urgency Triggers', enabled: true },
  ],

  performance: {
    accuracy: 94.7,
    decisionsPerHour: 342,
    revenueImpact: 12800,
  },
};

// --- SETTINGS MOCK DATA ---
const settingsData = {
  profile: {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    role: 'Administrator',
    avatar: 'https://i.pravatar.cc/40',
  },
  notifications: {
    highValueProspects: true,
    weeklySummary: true,
    securityAlerts: false,
  },
  display: {
    theme: 'dark',
    density: 'compact',
  },
  integrations: [
    { id: 'salesforce', name: 'Salesforce', connected: true },
    { id: 'google_analytics', name: 'Google Analytics', connected: false },
  ],
};

// --- UI COMPONENTS ---

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  activePage,
  setActivePage,
}) => {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-primary-surface text-text-primary transition-all duration-300 z-40 ${isCollapsed ? 'w-16' : 'w-[196px]'}`}
      data-oid='9708gsm'
    >
      <div className='flex flex-col h-full' data-oid='_gsibyy'>
        {/* Logo and Toggle */}
        <div
          className={`flex items-center p-md border-b border-white/10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          data-oid='6qgbrfp'
        >
          {!isCollapsed && (
            <span className='text-lg font-bold' data-oid='0t3c520'>
              RevAI
            </span>
          )}
          <button
            onClick={onToggle}
            className='p-1 rounded-md hover:bg-white/5'
            data-oid='k-7auan'
          >
            <ChevronLeft
              className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
              data-oid='jkd:0_o'
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-md py-sm space-y-xs' data-oid='-.3cwrz'>
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href='#'
                onClick={e => {
                  e.preventDefault();
                  setActivePage(item.id);
                }}
                className={`flex items-center p-xs rounded-md transition-all duration-200 ${isActive ? 'bg-primary-accent text-white' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'} ${isCollapsed ? 'justify-center' : ''}`}
                data-oid='f4ositz'
              >
                <Icon className='h-5 w-5' data-oid='reasl6a' />
                {!isCollapsed && (
                  <span className='ml-sm font-medium' data-oid='4_68v_2'>
                    {item.label}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className='p-md border-t border-white/10' data-oid='phg63..'>
          <div className='flex items-center' data-oid='c-74llg'>
            <img
              src='https://i.pravatar.cc/40'
              alt='User Avatar'
              className='rounded-full w-8 h-8'
              data-oid='-_85:9z'
            />

            {!isCollapsed && (
              <div className='ml-sm' data-oid='lf8xt_0'>
                <p className='font-semibold text-sm' data-oid='4pmmzje'>
                  Jane Doe
                </p>
                <p className='text-xs text-text-secondary' data-oid='djb9.qo'>
                  Admin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

const Header: React.FC<HeaderProps> = ({ onMenuClick, title, subtitle }) => (
  <header
    className='flex items-center justify-between p-md bg-primary-background/80 backdrop-blur-sm sticky top-0 z-30'
    data-oid='c-aad8z'
  >
    {/* Mobile Menu & Page Title */}
    <div className='flex items-center' data-oid='xh90ea6'>
      <button
        onClick={onMenuClick}
        className='mr-md lg:hidden p-1 rounded-md hover:bg-white/5'
        data-oid='a82lhp:'
      >
        <Menu data-oid='zdit37g' />
      </button>
      <div data-oid='a03n5yg'>
        <h1 className='text-xl font-bold' data-oid='tz:er8p'>
          {title}
        </h1>
        <p className='text-sm text-text-secondary' data-oid='33drb8y'>
          {subtitle}
        </p>
      </div>
    </div>

    {/* Search and Actions */}
    <div className='flex items-center space-x-sm' data-oid='6vvfdso'>
      <div className='relative hidden md:block' data-oid='zvpkltk'>
        <Search
          className='absolute left-sm top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted'
          data-oid='nysuyv-'
        />

        <input
          type='text'
          placeholder='Search...'
          className='bg-primary-surface border border-white/10 rounded-md pl-8 pr-sm py-xs w-56 focus:outline-none focus:ring-2 focus:ring-primary-accent'
          data-oid='h260pa4'
        />
      </div>
      <button className='p-xs rounded-full hover:bg-white/5' data-oid='yqexkbs'>
        <Bell data-oid='c3pzz96' />
      </button>
      <button
        className='text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity'
        data-oid='y0qz_08'
      >
        New Report
      </button>
    </div>
  </header>
);

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  changeType,
}) => {
  const changeColor =
    changeType === 'positive' ? 'text-status-success' : 'text-status-error';
  return (
    <div
      className='bg-primary-card p-md rounded-lg border border-white/10 shadow-md'
      data-oid='de4735v'
    >
      <div className='flex justify-between items-start' data-oid='l6a-6_n'>
        <div className='space-y-xs' data-oid='wgv615f'>
          <p
            className='text-xs uppercase font-semibold tracking-wider text-text-secondary'
            data-oid='53uhv-1'
          >
            {title}
          </p>
          <p className='text-2xl font-bold' data-oid='fplw0b1'>
            {value}
          </p>
        </div>
        <Icon className='h-5 w-5 text-text-muted' data-oid='tgx8k9t' />
      </div>
      <p
        className={`text-xs font-medium mt-sm ${changeColor}`}
        data-oid='o9_:j02'
      >
        {change} vs last month
      </p>
    </div>
  );
};

const MainChart = () => (
  <div
    className='bg-primary-card p-lg rounded-lg border border-white/10 shadow-md'
    data-oid='e4eds-d'
  >
    <div className='flex justify-between items-center mb-md' data-oid='6b8izt1'>
      <div data-oid='7gt_ly4'>
        <h2 className='text-lg font-bold' data-oid='a0jx30u'>
          Revenue Prediction
        </h2>
        <p className='text-sm text-text-secondary' data-oid='1rm.cdk'>
          Predicted vs. Actual Revenue
        </p>
      </div>
      <div className='flex items-center space-x-xs' data-oid='7fo756a'>
        <div className='flex items-center space-x-2' data-oid='-t1sehr'>
          <div
            className='w-2 h-2 rounded-full bg-chart-secondary'
            data-oid='yv2:-l2'
          />

          <span className='text-xs' data-oid='gl3h1il'>
            Predicted
          </span>
        </div>
        <div className='flex items-center space-x-2' data-oid='od7lhyc'>
          <div
            className='w-2 h-2 rounded-full bg-chart-primary'
            data-oid='k1hk6f2'
          />

          <span className='text-xs' data-oid='44jz:q5'>
            Actual
          </span>
        </div>
        <button
          className='flex items-center space-x-xs text-xs border border-white/10 px-2 py-1 rounded-md hover:bg-white/5'
          data-oid='j3rf4-q'
        >
          <span data-oid=':25qxel'>Monthly</span>
          <ChevronDown className='w-3 h-3' data-oid='ylb75wc' />
        </button>
      </div>
    </div>
    <div className='h-64' data-oid='qh3qeq_'>
      <ResponsiveContainer width='100%' height='100%' data-oid='9204akz'>
        <AreaChart
          data={revenueData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          data-oid='m:fp5m-'
        >
          <defs data-oid='3wj:l1m'>
            <linearGradient
              id='colorPredicted'
              x1='0'
              y1='0'
              x2='0'
              y2='1'
              data-oid='2w7fvkj'
            >
              <stop
                offset='5%'
                stopColor='#8B5CF6'
                stopOpacity={0.3}
                data-oid='3wvqtfm'
              />

              <stop
                offset='95%'
                stopColor='#8B5CF6'
                stopOpacity={0}
                data-oid='_lzpvgn'
              />
            </linearGradient>
            <linearGradient
              id='colorActual'
              x1='0'
              y1='0'
              x2='0'
              y2='1'
              data-oid='6dn6:t8'
            >
              <stop
                offset='5%'
                stopColor='#6366F1'
                stopOpacity={0.3}
                data-oid='j4x92fj'
              />

              <stop
                offset='95%'
                stopColor='#6366F1'
                stopOpacity={0}
                data-oid='4on7j.0'
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='rgba(255, 255, 255, 0.1)'
            data-oid='ewks-qf'
          />

          <XAxis
            dataKey='hour'
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            stroke='rgba(255, 255, 255, 0.1)'
            data-oid='0-l6uu0'
          />

          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            stroke='rgba(255, 255, 255, 0.1)'
            tickFormatter={value => `$${value}K`}
            data-oid='4a_xyjw'
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#252B3A',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
            }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            data-oid='-d4xf52'
          />

          <Area
            type='monotone'
            dataKey='predicted'
            stroke='#8B5CF6'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorPredicted)'
            data-oid='jalc2se'
          />

          <Area
            type='monotone'
            dataKey='actual'
            stroke='#6366F1'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorActual)'
            data-oid='-kkjn4y'
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DashboardPage = () => (
  <>
    {/* Metrics Row */}
    <div
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-lg'
      data-oid='n6-noab'
    >
      <MetricCard
        title='Pipeline Value'
        value='$348K'
        change='+12.5%'
        icon={DollarSign}
        changeType='positive'
        data-oid='f6pmie0'
      />

      <MetricCard
        title='Hot Prospects'
        value='8'
        change='+2.1%'
        icon={Target}
        changeType='positive'
        data-oid='kaqxsz0'
      />

      <MetricCard
        title='AI Decisions'
        value='151'
        change='-0.5%'
        icon={Brain}
        changeType='negative'
        data-oid='4dkhqvj'
      />

      <MetricCard
        title='Churn Prevented'
        value='$89K'
        change='+15%'
        icon={Shield}
        changeType='positive'
        data-oid='la63q_g'
      />
    </div>

    {/* Main Chart */}
    <MainChart data-oid='sb2ap-s' />
  </>
);

const AnalyticsPage = () => {
  const formatCurrency = (value: number) => `$${(value / 1000000).toFixed(2)}M`;
  const formatNumber = (value: number) => (value / 1000).toFixed(1) + 'K';

  return (
    <div className='space-y-md' data-oid='5t1wcld'>
      {/* Overview Metrics */}
      <div
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md'
        data-oid='7ujtcue'
      >
        <MetricCard
          title='Total Revenue'
          value={formatCurrency(analyticsData.overview.totalRevenue)}
          change={`+${analyticsData.overview.revenueGrowth}%`}
          icon={DollarSign}
          changeType='positive'
          data-oid='3bpi5_p'
        />

        <MetricCard
          title='Conversion Rate'
          value={`${analyticsData.overview.conversionRate}%`}
          change={`+${analyticsData.overview.conversionGrowth}%`}
          icon={TrendingUp}
          changeType='positive'
          data-oid='.11xqp.'
        />

        <MetricCard
          title='Avg. Deal Size'
          value={`$${formatNumber(analyticsData.overview.avgDealSize)}`}
          change={`+${analyticsData.overview.dealSizeGrowth}%`}
          icon={Target}
          changeType='positive'
          data-oid='xi7p_:w'
        />

        <MetricCard
          title='Time to Conversion'
          value={`${analyticsData.overview.timeToConversion} days`}
          change={`${analyticsData.overview.timeReduction}%`}
          icon={Clock}
          changeType='positive'
          data-oid='1b5ykj9'
        />
      </div>

      {/* Charts Row */}
      <div
        className='grid grid-cols-1 lg:grid-cols-5 gap-md'
        data-oid='uxe3gqh'
      >
        {/* Revenue Trend */}
        <div
          className='lg:col-span-3 bg-primary-card p-lg rounded-lg border border-white/10 shadow-md'
          data-oid='ry.qe0t'
        >
          <h2 className='text-lg font-bold mb-sm' data-oid='_1bzfz-'>
            Revenue Growth
          </h2>
          <div className='h-64' data-oid='7zfx5k8'>
            <ResponsiveContainer width='100%' height='100%' data-oid='zkoe:2u'>
              <AreaChart data={analyticsData.revenueByMonth} data-oid='w8uz46q'>
                <defs data-oid='uqhnhhd'>
                  <linearGradient
                    id='analyticsRevenue'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                    data-oid='6yjahe-'
                  >
                    <stop
                      offset='5%'
                      stopColor='#6366F1'
                      stopOpacity={0.3}
                      data-oid='4nfyyen'
                    />

                    <stop
                      offset='95%'
                      stopColor='#6366F1'
                      stopOpacity={0}
                      data-oid='1rovm-w'
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='rgba(255, 255, 255, 0.1)'
                  data-oid='f2abk--'
                />

                <XAxis
                  dataKey='month'
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  stroke='rgba(255, 255, 255, 0.1)'
                  data-oid='72rk9os'
                />

                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  stroke='rgba(255, 255, 255, 0.1)'
                  tickFormatter={value => `$${value / 1000}K`}
                  data-oid='3qwcqzb'
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252B3A',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }}
                  data-oid='jbysenw'
                />

                <Area
                  type='monotone'
                  dataKey='revenue'
                  stroke='#6366F1'
                  strokeWidth={2}
                  fill='url(#analyticsRevenue)'
                  data-oid='1z7hn2g'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Performance */}
        <div
          className='lg:col-span-2 bg-primary-card p-lg rounded-lg border border-white/10 shadow-md'
          data-oid='muxfixh'
        >
          <h2 className='text-lg font-bold mb-sm' data-oid='pydcw1p'>
            Visitors by Region
          </h2>
          <div
            className='h-64 flex items-center justify-center'
            data-oid='4us1h7a'
          >
            <ResponsiveContainer width='100%' height='100%' data-oid='bbiw9mc'>
              <PieChart data-oid='q:rcibq'>
                <Pie
                  data={analyticsData.geographicPerformance}
                  dataKey='visitors'
                  nameKey='region'
                  cx='50%'
                  cy='50%'
                  innerRadius={40}
                  outerRadius={60}
                  fill='#8884d8'
                  paddingAngle={5}
                  data-oid='6-vdswd'
                >
                  {analyticsData.geographicPerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      data-oid='b-dobqx'
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252B3A',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }}
                  data-oid='13-al-i'
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Intervention Performance Table */}
      <div
        className='bg-primary-card rounded-lg border border-white/10 shadow-md'
        data-oid='9p77:x5'
      >
        <h2 className='text-lg font-bold p-md' data-oid='-ru1kzi'>
          AI Intervention Performance
        </h2>
        <div className='overflow-x-auto' data-oid='3-ci2t1'>
          <table className='w-full text-left text-sm' data-oid='qy82c6s'>
            <thead
              className='border-b border-t border-white/10'
              data-oid='xq42mgy'
            >
              <tr data-oid='.:456_1'>
                <th className='p-sm font-semibold' data-oid='pcewa91'>
                  Intervention Type
                </th>
                <th className='p-sm font-semibold' data-oid='ctcsxtq'>
                  Impressions
                </th>
                <th className='p-sm font-semibold' data-oid='jo0copc'>
                  Conversions
                </th>
                <th className='p-sm font-semibold' data-oid='eqs.2a3'>
                  Rate
                </th>
                <th className='p-sm font-semibold' data-oid='gc3unv-'>
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody data-oid='-0ym0ki'>
              {analyticsData.interventionPerformance.map((item, index) => (
                <tr
                  key={index}
                  className='border-b border-white/10 last:border-b-0 hover:bg-white/5'
                  data-oid='_kyt289'
                >
                  <td className='p-sm' data-oid='7ojgffk'>
                    {item.type}
                  </td>
                  <td className='p-sm' data-oid='c9xfg62'>
                    {item.impressions.toLocaleString()}
                  </td>
                  <td className='p-sm' data-oid='wz1.rf7'>
                    {item.conversions}
                  </td>
                  <td className='p-sm' data-oid='h_trzmq'>
                    {item.rate}%
                  </td>
                  <td className='p-sm' data-oid='kilctb2'>
                    {formatCurrency(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProspectsPage = () => {
  const [filter, setFilter] = useState('all');

  const getEngagementColor = (level: string) => {
    if (level === 'high' || level === 'very_high') return 'text-status-success';
    if (level === 'medium') return 'text-status-warning';
    return 'text-text-muted';
  };

  const filteredProspects = liveProspects.filter(prospect => {
    if (filter === 'high_value') {
      return prospect.behaviorScore > 80;
    }
    if (filter === 'needs_attention') {
      return prospect.engagementLevel === 'very_high';
    }
    return true;
  });

  return (
    <div className='space-y-md' data-oid='1::mk8b'>
      {/* Filters and Actions */}
      <div className='flex justify-between items-center' data-oid='7e0hg64'>
        <div className='flex items-center space-x-xs' data-oid='y0bto.e'>
          <button
            onClick={() => setFilter('all')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'all' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            data-oid=':z.iu.x'
          >
            All Prospects
          </button>
          <button
            onClick={() => setFilter('high_value')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'high_value' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            data-oid='ihqu.7b'
          >
            High Value
          </button>
          <button
            onClick={() => setFilter('needs_attention')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'needs_attention' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            data-oid='ji3358g'
          >
            Needs Attention
          </button>
        </div>
        <button
          className='text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity'
          data-oid='mvcjyya'
        >
          Export List
        </button>
      </div>

      {/* Prospects List */}
      <div
        className='bg-primary-card rounded-lg border border-white/10 shadow-md'
        data-oid='i2siba7'
      >
        <ul className='divide-y divide-white/10' data-oid='o7xhb58'>
          {filteredProspects.map(prospect => (
            <li
              key={prospect.visitorId}
              className='p-md hover:bg-white/5 transition-colors duration-200'
              data-oid='wptx6ky'
            >
              <div
                className='grid grid-cols-1 md:grid-cols-12 gap-sm items-center'
                data-oid='o2sq_nh'
              >
                {/* Location */}
                <div
                  className='md:col-span-3 flex items-center space-x-sm'
                  data-oid=':v4wo7u'
                >
                  <span className='text-xl' data-oid='1pw__7h'>
                    {prospect.location.flag}
                  </span>
                  <div data-oid='17mr:7g'>
                    <p className='font-semibold text-sm' data-oid='0k6n6rz'>
                      {prospect.location.city}, {prospect.location.region}
                    </p>
                    <p
                      className='text-xs text-text-secondary'
                      data-oid='aiszp8b'
                    >
                      {prospect.visitorId}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className='md:col-span-2' data-oid='qrfw0-y'>
                  <p
                    className='text-xs text-text-secondary mb-1'
                    data-oid='etubfz4'
                  >
                    Behavior Score
                  </p>
                  <div
                    className='flex items-center space-x-xs'
                    data-oid='theek-f'
                  >
                    <TrendingUp
                      className='w-4 h-4 text-status-info'
                      data-oid='_4r47hl'
                    />

                    <span
                      className='font-semibold text-base'
                      data-oid='xvz-2e6'
                    >
                      {prospect.behaviorScore}
                    </span>
                  </div>
                </div>

                {/* Value */}
                <div className='md:col-span-2' data-oid='.m5ju8m'>
                  <p
                    className='text-xs text-text-secondary mb-1'
                    data-oid='p0azp4l'
                  >
                    Pipeline Value
                  </p>
                  <div
                    className='flex items-center space-x-xs'
                    data-oid='yy6w2ts'
                  >
                    <DollarSign
                      className='w-4 h-4 text-status-success'
                      data-oid='spq3h2a'
                    />

                    <span
                      className='font-semibold text-base'
                      data-oid='dbt64xx'
                    >
                      ${(prospect.revenueValue / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>

                {/* Engagement */}
                <div className='md:col-span-2' data-oid='b.3ua0b'>
                  <p
                    className='text-xs text-text-secondary mb-1'
                    data-oid='g9h1d0y'
                  >
                    Engagement
                  </p>
                  <div
                    className='flex items-center space-x-xs'
                    data-oid='bk6gltr'
                  >
                    <Zap
                      className={`w-4 h-4 ${getEngagementColor(prospect.engagementLevel)}`}
                      data-oid='w8724i9'
                    />

                    <span
                      className={`font-semibold capitalize text-base ${getEngagementColor(prospect.engagementLevel)}`}
                      data-oid='wg_o4qz'
                    >
                      {prospect.engagementLevel.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className='md:col-span-3 flex justify-end items-center space-x-sm'
                  data-oid='6wun7tk'
                >
                  <button
                    className='text-xs bg-primary-surface border border-white/10 px-sm py-xs rounded-md hover:bg-white/10'
                    data-oid=':3int4u'
                  >
                    View Details
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const AIDecisionsPage = () => {
  const [aggressiveness, setAggressiveness] = useState(75);
  const [strategies, setStrategies] = useState(aiDecisionsData.strategies);

  const toggleStrategy = (id: string) => {
    setStrategies(
      strategies.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'positive':
        return 'bg-status-success/20 text-status-success';
      case 'negative':
        return 'bg-status-error/20 text-status-error';
      default:
        return 'bg-primary-surface text-text-secondary';
    }
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-sm' data-oid='7by:.gu'>
      {/* Main Content: Live Feed */}
      <div className='lg:col-span-2 space-y-sm' data-oid='7sx0hq2'>
        <div
          className='bg-primary-card rounded-lg border border-white/10 shadow-md'
          data-oid='doxy473'
        >
          <div
            className='p-sm border-b border-white/10 flex justify-between items-center'
            data-oid='44-fnia'
          >
            <h2 className='text-base font-bold' data-oid='f5.d9ix'>
              Live Decision Stream
            </h2>
            <div className='flex items-center space-x-2' data-oid='eswum.a'>
              <div
                className='w-2 h-2 bg-status-success rounded-full animate-pulse'
                data-oid='gz5zy23'
              />

              <span className='text-xs text-status-success' data-oid='4z9zfpy'>
                Live
              </span>
            </div>
          </div>
          <ul className='divide-y divide-white/10' data-oid='5gzff.u'>
            {aiDecisionsData.liveDecisions.map(decision => (
              <li
                key={decision.id}
                className='p-sm flex justify-between items-center'
                data-oid='0p7dv11'
              >
                <div
                  className='flex items-center space-x-sm'
                  data-oid='q36_gfz'
                >
                  <div
                    className='p-1 bg-primary-surface rounded-md'
                    data-oid='5ibed-1'
                  >
                    <Brain
                      className='w-4 h-4 text-primary-accent'
                      data-oid='freu_g9'
                    />
                  </div>
                  <div data-oid='.c.jm25'>
                    <p className='font-medium text-sm' data-oid='vw67z3u'>
                      {decision.decision}
                    </p>
                    <p
                      className='text-xs text-text-secondary'
                      data-oid='437bv6j'
                    >
                      Visitor {decision.visitor} • Trigger: {decision.trigger}
                    </p>
                  </div>
                </div>
                <div className='text-right' data-oid='tfr0.mp'>
                  <p className='text-xs font-semibold' data-oid='50x65cq'>
                    {decision.confidence}% Confidence
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getOutcomeBadge(decision.outcome)}`}
                    data-oid='6dp7gem'
                  >
                    {decision.outcome}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sidebar: Configuration and Performance */}
      <div className='space-y-sm' data-oid='zd9zuf_'>
        <div
          className='bg-primary-card rounded-lg border border-white/10 shadow-md p-sm'
          data-oid='daq.wft'
        >
          <h2 className='text-base font-bold mb-xs' data-oid='uhq29iz'>
            AI Configuration
          </h2>

          <div className='space-y-sm' data-oid='olapljk'>
            {/* Aggressiveness Slider */}
            <div data-oid='kk5j:rf'>
              <label
                className='text-xs font-medium text-text-secondary'
                data-oid='ex9ej18'
              >
                Intervention Aggressiveness
              </label>
              <div
                className='flex items-center space-x-sm mt-1'
                data-oid='wc3bp:7'
              >
                <input
                  type='range'
                  min='0'
                  max='100'
                  value={aggressiveness}
                  onChange={e => setAggressiveness(Number(e.target.value))}
                  className='w-full h-1 bg-primary-surface rounded-lg appearance-none cursor-pointer'
                  data-oid='0zu:f:h'
                />

                <span
                  className='font-bold text-primary-accent w-8 text-right text-sm'
                  data-oid='5xa0kml'
                >
                  {aggressiveness}%
                </span>
              </div>
            </div>

            {/* Strategy Toggles */}
            <div data-oid='hplncue'>
              <label
                className='text-xs font-medium text-text-secondary'
                data-oid='yulcmx2'
              >
                Active Strategies
              </label>
              <div className='space-y-xs mt-1' data-oid='1xokm11'>
                {strategies.map(strategy => (
                  <div
                    key={strategy.id}
                    className='flex justify-between items-center bg-primary-surface p-xs rounded-md'
                    data-oid='0po1p9i'
                  >
                    <span className='text-xs' data-oid='xhxb_h_'>
                      {strategy.name}
                    </span>
                    <button
                      onClick={() => toggleStrategy(strategy.id)}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${strategy.enabled ? 'bg-primary-accent' : 'bg-white/10'}`}
                      data-oid='dl-x3.y'
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${strategy.enabled ? 'translate-x-4' : 'translate-x-0'}`}
                        data-oid='ps60r:u'
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className='bg-primary-card rounded-lg border border-white/10 shadow-md p-sm'
          data-oid='r23020p'
        >
          <h2 className='text-base font-bold mb-xs' data-oid='iyfeg4:'>
            Performance Overview
          </h2>
          <div className='space-y-xs text-sm' data-oid='ykr-tml'>
            <div
              className='flex justify-between items-center'
              data-oid='2t3sq39'
            >
              <span className='text-text-secondary' data-oid='8xm1peh'>
                Model Accuracy
              </span>
              <span className='font-semibold' data-oid='7t_b.68'>
                {aiDecisionsData.performance.accuracy}%
              </span>
            </div>
            <div
              className='flex justify-between items-center'
              data-oid='qeqm5hz'
            >
              <span className='text-text-secondary' data-oid='qswx-p1'>
                Decisions / Hour
              </span>
              <span className='font-semibold' data-oid='dsj95ct'>
                {aiDecisionsData.performance.decisionsPerHour}
              </span>
            </div>
            <div
              className='flex justify-between items-center'
              data-oid='nk_6.-.'
            >
              <span className='text-text-secondary' data-oid='21_8b0g'>
                Revenue Impact (24h)
              </span>
              <span
                className='font-semibold text-status-success'
                data-oid='-.tnqhm'
              >
                +${aiDecisionsData.performance.revenueImpact.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState(
    settingsData.notifications
  );

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API & Integrations', icon: Code },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className='space-y-md' data-oid='pfkroe9'>
            <h3 className='text-lg font-bold' data-oid='h2cjzdb'>
              Profile Settings
            </h3>
            <div className='space-y-sm' data-oid='rtih31a'>
              <label
                className='text-xs font-medium text-text-secondary'
                data-oid='0k5i35f'
              >
                Full Name
              </label>
              <input
                type='text'
                defaultValue={settingsData.profile.name}
                className='w-full bg-primary-surface border border-white/10 rounded-md p-xs'
                data-oid='nzxk1vc'
              />
            </div>
            <div className='space-y-sm' data-oid='e6yo1dr'>
              <label
                className='text-xs font-medium text-text-secondary'
                data-oid='_a09oq7'
              >
                Email
              </label>
              <input
                type='email'
                defaultValue={settingsData.profile.email}
                disabled
                className='w-full bg-primary-surface/50 border border-white/10 rounded-md p-xs'
                data-oid='w_h_5ji'
              />
            </div>
            <div data-oid='jl.k18e'>
              <button
                className='text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity'
                data-oid='u.dg89s'
              >
                Update Profile
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className='space-y-md' data-oid='yuf3ljb'>
            <h3 className='text-lg font-bold' data-oid='sshvogp'>
              Notification Settings
            </h3>
            <div className='space-y-sm' data-oid=':vmv0iv'>
              {Object.entries(notifications).map(([key, value]) => (
                <div
                  key={key}
                  className='flex justify-between items-center bg-primary-surface p-sm rounded-md'
                  data-oid='hc:2x63'
                >
                  <span className='text-sm capitalize' data-oid='-bqphq6'>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <button
                    onClick={() =>
                      toggleNotification(key as keyof typeof notifications)
                    }
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${value ? 'bg-primary-accent' : 'bg-white/10'}`}
                    data-oid='8vv9u2l'
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`}
                      data-oid='p91k-c.'
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className='text-center p-xl' data-oid='9d8hox-'>
            <h3 className='text-lg font-bold' data-oid='h.ncdml'>
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className='text-text-secondary mt-sm' data-oid='w7yhjlz'>
              Settings for this section are coming soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className='flex space-x-md' data-oid='2.uriq9'>
      <aside className='w-1/4' data-oid='cxoci2n'>
        <nav className='space-y-xs' data-oid='_hfzfug'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-sm p-sm rounded-md text-sm transition-colors ${activeTab === tab.id ? 'bg-primary-surface text-text-primary' : 'text-text-secondary hover:bg-primary-surface'}`}
              data-oid='drp-5-y'
            >
              <tab.icon className='w-4 h-4' data-oid='a8-z5bb' />
              <span data-oid='zlw2k9z'>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main
        className='w-3/4 bg-primary-card p-md rounded-lg border border-white/10'
        data-oid='slo7x:j'
      >
        {renderContent()}
      </main>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleToggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const pages: PageCollection = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Welcome back, Jane!',
      component: <DashboardPage data-oid='m7grj1l' />,
    },
    analytics: {
      title: 'Analytics',
      subtitle: 'Deep dive into your performance metrics.',
      component: <AnalyticsPage data-oid='hi06in1' />,
    },
    prospects: {
      title: 'Live Prospects',
      subtitle: 'Real-time analysis of high-value website visitors.',
      component: <ProspectsPage data-oid='.9zm8pq' />,
    },
    decisions: {
      title: 'AI Decision Engine',
      subtitle: 'Monitor and configure the AI decision-making process.',
      component: <AIDecisionsPage data-oid='m_iyxe7' />,
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile, notifications, and integrations.',
      component: <SettingsPage data-oid='4qpjlyl' />,
    },
  };

  const currentPage = pages[activePage] || pages.dashboard;

  return (
    <div className='min-h-screen' data-oid='am3ipkb'>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-30 lg:hidden'
          onClick={handleToggleMobileMenu}
          data-oid='acees6r'
        />
      )}

      {/* Conditional Sidebar for mobile */}
      <div
        className={`lg:hidden transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed z-50`}
        data-oid='0kpm9p.'
      >
        <Sidebar
          isCollapsed={false}
          onToggle={() => {}}
          activePage={activePage}
          setActivePage={setActivePage}
          data-oid=':1kqn4j'
        />
      </div>

      {/* Static Sidebar for desktop */}
      <div className='hidden lg:block' data-oid='59eq32.'>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          activePage={activePage}
          setActivePage={setActivePage}
          data-oid='4f68059'
        />
      </div>

      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[196px]'}`}
        data-oid='qdfen.6'
      >
        <Header
          onMenuClick={handleToggleMobileMenu}
          title={currentPage.title}
          subtitle={currentPage.subtitle}
          data-oid='rxd6.k6'
        />

        <main className='p-md' data-oid='d371qzc'>
          {currentPage.component}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
