import '@testing-library/jest-dom';
import { cleanup, render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { ReactElement } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock Next.js router
const mockRouter = {
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  push: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn().mockResolvedValue(undefined),
  beforePopState: vi.fn(),
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock Recharts for chart testing
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  LineChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'line-chart' }, children),
  BarChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'bar-chart' }, children),
  XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
  Line: () => React.createElement('div', { 'data-testid': 'line' }),
  Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
  Area: () => React.createElement('div', { 'data-testid': 'area' }),
  AreaChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'area-chart' }, children),
  PieChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  Pie: () => React.createElement('div', { 'data-testid': 'pie' }),
  Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
  FunnelChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'funnel-chart' }, children),
  Funnel: () => React.createElement('div', { 'data-testid': 'funnel' }),
  LabelList: () => React.createElement('div', { 'data-testid': 'label-list' }),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    span: ({ children, ...props }: any) => React.createElement('span', props, children),
    button: ({ children, ...props }: any) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock window.ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock environment variables
Object.defineProperty(window, 'process', {
  value: {
    env: {
      NODE_ENV: 'test',
    },
  },
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  router?: Partial<typeof mockRouter>;
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  // Update router mock if provided
  if (options?.router) {
    Object.assign(mockRouter, options.router);
  }

  const user = userEvent.setup();

  // Wrapper component for providers
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Add any global providers here (Theme, Context, etc.)
    return children;
  };

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
};
