/**
 * Interactive Elements Demo
 * Showcases advanced button system, loading states, and micro-interactions
 */

import React, { useState } from 'react';
import { useUtilities } from '../../lib/useUtilities';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingStates from '../ui/LoadingStates';

const InteractiveDemo: React.FC = () => {
  const { typography, colors, spacing } = useUtilities();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(65);

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const handleProgressUpdate = () => {
    setProgress(prev => (prev >= 100 ? 0 : prev + 10));
  };

  return (
    <div className="space-y-12 p-6">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className={`${typography.getClass('display-xl')} gradient-text mb-4`}>
          Interactive Elements System
        </h1>
        <p className={`${typography.getClass('body-lg')} ${colors.getClass('text', 'secondary', '600')} max-w-3xl mx-auto`}>
          Advanced button variants, sophisticated loading states, and smooth micro-interactions
          designed for modern SaaS applications with comprehensive accessibility support.
        </p>
      </div>

      {/* Button System Demo */}
      <Card variant="glass" size="lg" className="animate-slide-up entrance-delay-1">
        <div className="space-y-8">
          <div className="border-b border-gray-200 pb-4">
            <h2 className={`${typography.getClass('heading-lg')} ${colors.getClass('text', 'secondary', '900')} mb-2`}>
              Advanced Button System
            </h2>
            <p className={`${typography.getClass('body-sm')} ${colors.getClass('text', 'secondary', '600')}`}>
              Sophisticated button variants with micro-interactions and loading states
            </p>
          </div>

          {/* Button Variants */}
          <div className="space-y-6">
            <div>
              <h3 className={`${typography.getClass('heading-md')} ${colors.getClass('text', 'secondary', '800')} mb-4`}>
                Button Variants
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="md">
                  Primary Button
                </Button>
                <Button variant="secondary" size="md">
                  Secondary Button
                </Button>
                <Button variant="tertiary" size="md">
                  Tertiary Button
                </Button>
                <Button variant="ghost" size="md">
                  Ghost Button
                </Button>
                <Button variant="outline" size="md">
                  Outline Button
                </Button>
                <Button variant="danger" size="md">
                  Danger Button
                </Button>
              </div>
            </div>

            <div>
              <h3 className={`${typography.getClass('heading-md')} ${colors.getClass('text', 'secondary', '800')} mb-4`}>
                Button Sizes
              </h3>
              <div className="flex flex-wrap gap-4 items-end">
                <Button variant="primary" size="xs">
                  Extra Small
                </Button>
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="primary" size="xl">
                  Extra Large
                </Button>
              </div>
            </div>

            <div>
              <h3 className={`${typography.getClass('heading-md')} ${colors.getClass('text', 'secondary', '800')} mb-4`}>
                Button States & Features
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="primary"
                  size="md"
                  loading={isLoading}
                  loadingText="Processing..."
                  onClick={handleLoadingTest}
                >
                  {isLoading ? 'Loading...' : 'Test Loading'}
                </Button>
                <Button variant="secondary" size="md" disabled>
                  Disabled Button
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                >
                  With Left Icon
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  }
                >
                  With Right Icon
                </Button>
                <Button variant="secondary" size="md" fullWidth className="mt-4">
                  Full Width Button
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading States Demo */}
      <Card variant="elevated" size="lg" className="animate-slide-up entrance-delay-2">
        <div className="space-y-8">
          <div className="border-b border-gray-200 pb-4">
            <h2 className={`${typography.getClass('heading-lg')} ${colors.getClass('text', 'secondary', '900')} mb-2`}>
              Sophisticated Loading States
            </h2>
            <p className={`${typography.getClass('body-sm')} ${colors.getClass('text', 'secondary', '600')}`}>
              Skeleton screens, progress indicators, and loading animations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skeleton Components */}
            <div>
              <h3 className={`${typography.getClass('heading-md')} ${colors.getClass('text', 'secondary', '800')} mb-4`}>
                Skeleton Screens
              </h3>
              <div className="space-y-4">
                <LoadingStates.CardSkeleton showAvatar={true} lines={3} />
                <LoadingStates.MetricSkeleton />
                <div className="grid grid-cols-2 gap-4">
                  <LoadingStates.Skeleton variant="rect" height={100} />
                  <LoadingStates.Skeleton variant="rounded" height={100} />
                </div>
              </div>
            </div>

            {/* Progress Indicators */}
            <div>
              <h3 className={`${typography.getClass('heading-md')} ${colors.getClass('text', 'secondary', '800')} mb-4`}>
                Progress Indicators
              </h3>
              <div className="space-y-6">
                <LoadingStates.ProgressBar
                  value={progress}
                  label="Upload Progress"
                  showValue={true}
                  variant="primary"
                />
                <LoadingStates.ProgressBar
                  value={85}
                  label="Completion Rate"
                  showValue={true}
                  variant="success"
                  size="sm"
                />

                <div className="flex items-center space-x-6">
                  <LoadingStates.CircularProgress
                    value={progress}
                    variant="primary"
                    size={64}
                  />
                  <LoadingStates.CircularProgress
                    value={92}
                    variant="success"
                    size={48}
                  />
                  <LoadingStates.CircularProgress
                    value={67}
                    variant="warning"
                    size={32}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <LoadingStates.LoadingDots size="sm" variant="primary" />
                  <LoadingStates.LoadingDots size="md" variant="success" />
                  <LoadingStates.LoadingDots size="lg" variant="warning" />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProgressUpdate}
                >
                  Update Progress
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Micro-interactions Demo */}
      <Card variant="glass" size="lg" className="animate-slide-up entrance-delay-3">
        <div className="space-y-8">
          <div className="border-b border-gray-200 pb-4">
            <h2 className={`${typography.getClass('heading-lg')} ${colors.getClass('text', 'secondary', '900')} mb-2`}>
              Micro-interactions & Animations
            </h2>
            <p className={`${typography.getClass('body-sm')} ${colors.getClass('text', 'secondary', '600')}`}>
              Subtle animations that enhance user experience without distraction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Hover Effects */}
            <div className="space-y-4">
              <h3 className={`${typography.getClass('heading-sm')} ${colors.getClass('text', 'secondary', '800')}`}>
                Hover Effects
              </h3>
              <div className="space-y-3">
                <div className={`${colors.getClass('bg', 'primary', '100')} p-4 rounded-lg hover-lift cursor-pointer`}>
                  <p className={typography.getClass('body-sm')}>Subtle Lift</p>
                </div>
                <div className={`${colors.getClass('bg', 'success', '100')} p-4 rounded-lg hover-lift-strong cursor-pointer`}>
                  <p className={typography.getClass('body-sm')}>Strong Lift</p>
                </div>
                <div className={`${colors.getClass('bg', 'warning', '100')} p-4 rounded-lg hover-scale cursor-pointer`}>
                  <p className={typography.getClass('body-sm')}>Scale Effect</p>
                </div>
              </div>
            </div>

            {/* Entrance Animations */}
            <div className="space-y-4">
              <h3 className={`${typography.getClass('heading-sm')} ${colors.getClass('text', 'secondary', '800')}`}>
                Entrance Animations
              </h3>
              <div className="animate-group space-y-3">
                <div className={`${colors.getClass('bg', 'secondary', '100')} p-3 rounded`}>
                  <p className={typography.getClass('body-sm')}>Staggered Item 1</p>
                </div>
                <div className={`${colors.getClass('bg', 'secondary', '100')} p-3 rounded`}>
                  <p className={typography.getClass('body-sm')}>Staggered Item 2</p>
                </div>
                <div className={`${colors.getClass('bg', 'secondary', '100')} p-3 rounded`}>
                  <p className={typography.getClass('body-sm')}>Staggered Item 3</p>
                </div>
              </div>
            </div>

            {/* Interactive Cards */}
            <div className="space-y-4">
              <h3 className={`${typography.getClass('heading-sm')} ${colors.getClass('text', 'secondary', '800')}`}>
                Interactive Cards
              </h3>
              <div className="space-y-3">
                <div className={`${colors.getClass('bg', 'secondary', '50')} border border-secondary-200 p-4 rounded-lg interactive-card cursor-pointer`}>
                  <h4 className={`${typography.getClass('heading-sm')} mb-1`}>Metric Card</h4>
                  <p className={`${typography.getClass('body-sm')} ${colors.getClass('text', 'secondary', '600')}`}>
                    Hover for interaction
                  </p>
                </div>
                <div className={`${colors.getClass('bg', 'primary', '50')} border border-primary-200 p-4 rounded-lg interactive-card cursor-pointer`}>
                  <h4 className={`${typography.getClass('heading-sm')} mb-1`}>Action Card</h4>
                  <p className={`${typography.getClass('body-sm')} ${colors.getClass('text', 'primary', '700')}`}>
                    Click for action
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Accessibility Features */}
      <Card variant="elevated" size="lg" className="animate-slide-up entrance-delay-4">
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className={`${typography.getClass('heading-lg')} ${colors.getClass('text', 'secondary', '900')} mb-2`}>
              Accessibility & Focus Management
            </h2>
            <p className={`${typography.getClass('body-sm')} ${colors.getClass('text', 'secondary', '600')}`}>
              Comprehensive focus states and reduced motion support for all interactive elements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className={`${typography.getClass('heading-md')} ${colors.getClass('text', 'secondary', '800')} mb-4`}>
                Focus States
              </h3>
              <div className="space-y-3">
                <Button variant="primary" size="md" className="focus-ring">
                  Focus with Ring
                </Button>
                <Button variant="secondary" size="md" className="focus-ring-subtle">
                  Subtle Focus Ring
                </Button>
                <div className={`p-3 rounded border focus-ring cursor-pointer ${colors.getClass('bg', 'secondary', '50')}`} tabIndex={0}>
                  <p className={typography.getClass('body-sm')}>Focusable Card Element</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`${typography.getClass('heading-md')} ${colors.getClass('text', 'secondary', '800')} mb-4`}>
                Reduced Motion
              </h3>
              <div className="space-y-3">
                <p className={`${typography.getClass('body-sm')} ${colors.getClass('text', 'secondary', '600')}`}>
                  All animations respect <code className={`${colors.getClass('bg', 'secondary', '100')} px-2 py-1 rounded text-xs`}>prefers-reduced-motion</code> settings
                </p>
                <p className={`${typography.getClass('body-sm')} ${colors.getClass('text', 'secondary', '600')}`}>
                  Interactive elements maintain functionality while reducing motion for accessibility
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InteractiveDemo;
