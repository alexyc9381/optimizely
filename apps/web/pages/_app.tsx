/* eslint-disable no-undef */
import { initToolbar } from '@stagewise/toolbar';
import type { AppProps } from 'next/app';
import { useEffect, useRef } from 'react';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const stagewiseInitialized = useRef(false);

  useEffect(() => {
    // Initialize Stagewise toolbar only in development mode and only once

    if (
      process.env.NODE_ENV === 'development' &&
      !stagewiseInitialized.current
    ) {
      try {
        // Check if stagewise anchor already exists in DOM
        const existingAnchor = document.querySelector(
          '[data-stagewise-anchor]'
        );
        if (!existingAnchor) {
          const stagewiseConfig = {
            plugins: [],
          };

          initToolbar(stagewiseConfig);
          stagewiseInitialized.current = true;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
          'Stagewise toolbar initialization skipped:',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // Cleanup function
    return () => {
      // Optional: cleanup logic if needed when component unmounts
    };
  }, []);

  return <Component {...pageProps} data-oid='.ib-vfs' />;
}
