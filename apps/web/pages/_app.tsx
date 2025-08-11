/* eslint-disable no-undef */
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { useEffect, useRef } from 'react';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const stagewiseInitialized = useRef(false);

  useEffect(() => {
    // Initialize Stagewise toolbar only in development mode and only once
    if (
      process.env.NODE_ENV === 'development' &&
      !stagewiseInitialized.current &&
      typeof window !== 'undefined'
    ) {
      console.log('🔧 Stagewise: Starting initialization...');

      // Dynamic import to avoid SSR issues
      import('@stagewise/toolbar')
        .then((stagewiseModule) => {
          console.log('🔧 Stagewise: Module loaded', stagewiseModule);

          const { initToolbar } = stagewiseModule;

          // Check if stagewise anchor already exists in DOM
          const existingAnchor = document.querySelector(
            '[data-stagewise-anchor]'
          );

          if (!existingAnchor) {
            console.log('🔧 Stagewise: No existing anchor, initializing toolbar...');

            const stagewiseConfig = {
              plugins: [],
              position: 'bottom-right',
              theme: 'dark'
            };

            try {
              initToolbar(stagewiseConfig);
              console.log('✅ Stagewise: Toolbar initialized successfully!');
              stagewiseInitialized.current = true;

              // Add a visual indicator
              setTimeout(() => {
                const toolbar = document.querySelector('[data-stagewise-anchor]');
                if (toolbar) {
                  console.log('✅ Stagewise: Toolbar found in DOM!', toolbar);
                } else {
                  console.warn('⚠️ Stagewise: Toolbar not found in DOM after initialization');
                }
              }, 1000);

            } catch (initError) {
              console.error('❌ Stagewise: Initialization error:', initError);
            }
          } else {
            console.log('🔧 Stagewise: Existing anchor found, skipping initialization');
          }
        })
        .catch((error) => {
          console.error('❌ Stagewise: Module import failed:', error);
          console.warn(
            'Stagewise toolbar initialization skipped:',
            error instanceof Error ? error.message : 'Unknown error'
          );

          // Create a fallback visual indicator
          const fallbackIndicator = document.createElement('div');
          fallbackIndicator.id = 'stagewise-fallback';
          fallbackIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          `;
          fallbackIndicator.innerHTML = '🔧 Stagewise (fallback mode)';
          document.body.appendChild(fallbackIndicator);

          console.log('✅ Stagewise: Fallback indicator added');
        });
    } else {
      console.log('🔧 Stagewise: Initialization skipped - not in development mode or already initialized');
    }
  }, []);

  return (
    <SessionProvider session={pageProps?.session}>
      <Component {...pageProps} data-oid='.ib-vfs' />
    </SessionProvider>
  );
}
