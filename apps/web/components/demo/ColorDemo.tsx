/**
 * Color System Demo Component
 * Showcases the comprehensive color palette and theme management
 */

import React from 'react';
import { COLOR_PALETTE } from '../../lib/colors';
import { useColors } from '../../lib/useColors';
import Card from '../ui/Card';

const ColorDemo: React.FC = () => {
  const { colors, theme } = useColors();

  const colorCategories = [
    { name: 'Primary', colors: COLOR_PALETTE.primary, description: 'Main brand colors' },
    { name: 'Secondary', colors: COLOR_PALETTE.secondary, description: 'Supporting brand colors' },
    { name: 'Neutral', colors: COLOR_PALETTE.neutral, description: 'Text, backgrounds, borders' },
    { name: 'Success', colors: COLOR_PALETTE.success, description: 'Positive states, confirmations' },
    { name: 'Warning', colors: COLOR_PALETTE.warning, description: 'Caution states, warnings' },
    { name: 'Error', colors: COLOR_PALETTE.error, description: 'Error states, destructive actions' },
    { name: 'Info', colors: COLOR_PALETTE.info, description: 'Informational states, tips' },
  ];

  const semanticColors = [
    { name: 'Success', color: colors.getStatusColor('success'), usage: 'Positive feedback, completed actions' },
    { name: 'Warning', color: colors.getStatusColor('warning'), usage: 'Caution, pending actions' },
    { name: 'Error', color: colors.getStatusColor('error'), usage: 'Errors, destructive actions' },
    { name: 'Info', color: colors.getStatusColor('info'), usage: 'Information, neutral feedback' },
  ];

  const interactiveStates = [
    { name: 'Primary Button', states: colors.getInteractiveColors('primary') },
    { name: 'Secondary Button', states: colors.getInteractiveColors('secondary') },
  ];

  return (
    <div className='space-y-8 p-6'>
      {/* Header */}
      <div className='text-center mb-12'>
        <h1 className='text-display-xl text-gradient-primary mb-4'>
          Color System
        </h1>
        <p className='text-body-lg text-secondary max-w-2xl mx-auto'>
          Enterprise-grade color palette with WCAG 2.1 AA compliance, semantic meanings,
          and comprehensive dark mode support. Built for accessibility and consistency.
        </p>

        {/* Theme Toggle */}
        <div className='flex items-center justify-center gap-4 mt-6'>
          <span className='text-label-md text-secondary'>Theme:</span>
          <div className='flex gap-2'>
            <button
              onClick={() => theme.set('light')}
              className={`px-3 py-1 rounded-md text-label-sm transition-colors ${
                theme.current === 'light'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-secondary hover:bg-neutral-200'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => theme.set('dark')}
              className={`px-3 py-1 rounded-md text-label-sm transition-colors ${
                theme.current === 'dark'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-secondary hover:bg-neutral-200'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => theme.set('system')}
              className={`px-3 py-1 rounded-md text-label-sm transition-colors ${
                theme.current === 'system'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-secondary hover:bg-neutral-200'
              }`}
            >
              System
            </button>
          </div>
          <span className='text-label-sm text-tertiary'>
            Active: {theme.resolved}
          </span>
        </div>
      </div>

      {/* Color Scales */}
      {colorCategories.map((category) => (
        <Card key={category.name} variant='elevated' size='lg'>
          <div className='space-y-6'>
            <div className='border-b border-default pb-4'>
              <h2 className='text-heading-lg text-primary mb-2'>{category.name} Colors</h2>
              <p className='text-body-sm text-secondary'>{category.description}</p>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-5 lg:grid-cols-11 gap-4'>
              {Object.entries(category.colors).map(([shade, color]) => (
                <div key={shade} className='space-y-2'>
                  <div
                    className='w-full h-16 rounded-lg border border-default shadow-sm cursor-pointer transition-transform hover:scale-105'
                    style={{ backgroundColor: color }}
                    title={`${category.name} ${shade}: ${color}`}
                  />
                  <div className='text-center'>
                    <div className='text-label-sm font-medium text-primary'>{shade}</div>
                    <div className='text-label-sm text-tertiary font-mono'>{color}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Examples for Primary Colors */}
            {category.name === 'Primary' && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-subtle'>
                <div className='p-4 rounded-lg' style={{ backgroundColor: category.colors[50] }}>
                  <div className='text-label-md font-medium mb-1' style={{ color: category.colors[900] }}>
                    Light Background
                  </div>
                  <div className='text-body-sm' style={{ color: category.colors[700] }}>
                    Subtle brand presence
                  </div>
                </div>
                <div className='p-4 rounded-lg' style={{ backgroundColor: category.colors[500] }}>
                  <div className='text-label-md font-medium mb-1 text-white'>
                    Primary Action
                  </div>
                  <div className='text-body-sm text-white/90'>
                    Main brand color
                  </div>
                </div>
                <div className='p-4 rounded-lg' style={{ backgroundColor: category.colors[900] }}>
                  <div className='text-label-md font-medium mb-1 text-white'>
                    Dark Background
                  </div>
                  <div className='text-body-sm text-white/80'>
                    Strong brand presence
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Semantic Colors */}
      <Card variant='glass' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-default pb-4'>
            <h2 className='text-heading-lg text-primary mb-2'>Semantic Colors</h2>
            <p className='text-body-sm text-secondary'>
              Color meanings for status, feedback, and user interface elements
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {semanticColors.map((semantic) => (
              <div key={semantic.name} className='space-y-3'>
                <div className='flex items-center gap-3'>
                  <div
                    className='w-6 h-6 rounded-full border border-default'
                    style={{ backgroundColor: semantic.color }}
                  />
                  <h3 className='text-heading-xs text-primary'>{semantic.name}</h3>
                </div>
                <p className='text-body-sm text-secondary'>{semantic.usage}</p>

                {/* Example Usage */}
                <div className='space-y-2'>
                  <div
                    className={`px-3 py-2 rounded-md text-label-sm font-medium ${
                      semantic.name === 'Success' ? 'bg-success-100 text-success-800' :
                      semantic.name === 'Warning' ? 'bg-warning-100 text-warning-800' :
                      semantic.name === 'Error' ? 'bg-error-100 text-error-800' :
                      'bg-info-100 text-info-800'
                    }`}
                  >
                    {semantic.name} Message
                  </div>
                  <button
                    className={`w-full px-3 py-2 rounded-md text-label-sm font-medium text-white transition-colors ${
                      semantic.name === 'Success' ? 'bg-success-500 hover:bg-success-600' :
                      semantic.name === 'Warning' ? 'bg-warning-500 hover:bg-warning-600' :
                      semantic.name === 'Error' ? 'bg-error-500 hover:bg-error-600' :
                      'bg-info-500 hover:bg-info-600'
                    }`}
                  >
                    {semantic.name} Button
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Interactive States */}
      <Card variant='interactive' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-default pb-4'>
            <h2 className='text-heading-lg text-primary mb-2'>Interactive States</h2>
            <p className='text-body-sm text-secondary'>
              Color variations for different interaction states (hover, active, disabled)
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {interactiveStates.map((interactive) => (
              <div key={interactive.name} className='space-y-4'>
                <h3 className='text-heading-sm text-primary'>{interactive.name}</h3>

                <div className='grid grid-cols-2 gap-4'>
                  {Object.entries(interactive.states).map(([state, color]) => (
                    <div key={state} className='space-y-2'>
                      <div
                        className='w-full h-12 rounded-lg border border-default flex items-center justify-center text-label-sm font-medium transition-transform hover:scale-105 cursor-pointer'
                        style={{
                          backgroundColor: color,
                          color: state === 'disabled' ? '#9ca3af' : (
                            interactive.name === 'Primary Button' ? '#ffffff' : '#374151'
                          )
                        }}
                      >
                        {state.charAt(0).toUpperCase() + state.slice(1)}
                      </div>
                      <div className='text-center'>
                        <div className='text-label-sm text-tertiary font-mono'>{color}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Accessibility Information */}
      <Card variant='elevated' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-default pb-4'>
            <h2 className='text-heading-lg text-primary mb-2'>Accessibility & Compliance</h2>
            <p className='text-body-sm text-secondary'>
              Color combinations that meet WCAG 2.1 AA standards for contrast and readability
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Text on Backgrounds */}
            <div className='space-y-3'>
              <h3 className='text-heading-xs text-primary'>Text on Light Backgrounds</h3>
              <div className='space-y-2'>
                <div className='p-3 rounded-lg bg-neutral-50 border border-default'>
                  <div className='text-body-md text-neutral-900 font-medium'>Primary Text</div>
                  <div className='text-body-sm text-neutral-600'>Secondary Text</div>
                  <div className='text-body-sm text-neutral-500'>Tertiary Text</div>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <h3 className='text-heading-xs text-primary'>Text on Dark Backgrounds</h3>
              <div className='space-y-2'>
                <div className='p-3 rounded-lg bg-neutral-900 border border-default'>
                  <div className='text-body-md text-neutral-50 font-medium'>Primary Text</div>
                  <div className='text-body-sm text-neutral-300'>Secondary Text</div>
                  <div className='text-body-sm text-neutral-400'>Tertiary Text</div>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <h3 className='text-heading-xs text-primary'>Status Indicators</h3>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 p-2 rounded bg-success-50 border border-success-200'>
                  <div className='w-2 h-2 rounded-full bg-success-500' />
                  <span className='text-label-sm text-success-800'>System Online</span>
                </div>
                <div className='flex items-center gap-2 p-2 rounded bg-error-50 border border-error-200'>
                  <div className='w-2 h-2 rounded-full bg-error-500' />
                  <span className='text-label-sm text-error-800'>System Offline</span>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-neutral-50 p-4 rounded-lg border border-default'>
            <h4 className='text-heading-xs text-primary mb-2'>WCAG 2.1 AA Compliance</h4>
            <ul className='text-body-sm text-secondary space-y-1 list-disc list-inside'>
              <li>Minimum contrast ratio of 4.5:1 for normal text</li>
              <li>Minimum contrast ratio of 3:1 for large text (18pt+ or 14pt+ bold)</li>
              <li>Color is not used as the only means of conveying information</li>
              <li>Focus indicators have sufficient contrast and visibility</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ColorDemo;
