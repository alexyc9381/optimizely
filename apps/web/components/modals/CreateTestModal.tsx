import { BarChart3, Settings, Target, Users, X, Zap, Brain, Globe } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { CreateABTestConfig, TestSuggestion, WebsiteScanResult, apiClient } from '../../src/services/apiClient';

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: (testId: string) => void;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({
  isOpen,
  onClose,
  onTestCreated,
}) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<WebsiteScanResult | null>(null);
  const [suggestions, setSuggestions] = useState<TestSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TestSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const industries = [
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
        industry: formData.targetUrl.includes('shop') || formData.targetUrl.includes('store') ? 'E-commerce' : 'SaaS',
        elements: {
          buttons: [
            { text: 'Sign Up', location: 'header', type: 'cta', prominence: 9 },
            { text: 'Get Started', location: 'hero', type: 'cta', prominence: 10 },
            { text: 'Learn More', location: 'features', type: 'cta', prominence: 6 },
          ],
          headlines: [
            { text: 'Transform Your Business Today', level: 1, location: 'hero' },
            { text: 'Powerful Features', level: 2, location: 'features' },
          ],
          images: [
            { alt: 'Hero image', src: '/hero.jpg', location: 'hero' },
          ],
          forms: [
            { type: 'signup', fields: ['email', 'password'], location: 'modal' },
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
          description: 'Test different colors for the primary CTA button to improve conversion',
          hypothesis: 'If we change the CTA button from blue to orange, then conversion rates will increase because orange creates more urgency and stands out better',
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
              changes: 'Change button color from #3B82F6 to #F97316, maintain white text',
            },
          },
          recommendedMetric: 'conversion_rate',
          recommendedDuration: 14,
          trafficSplit: 50,
        },
        {
          id: '2',
          name: 'Headline Optimization',
          description: 'Test a more benefit-focused headline to improve engagement',
          hypothesis: 'If we change the headline to focus on specific benefits, then user engagement will increase because visitors will better understand the value proposition',
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
              changes: 'Replace generic headline with specific, measurable benefit',
            },
          },
          recommendedMetric: 'engagement_rate',
          recommendedDuration: 21,
          trafficSplit: 50,
        },
        {
          id: '3',
          name: 'Social Proof Addition',
          description: 'Add customer testimonials to build trust and credibility',
          hypothesis: 'If we add customer testimonials near the CTA, then conversion rates will increase because social proof reduces perceived risk',
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
              description: 'Add 3 customer testimonials with photos below hero section',
              changes: 'Insert testimonial carousel with customer photos, names, and company logos',
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
        const highestPriority = mockSuggestions.find(s => s.priority === 'high') || mockSuggestions[0];
        setSelectedSuggestion(highestPriority);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan website');
    } finally {
      setIsScanning(false);
    }
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
      const newTest = await apiClient.createABTest(formData);
      onTestCreated(newTest.id);
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
      setCurrentStep(1);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New A/B Test</h2>
              <p className="text-sm text-gray-500">Set up and configure your experiment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className="ml-2">
                  <p className={`text-sm font-medium ${
                    step <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step === 1 && 'Basic Info'}
                    {step === 2 && 'Variants'}
                    {step === 3 && 'Configuration'}
                  </p>
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Homepage CTA Button Test"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={formData.targetUrl}
                      onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/page"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleWebsiteScan}
                      disabled={isScanning || !formData.targetUrl}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      {isScanning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4" />
                          <span>AI Scan</span>
                        </>
                      )}
                    </button>
                  </div>
                  {scanResult && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-sm text-green-700">
                        <Globe className="w-4 h-4 mr-2" />
                        <span>Website scanned successfully - Industry: {scanResult.industry}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe what you're testing and why..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hypothesis
                  </label>
                  <textarea
                    value={formData.hypothesis}
                    onChange={(e) => handleInputChange('hypothesis', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="If we change X, then Y will happen because..."
                    required
                  />
                </div>
              </div>

              {/* AI Test Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    AI-Powered Test Suggestions
                  </h4>
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedSuggestion?.id === suggestion.id
                            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-20'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedSuggestion(suggestion)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-medium text-gray-900">{suggestion.name}</h5>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                                suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {suggestion.priority} priority
                              </span>
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                +{suggestion.estimatedImpact}% impact
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                            <p className="text-xs text-gray-500 italic">"{suggestion.hypothesis}"</p>
                          </div>
                          {selectedSuggestion?.id === suggestion.id && (
                            <div className="ml-4">
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedSuggestion && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Selected suggestion will auto-fill the form when you proceed to the next step
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Variants */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Test Variants
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Control */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Control (Original)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.variants.control.name}
                        onChange={(e) => handleInputChange('variants.control.name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.variants.control.description}
                        onChange={(e) => handleInputChange('variants.control.description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Variant */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Variant A (Test)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.variants.variant.name}
                        onChange={(e) => handleInputChange('variants.variant.name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.variants.variant.description}
                        onChange={(e) => handleInputChange('variants.variant.description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Changes Made
                      </label>
                      <textarea
                        value={formData.variants.variant.changes}
                        onChange={(e) => handleInputChange('variants.variant.changes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Describe the specific changes..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Test Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Metric
                  </label>
                  <select
                    value={formData.primaryMetric}
                    onChange={(e) => handleInputChange('primaryMetric', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {primaryMetrics.map(metric => (
                      <option key={metric.value} value={metric.value}>{metric.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Traffic Split ({formData.trafficSplit}% to variant)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={formData.trafficSplit}
                    onChange={(e) => handleInputChange('trafficSplit', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10%</span>
                    <span>90%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Detectable Effect (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.minimumDetectableEffect}
                    onChange={(e) => handleInputChange('minimumDetectableEffect', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Significance Level (%)
                  </label>
                  <select
                    value={formData.significanceLevel}
                    onChange={(e) => handleInputChange('significanceLevel', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Test...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Create Test</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTestModal;
