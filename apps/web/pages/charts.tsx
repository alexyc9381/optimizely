/**
 * Charts Showcase Page
 * Demonstrates the elegant data visualization system
 */

import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import DashboardLayout from '../components/Layout/DashboardLayout';

// Lazy load the chart showcase for better performance
const ChartShowcase = dynamic(() => import('../components/charts/ChartShowcase').then(mod => ({ default: mod.ChartShowcase })), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading charts...</span>
    </div>
  ),
  ssr: false,
});

const ChartsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Charts - Optelo Dashboard</title>
        <meta name="description" content="Elegant data visualization with smooth animations and interactions" />
      </Head>

      <DashboardLayout title="Charts - Optelo Dashboard">
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 -m-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ChartShowcase />
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default ChartsPage;