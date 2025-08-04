import React from 'react';
import {
    LAYOUT_CLASSES,
    RESPONSIVE_SPACING,
    spacing,
    SPACING_CLASSES,
    SPACING_GUIDELINES
} from '../../lib/spacing';
import Card from '../ui/Card';

/**
 * Breathing Room Standards Demo Component
 * Demonstrates all spacing standards and utilities for the modern SaaS design system
 */
const BreathingRoomDemo: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Main Container with Dashboard Layout */}
      <div className={LAYOUT_CLASSES.DASHBOARD_CONTAINER}>

        {/* Hero Section with Generous Spacing */}
        <div className={LAYOUT_CLASSES.HERO_CONTAINER}>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Breathing Room Standards Demo
          </h1>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
            Comprehensive showcase of spacing standards for modern SaaS card design system.
            Minimum 32px between card groups, 24-32px internal padding, and responsive spacing.
          </p>
        </div>

        {/* Guidelines Section */}
        <section className={spacing.getSectionSpacing('high')}>
          <Card variant='glass' size='lg'>
            <div className='text-center mb-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Design System Guidelines
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-blue-600 mb-2'>
                  {SPACING_GUIDELINES.MINIMUM_CARD_GROUP_SPACING}
                </div>
                <div className='text-sm text-gray-600'>
                  Minimum Card Group Spacing
                </div>
              </div>

              <div className='text-center'>
                <div className='text-3xl font-bold text-green-600 mb-2'>
                  {SPACING_GUIDELINES.RECOMMENDED_CARD_INTERNAL_PADDING}
                </div>
                <div className='text-sm text-gray-600'>
                  Recommended Internal Padding
                </div>
              </div>

              <div className='text-center'>
                <div className='text-3xl font-bold text-blue-600 mb-2'>
                  {SPACING_GUIDELINES.DESKTOP_COMFORTABLE_SPACING}
                </div>
                <div className='text-sm text-gray-600'>
                  Desktop Comfortable Spacing
                </div>
              </div>
            </div>

            <div className='mt-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Core Rules
              </h3>
              <ul className='space-y-2'>
                {SPACING_GUIDELINES.RULES.map((rule, index) => (
                  <li key={index} className='flex items-start space-x-3'>
                    <span className='flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2'></span>
                    <span className='text-gray-700'>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </section>

        {/* Card Group Spacing Examples */}
        <section className={spacing.getSectionSpacing('medium')}>
          <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
            Card Group Spacing Examples
          </h2>

          {/* Compact Spacing */}
          <div className='mb-12'>
            <h3 className='text-lg font-semibold text-gray-700 mb-4'>
              Compact Spacing (24px) - Mobile Friendly
            </h3>
            <div className={SPACING_CLASSES.CARD_GROUP.xs}>
              <Card variant='basic' size='sm'>
                <h4 className='font-medium text-gray-900'>Card 1</h4>
                <p className='text-sm text-gray-600'>Compact spacing for mobile</p>
              </Card>
              <Card variant='basic' size='sm'>
                <h4 className='font-medium text-gray-900'>Card 2</h4>
                <p className='text-sm text-gray-600'>Tight layout for small screens</p>
              </Card>
              <Card variant='basic' size='sm'>
                <h4 className='font-medium text-gray-900'>Card 3</h4>
                <p className='text-sm text-gray-600'>Efficient space usage</p>
              </Card>
            </div>
          </div>

          {/* Standard Spacing (32px minimum) */}
          <div className='mb-12'>
            <h3 className='text-lg font-semibold text-gray-700 mb-4'>
              Standard Spacing (32px) - Minimum Recommended
            </h3>
            <div className={SPACING_CLASSES.CARD_GROUP.sm}>
              <Card variant='elevated' size='md'>
                <h4 className='font-medium text-gray-900'>Metric Card 1</h4>
                <p className='text-sm text-gray-600'>Standard spacing for metrics</p>
                <div className='text-2xl font-bold text-blue-600 mt-2'>$12.4k</div>
              </Card>
              <Card variant='elevated' size='md'>
                <h4 className='font-medium text-gray-900'>Metric Card 2</h4>
                <p className='text-sm text-gray-600'>Comfortable breathing room</p>
                <div className='text-2xl font-bold text-green-600 mt-2'>89.3%</div>
              </Card>
              <Card variant='elevated' size='md'>
                <h4 className='font-medium text-gray-900'>Metric Card 3</h4>
                <p className='text-sm text-gray-600'>Optimal desktop spacing</p>
                <div className='text-2xl font-bold text-blue-600 mt-2'>1,847</div>
              </Card>
            </div>
          </div>

          {/* Generous Spacing */}
          <div className='mb-12'>
            <h3 className='text-lg font-semibold text-gray-700 mb-4'>
              Generous Spacing (48px) - Luxury Feel
            </h3>
            <div className={SPACING_CLASSES.CARD_GROUP.lg}>
              <Card variant='glass' size='lg'>
                <h4 className='font-medium text-gray-900 mb-2'>Premium Feature 1</h4>
                <p className='text-gray-600 mb-4'>Generous spacing creates premium feel</p>
                <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'>
                  Take Action
                </button>
              </Card>
              <Card variant='glass' size='lg'>
                <h4 className='font-medium text-gray-900 mb-2'>Premium Feature 2</h4>
                <p className='text-gray-600 mb-4'>Luxury spacing for high-value content</p>
                <button className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'>
                  Get Started
                </button>
              </Card>
            </div>
          </div>
        </section>

        {/* Grid Spacing Examples */}
        <section className={spacing.getSectionSpacing('medium')}>
          <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
            Grid Spacing by Content Type
          </h2>

          {/* Metrics Grid */}
          <div className='mb-12'>
            <h3 className='text-lg font-semibold text-gray-700 mb-4'>
              Metrics Grid (32px spacing)
            </h3>
            <div className={`grid grid-cols-1 md:grid-cols-3 ${spacing.getGridSpacing('metrics')}`}>
              <Card variant='basic' size='md'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>2,847</div>
                  <div className='text-sm text-gray-600'>Total Users</div>
                </div>
              </Card>
              <Card variant='basic' size='md'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>94.2%</div>
                  <div className='text-sm text-gray-600'>Success Rate</div>
                </div>
              </Card>
              <Card variant='basic' size='md'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>$18.4k</div>
                  <div className='text-sm text-gray-600'>Revenue</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Charts Grid */}
          <div className='mb-12'>
            <h3 className='text-lg font-semibold text-gray-700 mb-4'>
              Charts Grid (40px spacing)
            </h3>
            <div className={`grid grid-cols-1 lg:grid-cols-2 ${spacing.getGridSpacing('charts')}`}>
              <Card variant='elevated' size='lg'>
                <h4 className='font-medium text-gray-900 mb-4'>Analytics Chart</h4>
                <div className='h-32 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center'>
                  <span className='text-blue-600 font-medium'>Chart Placeholder</span>
                </div>
              </Card>
              <Card variant='elevated' size='lg'>
                <h4 className='font-medium text-gray-900 mb-4'>Performance Chart</h4>
                <div className='h-32 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center'>
                  <span className='text-green-600 font-medium'>Chart Placeholder</span>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Responsive Spacing Example */}
        <section className={spacing.getSectionSpacing('medium')}>
          <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
            Responsive Spacing System
          </h2>
          <Card variant='glass' size='lg'>
            <div className='text-center mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Responsive Card Group
              </h3>
              <p className='text-gray-600 mt-2'>
                Automatically adjusts spacing: 24px mobile → 32px tablet → 40px desktop
              </p>
            </div>

            <div className={RESPONSIVE_SPACING.CARD_GROUP_RESPONSIVE}>
              <Card variant='interactive' size='md'>
                <h4 className='font-medium text-gray-900'>Mobile Optimized</h4>
                <p className='text-sm text-gray-600'>Compact on small screens</p>
              </Card>
              <Card variant='interactive' size='md'>
                <h4 className='font-medium text-gray-900'>Tablet Friendly</h4>
                <p className='text-sm text-gray-600'>Comfortable on medium screens</p>
              </Card>
              <Card variant='interactive' size='md'>
                <h4 className='font-medium text-gray-900'>Desktop Spacious</h4>
                <p className='text-sm text-gray-600'>Generous on large screens</p>
              </Card>
            </div>
          </Card>
        </section>

        {/* Usage Examples */}
        <section className={spacing.getSectionSpacing('medium')}>
          <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
            Usage Examples
          </h2>

          <div className={RESPONSIVE_SPACING.GRID_RESPONSIVE}>
            <Card variant='basic' size='lg'>
              <h3 className='font-semibold text-gray-900 mb-4'>Code Examples</h3>
              <div className='space-y-4 text-sm'>
                <div>
                  <code className='bg-gray-100 px-2 py-1 rounded text-xs'>
                    {`className={LAYOUT_CLASSES.DASHBOARD_CONTAINER}`}
                  </code>
                  <p className='text-gray-600 mt-1'>Main dashboard container</p>
                </div>

                <div>
                  <code className='bg-gray-100 px-2 py-1 rounded text-xs'>
                    {`className={spacing.getCardGroupSpacing('comfortable')}`}
                  </code>
                  <p className='text-gray-600 mt-1'>Dynamic card group spacing</p>
                </div>

                <div>
                  <code className='bg-gray-100 px-2 py-1 rounded text-xs'>
                    {`className={RESPONSIVE_SPACING.CARD_GROUP_RESPONSIVE}`}
                  </code>
                  <p className='text-gray-600 mt-1'>Mobile-first responsive spacing</p>
                </div>
              </div>
            </Card>

            <Card variant='basic' size='lg'>
              <h3 className='font-semibold text-gray-900 mb-4'>Best Practices</h3>
              <ul className='space-y-3 text-sm'>
                <li className='flex items-start space-x-2'>
                  <span className='text-green-600 font-bold'>✓</span>
                  <span>Use minimum 32px between card groups</span>
                </li>
                <li className='flex items-start space-x-2'>
                  <span className='text-green-600 font-bold'>✓</span>
                  <span>Apply 24-32px internal card padding</span>
                </li>
                <li className='flex items-start space-x-2'>
                  <span className='text-green-600 font-bold'>✓</span>
                  <span>Use responsive spacing classes</span>
                </li>
                <li className='flex items-start space-x-2'>
                  <span className='text-green-600 font-bold'>✓</span>
                  <span>Maintain consistent spacing hierarchy</span>
                </li>
                <li className='flex items-start space-x-2'>
                  <span className='text-red-600 font-bold'>✗</span>
                  <span>Don't use spacing smaller than 24px between card groups</span>
                </li>
                <li className='flex items-start space-x-2'>
                  <span className='text-red-600 font-bold'>✗</span>
                  <span>Avoid inconsistent spacing throughout the interface</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
};

export default BreathingRoomDemo;
