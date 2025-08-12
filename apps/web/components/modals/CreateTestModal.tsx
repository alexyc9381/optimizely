import {
    Brain,
    Globe,
    MousePointer,
    Plus,
    Settings,
    Target,
    Trash2,
    Type,
    Users,
    Wand2,
    X,
    Zap
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
  const [selectedElementType, setSelectedElementType] = useState<string>('button');

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

  // Helper function to generate hypothesis based on element type and scan data
  const generateHypothesis = (elementType: string | null, scanData: any) => {
    if (!elementType || !scanData) return '';

    const elementTypeLower = elementType.toLowerCase();
    const title = scanData.title || 'the page';

    switch (elementTypeLower) {
      case 'headline':
        return `If we optimize the headline to be more compelling and clear, then users will be more engaged and conversion rates will increase because a stronger headline better communicates the value proposition.`;
      case 'button text':
        return `If we improve the button text to be more action-oriented and clear, then more users will click and convert because clearer call-to-action language reduces friction.`;
      case 'description':
        return `If we enhance the description to be more persuasive and benefit-focused, then users will have better understanding of the value and conversion rates will improve.`;
      case 'image':
        return `If we optimize the image to be more relevant and engaging, then users will have better visual connection with the content and conversion rates will increase.`;
      default:
        return `If we optimize the ${elementTypeLower} on ${title}, then user engagement and conversion rates will improve because better ${elementTypeLower} design reduces friction and increases clarity.`;
    }
  };

    // Helper function to extract original content based on element type
  const getOriginalContentFromScan = (elementType: string | null, scanData: any) => {
    if (!elementType || !scanData?.elements) return '';

    const elementTypeLower = elementType.toLowerCase();

    switch (elementTypeLower) {
      case 'headline':
        const headlines = scanData.elements.headlines;
        if (headlines.length > 0) {
          // Get the main H1 first, or the first available headline
          const mainHeadline = headlines.find((h: any) => h.level === 1) || headlines[0];
          return mainHeadline.text.trim();
        }
        return 'Main Headline';
      case 'button text':
        const buttons = scanData.elements.buttons;
        if (buttons.length > 0) {
          // Prioritize CTA buttons, then navigation, then any button
          const ctaButton = buttons.find((btn: any) => btn.type === 'cta') ||
                           buttons.find((btn: any) => btn.text.toLowerCase().includes('get') ||
                                                      btn.text.toLowerCase().includes('try') ||
                                                      btn.text.toLowerCase().includes('start')) ||
                           buttons[0];
          return ctaButton.text.trim();
        }
        return 'Click Here';
      case 'description':
        // Use the page description or meta description from scan
        return scanData.description?.trim() || scanData.title?.trim() + ' - improve your experience' || 'Page description content';
      case 'image':
        const images = scanData.elements.images;
        if (images.length > 0) {
          // Get the first image with meaningful alt text
          const meaningfulImage = images.find((img: any) => img.alt && img.alt.length > 5) || images[0];
          return meaningfulImage.alt?.trim() || 'Hero image';
        }
        return 'Main image';
      default:
        return `Original ${elementTypeLower} content`;
    }
  };

  // Helper function to generate AI variants based on scanned content
  const generateVariantsFromScanData = async (elementType: string | null, originalContent: string) => {
    if (!elementType || !originalContent) return;

    const elementTypeLower = elementType.toLowerCase();
    let generatedVariants: any[] = [];

    // Generate variants based on element type - ALL variants follow same structure
    switch (elementTypeLower) {
      case 'headline':
        generatedVariants = [
          {
            name: 'Variant B (Power Words)',
            description: `Unlock Your ${originalContent.replace(/\b\w+\b/, 'Ultimate')}`,
            changes: 'Added power words and urgency to increase engagement'
          },
          {
            name: 'Variant C (Benefit Focused)',
            description: `${originalContent} - Get Results Fast`,
            changes: 'Emphasized benefits and speed of results'
          },
          {
            name: 'Variant D (Question Format)',
            description: `Ready to ${originalContent.toLowerCase()}?`,
            changes: 'Used question format to increase engagement'
          }
        ];
        break;
      case 'button text':
        generatedVariants = [
          {
            name: 'Variant B (Action Oriented)',
            description: `Get ${originalContent.replace(/click|here|now/gi, '').trim()} Now`,
            changes: 'Made more action-oriented with urgency'
          },
          {
            name: 'Variant C (Urgency)',
            description: `${originalContent.replace(/click|here/gi, '').trim()} Today`,
            changes: 'Added time-based urgency'
          },
          {
            name: 'Variant D (Benefit)',
            description: `Start ${originalContent.replace(/click|here|get|now/gi, '').trim()}`,
            changes: 'Focused on action and beginning journey'
          }
        ];
        break;
      case 'description':
        generatedVariants = [
          {
            name: 'Variant B (Benefit Heavy)',
            description: `${originalContent} - Transform your results in just minutes.`,
            changes: 'Added specific benefit and time promise'
          },
          {
            name: 'Variant C (Social Proof)',
            description: `Join thousands who use ${originalContent.split(' ').slice(0, 5).join(' ')}...`,
            changes: 'Added social proof and community aspect'
          },
          {
            name: 'Variant D (Problem/Solution)',
            description: `Tired of poor results? ${originalContent}`,
            changes: 'Addressed pain point before solution'
          }
        ];
        break;
      default:
        generatedVariants = [
          {
            name: 'Variant B (Enhanced)',
            description: `Enhanced ${originalContent}`,
            changes: 'General optimization for better performance'
          },
          {
            name: 'Variant C (Improved)',
            description: `Improved ${originalContent}`,
            changes: 'Refined version with better clarity'
          }
        ];
    }

    // Update additional variants
    setAdditionalVariants(generatedVariants);
  };

  const handleWebsiteScan = async () => {
    if (!formData.targetUrl) {
      setError('Please enter a target URL first');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Call real website scanning API
      const scanResponse = await apiClient.scanWebsite(formData.targetUrl);

      // Generate test suggestions based on scan results
      const suggestionsResponse = await apiClient.getTestSuggestions(scanResponse);

      setScanResult(scanResponse);
      setSuggestions(suggestionsResponse);
      setShowSuggestions(true);

      // AUTO-FILL FORM FIELDS BASED ON SCANNED DATA
      setFormData(prev => ({
        ...prev,
        // Auto-fill industry from scanned data
        industry: scanResponse.industry || prev.industry,

        // Auto-fill name if not already set
        name: prev.name || `${scanResponse.title || 'Website'} - ${selectedElementType || 'Element'} Test`,

        // Auto-fill description based on scan results
        description: prev.description || `A/B testing ${selectedElementType?.toLowerCase() || 'element'} on ${scanResponse.title || 'the website'} to improve conversion rates. Page contains ${scanResponse.elements.buttons.length} buttons, ${scanResponse.elements.headlines.length} headlines, and ${scanResponse.elements.forms.length} forms.`,

        // Auto-fill hypothesis based on element type and scan data
        hypothesis: prev.hypothesis || generateHypothesis(selectedElementType, scanResponse)
      }));

            // Auto-populate variants based on selected element type and scanned content
      if (selectedElementType && scanResponse.elements) {
        const originalContent = getOriginalContentFromScan(selectedElementType, scanResponse);
        if (originalContent) {
          // Set control variant with ACTUAL scraped content
          setFormData(prev => ({
            ...prev,
          variants: {
              ...prev.variants,
            control: {
                name: 'Original',
                description: originalContent // This is the ACTUAL content from the website
            },
            variant: {
                name: 'Variant A',
                description: `Enhanced ${originalContent}`, // AI-enhanced version
                changes: `Optimized ${selectedElementType?.toLowerCase()} content`
              }
            }
          }));

          // Generate AI variants based on the scanned content (these will be additional variants)
          generateVariantsFromScanData(selectedElementType, originalContent);
        }
      }

      // Auto-select highest priority suggestion
      if (suggestionsResponse.length > 0) {
        const highestPriority =
          suggestionsResponse.find(s => s.priority === 'high') ||
          suggestionsResponse[0];
        setSelectedSuggestion(highestPriority);
      }
    } catch (err) {
      console.error('Failed to scan website:', err);
      setError(
        'Failed to scan website. Please check the URL and try again. ' +
        'Note: The website must be publicly accessible.'
      );
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
      // Get original content from scan results
      const originalContent = getOriginalContentFromScan(selectedElementType, scanResult);

      if (!originalContent) {
        setError('Could not extract original content for the selected element type. Please scan a website first.');
        return;
      }

      console.log('Generating AI variants with Gemini API...');

      // Generate variants using Gemini AI
      const variants = await apiClient.generateVariants({
        elementType: selectedElementType,
        originalContent,
        hypothesis: formData.hypothesis,
        targetUrl: formData.targetUrl,
        industry: formData.industry,
        context: formData.description,
        count: 1 // Generate 1 primary variant first
      });

      if (variants && variants.length > 0) {
        const primaryVariant = variants[0];

        // Update form data with AI-generated variants
        setFormData(prev => ({
          ...prev,
          variants: {
            control: {
              name: 'Original',
              description: originalContent
            },
            variant: {
              name: primaryVariant.name,
              description: primaryVariant.description,
              changes: primaryVariant.changes
            }
          }
        }));

        // Generate additional variants (2-3 more)
        const additionalVariants = await apiClient.generateVariants({
          elementType: selectedElementType,
          originalContent,
          hypothesis: formData.hypothesis,
          targetUrl: formData.targetUrl,
          industry: formData.industry,
          context: formData.description + ' Generate different approaches from the first variant.',
          count: 2
        });

        if (additionalVariants && additionalVariants.length > 0) {
          const formattedAdditionalVariants = additionalVariants.map((variant, index) => ({
            id: `variant_${Date.now()}_${index}`,
            name: variant.name,
            description: variant.changes, // Full explanation goes here
            changes: variant.changes,
            rationale: variant.rationale,
            elementType: selectedElementType,
            originalContent,
            modifiedContent: variant.description // This is the new content for the element
          }));

          setAdditionalVariants(formattedAdditionalVariants);
        }

        console.log('Successfully generated AI variants!');
      } else {
        throw new Error('No variants generated by AI');
      }

            // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>AI variants generated! ${additionalVariants?.length + 2 || 3} variants created. Edit as needed.</span>
        </div>
      `;

      document.body.appendChild(notification);

      // Remove notification after 4 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 4000);

        } catch (err) {
      console.error('Error generating variants with Gemini AI:', err);
      setError(`Failed to generate AI variants: ${err instanceof Error ? err.message : 'Unknown error'}. Falling back to basic variants.`);

      // Fallback to mock generation if AI fails
      console.log('Falling back to mock variant generation...');
      const fallbackOriginalContent = getOriginalContentFromScan(selectedElementType, scanResult) || getOriginalContent(selectedElementType);
      const variantStrings = generateElementVariants(selectedElementType, fallbackOriginalContent);

      // Convert strings to proper variant objects
      const mockAdditionalVariants = variantStrings.slice(0, 2).map((variantText, index) => {
        const nextLetter = String.fromCharCode(67 + index); // C, D, etc.
        return {
          id: `variant_${Date.now()}_${index}`,
          name: `Variant ${nextLetter}`,
          description: `${elementTypes.find(et => et.value === selectedElementType)?.label} test variant ${nextLetter}`,
          changes: `Change ${selectedElementType} from "${fallbackOriginalContent}" to "${variantText}"`,
          elementType: selectedElementType,
          originalContent: fallbackOriginalContent,
          modifiedContent: variantText,
        };
      });

      const mockGeneratedVariants = {
        control: {
          name: 'Original',
          description: fallbackOriginalContent,
        },
        variant: {
          name: 'Optimized Version',
          description: `Enhanced version based on hypothesis: ${formData.hypothesis}`,
          changes: `Implement changes to test the hypothesis: ${formData.hypothesis.substring(0, 100)}${formData.hypothesis.length > 100 ? '...' : ''}`,
        },
      };

      setFormData(prev => ({
        ...prev,
        variants: mockGeneratedVariants,
      }));

      // Don't set additional variants in the success case, AI handles everything
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const addVariant = () => {
    const nextLetter = String.fromCharCode(65 + additionalVariants.length + 1); // B, C, D, etc.
    const originalContent = getOriginalContent(selectedElementType);
    const variants = generateElementVariants(selectedElementType, originalContent);
    const selectedVariant = variants[Math.floor(Math.random() * variants.length)];

    const newVariant = {
      id: `variant_${Date.now()}`,
      name: `Variant ${nextLetter}`,
      description: `${elementTypes.find(et => et.value === selectedElementType)?.label} test variant`,
      changes: `Change ${selectedElementType} from "${originalContent}" to "${selectedVariant}"`,
      elementType: selectedElementType,
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
      setSelectedElementType('button');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
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

          {/* Progress Indicator (Google Optimize Style) */}
          {!showConfirmation && (
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-gray-700'>
                  Step {currentStep} of 4
                </span>
                <span className='text-xs text-gray-500'>
                  {Math.round((currentStep / 4) * 100)}% complete
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out'
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
              <div className='flex justify-between mt-2 text-xs text-gray-500'>
                <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Setup</span>
                <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Variants</span>
                <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Audience</span>
                <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : ''}>Review</span>
              </div>
            </div>
          )}

          {!showConfirmation && (
            <>
              {/* Step 1: Test Setup & Objective */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                  <Target className='w-4 h-4 mr-2' />
                  Test Setup & Objective
              </h3>
                <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'>
                  Step 1 of 4
                </span>
              </div>

              {/* Objective Definition (Google Optimize Style) */}
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <h4 className='font-medium text-blue-900 mb-2 flex items-center'>
                  <Target className='w-4 h-4 mr-2' />
                  What do you want to optimize?
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  {[
                    { id: 'conversion', label: 'Increase Conversions', icon: '🎯', desc: 'Button clicks, form submissions' },
                    { id: 'engagement', label: 'Boost Engagement', icon: '📈', desc: 'Time on page, scroll depth' },
                    { id: 'revenue', label: 'Drive Revenue', icon: '💰', desc: 'Purchases, sign-ups' }
                  ].map(objective => (
                    <button
                      key={objective.id}
                      type='button'
                      onClick={() => handleInputChange('primaryMetric', objective.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.primaryMetric === objective.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                      }`}
                    >
                      <div className='text-lg mb-1'>{objective.icon}</div>
                      <div className='font-medium text-sm'>{objective.label}</div>
                      <div className='text-xs opacity-75'>{objective.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

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

                {/* Page & Element Selection (Google Optimize Style) */}
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Target Page URL
                  </label>
                  <div className='flex space-x-2'>
                    <input
                      type='url'
                      value={formData.targetUrl}
                      onChange={e => handleInputChange('targetUrl', e.target.value)}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                      placeholder='https://yoursite.com/page-to-test'
                      required
                    />
                    <button
                      type='button'
                      onClick={handleWebsiteScan}
                      disabled={isScanning || !formData.targetUrl}
                      className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2'
                    >
                      {isScanning ? (
                        <>
                          <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Globe className='w-4 h-4' />
                          <span>Scan Page</span>
                        </>
                      )}
                    </button>
                  </div>
                  {scanResult && (
                    <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
                      <div className='flex items-center space-x-2 text-green-800'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className='text-sm font-medium'>Page scanned successfully</span>
                      </div>
                      <p className='text-xs text-green-700 mt-1'>
                        Found {scanResult.elements?.buttons?.length || 0} buttons, {scanResult.elements?.headlines?.length || 0} headlines, and more elements
                      </p>
                    </div>
                  )}
                </div>

                {/* Visual Element Selector (Modern Optimizely Style) */}
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Choose Element to Test
                  </label>
                  <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      {elementTypes.map(type => {
                        const Icon = type.icon;
                        const isSelected = selectedElementType === type.value;
                        return (
                          <button
                            key={type.value}
                            type='button'
                            onClick={() => setSelectedElementType(type.value)}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 relative ${
                              isSelected
                                ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-md'
                                : 'border-gray-300 hover:border-blue-300 text-gray-600 hover:text-blue-600 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center'>
                                <div className='w-1.5 h-1.5 bg-white rounded-full'></div>
                              </div>
                            )}
                            <Icon className='w-5 h-5' />
                            <span className='text-xs font-medium text-center'>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className='mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700'>
                      <span className='font-medium'>Selected:</span> {elementTypes.find(et => et.value === selectedElementType)?.label}
                      <span className='ml-2 opacity-75'>All variants will test this element type</span>
                    </div>
                  </div>
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
              {showSuggestions && suggestions.length > 0 && selectedElementType && (
                <div className='mt-8'>
                  <h4 className='text-lg font-medium text-gray-900 flex items-center mb-4'>
                    <Zap className='w-4 h-4 mr-2 text-yellow-500' />
                    AI-Powered Test Suggestions for {elementTypes.find(et => et.value === selectedElementType)?.label}
                  </h4>
                  <div className='space-y-3'>
                    {suggestions
                      .filter(suggestion => {
                        // Filter suggestions based on selected element type
                        const elementTypeMap = {
                          'button': ['Call-to-Action', 'Button', 'CTA'],
                          'headline': ['Headline', 'Title', 'Header'],
                          'description': ['Description', 'Copy', 'Text'],
                          'image': ['Image', 'Visual', 'Photo'],
                          'form': ['Form', 'Input', 'Field'],
                          'navigation': ['Navigation', 'Menu', 'Nav'],
                          'pricing': ['Pricing', 'Price', 'Cost'],
                          'social proof': ['Trust', 'Social', 'Testimonial', 'Review']
                        };

                        const relevantTypes = elementTypeMap[selectedElementType] || [];
                        return relevantTypes.some(type =>
                          suggestion.name.toLowerCase().includes(type.toLowerCase()) ||
                          suggestion.description.toLowerCase().includes(type.toLowerCase())
                        );
                      })
                      .map(suggestion => (
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

                    {/* Step 2: AI-Powered Variant Creation */}
          {currentStep === 2 && (
                        <div className='space-y-6'>
               <div className='flex items-center justify-between'>
                 <div>
                   <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                     <Wand2 className='w-4 h-4 mr-2' />
                     AI Variant Generator
              </h3>
                   <p className='text-sm text-gray-600 mt-1'>
                     Testing {elementTypes.find(et => et.value === selectedElementType)?.label} • {formData.primaryMetric} optimization
                   </p>
                 </div>
                 <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'>
                   Step 2 of 4
                 </span>
               </div>

               {/* Instant AI Generation Panel */}
               <div className='bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6'>
                 <div className='flex items-center justify-between mb-4'>
                   <div className='flex items-center space-x-3'>
                     <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                       <Brain className='w-5 h-5 text-purple-600' />
                     </div>
                     <div>
                       <h4 className='font-medium text-gray-900'>AI Variant Generation</h4>
                       <p className='text-sm text-gray-600'>Instantly create optimized variants based on your page content</p>
                     </div>
                   </div>
                   <button
                     type='button'
                     onClick={handleGenerateVariants}
                     disabled={isGeneratingVariants || !formData.targetUrl || !selectedElementType}
                     className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2'
                   >
                     {isGeneratingVariants ? (
                       <>
                         <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                         <span>Generating Variants...</span>
                       </>
                     ) : (
                       <>
                         <Zap className='w-5 h-5' />
                         <span>Generate AI Variants</span>
                       </>
                     )}
                   </button>
                 </div>

                 {!formData.targetUrl || !selectedElementType ? (
                   <div className='text-center py-4'>
                     <div className='text-yellow-600 mb-2'>⚠️</div>
                     <p className='text-sm text-gray-600'>
                       Complete Step 1 (Target URL and Element Type) to enable AI generation
                     </p>
                   </div>
                 ) : (
                   <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-center'>
                     <div className='bg-white p-4 rounded-lg border border-gray-200'>
                       <div className='text-blue-600 text-2xl mb-2'>🎯</div>
                       <h5 className='font-medium text-gray-900 mb-1'>Smart Analysis</h5>
                       <p className='text-xs text-gray-600'>Analyzes your page content and user behavior patterns</p>
                     </div>
                     <div className='bg-white p-4 rounded-lg border border-gray-200'>
                       <div className='text-green-600 text-2xl mb-2'>⚡</div>
                       <h5 className='font-medium text-gray-900 mb-1'>Instant Variants</h5>
                       <p className='text-xs text-gray-600'>Creates 3-5 optimized variants in seconds</p>
                     </div>
                     <div className='bg-white p-4 rounded-lg border border-gray-200'>
                       <div className='text-purple-600 text-2xl mb-2'>🚀</div>
                       <h5 className='font-medium text-gray-900 mb-1'>Ready to Test</h5>
                       <p className='text-xs text-gray-600'>All variants are editable and test-ready</p>
                     </div>
                   </div>
                 )}
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
                        Original Content
                      </label>
                      <div className='bg-white p-3 border border-gray-200 rounded-lg'>
                        <div className='text-sm text-gray-600 mb-2'>
                          <strong>Element Type:</strong> {selectedElementType ? elementTypes.find(et => et.value === selectedElementType)?.label : 'Not selected'}
                        </div>
                        <div className='text-sm text-gray-600 mb-2'>
                          <strong>Original Text:</strong> 
                        </div>
                        <div className='bg-gray-50 p-2 rounded border text-sm font-mono text-gray-800'>
                          "{getOriginalContentFromScan(selectedElementType, scanResult) || formData.variants.control.description || 'No content detected'}"
                        </div>
                        {scanResult?.url && (
                          <div className='text-xs text-gray-500 mt-2'>
                            <strong>Source:</strong> {scanResult.url}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Variant */}
                <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-2'>
                      <Zap className='w-4 h-4 text-green-600' />
                      <h4 className='font-medium text-gray-900'>
                        Variant A (Primary Test)
                      </h4>
                      {selectedElementType && (
                        <span className='text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full'>
                          {elementTypes.find(et => et.value === selectedElementType)?.label || selectedElementType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Variant Name
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

                    {formData.variants.control.description && (
                      <div className='bg-white p-3 rounded border'>
                        <h5 className='text-sm font-medium text-gray-700 mb-2'>Content Changes</h5>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                              Original {selectedElementType || 'Content'}
                            </label>
                            <div className='w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600 text-sm'>
                              "{formData.variants.control.description}"
                            </div>
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                              New {selectedElementType || 'Content'}
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
                              rows={3}
                              required
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
                        value={formData.variants.variant.changes}
                        onChange={e =>
                          handleInputChange(
                            'variants.variant.changes',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                        rows={2}
                        placeholder='Describe the changes and rationale for this variant...'
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
                    <button
                      type='button'
                      onClick={addVariant}
                      disabled={additionalVariants.length >= 8}
                      className='px-6 py-3 bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <Plus className='w-5 h-5' />
                      <span>Add {elementTypes.find(et => et.value === selectedElementType)?.label} Variant</span>
                    </button>
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

          {/* Step 3: Audience & Targeting */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                  <Users className='w-4 h-4 mr-2' />
                  Audience & Settings
                </h3>
                <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'>
                  Step 3 of 4
                </span>
              </div>

              {/* Quick Audience Settings (Google Optimize Style) */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h4 className='font-medium text-gray-900'>Traffic Allocation</h4>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Percentage of visitors to include
                    </label>
                    <div className='flex items-center space-x-3'>
                      <input
                        type='range'
                        min='1'
                        max='100'
                        value={formData.trafficSplit}
                        onChange={e => handleInputChange('trafficSplit', parseInt(e.target.value))}
                        className='flex-1'
                      />
                      <span className='text-sm font-medium text-gray-900 min-w-[3rem]'>
                        {formData.trafficSplit}%
                      </span>
                    </div>
                    <p className='text-xs text-gray-500 mt-2'>
                      {formData.trafficSplit}% of visitors will see test variants, others see original
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <h4 className='font-medium text-gray-900'>Test Duration</h4>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Estimated test duration
                    </label>
                    <select
                      value={formData.duration}
                      onChange={e => handleInputChange('duration', parseInt(e.target.value))}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    >
                      <option value={7}>1 week</option>
                      <option value={14}>2 weeks (recommended)</option>
                      <option value={21}>3 weeks</option>
                      <option value={30}>1 month</option>
                      <option value={60}>2 months</option>
                    </select>
                    <p className='text-xs text-gray-500 mt-2'>
                      Longer tests provide more reliable results
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className='border-t border-gray-200 pt-6'>
                <h4 className='font-medium text-gray-900 mb-4'>Statistical Settings</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Minimum Detectable Effect
                    </label>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='number'
                        min='1'
                        max='50'
                        value={formData.minimumDetectableEffect}
                        onChange={e => handleInputChange('minimumDetectableEffect', parseInt(e.target.value))}
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                      />
                      <span className='text-sm text-gray-600'>%</span>
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Confidence Level
                    </label>
                    <select
                      value={formData.significanceLevel}
                      onChange={e => handleInputChange('significanceLevel', parseInt(e.target.value))}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                    >
                      <option value={90}>90%</option>
                      <option value={95}>95% (recommended)</option>
                      <option value={99}>99%</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Configuration */}
          {currentStep === 4 && (
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
                      <p className='text-xs text-blue-700 mb-1'>{formData.variants.variant.description}</p>
                      {formData.variants.variant.changes && (
                        <p className='text-xs text-blue-600 italic'>Changes: {formData.variants.variant.changes}</p>
                      )}
                    </div>
                    {additionalVariants.map((variant, index) => (
                      <div key={variant.id} className='bg-green-50 p-3 rounded'>
                        <h5 className='font-medium text-sm text-green-900'>{variant.name}</h5>
                        <p className='text-xs text-green-700 mb-1'>{variant.description}</p>
                        {variant.changes && (
                          <p className='text-xs text-green-600 italic'>Changes: {variant.changes}</p>
                        )}
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
                  onClick={currentStep < 4 ? nextStep : () => setShowConfirmation(true)}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  {currentStep < 4 ? 'Next' : 'Review & Confirm'}
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
