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
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
  { hour: '24:00', predicted: 142, actual: 139 }
];

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'prospects', label: 'Prospects', icon: Users },
  { id: 'decisions', label: 'AI Decisions', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings }
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
      timeReduction: -35.8
    },
    revenueByMonth: [
    { month: 'Jan', revenue: 185000 },
    { month: 'Feb', revenue: 230000 },
    { month: 'Mar', revenue: 278000 },
    { month: 'Apr', revenue: 345000 },
    { month: 'May', revenue: 412000 },
    { month: 'Jun', revenue: 489000 },
    { month: 'Jul', revenue: 567000 },
    { month: 'Aug', revenue: 634000 }
  ],
    interventionPerformance: [
      { type: 'Geographic Personalization', impressions: 8934, conversions: 892, rate: 9.98, lift: 156, revenue: 1240000 },
      { type: 'Competitive Defense', impressions: 2341, conversions: 387, rate: 16.53, lift: 234, revenue: 980000 },
      { type: 'Price Sensitivity Detection', impressions: 5627, conversions: 445, rate: 7.91, lift: 89, revenue: 670000 },
      { type: 'Urgency Triggers', impressions: 3892, conversions: 623, rate: 16.01, lift: 178, revenue: 1120000 },
      { type: 'Premium Showcase', impressions: 1456, conversions: 234, rate: 16.07, lift: 203, revenue: 890000 }
    ],
    geographicPerformance: [
    { region: 'North America', visitors: 18400, color: '#6366F1' },
    { region: 'Europe', visitors: 12300, color: '#8B5CF6' },
    { region: 'Asia Pacific', visitors: 9800, color: '#06B6D4' },
    { region: 'Other', visitors: 5100, color: '#10B981' }
  ]
};

// --- PROSPECTS MOCK DATA ---
  const liveProspects = [
    {
      visitorId: "V_2847",
      location: { country: "US", region: "California", city: "San Francisco", flag: "🇺🇸" },
      behaviorScore: 89,
      revenueValue: 78000,
      confidence: 96,
      status: "active",
      timeOnSite: "12m 34s",
      pagesVisited: 8,
      engagementLevel: "high",
      aiInsights: {
        intent: "Researching Stanford CS programs for child",
        nextAction: "Auto-triggered: Stanford success popup in 30s"
    }
    },
    {
      visitorId: "V_2851",
      location: { country: "CA", region: "Ontario", city: "Toronto", flag: "🇨🇦" },
      behaviorScore: 67,
      revenueValue: 42000,
      confidence: 78,
      status: "active",
      timeOnSite: "8m 12s",
      pagesVisited: 5,
      engagementLevel: "medium",
      aiInsights: {
        intent: "Looking for affordable university options",
        nextAction: "Auto-triggering scholarship finder in 2m"
    }
    },
    {
      visitorId: "V_2849",
      location: { country: "GB", region: "England", city: "London", flag: "🇬🇧" },
      behaviorScore: 94,
      revenueValue: 89000,
      confidence: 91,
      status: "active",
      timeOnSite: "18m 45s",
      pagesVisited: 12,
      engagementLevel: "very_high",
      aiInsights: {
        intent: "Researching premium Oxbridge admissions support",
        nextAction: "Auto-executing: Exclusive Oxbridge popup NOW"
    }
  }
];

// --- AI DECISIONS MOCK DATA ---
const aiDecisionsData = {
  liveDecisions: [
    { id: 'D01', visitor: 'V_2847', trigger: 'High Engagement', decision: 'Triggered success story popup', confidence: 96, outcome: 'pending' },
    { id: 'D02', visitor: 'V_2851', trigger: 'Price Sensitivity', decision: 'Activated scholarship finder', confidence: 82, outcome: 'positive' },
    { id: 'D03', visitor: 'V_2849', trigger: 'Competitor Referrer', decision: 'Deployed competitive defense', confidence: 91, outcome: 'positive' },
    { id: 'D04', visitor: 'V_3102', trigger: 'Exit Intent', decision: 'Offered limited-time discount', confidence: 78, outcome: 'negative' },
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
    revenueImpact: 12800
  }
};

// --- SETTINGS MOCK DATA ---
const settingsData = {
  profile: {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    role: 'Administrator',
    avatar: 'https://i.pravatar.cc/40'
  },
  notifications: {
    highValueProspects: true,
    weeklySummary: true,
    securityAlerts: false
  },
  display: {
    theme: 'dark',
    density: 'compact'
  },
  integrations: [
    { id: 'salesforce', name: 'Salesforce', connected: true },
    { id: 'google_analytics', name: 'Google Analytics', connected: false }
  ]
};

