/**
 * Typography System Demo Component
 * Showcases the comprehensive typography hierarchy and responsive behavior
 */

import React from 'react';
import Card from '../ui/Card';
import { useTypography } from '../../lib/useTypography';

const TypographyDemo: React.FC = () => {
  const { hierarchy, getClassName } = useTypography();

  const displaySizes = ['display-2xl', 'display-xl', 'display-lg'] as const;

  const headingSizes = [
    'heading-xl',
    'heading-lg',
    'heading-md',
    'heading-sm',
    'heading-xs',
  ] as const;

  const bodySizes = [
    'body-xl',
    'body-lg',
    'body-md',
    'body-sm',
    'body-xs',
  ] as const;

  const labelSizes = ['label-lg', 'label-md', 'label-sm'] as const;

  return (
    <div className='space-y-8 p-6'>
      {/* Header */}
      <div className='text-center mb-12'>
        <h1 className='text-display-xl gradient-text mb-4'>
          Typography System
        </h1>
        <p className='text-body-lg text-gray-400 max-w-2xl mx-auto'>
          Comprehensive typography scale with semantic hierarchy, responsive
          behavior, and accessibility compliance. Built with 1.125 (major
          second) ratio for optimal visual rhythm.
        </p>
      </div>

      {/* Display Text Section */}
      <Card variant='glass' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-gray-200 pb-4'>
            <h2 className='text-heading-lg text-gray-900 mb-2'>Display Text</h2>
            <p className='text-body-sm text-gray-600'>
              For hero sections, landing pages, and marketing displays
            </p>
          </div>

          <div className='space-y-4'>
            {displaySizes.map(size => (
              <div key={size} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-label-sm text-gray-500 font-mono'>
                    {size}
                  </span>
                  <span className='text-label-sm text-gray-400'>
                    {hierarchy[size].fontSize} / {hierarchy[size].lineHeight}
                  </span>
                </div>
                <div className={getClassName(size)}>
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Headings Section */}
      <Card variant='elevated' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-gray-200 pb-4'>
            <h2 className='text-heading-lg text-gray-900 mb-2'>Headings</h2>
            <p className='text-body-sm text-gray-600'>
              For content hierarchy (H1-H6) and section titles
            </p>
          </div>

          <div className='space-y-4'>
            {headingSizes.map((size, index) => (
              <div key={size} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-label-sm text-gray-500 font-mono'>
                    {size} (H{index + 1})
                  </span>
                  <span className='text-label-sm text-gray-400'>
                    {hierarchy[size].fontSize} / {hierarchy[size].lineHeight}
                  </span>
                </div>
                <div className={getClassName(size)}>
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Body Text Section */}
      <Card variant='basic' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-gray-200 pb-4'>
            <h2 className='text-heading-lg text-gray-900 mb-2'>Body Text</h2>
            <p className='text-body-sm text-gray-600'>
              For content, descriptions, and paragraph text
            </p>
          </div>

          <div className='space-y-4'>
            {bodySizes.map(size => (
              <div key={size} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-label-sm text-gray-500 font-mono'>
                    {size}
                  </span>
                  <span className='text-label-sm text-gray-400'>
                    {hierarchy[size].fontSize} / {hierarchy[size].lineHeight}
                  </span>
                </div>
                <div className={getClassName(size)}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris.
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Labels Section */}
      <Card variant='interactive' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-gray-200 pb-4'>
            <h2 className='text-heading-lg text-gray-900 mb-2'>
              Labels & UI Text
            </h2>
            <p className='text-body-sm text-gray-600'>
              For form labels, buttons, tags, and UI elements
            </p>
          </div>

          <div className='space-y-4'>
            {labelSizes.map(size => (
              <div key={size} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-label-sm text-gray-500 font-mono'>
                    {size}
                  </span>
                  <span className='text-label-sm text-gray-400'>
                    {hierarchy[size].fontSize} / {hierarchy[size].lineHeight}
                  </span>
                </div>
                <div className={`${getClassName(size)} flex flex-wrap gap-2`}>
                  <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-md'>
                    Button Label
                  </span>
                  <span className='px-3 py-1 bg-green-100 text-green-800 rounded-md'>
                    Success Tag
                  </span>
                  <span className='px-3 py-1 bg-gray-100 text-gray-800 rounded-md'>
                    Form Label
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Responsive Typography Section */}
      <Card variant='glass' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-gray-200 pb-4'>
            <h2 className='text-heading-lg text-gray-900 mb-2'>
              Responsive Typography
            </h2>
            <p className='text-body-sm text-gray-600'>
              Typography that adapts to different screen sizes automatically
            </p>
          </div>

          <div className='space-y-6'>
            <div>
              <h3 className='text-heading-sm text-gray-900 mb-3'>
                Display Responsive
              </h3>
              <div className='text-display-responsive'>
                This text scales from mobile to desktop
              </div>
              <p className='text-body-xs text-gray-500 mt-2'>
                Mobile: heading-xl → Tablet: display-lg → Desktop: display-xl
              </p>
            </div>

            <div>
              <h3 className='text-heading-sm text-gray-900 mb-3'>
                Heading Responsive
              </h3>
              <div className='text-heading-responsive'>
                This heading adapts to screen size
              </div>
              <p className='text-body-xs text-gray-500 mt-2'>
                Mobile: heading-md → Tablet: heading-lg → Desktop: heading-xl
              </p>
            </div>

            <div>
              <h3 className='text-heading-sm text-gray-900 mb-3'>
                Body Responsive
              </h3>
              <div className='text-body-responsive'>
                This body text ensures optimal readability across all devices by
                automatically adjusting the font size based on the screen size.
              </div>
              <p className='text-body-xs text-gray-500 mt-2'>
                Mobile: body-sm → Tablet: body-md → Desktop: body-lg
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Usage Examples */}
      <Card variant='elevated' size='lg'>
        <div className='space-y-6'>
          <div className='border-b border-gray-200 pb-4'>
            <h2 className='text-heading-lg text-gray-900 mb-2'>
              Usage Examples
            </h2>
            <p className='text-body-sm text-gray-600'>
              Real-world examples of typography in dashboard components
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Metric Card Example */}
            <div className='p-4 border border-gray-200 rounded-lg bg-gray-50'>
              <h3 className='text-label-md text-gray-600 mb-1'>
                Total Revenue
              </h3>
              <div className='text-heading-xl text-gray-900 mb-1'>$847,500</div>
              <div className='text-body-sm text-green-600'>
                +12.5% from last month
              </div>
            </div>

            {/* Article Card Example */}
            <div className='p-4 border border-gray-200 rounded-lg bg-gray-50'>
              <h3 className='text-heading-sm text-gray-900 mb-2'>
                Article Title
              </h3>
              <p className='text-body-sm text-gray-600 mb-3'>
                This is a brief description of the article content that provides
                context.
              </p>
              <div className='text-label-sm text-blue-600'>Read more →</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TypographyDemo;
