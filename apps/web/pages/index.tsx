import dynamic from 'next/dynamic';
import DashboardLayout from '../components/Layout/DashboardLayout';

// Lazy load the main dashboard component for better performance
const UniversalAIDashboard = dynamic(() => import('../components/UniversalAIDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading dashboard...</span>
    </div>
  ),
  ssr: false, // Disable SSR for this component to reduce initial bundle size
});

export default function Home() {
  return (
    <DashboardLayout
      title='Universal AI Platform - Dashboard'
      data-oid='2:2att-'
    >
      <UniversalAIDashboard data-oid='5i4y-0.' />
    </DashboardLayout>
  );
}