// --- UI COMPONENTS ---

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, activePage, setActivePage }) => {
  return (
    <aside className={`fixed top-0 left-0 h-screen bg-primary-surface text-text-primary transition-all duration-300 z-40 ${isCollapsed ? 'w-16' : 'w-[196px]'}`}>
      <div className="flex flex-col h-full">
        {/* Logo and Toggle */}
        <div className={`flex items-center p-md border-b border-white/10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && <span className="text-lg font-bold">RevAI</span>}
          <button onClick={onToggle} className="p-1 rounded-md hover:bg-white/5">
            <ChevronLeft className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
          </button>
      </div>

      {/* Navigation */}
        <nav className="flex-1 px-md py-sm space-y-xs">
          {navigationItems.map(item => {
          const Icon = item.icon;
            const isActive = activePage === item.id;
          return (
              <a
              key={item.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                setActivePage(item.id);
                }}
                className={`flex items-center p-xs rounded-md transition-all duration-200 ${isActive ? 'bg-primary-accent text-white' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'} ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="h-5 w-5" />
                {!isCollapsed && <span className="ml-sm font-medium">{item.label}</span>}
              </a>
          );
        })}
      </nav>

        {/* User Profile */}
        <div className="p-md border-t border-white/10">
          <div className="flex items-center">
            <img
              src="https://i.pravatar.cc/40"
              alt="User Avatar"
              className="rounded-full w-8 h-8"
            />
            {!isCollapsed && (
              <div className="ml-sm">
                <p className="font-semibold text-sm">Jane Doe</p>
                <p className="text-xs text-text-secondary">Admin</p>
          </div>
        )}
      </div>
    </div>
      </div>
    </aside>
  );
};

const Header: React.FC<HeaderProps> = ({ onMenuClick, title, subtitle }) => (
  <header className="flex items-center justify-between p-md bg-primary-background/80 backdrop-blur-sm sticky top-0 z-30">
    {/* Mobile Menu & Page Title */}
    <div className="flex items-center">
      <button onClick={onMenuClick} className="mr-md lg:hidden p-1 rounded-md hover:bg-white/5">
        <Menu />
          </button>
          <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-text-secondary">{subtitle}</p>
          </div>
        </div>

    {/* Search and Actions */}
    <div className="flex items-center space-x-sm">
      <div className="relative hidden md:block">
        <Search className="absolute left-sm top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-primary-surface border border-white/10 rounded-md pl-8 pr-sm py-xs w-56 focus:outline-none focus:ring-2 focus:ring-primary-accent"
        />
            </div>
      <button className="p-xs rounded-full hover:bg-white/5">
        <Bell />
      </button>
      <button className="text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity">
        New Report
      </button>
            </div>
  </header>
);

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, changeType }) => {
  const changeColor = changeType === 'positive' ? 'text-status-success' : 'text-status-error';
  return (
    <div className="bg-primary-card p-md rounded-lg border border-white/10 shadow-md">
      <div className="flex justify-between items-start">
        <div className="space-y-xs">
          <p className="text-xs uppercase font-semibold tracking-wider text-text-secondary">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
            </div>
        <Icon className="h-5 w-5 text-text-muted" />
            </div>
      <p className={`text-xs font-medium mt-sm ${changeColor}`}>
        {change} vs last month
      </p>
          </div>
  );
};

const MainChart = () => (
  <div className="bg-primary-card p-lg rounded-lg border border-white/10 shadow-md">
    <div className="flex justify-between items-center mb-md">
          <div>
        <h2 className="text-lg font-bold">Revenue Prediction</h2>
        <p className="text-sm text-text-secondary">Predicted vs. Actual Revenue</p>
          </div>
      <div className="flex items-center space-x-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-chart-secondary" />
          <span className="text-xs">Predicted</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-chart-primary" />
          <span className="text-xs">Actual</span>
      </div>
        <button className="flex items-center space-x-xs text-xs border border-white/10 px-2 py-1 rounded-md hover:bg-white/5">
          <span>Monthly</span>
          <ChevronDown className="w-3 h-3" />
        </button>
          </div>
    </div>
    <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis dataKey="hour" tick={{ fill: '#9CA3AF', fontSize: 10 }} stroke="rgba(255, 255, 255, 0.1)" />
          <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} stroke="rgba(255, 255, 255, 0.1)" tickFormatter={(value) => `$${value}K`} />
                <Tooltip
            contentStyle={{
              backgroundColor: '#252B3A',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF'
            }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
          />
          <Area type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorPredicted)" />
          <Area type="monotone" dataKey="actual" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
      </div>
    </div>
  );

