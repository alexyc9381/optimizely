import React, { useEffect } from 'react';
import { PerformanceMonitor } from '../../lib/performance';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title: _title,
}) => {
  useEffect(() => {
    // Initialize performance monitoring
    const monitor = PerformanceMonitor.getInstance();

    return () => {
      monitor.cleanup();
    };
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Skip to main content link for accessibility */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded'
      >
        Skip to main content
      </a>
      
      {/* Live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className='flex h-screen'>
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          id='main-content'
          className='flex-1 flex flex-col overflow-hidden'
          role='main'
          aria-label='Dashboard main content'
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#6B7280 #E5E7EB',
          }}
        >
          <div className='flex-1 overflow-y-auto p-6 pt-16 md:pt-6'>{children}</div>
        </main>
      </div>


    </div>
  );
};

export default DashboardLayout;
