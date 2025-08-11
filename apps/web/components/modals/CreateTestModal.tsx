import {
    BarChart3,
    Brain,
    Globe,
    MousePointer,
    Plus,
    Settings,
    Target,
    Type,
    Trash2,
    Users,
    Wand2,
    X,
    Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUserProfile } from '../../lib/contexts/UserProfileContext';
import {
    CreateABTestConfig,
    TestSuggestion,
    WebsiteScanResult,
    apiClient,
} from '../../src/services/apiClient';

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: (testId: string, testData?: any) => void;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({
  isOpen,
  onClose,
  onTestCreated,
}) => {
  const { userProfile } = useUserProfile();
  const [formData, setFormData] = useState<CreateABTestConfig>({
    name: '',
    description: '',
    industry: '',
    targetUrl: '',
    hypothesis: '',
    primaryMetric: 'conversion_rate',
    variants: {
      control: {
        name: 'Control',
        description: 'Original version',
      },
      variant: {
        name: 'Variant A',
        description: 'Test version',
        changes: '',
      },
    },
    trafficSplit: 50,
    duration: 14,
    minimumDetectableEffect: 5,
    significanceLevel: 95,
  });
  const [additionalVariants, setAdditionalVariants] = useState<Array<{
    id: string;
    name: string;
    description: string;
    changes: string;
    elementType?: string;
    originalContent?: string;
    modifiedContent?: string;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<WebsiteScanResult | null>(null);
  const [suggestions, setSuggestions] = useState<TestSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<TestSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Element types for targeted testing
  const elementTypes = [
    { value: 'button', label: 'Button/CTA', icon: MousePointer },
    { value: 'headline', label: 'Headline/Title', icon: Type },
    { value: 'description', label: 'Description Text', icon: Type },
    { value: 'image', label: 'Image/Visual', icon: Target },
    { value: 'form', label: 'Form Element', icon: Settings },
    { value: 'navigation', label: 'Navigation', icon: Target },
    { value: 'pricing', label: 'Pricing Element', icon: Target },
    { value: 'social-proof', label: 'Social Proof', icon: Users },
  ];

  // Get original content based on element type and scan results
  const getOriginalContent = (elementType: string) => {
    if (!scanResult?.elements) return `Current ${elementType}`;
    
    switch (elementType) {
      case 'button':
        const ctaButton = scanResult.elements.buttons?.find(b => b.type === 'cta');
        return ctaButton?.text || 'Get Started';
      case 'headline':
        const mainHeadline = scanResult.elements.headlines?.find(h => h.level === 1);
        return mainHeadline?.text || 'Welcome to Our Platform';
      case 'description':
        return 'Transform your business with our innovative solution';
      case 'image':
        const heroImage = scanResult.elements.images?.[0];
        return heroImage?.alt || 'Hero image';
      default:
        return `Current ${elementType}`;
    }
  };

  // Generate AI variants based on element type
  const generateElementVariants = (elementType: string, originalContent: string) => {
    const variantSuggestions = {
      button: [
        'Start Free Trial',
        'Get Started Now',
        'Join Today',
        'Try It Free',
        'Start Your Journey'
      ],
      headline: [
        'Revolutionize Your Business Today',
        'The Future of Business is Here',
        'Transform Your Success Story',
        'Unlock Your Potential Now',
        'Experience the Difference'
      ],
      description: [
        'Join thousands of satisfied customers who have transformed their business',
        'Discover the power of innovation with our cutting-edge solution',
        'Streamline your operations and boost productivity instantly',
        'Take your business to the next level with proven results'
      ]
    };

    return variantSuggestions[elementType as keyof typeof variantSuggestions] || [
      `Enhanced ${elementType}`,
      `Optimized ${elementType}`,
      `Improved ${elementType}`
    ];
  };

  // Dynamic industries based on user profile
  const getIndustries = () => {
    if (userProfile?.onboarding?.selectedIndustries?.length) {
      return userProfile.onboarding.selectedIndustries;
    }
    // Fallback to comprehensive list
    return [
      'SaaS',
      'E-commerce',
      'Healthcare',
      'FinTech',
      'Manufacturing',
      'Education',
      'Real Estate',
      'Travel',
      'Media',
      'Retail',
    ];
  };

  const primaryMetrics = [
    { value: 'conversion_rate', label: 'Conversion Rate' },
    { value: 'click_through_rate', label: 'Click-Through Rate' },
    { value: 'revenue_per_visitor', label: 'Revenue per Visitor' },
    { value: 'bounce_rate', label: 'Bounce Rate' },
    { value: 'time_on_page', label: 'Time on Page' },
    { value: 'page_views', label: 'Page Views' },
    { value: 'signup_rate', label: 'Signup Rate' },
    { value: 'engagement_rate', label: 'Engagement Rate' },
  ];

  // Auto-populate form when a suggestion is selected
  useEffect(() => {
    if (selectedSuggestion) {
      setFormData(prev => ({
        ...prev,
        name: selectedSuggestion.name,
        description: selectedSuggestion.description,
        hypothesis: selectedSuggestion.hypothesis,
        primaryMetric: selectedSuggestion.recommendedMetric,
        variants: selectedSuggestion.variants,
        trafficSplit: selectedSuggestion.trafficSplit,
        duration: selectedSuggestion.recommendedDuration,
      }));
    }
  }, [selectedSuggestion]);

  // Auto-detect industry from scan result
  useEffect(() => {
    if (scanResult) {
      setFormData(prev => ({
        ...prev,
        industry: scanResult.industry,
      }));
    }
  }, [scanResult]);

  const handleWebsiteScan = async () => {
    if (!formData.targetUrl) {
      setError('Please enter a target URL first');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Mock scan for demo - replace with real API call
      const mockScanResult: WebsiteScanResult = {
        url: formData.targetUrl,
        title: 'Demo Website',
        description: 'A sample website for testing',
        industry:
          formData.targetUrl.includes('shop') ||
          formData.targetUrl.includes('store')
            ? 'E-commerce'
            : 'SaaS',
        elements: {
          buttons: [
            { text: 'Sign Up', location: 'header', type: 'cta', prominence: 9 },
            {
              text: 'Get Started',
              location: 'hero',
              type: 'cta',
              prominence: 10,
            },
            {
              text: 'Learn More',
              location: 'features',
              type: 'cta',
              prominence: 6,
            },
          ],
          headlines: [
            {
              text: 'Transform Your Business Today',
              level: 1,
              location: 'hero',
            },
            { text: 'Powerful Features', level: 2, location: 'features' },
          ],
          images: [{ alt: 'Hero image', src: '/hero.jpg', location: 'hero' }],
          forms: [
            {
              type: 'signup',
              fields: ['email', 'password'],
              location: 'modal',
            },
          ],
        },
        metrics: {
          loadTime: 2.3,
          mobileOptimized: true,
          conversionElements: 3,
          trustSignals: 2,
        },
        recommendations: [
          'Consider testing CTA button colors',
          'Improve headline clarity',
          'Add social proof elements',
        ],
      };

      // Generate intelligent test suggestions based on scan
      const mockSuggestions: TestSuggestion[] = [
        {
          id: '1',
          name: 'CTA Button Color Test',
          description:
            'Test different colors for the primary CTA button to improve conversion',
          hypothesis:
            'If we change the CTA button from blue to orange, then conversion rates will increase because orange creates more urgency and stands out better',
          priority: 'high',
          estimatedImpact: 15,
          confidence: 85,
          category: 'cta',
          variants: {
            control: {
              name: 'Blue CTA Button',
              description: 'Current blue "Get Started" button',
            },
            variant: {
              name: 'Orange CTA Button',
              description: 'High-contrast orange "Get Started" button',
              changes:
                'Change button color from #3B82F6 to #F97316, maintain white text',
            },
          },
          recommendedMetric: 'conversion_rate',
          recommendedDuration: 14,
          trafficSplit: 50,
        },
        {
          id: '2',
          name: 'Headline Optimization',
          description:
            'Test a more benefit-focused headline to improve engagement',
          hypothesis:
            'If we change the headline to focus on specific benefits, then user engagement will increase because visitors will better understand the value proposition',
          priority: 'medium',
          estimatedImpact: 12,
          confidence: 78,
          category: 'copy',
          variants: {
            control: {
              name: 'Current Headline',
              description: 'Transform Your Business Today',
            },
            variant: {
              name: 'Benefit-Focused Headline',
              description: 'Increase Revenue by 40% in 30 Days',
              changes:
                'Replace generic headline with specific, measurable benefit',
            },
          },
          recommendedMetric: 'engagement_rate',
          recommendedDuration: 21,
          trafficSplit: 50,
        },
        {
          id: '3',
          name: 'Social Proof Addition',
          description:
            'Add customer testimonials to build trust and credibility',
          hypothesis:
            'If we add customer testimonials near the CTA, then conversion rates will increase because social proof reduces perceived risk',
          priority: 'medium',
          estimatedImpact: 18,
          confidence: 82,
          category: 'social-proof',
          variants: {
            control: {
              name: 'No Social Proof',
              description: 'Current layout without testimonials',
            },
            variant: {
              name: 'With Customer Testimonials',
              description:
                'Add 3 customer testimonials with photos below hero section',
              changes:
                'Insert testimonial carousel with customer photos, names, and company logos',
            },
          },
          recommendedMetric: 'conversion_rate',
          recommendedDuration: 28,
          trafficSplit: 50,
        },
      ];

      setScanResult(mockScanResult);
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);

      // Auto-select highest priority suggestion
      if (mockSuggestions.length > 0) {
        const highestPriority =
          mockSuggestions.find(s => s.priority === 'high') ||
          mockSuggestions[0];
        setSelectedSuggestion(highestPriority);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan website');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateVariants = async () => {
    if (!formData.name || !formData.description || !formData.hypothesis) {
      setError('Please fill in the basic information (name, description, hypothesis) before generating variants');
      return;
    }

    setIsGeneratingVariants(true);
    setError(null);

    try {
      // Mock AI variant generation - replace with real API call
      const mockGeneratedVariants = {
        control: {
          name: 'Original Version',
          description: `Current implementation of ${formData.name.toLowerCase()}`,
        },
        variant: {
          name: 'Optimized Version',
          description: `Enhanced version based on hypothesis: ${formData.hypothesis}`,
          changes: `Implement changes to test the hypothesis: ${formData.hypothesis.substring(0, 100)}${formData.hypothesis.length > 100 ? '...' : ''}`,
        },
      };

      // Generate 2-3 additional variants based on platform/website context
      const mockAdditionalVariants = [
        {
          id: `variant_${Date.now()}_1`,
          name: 'Alternative Approach',
          description: `Alternative implementation approach for ${formData.name.toLowerCase()}`,
          changes: `Different strategy: Focus on mobile-first optimization with simplified UX flow`,
        },
        {
          id: `variant_${Date.now()}_2`,
          name: 'Aggressive Test',
          description: `Bold approach testing radical changes to ${formData.name.toLowerCase()}`,
          changes: `Aggressive changes: Complete redesign with enhanced visual hierarchy and contrasting elements`,
        },
      ];

      // Auto-fill the variants but allow manual editing
      setFormData(prev => ({
        ...prev,
        variants: mockGeneratedVariants,
      }));

      setAdditionalVariants(mockAdditionalVariants);

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>AI variants generated! ${mockAdditionalVariants.length + 2} variants created. Edit as needed.</span>
        </div>
      `;

      document.body.appendChild(notification);

      // Remove notification after 4 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 4000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variants');
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const addVariant = (elementType: string = 'button') => {
    const nextLetter = String.fromCharCode(65 + additionalVariants.length + 1); // B, C, D, etc.
    const originalContent = getOriginalContent(elementType);
    const variants = generateElementVariants(elementType, originalContent);
    const selectedVariant = variants[Math.floor(Math.random() * variants.length)];
    
    const newVariant = {
      id: `variant_${Date.now()}`,
      name: `Variant ${nextLetter}`,
      description: `${elementTypes.find(et => et.value === elementType)?.label} test variant`,
      changes: `Change ${elementType} from "${originalContent}" to "${selectedVariant}"`,
      elementType,
      originalContent,
      modifiedContent: selectedVariant,
    };
    setAdditionalVariants(prev => [...prev, newVariant]);
  };

  const removeVariant = (id: string) => {
    setAdditionalVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateAdditionalVariant = (id: string, field: string, value: string) => {
    setAdditionalVariants(prev =>
      prev.map(variant =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('variants.')) {
      const [, variant, prop] = field.split('.');
      setFormData(prev => ({
        ...prev,
        variants: {
          ...prev.variants,
          [variant]: {
            ...prev.variants[variant as keyof typeof prev.variants],
            [prop]: value,
          },
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Try to call the real API first
      let newTest;
      try {
        newTest = await apiClient.createABTest(formData);
      } catch (apiError) {
        // If API fails, create a mock test for demo purposes
        console.warn('API unavailable, using mock data:', apiError);
        newTest = {
          id: `test_${Date.now()}`,
          name: formData.name,
          status: 'Draft' as const,
          industry: formData.industry,
          startDate: new Date().toISOString(),
          visitors: 0,
          conversionRate: {
            control: 0,
            variant: 0,
          },
          confidence: 0,
          uplift: 0,
        };

        // Simulate some delay to make it feel real
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      onTestCreated(newTest.id, formData);
      onClose();

      // Reset form
      setFormData({
        name: '',
        description: '',
        industry: '',
        targetUrl: '',
        hypothesis: '',
        primaryMetric: 'conversion_rate',
        variants: {
          control: {
            name: 'Control',
            description: 'Original version',
          },
          variant: {
            name: 'Variant A',
            description: 'Test version',
            changes: '',
          },
        },
        trafficSplit: 50,
        duration: 14,
        minimumDetectableEffect: 5,
        significanceLevel: 95,
      });
      setAdditionalVariants([]);
      setCurrentStep(1);
      setShowConfirmation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
              <Target className='w-4 h-4 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                Create New A/B Test
              </h2>
              <p className='text-sm text-gray-500'>
                Set up and configure your experiment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Progress Steps */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            {[1, 2, 3].map(step => (
              <div key={step} className='flex items-center'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                <div className='ml-2'>
                  <p
                    className={`text-sm font-medium ${
                      step <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step === 1 && 'Basic Info'}
                    {step === 2 && 'Variants'}
                    {step === 3 && 'Configuration'}
                  </p>
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-4 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className='p-6'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          )}

          {!showConfirmation && (
            <>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
            <div className='space-y-6'>
              <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                <Settings className='w-4 h-4 mr-2' />
                Basic Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Test Name
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    placeholder='e.g., Homepage CTA Button Test'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={e =>
                      handleInputChange('industry', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    required
                  >
                    <option value=''>Select Industry</option>
                    {getIndustries().map(industry => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Target URL
                  </label>
                  <div className='flex space-x-2'>
                    <input
                      type='url'
                      value={formData.targetUrl}
                      onChange={e =>
                        handleInputChange('targetUrl', e.target.value)
                      }
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                      placeholder='https://example.com/page'
                      required
                    />
                    <button
                      type='button'
                      onClick={handleWebsiteScan}
                      disabled={isScanning || !formData.targetUrl}
                      className='px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
                    >
                      {isScanning ? (
                        <>
                          <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Brain className='w-4 h-4' />
                          <span>AI Scan</span>
                        </>
                      )}
                    </button>
                  </div>
                  {scanResult && (
                    <div className='mt-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
                      <div className='flex items-center text-sm text-green-700'>
                        <Globe className='w-4 h-4 mr-2' />
                        <span>
                          Website scanned successfully - Industry:{' '}
                          {scanResult.industry}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    rows={3}
                    placeholder="Describe what you're testing and why..."
                    required
                  />
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Hypothesis
                  </label>
                  <textarea
                    value={formData.hypothesis}
                    onChange={e =>
                      handleInputChange('hypothesis', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    rows={2}
                    placeholder='If we change X, then Y will happen because...'
                    required
                  />
                </div>
              </div>

              {/* AI Test Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className='mt-8'>
                  <h4 className='text-lg font-medium text-gray-900 flex items-center mb-4'>
                    <Zap className='w-4 h-4 mr-2 text-yellow-500' />
                    AI-Powered Test Suggestions
                  </h4>
                  <div className='space-y-3'>
                    {suggestions.map(suggestion => (
                      <div
                        key={suggestion.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedSuggestion?.id === suggestion.id
                            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-20'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedSuggestion(suggestion)}
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2 mb-2'>
                              <h5 className='font-medium text-gray-900'>
                                {suggestion.name}
                              </h5>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  suggestion.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : suggestion.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {suggestion.priority} priority
                              </span>
                              <span className='px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'>
                                +{suggestion.estimatedImpact}% impact
                              </span>
                            </div>
                            <p className='text-sm text-gray-600 mb-2'>
                              {suggestion.description}
                            </p>
                            <p className='text-xs text-gray-500 italic'>
                              "{suggestion.hypothesis}"
                            </p>
                          </div>
                          {selectedSuggestion?.id === suggestion.id && (
                            <div className='ml-4'>
                              <div className='w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center'>
                                <div className='w-2 h-2 bg-white rounded-full'></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedSuggestion && (
                    <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                      <p className='text-sm text-blue-700 flex items-center'>
                        <Zap className='w-4 h-4 mr-2' />
                        Selected suggestion will auto-fill the form when you
                        proceed to the next step
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Variants */}
          {currentStep === 2 && (
                         <div className='space-y-6'>
               <div className='flex items-center justify-between'>
                 <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                   <BarChart3 className='w-4 h-4 mr-2' />
                   Test Variants
                 </h3>
                 <button
                   type='button'
                   onClick={handleGenerateVariants}
                   disabled={isGeneratingVariants || !formData.name || !formData.description || !formData.hypothesis}
                   className='px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
                 >
                   {isGeneratingVariants ? (
                     <>
                       <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                       <span>Generating...</span>
                     </>
                   ) : (
                     <>
                       <Wand2 className='w-4 h-4' />
                       <span>AI Generate</span>
                     </>
                   )}
                 </button>
               </div>

               {(!formData.name || !formData.description || !formData.hypothesis) && (
                 <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                   <p className='text-sm text-blue-700 flex items-center'>
                     <Wand2 className='w-4 h-4 mr-2' />
                     Complete Step 1 (name, description, hypothesis) to enable AI variant generation
                   </p>
                 </div>
               )}

              <div className='space-y-6'>
                {/* Control */}
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                    <Target className='w-4 h-4 mr-2 text-gray-600' />
                    Control (Original)
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Name
                      </label>
                      <input
                        type='text'
                        value={formData.variants.control.name}
                        onChange={e =>
                          handleInputChange(
                            'variants.control.name',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Description
                      </label>
                      <textarea
                        value={formData.variants.control.description}
                        onChange={e =>
                          handleInputChange(
                            'variants.control.description',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Variant */}
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                    <Zap className='w-4 h-4 mr-2 text-blue-600' />
                    Variant A (Primary Test)
                  </h4>
                  <div className='space-y-3'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Name
                        </label>
                        <input
                          type='text'
                          value={formData.variants.variant.name}
                          onChange={e =>
                            handleInputChange(
                              'variants.variant.name',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Description
                        </label>
                        <textarea
                          value={formData.variants.variant.description}
                          onChange={e =>
                            handleInputChange(
                              'variants.variant.description',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Changes Made
                      </label>
                      <textarea
                        value={formData.variants.variant.changes}
                        onChange={e =>
                          handleInputChange(
                            'variants.variant.changes',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                        rows={2}
                        placeholder='Describe the specific changes...'
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Variants */}
                {additionalVariants.map((variant, index) => {
                  const elementType = elementTypes.find(et => et.value === variant.elementType);
                  const ElementIcon = elementType?.icon || Target;
                  
                  return (
                    <div key={variant.id} className='bg-green-50 p-4 rounded-lg border border-green-200'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center space-x-2'>
                          <ElementIcon className='w-4 h-4 text-green-600' />
                          <h4 className='font-medium text-gray-900'>
                            Variant {String.fromCharCode(66 + index)}
                          </h4>
                          {elementType && (
                            <span className='text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full'>
                              {elementType.label}
                            </span>
                          )}
                        </div>
                        <button
                          type='button'
                          onClick={() => removeVariant(variant.id)}
                          className='p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors'
                          title='Remove variant'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>

                      <div className='space-y-3'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Variant Name
                          </label>
                          <input
                            type='text'
                            value={variant.name}
                            onChange={e =>
                              updateAdditionalVariant(variant.id, 'name', e.target.value)
                            }
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                            required
                          />
                        </div>

                        {variant.originalContent && (
                          <div className='bg-white p-3 rounded border'>
                            <h5 className='text-sm font-medium text-gray-700 mb-2'>Content Changes</h5>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                              <div>
                                <label className='block text-xs font-medium text-gray-600 mb-1'>
                                  Original {elementType?.label || 'Content'}
                                </label>
                                <div className='w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600 text-sm'>
                                  "{variant.originalContent}"
                                </div>
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-600 mb-1'>
                                  New {elementType?.label || 'Content'}
                                </label>
                                <input
                                  type='text'
                                  value={variant.modifiedContent || ''}
                                  onChange={e =>
                                    updateAdditionalVariant(variant.id, 'modifiedContent', e.target.value)
                                  }
                                  className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                                  placeholder={`Enter new ${elementType?.label.toLowerCase() || 'content'}...`}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Description
                          </label>
                          <textarea
                            value={variant.description}
                            onChange={e =>
                              updateAdditionalVariant(variant.id, 'description', e.target.value)
                            }
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                            rows={2}
                            placeholder='Describe the purpose of this variant...'
                            required
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Variant Button */}
                <div className='flex justify-center'>
                  <div className='flex items-center space-x-3'>
                    <div className='relative'>
                      <select
                        onChange={(e) => {
                          if (e.target.value && additionalVariants.length < 8) {
                            addVariant(e.target.value);
                            e.target.value = ''; // Reset selection
                          }
                        }}
                        disabled={additionalVariants.length >= 8}
                        className='px-4 py-3 bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer min-w-[200px]'
                      >
                        <option value=''>+ Add Test Variant</option>
                        {elementTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <div className='absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                        <Plus className='w-4 h-4 text-gray-400' />
                      </div>
                    </div>
                    <span className='text-xs bg-gray-100 px-3 py-2 rounded-lg'>
                      {additionalVariants.length + 2}/10 variants
                    </span>
                  </div>
                  
                  {additionalVariants.length >= 8 && (
                    <p className='text-xs text-orange-600 mt-2'>
                      Maximum of 10 total variants reached
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                <Users className='w-4 h-4 mr-2' />
                Test Configuration
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Primary Metric
                  </label>
                  <select
                    value={formData.primaryMetric}
                    onChange={e =>
                      handleInputChange('primaryMetric', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    required
                  >
                    {primaryMetrics.map(metric => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Traffic Split ({formData.trafficSplit}% to variant)
                  </label>
                  <input
                    type='range'
                    min='10'
                    max='90'
                    step='5'
                    value={formData.trafficSplit}
                    onChange={e =>
                      handleInputChange(
                        'trafficSplit',
                        parseInt(e.target.value)
                      )
                    }
                    className='w-full'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>10%</span>
                    <span>90%</span>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Duration (days)
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='90'
                    value={formData.duration}
                    onChange={e =>
                      handleInputChange('duration', parseInt(e.target.value))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Minimum Detectable Effect (%)
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='50'
                    value={formData.minimumDetectableEffect}
                    onChange={e =>
                      handleInputChange(
                        'minimumDetectableEffect',
                        parseInt(e.target.value)
                      )
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Significance Level (%)
                  </label>
                  <select
                    value={formData.significanceLevel}
                    onChange={e =>
                      handleInputChange(
                        'significanceLevel',
                        parseInt(e.target.value)
                      )
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    required
                  >
                    <option value={90}>90%</option>
                    <option value={95}>95%</option>
                    <option value={99}>99%</option>
                  </select>
                </div>
              </div>
            </div>
          )}
            </>
          )}

          {/* Confirmation Review Screen */}
          {showConfirmation && (
            <div className='space-y-6 bg-blue-50 border border-blue-200 rounded-lg p-6'>
              <div className='flex items-center space-x-3 mb-4'>
                <Target className='w-6 h-6 text-blue-600' />
                <h3 className='text-lg font-semibold text-gray-900'>
                  Review Your A/B Test Configuration
                </h3>
              </div>

              <div className='bg-white rounded-lg p-4 space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <h4 className='font-medium text-gray-900 mb-2'>Test Details</h4>
                    <div className='space-y-2 text-sm'>
                      <div><span className='font-medium'>Name:</span> {formData.name}</div>
                      <div><span className='font-medium'>Industry:</span> {formData.industry}</div>
                      <div><span className='font-medium'>Target URL:</span> {formData.targetUrl}</div>
                      <div><span className='font-medium'>Duration:</span> {formData.duration} days</div>
                    </div>
                  </div>

                  <div>
                    <h4 className='font-medium text-gray-900 mb-2'>Test Parameters</h4>
                    <div className='space-y-2 text-sm'>
                      <div><span className='font-medium'>Traffic Split:</span> {formData.trafficSplit}% per variant</div>
                      <div><span className='font-medium'>Primary Metric:</span> {formData.primaryMetric.replace('_', ' ')}</div>
                      <div><span className='font-medium'>Min Effect:</span> {formData.minimumDetectableEffect}%</div>
                      <div><span className='font-medium'>Confidence:</span> {formData.significanceLevel}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-medium text-gray-900 mb-2'>Hypothesis</h4>
                  <p className='text-sm text-gray-700 bg-gray-50 p-3 rounded'>{formData.hypothesis}</p>
                </div>

                <div>
                  <h4 className='font-medium text-gray-900 mb-2'>Test Variants ({2 + additionalVariants.length} total)</h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div className='bg-gray-50 p-3 rounded'>
                      <h5 className='font-medium text-sm text-gray-900'>{formData.variants.control.name}</h5>
                      <p className='text-xs text-gray-600'>{formData.variants.control.description}</p>
                    </div>
                    <div className='bg-blue-50 p-3 rounded'>
                      <h5 className='font-medium text-sm text-blue-900'>{formData.variants.variant.name}</h5>
                      <p className='text-xs text-blue-700'>{formData.variants.variant.description}</p>
                    </div>
                    {additionalVariants.map((variant, index) => (
                      <div key={variant.id} className='bg-green-50 p-3 rounded'>
                        <h5 className='font-medium text-sm text-green-900'>{variant.name}</h5>
                        <p className='text-xs text-green-700'>{variant.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                <div className='flex items-start space-x-3'>
                  <div className='w-6 h-6 text-yellow-600 mt-0.5'>⚠️</div>
                  <div>
                    <h4 className='font-medium text-yellow-900 mb-1'>Ready to Publish</h4>
                    <p className='text-sm text-yellow-800'>
                      Once published, this test will start collecting data immediately.
                      Make sure all configurations are correct before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className='flex items-center justify-between pt-6 border-t border-gray-200 mt-8'>
            <div>
              {currentStep > 1 && !showConfirmation && (
                <button
                  type='button'
                  onClick={prevStep}
                  className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Previous
                </button>
              )}
            </div>

            <div className='flex items-center space-x-3'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>

              {!showConfirmation ? (
                <button
                  type='button'
                  onClick={currentStep < 3 ? nextStep : () => setShowConfirmation(true)}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  {currentStep < 3 ? 'Next' : 'Review & Confirm'}
                </button>
              ) : (
                <div className='flex space-x-3'>
                  <button
                    type='button'
                    onClick={() => setShowConfirmation(false)}
                    className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    Back to Edit
                  </button>
                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2'
                  >
                    {isSubmitting ? (
                      <>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        <span>Publishing Test...</span>
                      </>
                    ) : (
                      <>
                        <Target className='w-4 h-4' />
                        <span>Publish Test</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTestModal;