const DashboardPage = () => (
  <>
    {/* Metrics Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-lg">
      <MetricCard title="Pipeline Value" value="$348K" change="+12.5%" icon={DollarSign} changeType="positive" />
      <MetricCard title="Hot Prospects" value="8" change="+2.1%" icon={Target} changeType="positive" />
      <MetricCard title="AI Decisions" value="151" change="-0.5%" icon={Brain} changeType="negative" />
      <MetricCard title="Churn Prevented" value="$89K" change="+15%" icon={Shield} changeType="positive" />
      </div>

    {/* Main Chart */}
    <MainChart />
  </>
);

const AnalyticsPage = () => {
  const formatCurrency = (value: number) => `$${(value / 1000000).toFixed(2)}M`;
  const formatNumber = (value: number) => (value / 1000).toFixed(1) + 'K';

  return (
    <div className="space-y-md">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        <MetricCard title="Total Revenue" value={formatCurrency(analyticsData.overview.totalRevenue)} change={`+${analyticsData.overview.revenueGrowth}%`} icon={DollarSign} changeType="positive" />
        <MetricCard title="Conversion Rate" value={`${analyticsData.overview.conversionRate}%`} change={`+${analyticsData.overview.conversionGrowth}%`} icon={TrendingUp} changeType="positive" />
        <MetricCard title="Avg. Deal Size" value={`$${formatNumber(analyticsData.overview.avgDealSize)}`} change={`+${analyticsData.overview.dealSizeGrowth}%`} icon={Target} changeType="positive" />
        <MetricCard title="Time to Conversion" value={`${analyticsData.overview.timeToConversion} days`} change={`${analyticsData.overview.timeReduction}%`} icon={Clock} changeType="positive" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-md">
        {/* Revenue Trend */}
        <div className="lg:col-span-3 bg-primary-card p-lg rounded-lg border border-white/10 shadow-md">
           <h2 className="text-lg font-bold mb-sm">Revenue Growth</h2>
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.revenueByMonth}>
                <defs>
                          <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} stroke="rgba(255, 255, 255, 0.1)" />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} stroke="rgba(255, 255, 255, 0.1)" tickFormatter={(value) => `$${value/1000}K`} />
                      <Tooltip contentStyle={{ backgroundColor: '#252B3A', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fill="url(#analyticsRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Performance */}
        <div className="lg:col-span-2 bg-primary-card p-lg rounded-lg border border-white/10 shadow-md">
           <h2 className="text-lg font-bold mb-sm">Visitors by Region</h2>
           <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={analyticsData.geographicPerformance} dataKey="visitors" nameKey="region" cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#8884d8" paddingAngle={5}>
                        {analyticsData.geographicPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#252B3A', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }} />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Intervention Performance Table */}
      <div className="bg-primary-card rounded-lg border border-white/10 shadow-md">
        <h2 className="text-lg font-bold p-md">AI Intervention Performance</h2>
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-t border-white/10">
              <tr>
                <th className="p-sm font-semibold">Intervention Type</th>
                <th className="p-sm font-semibold">Impressions</th>
                <th className="p-sm font-semibold">Conversions</th>
                <th className="p-sm font-semibold">Rate</th>
                <th className="p-sm font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
              {analyticsData.interventionPerformance.map((item, index) => (
                <tr key={index} className="border-b border-white/10 last:border-b-0 hover:bg-white/5">
                  <td className="p-sm">{item.type}</td>
                  <td className="p-sm">{item.impressions.toLocaleString()}</td>
                  <td className="p-sm">{item.conversions}</td>
                  <td className="p-sm">{item.rate}%</td>
                  <td className="p-sm">{formatCurrency(item.revenue)}</td>
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
    <div className="space-y-md">
      {/* Filters and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'all' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            All Prospects
          </button>
          <button
            onClick={() => setFilter('high_value')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'high_value' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            High Value
          </button>
          <button
            onClick={() => setFilter('needs_attention')}
            className={`px-sm py-xs rounded-md text-xs transition-colors ${filter === 'needs_attention' ? 'bg-primary-surface border border-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Needs Attention
          </button>
        </div>
        <button className="text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity">
          Export List
          </button>
      </div>

      {/* Prospects List */}
      <div className="bg-primary-card rounded-lg border border-white/10 shadow-md">
        <ul className="divide-y divide-white/10">
          {filteredProspects.map((prospect) => (
            <li key={prospect.visitorId} className="p-md hover:bg-white/5 transition-colors duration-200">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-sm items-center">
                {/* Location */}
                <div className="md:col-span-3 flex items-center space-x-sm">
                  <span className="text-xl">{prospect.location.flag}</span>
            <div>
                    <p className="font-semibold text-sm">{prospect.location.city}, {prospect.location.region}</p>
                    <p className="text-xs text-text-secondary">{prospect.visitorId}</p>
        </div>
      </div>

                {/* Score */}
                <div className="md:col-span-2">
                  <p className="text-xs text-text-secondary mb-1">Behavior Score</p>
                  <div className="flex items-center space-x-xs">
                    <TrendingUp className="w-4 h-4 text-status-info"/>
                    <span className="font-semibold text-base">{prospect.behaviorScore}</span>
                </div>
              </div>

                {/* Value */}
                <div className="md:col-span-2">
                  <p className="text-xs text-text-secondary mb-1">Pipeline Value</p>
                  <div className="flex items-center space-x-xs">
                    <DollarSign className="w-4 h-4 text-status-success"/>
                    <span className="font-semibold text-base">${(prospect.revenueValue / 1000).toFixed(0)}K</span>
                </div>
              </div>

                {/* Engagement */}
                <div className="md:col-span-2">
                  <p className="text-xs text-text-secondary mb-1">Engagement</p>
                  <div className="flex items-center space-x-xs">
                    <Zap className={`w-4 h-4 ${getEngagementColor(prospect.engagementLevel)}`} />
                    <span className={`font-semibold capitalize text-base ${getEngagementColor(prospect.engagementLevel)}`}>{prospect.engagementLevel.replace('_', ' ')}</span>
                </div>
              </div>

                {/* Actions */}
                <div className="md:col-span-3 flex justify-end items-center space-x-sm">
                  <button className="text-xs bg-primary-surface border border-white/10 px-sm py-xs rounded-md hover:bg-white/10">View Details</button>
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
    setStrategies(strategies.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const getOutcomeBadge = (outcome: string) => {
    switch(outcome) {
      case 'positive': return 'bg-status-success/20 text-status-success';
      case 'negative': return 'bg-status-error/20 text-status-error';
      default: return 'bg-primary-surface text-text-secondary';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm">
      {/* Main Content: Live Feed */}
      <div className="lg:col-span-2 space-y-sm">
        <div className="bg-primary-card rounded-lg border border-white/10 shadow-md">
          <div className="p-sm border-b border-white/10 flex justify-between items-center">
            <h2 className="text-base font-bold">Live Decision Stream</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
              <span className="text-xs text-status-success">Live</span>
                </div>
            </div>
          <ul className="divide-y divide-white/10">
            {aiDecisionsData.liveDecisions.map(decision => (
              <li key={decision.id} className="p-sm flex justify-between items-center">
                <div className="flex items-center space-x-sm">
                  <div className="p-1 bg-primary-surface rounded-md">
                    <Brain className="w-4 h-4 text-primary-accent" />
          </div>
            <div>
                    <p className="font-medium text-sm">{decision.decision}</p>
                    <p className="text-xs text-text-secondary">Visitor {decision.visitor} • Trigger: {decision.trigger}</p>
                  </div>
                  </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{decision.confidence}% Confidence</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getOutcomeBadge(decision.outcome)}`}>
                    {decision.outcome}
                  </span>
                  </div>
              </li>
            ))}
          </ul>
              </div>
            </div>

      {/* Sidebar: Configuration and Performance */}
      <div className="space-y-sm">
        <div className="bg-primary-card rounded-lg border border-white/10 shadow-md p-sm">
          <h2 className="text-base font-bold mb-xs">AI Configuration</h2>

          <div className="space-y-sm">
            {/* Aggressiveness Slider */}
            <div>
              <label className="text-xs font-medium text-text-secondary">Intervention Aggressiveness</label>
              <div className="flex items-center space-x-sm mt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aggressiveness}
                  onChange={(e) => setAggressiveness(Number(e.target.value))}
                  className="w-full h-1 bg-primary-surface rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-bold text-primary-accent w-8 text-right text-sm">{aggressiveness}%</span>
            </div>
            </div>

            {/* Strategy Toggles */}
            <div>
              <label className="text-xs font-medium text-text-secondary">Active Strategies</label>
              <div className="space-y-xs mt-1">
                {strategies.map(strategy => (
                  <div key={strategy.id} className="flex justify-between items-center bg-primary-surface p-xs rounded-md">
                    <span className="text-xs">{strategy.name}</span>
                    <button onClick={() => toggleStrategy(strategy.id)} className={`w-8 h-4 rounded-full p-0.5 transition-colors ${strategy.enabled ? 'bg-primary-accent' : 'bg-white/10'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${strategy.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
            </div>
                ))}
          </div>
        </div>
      </div>
              </div>

        <div className="bg-primary-card rounded-lg border border-white/10 shadow-md p-sm">
          <h2 className="text-base font-bold mb-xs">Performance Overview</h2>
          <div className="space-y-xs text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Model Accuracy</span>
              <span className="font-semibold">{aiDecisionsData.performance.accuracy}%</span>
                  </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Decisions / Hour</span>
              <span className="font-semibold">{aiDecisionsData.performance.decisionsPerHour}</span>
                  </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Revenue Impact (24h)</span>
              <span className="font-semibold text-status-success">+${aiDecisionsData.performance.revenueImpact.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState(settingsData.notifications);

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
          <div className="space-y-md">
            <h3 className="text-lg font-bold">Profile Settings</h3>
            <div className="space-y-sm">
              <label className="text-xs font-medium text-text-secondary">Full Name</label>
              <input type="text" defaultValue={settingsData.profile.name} className="w-full bg-primary-surface border border-white/10 rounded-md p-xs" />
            </div>
            <div className="space-y-sm">
              <label className="text-xs font-medium text-text-secondary">Email</label>
              <input type="email" defaultValue={settingsData.profile.email} disabled className="w-full bg-primary-surface/50 border border-white/10 rounded-md p-xs" />
                  </div>
                  <div>
              <button className="text-sm bg-primary-accent text-white font-medium px-sm py-xs rounded-md hover:opacity-80 transition-opacity">Update Profile</button>
                  </div>
                </div>
        );
      case 'notifications':
        return (
          <div className="space-y-md">
            <h3 className="text-lg font-bold">Notification Settings</h3>
            <div className="space-y-sm">
              {Object.entries(notifications).map(([key, value]) => (
                 <div key={key} className="flex justify-between items-center bg-primary-surface p-sm rounded-md">
                   <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                   <button onClick={() => toggleNotification(key as keyof typeof notifications)} className={`w-8 h-4 rounded-full p-0.5 transition-colors ${value ? 'bg-primary-accent' : 'bg-white/10'}`}>
                     <div className={`w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
                   </button>
              </div>
              ))}
                  </div>
                  </div>
        );
      default:
        return (
          <div className="text-center p-xl">
            <h3 className="text-lg font-bold">{tabs.find(t => t.id === activeTab)?.label}</h3>
            <p className="text-text-secondary mt-sm">Settings for this section are coming soon.</p>
                </div>
        )
    }
  };

  return (
    <div className="flex space-x-md">
      <aside className="w-1/4">
        <nav className="space-y-xs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-sm p-sm rounded-md text-sm transition-colors ${activeTab === tab.id ? 'bg-primary-surface text-text-primary' : 'text-text-secondary hover:bg-primary-surface'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              </button>
          ))}
        </nav>
      </aside>
      <main className="w-3/4 bg-primary-card p-md rounded-lg border border-white/10">
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
  }

  const pages: PageCollection = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Welcome back, Jane!',
      component: <DashboardPage />
    },
    analytics: {
      title: 'Analytics',
      subtitle: 'Deep dive into your performance metrics.',
      component: <AnalyticsPage />
    },
    prospects: {
      title: 'Live Prospects',
      subtitle: 'Real-time analysis of high-value website visitors.',
      component: <ProspectsPage />
    },
    decisions: {
      title: 'AI Decision Engine',
      subtitle: 'Monitor and configure the AI decision-making process.',
      component: <AIDecisionsPage />
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile, notifications, and integrations.',
      component: <SettingsPage />
    }
  }

  const currentPage = pages[activePage] || pages.dashboard;

  return (
    <div className="min-h-screen">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={handleToggleMobileMenu}
        />
      )}

      {/* Conditional Sidebar for mobile */}
      <div className={`lg:hidden transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed z-50`}>
          <Sidebar isCollapsed={false} onToggle={() => {}} activePage={activePage} setActivePage={setActivePage} />
              </div>

      {/* Static Sidebar for desktop */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={handleToggleSidebar} activePage={activePage} setActivePage={setActivePage} />
                </div>

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[196px]'}`}>
        <Header onMenuClick={handleToggleMobileMenu} title={currentPage.title} subtitle={currentPage.subtitle} />
        <main className="p-md">
          {currentPage.component}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
