/**
 * Comprehensive Chart Showcase
 * Demonstrates all three chart types with elegant animations and interactions
 */

import React, { useState } from 'react';
import { ChartDataPoint } from '../../lib/charts/chartEngine';
import { useColors } from '../../lib/useColors';
import { useTypography } from '../../lib/useTypography';
import Card from '../ui/Card';
import { BarChart } from './BarChart';
import { FunnelChart } from './FunnelChart';
import { LineChart } from './LineChart';

export const ChartShowcase: React.FC = () => {
  const { colors } = useColors();
  const typography = useTypography();
  const [activeChart, setActiveChart] = useState<'line' | 'bar' | 'funnel'>('line');

  // Sample data for demonstrations
  const performanceData: ChartDataPoint[] = [
    { label: 'Jan', value: 4200, metadata: { month: 1, growth: 12 } },
    { label: 'Feb', value: 5100, metadata: { month: 2, growth: 21 } },
    { label: 'Mar', value: 4800, metadata: { month: 3, growth: -6 } },
    { label: 'Apr', value: 6200, metadata: { month: 4, growth: 29 } },
    { label: 'May', value: 7100, metadata: { month: 5, growth: 15 } },
    { label: 'Jun', value: 8300, metadata: { month: 6, growth: 17 } }
  ];

  const conversionData: ChartDataPoint[] = [
    { label: 'Website Visits', value: 10000, color: '#5b6cff' },
    { label: 'Product Views', value: 4500, color: '#7c3aed' },
    { label: 'Add to Cart', value: 1800, color: '#059669' },
    { label: 'Checkout Started', value: 900, color: '#dc2626' },
    { label: 'Purchase Complete', value: 650, color: '#ea580c' }
  ];

  const categoryData: ChartDataPoint[] = [
    { label: 'SaaS', value: 3200, color: '#5b6cff' },
    { label: 'E-commerce', value: 2800, color: '#7c3aed' },
    { label: 'Healthcare', value: 2100, color: '#059669' },
    { label: 'FinTech', value: 1900, color: '#dc2626' },
    { label: 'Education', value: 1400, color: '#ea580c' }
  ];

  const chartTabs = [
    { id: 'line' as const, label: 'Performance Trends', icon: '📈' },
    { id: 'bar' as const, label: 'Category Analysis', icon: '📊' },
    { id: 'funnel' as const, label: 'Conversion Flow', icon: '🔽' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`${typography.getClassName('heading-lg')} text-primary-900 mb-2`}>
          Elegant Data Visualization
        </h2>
        <p className={`${typography.getClassName('body-md')} text-secondary-600`}>
          Clean, minimal charts with smooth animations and contextual interactions
        </p>
      </div>

      {/* Chart Type Selector */}
      <div className="flex justify-center">
        <div className={`inline-flex bg-neutral-100 rounded-lg p-1`}>
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeChart === tab.id
                  ? `bg-primary-500 text-white shadow-sm`
                  : `text-secondary-600 hover:text-primary-600`
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Card variant="elevated" className="p-6">
            <div className="mb-4">
              <h3 className={`${typography.getClassName('heading-md')} text-primary-800 mb-1`}>
                {chartTabs.find(tab => tab.id === activeChart)?.label}
              </h3>
              <p className={`${typography.getClassName('body-sm')} text-secondary-500`}>
                {activeChart === 'line' && 'Monthly performance metrics with trend analysis'}
                {activeChart === 'bar' && 'Industry category breakdown and comparison'}
                {activeChart === 'funnel' && 'User journey conversion rates and drop-offs'}
              </p>
            </div>

            <div className="h-96">
              {activeChart === 'line' && (
                <LineChart
                  data={performanceData}
                  config={{
                    responsive: true,
                    animate: true,
                    showGrid: true,
                    showTooltip: true,
                    curve: 'smooth',
                    gradient: true,
                    showPoints: true
                  }}
                  onPointHover={(point) => {
                    if (point) {
                      console.log('Hovered point:', point);
                    }
                  }}
                />
              )}

              {activeChart === 'bar' && (
                <BarChart
                  data={categoryData}
                  config={{
                    responsive: true,
                    animate: true,
                    showGrid: true,
                    showTooltip: true,
                    showValues: true,
                    roundedCorners: 6
                  }}
                  onBarHover={(bar) => {
                    if (bar) {
                      console.log('Hovered bar:', bar);
                    }
                  }}
                />
              )}

              {activeChart === 'funnel' && (
                <FunnelChart
                  data={conversionData}
                  config={{
                    responsive: true,
                    animate: true,
                    showTooltip: true,
                    showPercentages: true,
                    showLabels: true
                  }}
                  onSegmentHover={(segment) => {
                    if (segment) {
                      console.log('Hovered segment:', segment);
                    }
                  }}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Chart Information Panel */}
        <div className="space-y-4">

          {/* Chart Features */}
          <Card variant="basic" className="p-4">
            <h4 className={`${typography.getClassName('heading-sm')} text-primary-800 mb-3`}>
              Chart Features
            </h4>
            <ul className="space-y-2">
              <li className={`flex items-center ${typography.getClassName('body-sm')} text-secondary-600`}>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Smooth animations & transitions
              </li>
              <li className={`flex items-center ${typography.getClassName('body-sm')} text-secondary-600`}>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Responsive design
              </li>
              <li className={`flex items-center ${typography.getClassName('body-sm')} text-secondary-600`}>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Interactive tooltips
              </li>
              <li className={`flex items-center ${typography.getClassName('body-sm')} text-secondary-600`}>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Accessibility compliant
              </li>
              <li className={`flex items-center ${typography.getClassName('body-sm')} text-secondary-600`}>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Customizable themes
              </li>
            </ul>
          </Card>

          {/* Performance Metrics */}
          <Card variant="basic" className="p-4">
            <h4 className={`${typography.getClassName('heading-sm')} text-primary-800 mb-3`}>
              Performance
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`${typography.getClassName('body-sm')} text-secondary-600`}>
                  Render Time
                </span>
                <span className={`${typography.getClassName('body-sm')} font-semibold text-success-600`}>
                  &lt;16ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`${typography.getClassName('body-sm')} text-secondary-600`}>
                  Bundle Size
                </span>
                <span className={`${typography.getClassName('body-sm')} font-semibold text-success-600`}>
                  12.3KB
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`${typography.getClassName('body-sm')} text-secondary-600`}>
                  Accessibility
                </span>
                <span className={`${typography.getClassName('body-sm')} font-semibold text-success-600`}>
                  WCAG 2.1 AA
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card variant="basic" className="p-4">
            <h4 className={`${typography.getClassName('heading-sm')} text-primary-800 mb-3`}>
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button className={`w-full px-3 py-2 text-left rounded-md transition-colors duration-200 ${typography.getClassName('body-sm')} text-secondary-700 hover:bg-neutral-100`}>
                📥 Export Data
              </button>
              <button className={`w-full px-3 py-2 text-left rounded-md transition-colors duration-200 ${typography.getClassName('body-sm')} text-secondary-700 hover:bg-neutral-100`}>
                🎨 Customize Theme
              </button>
              <button className={`w-full px-3 py-2 text-left rounded-md transition-colors duration-200 ${typography.getClassName('body-sm')} text-secondary-700 hover:bg-neutral-100`}>
                📊 View Analytics
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Technical Details */}
      <Card variant="basic" className="p-6">
        <h3 className={`${typography.getClassName('heading-md')} text-primary-800 mb-4`}>
          Technical Implementation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className={`${typography.getClassName('heading-sm')} text-primary-700 mb-2`}>
              Architecture
            </h4>
            <ul className={`space-y-1 ${typography.getClassName('body-sm')} text-secondary-600`}>
              <li>• SVG-based rendering</li>
              <li>• React hooks for state</li>
              <li>• TypeScript interfaces</li>
              <li>• Modular chart engine</li>
            </ul>
          </div>
          <div>
            <h4 className={`${typography.getClassName('heading-sm')} text-primary-700 mb-2`}>
              Animations
            </h4>
            <ul className={`space-y-1 ${typography.getClassName('body-sm')} text-secondary-600`}>
              <li>• CSS transitions</li>
              <li>• Staggered entrance</li>
              <li>• Smooth curves</li>
              <li>• Hover interactions</li>
            </ul>
          </div>
          <div>
            <h4 className={`${typography.getClassName('heading-sm')} text-primary-700 mb-2`}>
              Accessibility
            </h4>
            <ul className={`space-y-1 ${typography.getClassName('body-sm')} text-secondary-600`}>
              <li>• ARIA labels</li>
              <li>• Keyboard navigation</li>
              <li>• Screen reader support</li>
              <li>• Color contrast compliance</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChartShowcase;
