import React from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '../../components/Layout/DashboardLayout';

// Lazy load the main analytics component for better performance
const AnalyticsMain = dynamic(() => import('../../components/analytics/AnalyticsMain'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading analytics...</span>
    </div>
  ),
  ssr: false,
});

const AnalyticsPage: React.FC = () => {
  return (
    <DashboardLayout title="Analytics - Universal AI Platform">
      <AnalyticsMain />
    </DashboardLayout>
  );
};

export default AnalyticsPage;