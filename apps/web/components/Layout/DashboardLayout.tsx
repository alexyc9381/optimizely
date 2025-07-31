import React, { useEffect } from 'react';
import { initializeA11y } from '../../lib/accessibility';
import {
    initializeAccessibilityPerformance,
    preloadCriticalResources,
} from '../../lib/performance';
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
    // Initialize accessibility features
    initializeA11y();
    initializeAccessibilityPerformance();

    // Preload critical resources for better performance
    preloadCriticalResources();

    // Add skip link functionality
    // eslint-disable-next-line no-undef
    const handleSkipLink = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.shiftKey) {
        // eslint-disable-next-line no-undef
        const skipLink = document.querySelector(
          '[href="#main-content"]'
        ) as HTMLElement;
        if (skipLink && document.activeElement === document.body) {
          skipLink.focus();
        }
      }
    };

    document.addEventListener('keydown', handleSkipLink);

    return () => {
      document.removeEventListener('keydown', handleSkipLink);
    };
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Skip to main content link for accessibility */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 transition-all duration-200'
        tabIndex={0}
      >
        Skip to main content
      </a>

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

      {/* Screen reader announcements area - created by accessibility utils */}
      <div
        id='screen-reader-announcements'
        aria-live='polite'
        aria-atomic='true'
        className='sr-only'
      />
    </div>
  );
};

export default DashboardLayout;
