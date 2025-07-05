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
      data-oid='.s3ab7x'
    >
      <div className='flex flex-col h-full' data-oid='jn0:i:t'>
        {/* Logo and Toggle */}
        <div
          className={`flex items-center p-md border-b border-white/10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          data-oid='mboe3iw'
        >
          {!isCollapsed && (
            <span className='text-lg font-bold' data-oid='la7vvnp'>
              RevAI
            </span>
          )}
          <button
            onClick={onToggle}
            className='p-1 rounded-md hover:bg-white/5'
            data-oid='7ym8__y'
          >
            <ChevronLeft
              className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
              data-oid='0l3m-14'
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-md py-sm space-y-xs' data-oid='csmr.:u'>
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
                data-oid='ovhv:8d'
              >
                <Icon className='h-5 w-5' data-oid='1.k3a12' />
                {!isCollapsed && (
                  <span className='ml-sm font-medium' data-oid='yli3y2y'>
                    {item.label}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className='p-md border-t border-white/10' data-oid='yisfif0'>
          <div className='flex items-center' data-oid='mgj875e'>
            <img
              src='https://i.pravatar.cc/40'
              alt='User Avatar'
              className='rounded-full w-8 h-8'
              data-oid='5xd309.'
            />

            {!isCollapsed && (
              <div className='ml-sm' data-oid='rjcyw_q'>
                <p className='font-semibold text-sm' data-oid='0ncw8bd'>
                  Jane Doe
                </p>
                <p className='text-xs text-text-secondary' data-oid='30m--xp'>
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
    data-oid='3a5z3om'
  >
    {/* Mobile Menu & Page Title */}
    <div className='flex items-center' data-oid='9skiyre'>
      <button
        onClick={onMenuClick}
        className='mr-md lg:hidden p-1 rounded-md hover:bg-white/5'
        data-oid='56vufg2'
      >
        <Menu data-oid='gikb_8g' />
      </button>
      <div data-oid='kh:y:26'>
        <h1 className='text-xl font-bold' data-oid='b3s_f21'>
          {title}
        </h1>
        <p className='text-sm text-text-secondary' data-oid='qjt5qji'>
          {subtitle}
        </p>
      </div>
    </div>

    {/* Search and Actions */}
    <div className='flex items-center space-x-sm' data-oid='-xxupa9'>
      <div className='relative hidden md:block' data-oid='q2x0u.h'>
        <Search
          className='absolute left-sm top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted'
          data-oid='ue8lq.:'
        />

        <input
          type='text'
          placeholder='Search...'
          className='bg-primary-surface border border-white/10 rounded-md pl-8 pr-sm py-xs w-56 focus:outline-none focus:ring-2 focus:ring-primary-accent'
          data-oid='sheqj-g'
        />
      </div>
      <button className='p-xs rounded-full hover:bg-white/5' data-oid='gdhj43b'>
        <Bell data-oid='60hqdu:' />
      </button>
      <button
        className='text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity'
        data-oid='q693tep'
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
      data-oid='fsno68r'
    >
      <div className='flex justify-between items-start' data-oid='9mmz9q4'>
        <div className='space-y-xs' data-oid='e-1fs3r'>
          <p
            className='text-xs uppercase font-semibold tracking-wider text-text-secondary'
            data-oid='eeqyav3'
          >
            {title}
          </p>
          <p className='text-2xl font-bold' data-oid='3-cqpsi'>
            {value}
          </p>
        </div>
        <Icon className='h-5 w-5 text-text-muted' data-oid='c:sfi_v' />
      </div>
      <p
        className={`text-xs font-medium mt-sm ${changeColor}`}
        data-oid='_x35dqs'
      >
        {change} vs last month
      </p>
    </div>
  );
};

const MainChart = () => (
  <div
    className='bg-primary-card p-lg rounded-lg border border-white/10 shadow-md'
    data-oid='9p5s54d'
  >
    <div className='flex justify-between items-center mb-md' data-oid='9m9pnmd'>
      <div data-oid='k5lb_sy'>
        <h2 className='text-lg font-bold' data-oid='dza150z'>
          Revenue Prediction
        </h2>
        <p className='text-sm text-text-secondary' data-oid='8z14.yn'>
          Predicted vs. Actual Revenue
        </p>
      </div>
      <div className='flex items-center space-x-xs' data-oid='9mn1-cc'>
        <div className='flex items-center space-x-2' data-oid='ju6lkpw'>
          <div
            className='w-2 h-2 rounded-full bg-chart-secondary'
            data-oid='sfcyzsc'
          />

          <span className='text-xs' data-oid='sbqlupq'>
            Predicted
          </span>
        </div>
        <div className='flex items-center space-x-2' data-oid='4dfhoix'>
          <div
            className='w-2 h-2 rounded-full bg-chart-primary'
            data-oid='69nhjir'
          />

          <span className='text-xs' data-oid='pz0:s_w'>
            Actual
          </span>
        </div>
        <button
          className='flex items-center space-x-xs text-xs border border-white/10 px-2 py-1 rounded-md hover:bg-white/5'
          data-oid='5qrekb9'
        >
          <span data-oid='yt4_zpn'>Monthly</span>
          <ChevronDown className='w-3 h-3' data-oid='j6abh6g' />
        </button>
      </div>
    </div>
    <div className='h-64' data-oid='d5-:gro'>
      <ResponsiveContainer width='100%' height='100%' data-oid='gd4v_qo'>
        <AreaChart
          data={revenueData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          data-oid='v5-w-qk'
        >
          <defs data-oid='x4vf.g5'>
            <linearGradient
              id='colorPredicted'
              x1='0'
              y1='0'
              x2='0'
              y2='1'
              data-oid='-j-6_xx'
            >
              <stop
                offset='5%'
                stopColor='#8B5CF6'
                stopOpacity={0.3}
                data-oid='-92hqwt'
              />

              <stop
                offset='95%'
                stopColor='#8B5CF6'
                stopOpacity={0}
                data-oid='t-vs2kq'
              />
            </linearGradient>
            <linearGradient
              id='colorActual'
              x1='0'
              y1='0'
              x2='0'
              y2='1'
              data-oid='b3ezto7'
            >
              <stop
                offset='5%'
                stopColor='#6366F1'
                stopOpacity={0.3}
                data-oid='1g0txc4'
              />

              <stop
                offset='95%'
                stopColor='#6366F1'
                stopOpacity={0}
                data-oid='1o_:zp7'
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='rgba(255, 255, 255, 0.1)'
            data-oid='8p5qf34'
          />

          <XAxis
            dataKey='hour'
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            stroke='rgba(255, 255, 255, 0.1)'
            data-oid='4uls_5d'
          />

          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            stroke='rgba(255, 255, 255, 0.1)'
            tickFormatter={value => `$${value}K`}
            data-oid='p67k-_s'
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#252B3A',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
            }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            data-oid='utm3:7x'
          />

          <Area
            type='monotone'
            dataKey='predicted'
            stroke='#8B5CF6'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorPredicted)'
            data-oid='e.9_l4q'
          />

          <Area
            type='monotone'
            dataKey='actual'
            stroke='#6366F1'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorActual)'
            data-oid='5b547gi'
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
      data-oid='ah5-l1n'
    >
      <MetricCard
        title='Pipeline Value'
        value='$348K'
        change='+12.5%'
        icon={DollarSign}
        changeType='positive'
        data-oid='_9.n1o8'
      />

      <MetricCard
        title='Hot Prospects'
        value='8'
        change='+2.1%'
        icon={Target}
        changeType='positive'
        data-oid='_s3e9i6'
      />

      <MetricCard
        title='AI Decisions'
        value='151'
        change='-0.5%'
        icon={Brain}
        changeType='negative'
        data-oid='3uyni64'
      />

      <MetricCard
        title='Churn Prevented'
        value='$89K'
        change='+15%'
        icon={Shield}
        changeType='positive'
        data-oid='5o8-own'
      />
    </div>

    {/* Main Chart */}
    <MainChart data-oid='o-0c.zh' />
  </>
);

const AnalyticsPage = () => {
  const formatCurrency = (value: number) => `$${(value / 1000000).toFixed(2)}M`;
  const formatNumber = (value: number) => (value / 1000).toFixed(1) + 'K';

  return (
    <div className='space-y-md' data-oid='jy-.-kl'>
      {/* Overview Metrics */}
      <div
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md'
        data-oid='a0t2tzo'
      >
        <MetricCard
          title='Total Revenue'
          value={formatCurrency(analyticsData.overview.totalRevenue)}
          change={`+${analyticsData.overview.revenueGrowth}%`}
          icon={DollarSign}
          changeType='positive'
          data-oid='lx6cx5d'
        />

        <MetricCard
          title='Conversion Rate'
          value={`${analyticsData.overview.conversionRate}%`}
          change={`+${analyticsData.overview.conversionGrowth}%`}
          icon={TrendingUp}
          changeType='positive'
          data-oid='3rs0pv8'
        />

        <MetricCard
          title='Avg. Deal Size'
          value={`$${formatNumber(analyticsData.overview.avgDealSize)}`}
          change={`+${analyticsData.overview.dealSizeGrowth}%`}
          icon={Target}
          changeType='positive'
          data-oid='izozw.x'
        />

        <MetricCard
          title='Time to Conversion'
          value={`${analyticsData.overview.timeToConversion} days`}
          change={`${analyticsData.overview.timeReduction}%`}
          icon={Clock}
          changeType='positive'
          data-oid='sguwd8l'
        />
      </div>

      {/* Charts Row */}
      <div
        className='grid grid-cols-1 lg:grid-cols-5 gap-md'
        data-oid='s6.n345'
      >
        {/* Revenue Trend */}
        <div
          className='lg:col-span-3 bg-primary-card p-lg rounded-lg border border-white/10 shadow-md'
          data-oid='s1wpn26'
        >
          <h2 className='text-lg font-bold mb-sm' data-oid='00ksmfo'>
            Revenue Growth
          </h2>
          <div className='h-64' data-oid='1v71z4k'>
            <ResponsiveContainer width='100%' height='100%' data-oid='d.8-7gy'>
              <AreaChart data={analyticsData.revenueByMonth} data-oid='t:lkq--'>
                <defs data-oid='dcvrg:-'>
                  <linearGradient
                    id='analyticsRevenue'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                    data-oid='te5z.fg'
                  >
                    <stop
                      offset='5%'
                      stopColor='#6366F1'
                      stopOpacity={0.3}
                      data-oid='-nb.u9n'
                    />

                    <stop
                      offset='95%'
                      stopColor='#6366F1'
                      stopOpacity={0}
                      data-oid='40u4w.w'
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='rgba(255, 255, 255, 0.1)'
                  data-oid='cz_tk5y'
                />

                <XAxis
                  dataKey='month'
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  stroke='rgba(255, 255, 255, 0.1)'
                  data-oid='l0g2rm_'
                />

                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  stroke='rgba(255, 255, 255, 0.1)'
                  tickFormatter={value => `$${value / 1000}K`}
                  data-oid='4r25a:l'
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252B3A',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }}
                  data-oid='j0objhs'
                />

                <Area
                  type='monotone'
                  dataKey='revenue'
                  stroke='#6366F1'
                  strokeWidth={2}
                  fill='url(#analyticsRevenue)'
                  data-oid='d1nr0:b'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Performance */}
        <div
          className='lg:col-span-2 bg-primary-card p-lg rounded-lg border border-white/10 shadow-md'
          data-oid='d9-k0r.'
        >
          <h2 className='text-lg font-bold mb-sm' data-oid='6vnraop'>
            Visitors by Region
          </h2>
          <div
            className='h-64 flex items-center justify-center'
            data-oid='0vd.is2'
          >
            <ResponsiveContainer width='100%' height='100%' data-oid='.pzlii9'>
              <PieChart data-oid='f55:55j'>
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
                  data-oid='vt5oe1h'
                >
                  {analyticsData.geographicPerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      data-oid='uvrtd7d'
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252B3A',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }}
                  data-oid='8-5a2yc'
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Intervention Performance Table */}
      <div
        className='bg-primary-card rounded-lg border border-white/10 shadow-md'
        data-oid='epvnhpa'
      >
        <h2 className='text-lg font-bold p-md' data-oid='yj55564'>
          AI Intervention Performance
        </h2>
        <div className='overflow-x-auto' data-oid='hjy-g8t'>
          <table className='w-full text-left text-sm' data-oid='d-67n55'>
            <thead
              className='border-b border-t border-white/10'
              data-oid='gesh8_j'
            >
              <tr data-oid='n-if5kr'>
                <th className='p-sm font-semibold' data-oid=':qo0m39'>
                  Intervention Type
                </th>
                <th className='p-sm font-semibold' data-oid='fk9l66_'>
                  Impressions
                </th>
                <th className='p-sm font-semibold' data-oid='ra9fa3y'>
                  Conversions
                </th>
                <th className='p-sm font-semibold' data-oid='xr27ihx'>
                  Rate
                </th>
                <th className='p-sm font-semibold' data-oid='_86c34h'>
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody data-oid='0z5tq5z'>
              {analyticsData.interventionPerformance.map((item, index) => (
                <tr
                  key={index}
                  className='border-b border-white/10 last:border-b-0 hover:bg-white/5'
                  data-oid='tzyv-.w'
                >
                  <td className='p-sm' data-oid='6_pgso.'>
                    {item.type}
                  </td>
                  <td className='p-sm' data-oid='g84j.cs'>
                    {item.impressions.toLocaleString()}
                  </td>
                  <td className='p-sm' data-oid=':g.9wcw'>
                    {item.conversions}
                  </td>
                  <td className='p-sm' data-oid='91q0ma_'>
                    {item.rate}%
                  </td>
                  <td className='p-sm' data-oid='40fhhq7'>
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
    <div className='space-y-md' data-oid='b19m42k'>
      {/* Filters and Actions */}
      <div className='flex justify-between items-center' data-oid='-dvam4k'>
        <div className='flex items-center space-x-xs' data-oid='r:ybc06'>
          <button
            onClick={() => setFilter('all')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'all' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            data-oid='8qa47n-'
          >
            All Prospects
          </button>
          <button
            onClick={() => setFilter('high_value')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'high_value' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            data-oid='8_ymfj5'
          >
            High Value
          </button>
          <button
            onClick={() => setFilter('needs_attention')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'needs_attention' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            data-oid='u77xi.w'
          >
            Needs Attention
          </button>
        </div>
        <button
          className='text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity'
          data-oid='b2lag._'
        >
          Export List
        </button>
      </div>

      {/* Prospects List */}
      <div
        className='bg-primary-card rounded-lg border border-white/10 shadow-md'
        data-oid='5yi9spa'
      >
        <ul className='divide-y divide-white/10' data-oid='.l6v.yk'>
          {filteredProspects.map(prospect => (
            <li
              key={prospect.visitorId}
              className='p-md hover:bg-white/5 transition-colors duration-200'
              data-oid='z2qiuyv'
            >
              <div
                className='grid grid-cols-1 md:grid-cols-12 gap-sm items-center'
                data-oid='pws2elq'
              >
                {/* Location */}
                <div
                  className='md:col-span-3 flex items-center space-x-sm'
                  data-oid='nr8i-yw'
                >
                  <span className='text-xl' data-oid='pe0n-bt'>
                    {prospect.location.flag}
                  </span>
                  <div data-oid='ko5py4i'>
                    <p className='font-semibold text-sm' data-oid='vyh4.jg'>
                      {prospect.location.city}, {prospect.location.region}
                    </p>
                    <p
                      className='text-xs text-text-secondary'
                      data-oid='ddahq:2'
                    >
                      {prospect.visitorId}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className='md:col-span-2' data-oid='al.o4ia'>
                  <p
                    className='text-xs text-text-secondary mb-1'
                    data-oid='a_gdda9'
                  >
                    Behavior Score
                  </p>
                  <div
                    className='flex items-center space-x-xs'
                    data-oid='s-z0owm'
                  >
                    <TrendingUp
                      className='w-4 h-4 text-status-info'
                      data-oid=':1z6-gl'
                    />

                    <span
                      className='font-semibold text-base'
                      data-oid='jgqpmjt'
                    >
                      {prospect.behaviorScore}
                    </span>
                  </div>
                </div>

                {/* Value */}
                <div className='md:col-span-2' data-oid='tt:yb.i'>
                  <p
                    className='text-xs text-text-secondary mb-1'
                    data-oid='9vjmc7_'
                  >
                    Pipeline Value
                  </p>
                  <div
                    className='flex items-center space-x-xs'
                    data-oid='l8xfl0x'
                  >
                    <DollarSign
                      className='w-4 h-4 text-status-success'
                      data-oid='tr0ltu9'
                    />

                    <span
                      className='font-semibold text-base'
                      data-oid='3fmh9ej'
                    >
                      ${(prospect.revenueValue / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>

                {/* Engagement */}
                <div className='md:col-span-2' data-oid='02r_zwm'>
                  <p
                    className='text-xs text-text-secondary mb-1'
                    data-oid='bffkgb_'
                  >
                    Engagement
                  </p>
                  <div
                    className='flex items-center space-x-xs'
                    data-oid='evfd7zq'
                  >
                    <Zap
                      className={`w-4 h-4 ${getEngagementColor(prospect.engagementLevel)}`}
                      data-oid='ghtjtaw'
                    />

                    <span
                      className={`font-semibold capitalize text-base ${getEngagementColor(prospect.engagementLevel)}`}
                      data-oid='m73pi72'
                    >
                      {prospect.engagementLevel.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className='md:col-span-3 flex justify-end items-center space-x-sm'
                  data-oid='lircyxs'
                >
                  <button
                    className='text-xs bg-primary-surface border border-white/10 px-sm py-xs rounded-md hover:bg-white/10'
                    data-oid='6cc.jam'
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
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-sm' data-oid='6ohqdj8'>
      {/* Main Content: Live Feed */}
      <div className='lg:col-span-2 space-y-sm' data-oid='6k3pljz'>
        <div
          className='bg-primary-card rounded-lg border border-white/10 shadow-md'
          data-oid='dovj5ch'
        >
          <div
            className='p-sm border-b border-white/10 flex justify-between items-center'
            data-oid='nw.sdxe'
          >
            <h2 className='text-base font-bold' data-oid='3smoio5'>
              Live Decision Stream
            </h2>
            <div className='flex items-center space-x-2' data-oid='k3js:nv'>
              <div
                className='w-2 h-2 bg-status-success rounded-full animate-pulse'
                data-oid='off9wg-'
              />

              <span className='text-xs text-status-success' data-oid=':o:9nj8'>
                Live
              </span>
            </div>
          </div>
          <ul className='divide-y divide-white/10' data-oid='2wrd84q'>
            {aiDecisionsData.liveDecisions.map(decision => (
              <li
                key={decision.id}
                className='p-sm flex justify-between items-center'
                data-oid='krr:t9l'
              >
                <div
                  className='flex items-center space-x-sm'
                  data-oid='rfybnpu'
                >
                  <div
                    className='p-1 bg-primary-surface rounded-md'
                    data-oid='ru-wxxx'
                  >
                    <Brain
                      className='w-4 h-4 text-primary-accent'
                      data-oid='0seoc-n'
                    />
                  </div>
                  <div data-oid='o3vp052'>
                    <p className='font-medium text-sm' data-oid='d_gydbu'>
                      {decision.decision}
                    </p>
                    <p
                      className='text-xs text-text-secondary'
                      data-oid='njykhji'
                    >
                      Visitor {decision.visitor} • Trigger: {decision.trigger}
                    </p>
                  </div>
                </div>
                <div className='text-right' data-oid='q_qvo.f'>
                  <p className='text-xs font-semibold' data-oid='59_prq4'>
                    {decision.confidence}% Confidence
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getOutcomeBadge(decision.outcome)}`}
                    data-oid='4ji5ek5'
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
      <div className='space-y-sm' data-oid='q7q9pee'>
        <div
          className='bg-primary-card rounded-lg border border-white/10 shadow-md p-sm'
          data-oid='jrr-x4b'
        >
          <h2 className='text-base font-bold mb-xs' data-oid='octgiio'>
            AI Configuration
          </h2>

          <div className='space-y-sm' data-oid='cz2g362'>
            {/* Aggressiveness Slider */}
            <div data-oid='feox3_c'>
              <label
                className='text-xs font-medium text-text-secondary'
                data-oid='v81k:lr'
              >
                Intervention Aggressiveness
              </label>
              <div
                className='flex items-center space-x-sm mt-1'
                data-oid='g0odt15'
              >
                <input
                  type='range'
                  min='0'
                  max='100'
                  value={aggressiveness}
                  onChange={e => setAggressiveness(Number(e.target.value))}
                  className='w-full h-1 bg-primary-surface rounded-lg appearance-none cursor-pointer'
                  data-oid='4f2e5z8'
                />

                <span
                  className='font-bold text-primary-accent w-8 text-right text-sm'
                  data-oid='.xqpm2y'
                >
                  {aggressiveness}%
                </span>
              </div>
            </div>

            {/* Strategy Toggles */}
            <div data-oid='osgxtzs'>
              <label
                className='text-xs font-medium text-text-secondary'
                data-oid='19_o_f2'
              >
                Active Strategies
              </label>
              <div className='space-y-xs mt-1' data-oid='ceoev7e'>
                {strategies.map(strategy => (
                  <div
                    key={strategy.id}
                    className='flex justify-between items-center bg-primary-surface p-xs rounded-md'
                    data-oid='vlmv39v'
                  >
                    <span className='text-xs' data-oid='wrbnbvq'>
                      {strategy.name}
                    </span>
                    <button
                      onClick={() => toggleStrategy(strategy.id)}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${strategy.enabled ? 'bg-primary-accent' : 'bg-white/10'}`}
                      data-oid='u_3b7lv'
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${strategy.enabled ? 'translate-x-4' : 'translate-x-0'}`}
                        data-oid='3d9uxha'
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
          data-oid='joa--eg'
        >
          <h2 className='text-base font-bold mb-xs' data-oid='5k-a45b'>
            Performance Overview
          </h2>
          <div className='space-y-xs text-sm' data-oid='oe-xga:'>
            <div
              className='flex justify-between items-center'
              data-oid='rl2yo_l'
            >
              <span className='text-text-secondary' data-oid='n-qfw9o'>
                Model Accuracy
              </span>
              <span className='font-semibold' data-oid='6.b7pb3'>
                {aiDecisionsData.performance.accuracy}%
              </span>
            </div>
            <div
              className='flex justify-between items-center'
              data-oid='r.6u-_t'
            >
              <span className='text-text-secondary' data-oid='y:wxmj4'>
                Decisions / Hour
              </span>
              <span className='font-semibold' data-oid='f820gsk'>
                {aiDecisionsData.performance.decisionsPerHour}
              </span>
            </div>
            <div
              className='flex justify-between items-center'
              data-oid='xy_71uh'
            >
              <span className='text-text-secondary' data-oid='mklrc8o'>
                Revenue Impact (24h)
              </span>
              <span
                className='font-semibold text-status-success'
                data-oid='iv5uten'
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
          <div className='space-y-md' data-oid='v-j0gsn'>
            <h3 className='text-lg font-bold' data-oid='g7ve:j7'>
              Profile Settings
            </h3>
            <div className='space-y-sm' data-oid='elh7x5e'>
              <label
                className='text-xs font-medium text-text-secondary'
                data-oid='onbv6nx'
              >
                Full Name
              </label>
              <input
                type='text'
                defaultValue={settingsData.profile.name}
                className='w-full bg-primary-surface border border-white/10 rounded-md p-xs'
                data-oid='5du58sn'
              />
            </div>
            <div className='space-y-sm' data-oid='o4s-vnt'>
              <label
                className='text-xs font-medium text-text-secondary'
                data-oid='hmio3h1'
              >
                Email
              </label>
              <input
                type='email'
                defaultValue={settingsData.profile.email}
                disabled
                className='w-full bg-primary-surface/50 border border-white/10 rounded-md p-xs'
                data-oid='ekq29k0'
              />
            </div>
            <div data-oid='.qo.c2p'>
              <button
                className='text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity'
                data-oid='mdlr927'
              >
                Update Profile
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className='space-y-md' data-oid='5bcw6zp'>
            <h3 className='text-lg font-bold' data-oid='k19wr__'>
              Notification Settings
            </h3>
            <div className='space-y-sm' data-oid='3hptaka'>
              {Object.entries(notifications).map(([key, value]) => (
                <div
                  key={key}
                  className='flex justify-between items-center bg-primary-surface p-sm rounded-md'
                  data-oid='c-.551w'
                >
                  <span className='text-sm capitalize' data-oid='inor.9.'>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <button
                    onClick={() =>
                      toggleNotification(key as keyof typeof notifications)
                    }
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${value ? 'bg-primary-accent' : 'bg-white/10'}`}
                    data-oid='8z86zfe'
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`}
                      data-oid='d1.ris2'
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className='text-center p-xl' data-oid='3vzii1v'>
            <h3 className='text-lg font-bold' data-oid='kajtfwj'>
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className='text-text-secondary mt-sm' data-oid='byh0zdo'>
              Settings for this section are coming soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className='flex space-x-md' data-oid='3nynaem'>
      <aside className='w-1/4' data-oid='8iom9fx'>
        <nav className='space-y-xs' data-oid='d5oy_7f'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-sm p-sm rounded-md text-sm transition-colors ${activeTab === tab.id ? 'bg-primary-surface text-text-primary' : 'text-text-secondary hover:bg-primary-surface'}`}
              data-oid='a_3fxti'
            >
              <tab.icon className='w-4 h-4' data-oid='g1-9oi9' />
              <span data-oid='f4v_a_0'>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main
        className='w-3/4 bg-primary-card p-md rounded-lg border border-white/10'
        data-oid='_kp8fds'
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
      component: <DashboardPage data-oid='5cc176p' />,
    },
    analytics: {
      title: 'Analytics',
      subtitle: 'Deep dive into your performance metrics.',
      component: <AnalyticsPage data-oid='d631462' />,
    },
    prospects: {
      title: 'Live Prospects',
      subtitle: 'Real-time analysis of high-value website visitors.',
      component: <ProspectsPage data-oid='d3qu22:' />,
    },
    decisions: {
      title: 'AI Decision Engine',
      subtitle: 'Monitor and configure the AI decision-making process.',
      component: <AIDecisionsPage data-oid='22ycdq1' />,
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile, notifications, and integrations.',
      component: <SettingsPage data-oid='w_.jui_' />,
    },
  };

  const currentPage = pages[activePage] || pages.dashboard;

  return (
    <div className='min-h-screen' data-oid='zfq6fge'>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-30 lg:hidden'
          onClick={handleToggleMobileMenu}
          data-oid='5v_20vu'
        />
      )}

      {/* Conditional Sidebar for mobile */}
      <div
        className={`lg:hidden transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed z-50`}
        data-oid='i_.gsey'
      >
        <Sidebar
          isCollapsed={false}
          onToggle={() => {}}
          activePage={activePage}
          setActivePage={setActivePage}
          data-oid='20mxy7i'
        />
      </div>

      {/* Static Sidebar for desktop */}
      <div className='hidden lg:block' data-oid='jbw46fg'>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          activePage={activePage}
          setActivePage={setActivePage}
          data-oid='440qy_b'
        />
      </div>

      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[196px]'}`}
        data-oid='0j4v6a8'
      >
        <Header
          onMenuClick={handleToggleMobileMenu}
          title={currentPage.title}
          subtitle={currentPage.subtitle}
          data-oid='hly2u7b'
        />

        <main className='p-md' data-oid='t381fqz'>
          {currentPage.component}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
