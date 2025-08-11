import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../../src/services/apiClient';

export interface UserProfile {
  profile: {
    fullName: string;
    email: string;
    company: string;
    role: string;
  };
  business: {
    businessType: string;
    companySize: string;
    monthlyTraffic: string;
    timezone: string;
    industries?: string[];
    preferredModelTypes?: string[];
    dataSources?: string[];
    businessGoals?: string[];
  };
  preferences: {
    emailNotifications: boolean;
    testAlerts: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  onboarding?: {
    completedSteps: string[];
    selectedIndustries: string[];
    primaryGoals: string[];
    dataIntegrations: string[];
    modelPreferences: string[];
  };
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock onboarding data based on business type
  const generateMockOnboardingData = (businessType: string): UserProfile['onboarding'] => {
    const industryMapping: Record<string, string[]> = {
      'saas': ['SaaS', 'Technology', 'Software'],
      'ecommerce': ['E-commerce', 'Retail', 'Consumer Goods'],
      'healthcare': ['Healthcare', 'Medical', 'Pharmaceuticals'],
      'fintech': ['FinTech', 'Financial Services', 'Banking'],
      'manufacturing': ['Manufacturing', 'Industrial', 'Automotive'],
      'education': ['Education', 'E-learning', 'Academic'],
      'realestate': ['Real Estate', 'Property', 'Construction'],
      'travel': ['Travel', 'Hospitality', 'Tourism'],
      'media': ['Media', 'Entertainment', 'Publishing'],
      'retail': ['Retail', 'Consumer Goods', 'Fashion']
    };

    const modelMapping: Record<string, string[]> = {
      'saas': ['Optimization', 'Prediction', 'Recommendation', 'Classification'],
      'ecommerce': ['Recommendation', 'Optimization', 'Prediction', 'Classification'],
      'healthcare': ['Risk Analysis', 'Prediction', 'Classification', 'Anomaly Detection'],
      'fintech': ['Risk Analysis', 'Prediction', 'Classification', 'Time Series'],
      'manufacturing': ['Quality Control', 'Anomaly Detection', 'Prediction', 'Optimization'],
      'education': ['Recommendation', 'Classification', 'Prediction'],
      'realestate': ['Prediction', 'Classification', 'Recommendation'],
      'travel': ['Recommendation', 'Optimization', 'Prediction'],
      'media': ['Recommendation', 'Classification', 'Prediction'],
      'retail': ['Recommendation', 'Optimization', 'Prediction']
    };

    const dataSourceMapping: Record<string, string[]> = {
      'saas': ['API Integration', 'Database Connection', 'Web Analytics', 'Customer Data Platform'],
      'ecommerce': ['E-commerce Platform', 'Web Analytics', 'Customer Data Platform', 'Marketing Automation'],
      'healthcare': ['Database Connection', 'API Integration', 'CSV Upload'],
      'fintech': ['Database Connection', 'API Integration', 'Customer Data Platform'],
      'manufacturing': ['Database Connection', 'CSV Upload', 'API Integration'],
      'education': ['Database Connection', 'Web Analytics', 'API Integration'],
      'realestate': ['CRM System', 'Database Connection', 'API Integration'],
      'travel': ['API Integration', 'Database Connection', 'Web Analytics'],
      'media': ['Web Analytics', 'Database Connection', 'API Integration'],
      'retail': ['E-commerce Platform', 'Web Analytics', 'Customer Data Platform']
    };

    return {
      completedSteps: ['industry-selection', 'business-goals', 'data-sources', 'model-preferences'],
      selectedIndustries: industryMapping[businessType] || ['General'],
      primaryGoals: ['Increase Conversions', 'Optimize User Experience', 'Improve Performance'],
      dataIntegrations: dataSourceMapping[businessType] || ['Database Connection', 'API Integration'],
      modelPreferences: modelMapping[businessType] || ['Optimization', 'Prediction']
    };
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get settings from API
      const settings = await apiClient.getSettings();

      // Enhance with onboarding data
      const enhancedProfile: UserProfile = {
        ...settings,
        business: {
          ...settings.business,
          industries: [],
          preferredModelTypes: [],
          dataSources: [],
          businessGoals: []
        },
        onboarding: generateMockOnboardingData(settings.business.businessType)
      };

      setUserProfile(enhancedProfile);
    } catch (err) {
      console.warn('API unavailable, using mock profile data:', err);
      setError('Using demo data - API unavailable');

      // Fallback to mock data
      const mockProfile: UserProfile = {
        profile: {
          fullName: 'John Doe',
          email: 'john@company.com',
          company: 'Acme Corp',
          role: 'Marketing Director',
        },
        business: {
          businessType: 'saas',
          companySize: 'medium',
          monthlyTraffic: 'medium',
          timezone: 'America/New_York',
          industries: ['SaaS', 'Technology'],
          preferredModelTypes: ['Optimization', 'Prediction'],
          dataSources: ['API Integration', 'Web Analytics'],
          businessGoals: ['Increase Conversions', 'Optimize User Experience']
        },
        preferences: {
          emailNotifications: true,
          testAlerts: true,
          weeklyReports: false,
          marketingEmails: false,
        },
        onboarding: generateMockOnboardingData('saas')
      };

      setUserProfile(mockProfile);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!userProfile) return;

      const updatedProfile = { ...userProfile, ...updates };
      await apiClient.updateSettings(updatedProfile);
      setUserProfile(updatedProfile);
    } catch (err) {
      console.warn('Failed to update profile, updating locally:', err);
      // Update locally even if API fails
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const value: UserProfileContextType = {
    userProfile,
    loading,
    error,
    refreshProfile: fetchProfile,
    updateProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export default UserProfileContext;
