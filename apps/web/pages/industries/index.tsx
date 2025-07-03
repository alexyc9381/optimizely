import { Award, BarChart3, Clock, Download, FileText, Lightbulb, Target, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { apiClient, IndustryData } from '../../src/services/apiClient';

const IndustriesPage: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('saas');
  const [industries, setIndustries] = useState<Record<string, IndustryData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data as fallback
  const mockIndustryData: Record<string, IndustryData> = {
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
        { name: 'Pricing Page CTA Button', improvement: '+18.4%', confidence: '99%' },
        { name: 'Feature Comparison Layout', improvement: '+15.2%', confidence: '97%' },
        { name: 'Free Trial Duration', improvement: '+12.8%', confidence: '95%' },
      ],
    },
    ecommerce: {
      name: 'E-commerce',
      color: 'green',
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
        { name: 'Product Image Gallery', improvement: '+22.1%', confidence: '98%' },
        { name: 'Checkout Process Simplification', improvement: '+19.7%', confidence: '96%' },
        { name: 'Review Display Format', improvement: '+16.3%', confidence: '94%' },
      ],
    },
    healthcare: {
      name: 'Healthcare',
      color: 'blue',
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
        { name: 'Doctor Credentials Display', improvement: '+15.8%', confidence: '97%' },
        { name: 'Patient Testimonial Layout', improvement: '+13.4%', confidence: '95%' },
        { name: 'Appointment Booking Flow', improvement: '+11.9%', confidence: '93%' },
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
        { name: 'Security Badge Placement', improvement: '+25.3%', confidence: '99%' },
        { name: 'Fee Transparency Layout', improvement: '+21.7%', confidence: '98%' },
        { name: 'Mobile Application Flow', improvement: '+18.5%', confidence: '96%' },
      ],
    },
    manufacturing: {
      name: 'Manufacturing',
      color: 'gray',
      metrics: {
        conversionRate: 1.8,
        avgTestDuration: 25,
        topPerformingElement: 'Quality Certifications',
        improvement: '+12.4%',
      },
      insights: [
        'Quality certifications increase lead generation by 34%',
        'Case studies improve B2B conversion rates by 28%',
        'Technical specifications boost qualified leads by 31%',
        'Video demonstrations increase engagement by 42%',
      ],
      topTests: [
        { name: 'Quality Certification Display', improvement: '+12.4%', confidence: '94%' },
        { name: 'Case Study Layout', improvement: '+10.9%', confidence: '92%' },
        { name: 'Technical Spec Format', improvement: '+8.7%', confidence: '89%' },
      ],
    },
    'college-consulting': {
      name: 'College Consulting',
      color: 'purple',
      metrics: {
        conversionRate: 5.2,
        avgTestDuration: 12,
        topPerformingElement: 'Success Stories',
        improvement: '+28.7%',
      },
      insights: [
        'Student success stories increase inquiries by 48%',
        'College acceptance rates boost consultation bookings by 35%',
        'Parent testimonials improve trust and conversions by 41%',
        'Free assessment offers drive 52% more leads',
      ],
      topTests: [
        { name: 'Success Story Showcase', improvement: '+28.7%', confidence: '98%' },
        { name: 'Free Assessment CTA', improvement: '+24.3%', confidence: '96%' },
        { name: 'Parent Testimonial Layout', improvement: '+19.8%', confidence: '94%' },
      ],
    },
  };

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getAllIndustries();

        // Convert array to object for easier lookup
        const industriesObj = data.reduce((acc, industry) => {
          const key = industry.name.toLowerCase().replace(/\s+/g, '-');
          acc[key] = industry;
          return acc;
        }, {} as Record<string, IndustryData>);

        setIndustries(industriesObj);
      } catch (err) {
        console.warn('Failed to fetch industries from API, using mock data:', err);
        setError('Unable to connect to backend. Showing demo data.');
        setIndustries(mockIndustryData);
      } finally {
        setLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  const currentIndustry = industries[selectedIndustry] || mockIndustryData[selectedIndustry];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleExportInsights = async () => {
    try {
      // This would normally call an API to generate and download a report
      console.log('Exporting insights for', currentIndustry.name);
      alert(`Exporting insights for ${currentIndustry.name}... (This would download a PDF report)`);
    } catch (err) {
      console.error('Failed to export insights:', err);
      alert('Failed to export insights. Please try again.');
    }
  };

  const handleGenerateReport = async () => {
    try {
      // This would normally call an API to generate a comprehensive report
      console.log('Generating report for', currentIndustry.name);
      alert(`Generating comprehensive report for ${currentIndustry.name}... (This would create a detailed analysis)`);
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report. Please try again.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title='Industry Insights - Universal AI Platform'>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Industry Insights - Universal AI Platform'>
      <div className='space-y-6'>
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Industry Insights</h1>
            <p className='text-sm text-gray-500 mt-1'>
              AI-powered insights and best practices tailored to your industry
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            <button
              onClick={handleExportInsights}
              className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
            >
              <Download className="h-4 w-4" />
              <span>Export Insights</span>
            </button>
            <button
              onClick={handleGenerateReport}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors'
            >
              <FileText className="h-4 w-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Industry Selector */}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          {(Object.entries(industries).length > 0 ? Object.entries(industries) : Object.entries(mockIndustryData)).map(([key, industry]) => (
            <button
              key={key}
              onClick={() => setSelectedIndustry(key)}
              className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedIndustry === key
                  ? getColorClasses(industry.color)
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className='text-center'>
                <h3 className='font-semibold text-lg'>{industry.name}</h3>
                <p className='text-sm opacity-75 mt-1'>
                  CR: {industry.metrics.conversionRate}% | {industry.metrics.avgTestDuration}d avg
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Industry Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Conversion Rate</p>
                <p className='text-2xl font-bold text-gray-900'>{currentIndustry?.metrics.conversionRate}%</p>
                <p className='text-xs text-green-600 mt-1'>Industry average</p>
              </div>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Target className='w-4 h-4 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Avg Test Duration</p>
                <p className='text-2xl font-bold text-gray-900'>{currentIndustry?.metrics.avgTestDuration}</p>
                <p className='text-xs text-blue-600 mt-1'>days to significance</p>
              </div>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <Clock className='w-4 h-4 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Top Element</p>
                <p className='text-lg font-bold text-gray-900'>{currentIndustry?.metrics.topPerformingElement}</p>
                <p className='text-xs text-purple-600 mt-1'>highest impact</p>
              </div>
              <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                <Award className='w-4 h-4 text-purple-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Best Improvement</p>
                <p className='text-2xl font-bold text-gray-900'>{currentIndustry?.metrics.improvement}</p>
                <p className='text-xs text-green-600 mt-1'>maximum uplift</p>
              </div>
              <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-4 h-4 text-orange-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Industry Insights */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Key Insights */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center mb-4'>
              <Lightbulb className='w-5 h-5 text-yellow-600 mr-2' />
              <h3 className='text-lg font-semibold text-gray-900'>Key Insights</h3>
            </div>
            <div className='space-y-3'>
              {currentIndustry?.insights.map((insight, index) => (
                <div key={index} className='flex items-start space-x-3'>
                  <div className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5'>
                    {index + 1}
                  </div>
                  <p className='text-gray-700 text-sm flex-1'>{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Tests */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center mb-4'>
              <BarChart3 className='w-5 h-5 text-green-600 mr-2' />
              <h3 className='text-lg font-semibold text-gray-900'>Top Performing Tests</h3>
            </div>
            <div className='space-y-4'>
              {currentIndustry?.topTests.map((test, index) => (
                <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'>
                  <div className='flex-1'>
                    <p className='font-medium text-gray-900 text-sm'>{test.name}</p>
                    <p className='text-xs text-gray-500'>Confidence: {test.confidence}</p>
                  </div>
                  <div className='text-right'>
                    <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                      {test.improvement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industry-Specific Recommendations */}
        <div className='bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Recommended A/B Tests for {currentIndustry?.name}
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='bg-white rounded-lg p-4 border border-blue-100'>
              <h4 className='font-medium text-gray-900 mb-2'>High Priority</h4>
              <p className='text-sm text-gray-600'>Test pricing page elements and CTAs for immediate impact</p>
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2'>
                High Impact
              </span>
            </div>
            <div className='bg-white rounded-lg p-4 border border-blue-100'>
              <h4 className='font-medium text-gray-900 mb-2'>Medium Priority</h4>
              <p className='text-sm text-gray-600'>Optimize navigation and user flow for better engagement</p>
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2'>
                Medium Impact
              </span>
            </div>
            <div className='bg-white rounded-lg p-4 border border-blue-100'>
              <h4 className='font-medium text-gray-900 mb-2'>Low Priority</h4>
              <p className='text-sm text-gray-600'>Test visual elements and design variations</p>
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2'>
                Low Impact
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IndustriesPage;
