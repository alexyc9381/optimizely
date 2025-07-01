import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const IndustriesPage: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<
    'saas' | 'ecommerce' | 'healthcare' | 'fintech'
  >('saas');

  const industryData = {
    saas: {
      name: 'SaaS',
      color: 'blue',
      metrics: {
        conversionRate: 3.2,
        avgTestDuration: 14,
        topPerformingElement: 'Pricing CTAs',
        improvement: '+18.4%',
      },
      insights: [
        'Free trial lengths of 14 days show highest conversion rates',
        'Pricing transparency increases conversions by 23%',
        'Feature comparison tables drive 31% more upgrades',
        'Social proof elements boost sign-ups by 27%',
      ],
      topTests: [
        {
          name: 'Pricing Page CTA Button',
          improvement: '+18.4%',
          confidence: '99%',
        },
        {
          name: 'Feature Comparison Layout',
          improvement: '+15.2%',
          confidence: '97%',
        },
        {
          name: 'Free Trial Duration',
          improvement: '+12.8%',
          confidence: '95%',
        },
      ],
    },
    ecommerce: {
      name: 'E-commerce',
      color: 'purple',
      metrics: {
        conversionRate: 2.8,
        avgTestDuration: 10,
        topPerformingElement: 'Product Images',
        improvement: '+22.1%',
      },
      insights: [
        'Multiple product images increase conversions by 35%',
        'Customer reviews boost purchase confidence by 41%',
        'Simplified checkout reduces abandonment by 28%',
        'Urgency indicators drive 19% more immediate purchases',
      ],
      topTests: [
        {
          name: 'Product Image Gallery',
          improvement: '+22.1%',
          confidence: '98%',
        },
        {
          name: 'Checkout Process Simplification',
          improvement: '+19.7%',
          confidence: '96%',
        },
        {
          name: 'Review Display Format',
          improvement: '+16.3%',
          confidence: '94%',
        },
      ],
    },
    healthcare: {
      name: 'Healthcare',
      color: 'green',
      metrics: {
        conversionRate: 4.1,
        avgTestDuration: 21,
        topPerformingElement: 'Trust Signals',
        improvement: '+15.8%',
      },
      insights: [
        'Professional credentials increase trust by 45%',
        'Patient testimonials boost appointment bookings by 38%',
        'Clear privacy policies improve form completions by 32%',
        'Telehealth options increase engagement by 29%',
      ],
      topTests: [
        {
          name: 'Doctor Credentials Display',
          improvement: '+15.8%',
          confidence: '97%',
        },
        {
          name: 'Patient Testimonial Layout',
          improvement: '+13.4%',
          confidence: '95%',
        },
        {
          name: 'Appointment Booking Flow',
          improvement: '+11.9%',
          confidence: '93%',
        },
      ],
    },
    fintech: {
      name: 'FinTech',
      color: 'orange',
      metrics: {
        conversionRate: 2.1,
        avgTestDuration: 18,
        topPerformingElement: 'Security Features',
        improvement: '+25.3%',
      },
      insights: [
        'Security badges increase application completions by 52%',
        'Transparent fee structures boost conversions by 34%',
        'Mobile-first design improves engagement by 41%',
        'Regulatory compliance messaging builds trust by 38%',
      ],
      topTests: [
        {
          name: 'Security Badge Placement',
          improvement: '+25.3%',
          confidence: '99%',
        },
        {
          name: 'Fee Transparency Layout',
          improvement: '+21.7%',
          confidence: '98%',
        },
        {
          name: 'Mobile Application Flow',
          improvement: '+18.5%',
          confidence: '96%',
        },
      ],
    },
  };

  const currentIndustry = industryData[selectedIndustry];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <DashboardLayout title='Industry Insights - Universal AI Platform'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Industry Insights
            </h1>
            <p className='text-sm text-gray-500 mt-1'>
              AI-powered insights and best practices tailored to your industry
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            <button className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium'>
              Export Insights
            </button>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
              Generate Report
            </button>
          </div>
        </div>

        {/* Industry Selector */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {Object.entries(industryData).map(([key, industry]) => (
            <button
              key={key}
              onClick={() =>
                setSelectedIndustry(
                  key as 'saas' | 'ecommerce' | 'healthcare' | 'fintech'
                )
              }
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedIndustry === key
                  ? getColorClasses(industry.color)
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className='text-center'>
                <h3 className='font-semibold text-lg'>{industry.name}</h3>
                <p className='text-sm opacity-75 mt-1'>
                  CR: {industry.metrics.conversionRate}% |{' '}
                  {industry.metrics.avgTestDuration}d avg
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Industry Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Conversion Rate
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {currentIndustry.metrics.conversionRate}%
                </p>
                <p className='text-xs text-green-600 mt-1'>Industry average</p>
              </div>
              <div
                className={`w-8 h-8 ${currentIndustry.color === 'blue' ? 'bg-blue-100' : currentIndustry.color === 'purple' ? 'bg-purple-100' : currentIndustry.color === 'green' ? 'bg-green-100' : 'bg-orange-100'} rounded-lg flex items-center justify-center`}
              >
                <svg
                  className={`w-4 h-4 ${currentIndustry.color === 'blue' ? 'text-blue-600' : currentIndustry.color === 'purple' ? 'text-purple-600' : currentIndustry.color === 'green' ? 'text-green-600' : 'text-orange-600'}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Avg Test Duration
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {currentIndustry.metrics.avgTestDuration}d
                </p>
                <p className='text-xs text-blue-600 mt-1'>Optimal range</p>
              </div>
              <div className='w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-indigo-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Top Element</p>
                <p className='text-xl font-bold text-gray-900'>
                  {currentIndustry.metrics.topPerformingElement}
                </p>
                <p className='text-xs text-gray-500 mt-1'>Best performer</p>
              </div>
              <div className='w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-yellow-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Best Improvement
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {currentIndustry.metrics.improvement}
                </p>
                <p className='text-xs text-green-600 mt-1'>Recent tests</p>
              </div>
              <div className='w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-emerald-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Insights and Tests */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Key Insights */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-6'>
              Key Insights for {currentIndustry.name}
            </h3>
            <div className='space-y-4'>
              {currentIndustry.insights.map((insight, index) => (
                <div key={index} className='flex items-start'>
                  <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5'>
                    <svg
                      className='w-3 h-3 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <p className='text-gray-700 text-sm'>{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Tests */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-6'>
              Top Performing Tests
            </h3>
            <div className='space-y-4'>
              {currentIndustry.topTests.map((test, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                >
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>{test.name}</h4>
                    <p className='text-sm text-gray-500'>
                      Confidence: {test.confidence}
                    </p>
                  </div>
                  <div className='text-right'>
                    <span className='text-green-600 font-semibold'>
                      {test.improvement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industry Benchmarks */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-6'>
            Industry Benchmarks
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <svg
                  className='w-8 h-8 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                  />
                </svg>
              </div>
              <h4 className='font-medium text-gray-900'>Visitor Engagement</h4>
              <p className='text-2xl font-bold text-blue-600 mt-1'>78%</p>
              <p className='text-sm text-gray-500'>
                Average for {currentIndustry.name}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <svg
                  className='w-8 h-8 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                  />
                </svg>
              </div>
              <h4 className='font-medium text-gray-900'>Revenue Impact</h4>
              <p className='text-2xl font-bold text-green-600 mt-1'>+23%</p>
              <p className='text-sm text-gray-500'>Improvement potential</p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <svg
                  className='w-8 h-8 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
                  />
                </svg>
              </div>
              <h4 className='font-medium text-gray-900'>Test Success Rate</h4>
              <p className='text-2xl font-bold text-purple-600 mt-1'>67%</p>
              <p className='text-sm text-gray-500'>Significant results</p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <svg
                  className='w-8 h-8 text-orange-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <h4 className='font-medium text-gray-900'>
                Time to Significance
              </h4>
              <p className='text-2xl font-bold text-orange-600 mt-1'>
                {currentIndustry.metrics.avgTestDuration}d
              </p>
              <p className='text-sm text-gray-500'>Average duration</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IndustriesPage;
