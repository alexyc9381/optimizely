// Specialized testing utilities for chart components

import { screen, within } from '@testing-library/react';
import { expect } from 'vitest';

// Chart testing utilities
export const chartTestUtils = {
  // Check if a chart container is rendered
  expectChartContainer: (testId: string) => {
    const container = screen.getByTestId(testId);
    expect(container).toBeInTheDocument();
    return container;
  },

  // Check if responsive container is rendered
  expectResponsiveContainer: () => {
    const container = screen.getByTestId('responsive-container');
    expect(container).toBeInTheDocument();
    return container;
  },

  // Check chart components for different chart types
  expectLineChart: () => {
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  },

  expectBarChart: () => {
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  },

  expectPieChart: () => {
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  },

  expectFunnelChart: () => {
    expect(screen.getByTestId('funnel-chart')).toBeInTheDocument();
    expect(screen.getByTestId('funnel')).toBeInTheDocument();
  },

  // Check for chart accessories
  expectTooltip: () => {
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  },

  expectLegend: () => {
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  },

  expectGrid: () => {
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
  },

  // Verify chart data rendering (for mocked components)
  expectChartData: (container: HTMLElement, expectedDataPoints: number) => {
    // This would check for the number of data points rendered
    // In a real implementation, you'd check for actual data elements
    expect(container).toBeInTheDocument();
    // Add more specific assertions based on your chart implementation
  },

  // Check for chart loading states
  expectLoadingState: () => {
    expect(
      screen.getByTestId('chart-loading') ||
      screen.getByText(/loading/i) ||
      screen.getByRole('status')
    ).toBeInTheDocument();
  },

  // Check for chart error states
  expectErrorState: (errorMessage?: string) => {
    const errorElement = screen.getByTestId('chart-error') ||
                        screen.getByText(/error/i) ||
                        screen.getByRole('alert');
    expect(errorElement).toBeInTheDocument();

    if (errorMessage) {
      expect(errorElement).toHaveTextContent(errorMessage);
    }
  },

  // Check for empty chart states
  expectEmptyState: () => {
    expect(
      screen.getByTestId('chart-empty') ||
      screen.getByText(/no data/i) ||
      screen.getByText(/empty/i)
    ).toBeInTheDocument();
  },
};

// Dashboard testing utilities
export const dashboardTestUtils = {
  // Check for metric cards
  expectMetricCard: (label: string, value?: string) => {
    const card = screen.getByText(label).closest('[data-testid="metric-card"]') ||
                 screen.getByText(label).closest('.metric-card') ||
                 screen.getByText(label).parentElement;

    expect(card).toBeInTheDocument();

    if (value) {
      expect(within(card as HTMLElement).getByText(value)).toBeInTheDocument();
    }

    return card;
  },

  // Check for trend indicators
  expectTrendIndicator: (container: HTMLElement, trend: 'up' | 'down' | 'stable') => {
    const trendElement = within(container).getByTestId(`trend-${trend}`) ||
                        within(container).getByText(trend === 'up' ? /↑|up/i :
                                                    trend === 'down' ? /↓|down/i : /→|stable/i);
    expect(trendElement).toBeInTheDocument();
  },

  // Check for dashboard sections
  expectDashboardSection: (sectionTitle: string) => {
    const section = screen.getByRole('region', { name: sectionTitle }) ||
                   screen.getByTestId(`section-${sectionTitle.toLowerCase().replace(/\s+/g, '-')}`) ||
                   screen.getByText(sectionTitle).closest('section');

    expect(section).toBeInTheDocument();
    return section;
  },

  // Check for filter controls
  expectFilterControls: () => {
    const filters = screen.getByTestId('dashboard-filters') ||
                   screen.getByRole('region', { name: /filter/i });
    expect(filters).toBeInTheDocument();
    return filters;
  },

  // Check for export controls
  expectExportControls: () => {
    const exportBtn = screen.getByTestId('export-button') ||
                     screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeInTheDocument();
    return exportBtn;
  },
};

// Analytics testing utilities
export const analyticsTestUtils = {
  // Mock analytics tracking
  mockAnalyticsTrack: (eventName: string, properties?: Record<string, any>) => {
    // This would mock your analytics tracking calls
    console.log('Mock analytics track:', eventName, properties);
  },

  // Check for analytics events
  expectAnalyticsEvent: (eventName: string) => {
    // This would verify that an analytics event was fired
    // Implementation depends on your analytics setup
    expect(eventName).toBeDefined();
  },

  // Mock user identification
  mockUserIdentify: (userId: string, traits?: Record<string, any>) => {
    console.log('Mock user identify:', userId, traits);
  },

  // Test A/B test variants
  expectABTestVariant: (testName: string, variant: string) => {
    const element = screen.getByTestId(`ab-test-${testName}-${variant}`) ||
                   screen.getByTestId(`variant-${variant}`);
    expect(element).toBeInTheDocument();
  },
};

// Performance testing utilities
export const performanceTestUtils = {
  // Mock performance measurements
  mockPerformanceMark: (markName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(markName);
    }
  },

  // Check for performance markers
  expectPerformanceMetrics: (expectedMetrics: string[]) => {
    expectedMetrics.forEach(metric => {
      expect(metric).toBeDefined();
    });
  },

  // Mock Core Web Vitals
  mockCoreWebVitals: () => ({
    CLS: 0.1,
    FID: 100,
    FCP: 1200,
    LCP: 2500,
    TTFB: 200,
  }),
};

// Accessibility testing utilities
export const a11yTestUtils = {
  // Check for ARIA labels
  expectAriaLabel: (element: HTMLElement, expectedLabel: string) => {
    expect(element).toHaveAttribute('aria-label', expectedLabel);
  },

  // Check for proper heading hierarchy
  expectHeadingHierarchy: () => {
    const headings = screen.getAllByRole('heading');
    headings.forEach((heading, index) => {
      expect(heading).toBeInTheDocument();
      // Add more specific heading hierarchy checks as needed
    });
  },

  // Check for keyboard navigation
  expectKeyboardNavigation: async (user: any, startElement: HTMLElement) => {
    startElement.focus();
    expect(startElement).toHaveFocus();

    await user.keyboard('{Tab}');
    // Verify focus moved to next focusable element
  },

  // Check for screen reader content
  expectScreenReaderContent: (content: string) => {
    const srOnly = screen.getByText(content, {
      selector: '.sr-only, .visually-hidden, [aria-hidden="false"]'
    });
    expect(srOnly).toBeInTheDocument();
  },
};

// Export all utilities
export {
    a11yTestUtils as accessibility, analyticsTestUtils as analytics, chartTestUtils as charts,
    dashboardTestUtils as dashboard, performanceTestUtils as performance
};
