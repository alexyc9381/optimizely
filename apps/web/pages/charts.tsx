/**
 * Charts Showcase Page
 * Demonstrates the elegant data visualization system
 */

import React from 'react';
import Head from 'next/head';
import { ChartShowcase } from '../components/charts/ChartShowcase';
import DashboardLayout from '../components/Layout/DashboardLayout';

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