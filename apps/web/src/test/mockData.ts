// Mock data generators for testing analytics and dashboard components

export interface MockAnalyticsData {
  timestamp: string;
  visitors: number;
  leads: number;
  revenue: number;
  conversionRate: number;
}

export interface MockMetric {
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MockChartData {
  label: string;
  value: number;
  fill?: string;
}

// Generate mock analytics data
export const generateMockAnalyticsData = (days = 30): MockAnalyticsData[] => {
  const data: MockAnalyticsData[] = [];
  const baseDate = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);

    data.push({
      timestamp: date.toISOString().split('T')[0],
      visitors: Math.floor(Math.random() * 1000) + 500,
      leads: Math.floor(Math.random() * 100) + 20,
      revenue: Math.floor(Math.random() * 10000) + 2000,
      conversionRate: +(Math.random() * 5 + 2).toFixed(2),
    });
  }

  return data;
};

// Generate mock metrics
export const generateMockMetrics = (): MockMetric[] => [
  {
    label: 'Total Visitors',
    value: '12,543',
    change: 12.5,
    trend: 'up',
  },
  {
    label: 'Qualified Leads',
    value: '3,432',
    change: -2.3,
    trend: 'down',
  },
  {
    label: 'Conversion Rate',
    value: '3.2%',
    change: 0.8,
    trend: 'up',
  },
  {
    label: 'Revenue Impact',
    value: '$45,231',
    change: 8.7,
    trend: 'up',
  },
];

// Generate mock chart data for different chart types
export const generateMockBarChartData = (items = 6): MockChartData[] => {
  const categories = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
  return categories.slice(0, items).map((label, index) => ({
    label,
    value: Math.floor(Math.random() * 100) + 20,
    fill: `hsl(${index * 60}, 70%, 60%)`,
  }));
};

export const generateMockLineChartData = (points = 12): MockChartData[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.slice(0, points).map((label) => ({
    label,
    value: Math.floor(Math.random() * 500) + 100,
  }));
};

export const generateMockPieChartData = (): MockChartData[] => [
  { label: 'High Intent', value: 35, fill: '#8884d8' },
  { label: 'Medium Intent', value: 45, fill: '#82ca9d' },
  { label: 'Low Intent', value: 20, fill: '#ffc658' },
];

export const generateMockFunnelData = () => [
  { label: 'Visitors', value: 10000, fill: '#8884d8' },
  { label: 'Engaged', value: 7500, fill: '#82ca9d' },
  { label: 'Qualified', value: 3200, fill: '#ffc658' },
  { label: 'Converted', value: 850, fill: '#ff7300' },
];

// Mock industry data
export const generateMockIndustryData = () => ({
  'Technology': {
    conversionRate: 3.2,
    avgOrderValue: 2450,
    customers: 12500,
  },
  'Healthcare': {
    conversionRate: 2.8,
    avgOrderValue: 1850,
    customers: 8300,
  },
  'Finance': {
    conversionRate: 4.1,
    avgOrderValue: 3200,
    customers: 15600,
  },
  'E-commerce': {
    conversionRate: 2.1,
    avgOrderValue: 680,
    customers: 34500,
  },
});

// Mock user events
export const generateMockUserEvents = () => [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    event: 'page_view',
    user: 'user_123',
    properties: {
      page: '/dashboard',
      utm_source: 'google',
    },
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    event: 'button_click',
    user: 'user_456',
    properties: {
      button: 'cta_signup',
      page: '/landing',
    },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    event: 'form_submit',
    user: 'user_789',
    properties: {
      form: 'contact_form',
      lead_score: 85,
    },
  },
];

// Mock API responses
export const mockAPIResponses = {
  analytics: {
    success: {
      data: generateMockAnalyticsData(),
      metrics: generateMockMetrics(),
      status: 'success',
    },
    error: {
      error: 'Failed to fetch analytics data',
      status: 'error',
    },
  },
  charts: {
    barChart: generateMockBarChartData(),
    lineChart: generateMockLineChartData(),
    pieChart: generateMockPieChartData(),
    funnelChart: generateMockFunnelData(),
  },
  industry: generateMockIndustryData(),
  events: generateMockUserEvents(),
};

// Helper function to create delayed promises for testing loading states
export const createDelayedPromise = <T>(data: T, delay = 100): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Helper function to create rejected promises for testing error states
export const createRejectedPromise = (error = 'Mock error', delay = 100): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(error)), delay);
  });
};
