import React from 'react';
import Card, {
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '../ui/Card';

/**
 * Card Demo Component
 * Showcases all Card variants and features for testing and development
 */
const CardDemo: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
          Modern SaaS Card Design System
        </h1>

        {/* Card Variants Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12'>

          {/* Basic Card */}
          <Card variant='basic' size='md' data-testid='basic-card'>
            <CardHeader>
              <CardTitle>Basic Card</CardTitle>
              <CardDescription>
                Minimal elevation with subtle shadow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>
                Clean and simple design perfect for content display.
              </p>
            </CardContent>
            <CardFooter>
              <span className='text-xs text-gray-500'>Basic variant</span>
            </CardFooter>
          </Card>

          {/* Elevated Card */}
          <Card variant='elevated' size='md' data-testid='elevated-card'>
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>
                Enhanced shadow and glassmorphism
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>
                Perfect for important content that needs emphasis.
              </p>
            </CardContent>
            <CardFooter>
              <span className='text-xs text-gray-500'>Elevated variant</span>
            </CardFooter>
          </Card>

          {/* Interactive Card */}
          <Card
            variant='interactive'
            size='md'
            onClick={() => alert('Card clicked!')}
            data-testid='interactive-card'
          >
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
              <CardDescription>
                Hover effects and click handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>
                Click me! Includes hover animations and accessibility.
              </p>
            </CardContent>
            <CardFooter>
              <span className='text-xs text-gray-500'>Interactive variant</span>
            </CardFooter>
          </Card>

          {/* Glass Card */}
          <Card variant='glass' size='md' data-testid='glass-card'>
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>
                Maximum glassmorphism effect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>
                Beautiful transparent effect with backdrop blur.
              </p>
            </CardContent>
            <CardFooter>
              <span className='text-xs text-gray-500'>Glass variant</span>
            </CardFooter>
          </Card>
        </div>

        {/* Size Variants */}
        <div className='mb-12'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-6'>Size Variants</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>

            {/* Small Size */}
            <Card variant='elevated' size='sm' data-testid='small-card'>
              <CardTitle>Small Card</CardTitle>
              <CardContent>
                <p className='text-sm text-gray-600 mt-2'>
                  Compact size (16px padding) for tight spaces.
                </p>
              </CardContent>
            </Card>

            {/* Medium Size */}
            <Card variant='elevated' size='md' data-testid='medium-card'>
              <CardTitle>Medium Card</CardTitle>
              <CardContent>
                <p className='text-sm text-gray-600 mt-2'>
                  Standard size (24px padding) for most use cases.
                </p>
              </CardContent>
            </Card>

            {/* Large Size */}
            <Card variant='elevated' size='lg' data-testid='large-card'>
              <CardTitle>Large Card</CardTitle>
              <CardContent>
                <p className='text-sm text-gray-600 mt-2'>
                  Generous size (32px padding) for prominent content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hover Effects Demo */}
        <div className='mb-12'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-6'>Hover Effects</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>

            {/* Card with hover prop */}
            <Card variant='basic' hover data-testid='hover-card'>
              <CardHeader>
                <CardTitle>Hover Enhanced</CardTitle>
                <CardDescription>
                  Subtle hover effect for better UX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  Hover over me to see the gentle lift and shadow enhancement.
                </p>
              </CardContent>
            </Card>

            {/* No hover card for comparison */}
            <Card variant='basic' data-testid='no-hover-card'>
              <CardHeader>
                <CardTitle>No Hover</CardTitle>
                <CardDescription>
                  Standard card without hover effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  This card has no hover effects for comparison.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Real-world Example */}
        <div>
          <h2 className='text-2xl font-semibold text-gray-900 mb-6'>Dashboard Example</h2>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>

            {/* Metric Card */}
            <Card variant='elevated' size='md' hover data-testid='metric-card'>
              <CardContent>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-blue-600 mb-2'>
                    94.2%
                  </div>
                  <div className='text-sm font-medium text-gray-900 mb-1'>
                    Model Accuracy
                  </div>
                  <div className='text-xs text-green-600 font-medium'>
                    +2.3% from last week
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart Card */}
            <Card variant='glass' size='lg' data-testid='chart-card'>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Real-time dashboard analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center'>
                  <span className='text-gray-600'>Chart Placeholder</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Card */}
            <Card
              variant='interactive'
              size='md'
              onClick={() => alert('Start new experiment')}
              data-testid='action-card'
            >
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Start a new A/B test experiment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-center py-4'>
                  <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                    <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                    </svg>
                  </div>
                  <span className='text-sm font-medium text-gray-900'>New Experiment</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDemo;
