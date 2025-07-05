import Head from 'next/head';
import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Optelo',
  description = 'Multi-Industry A/B Testing & Analytics Platform',
}) => {
  return (
    <>
      <style jsx global data-oid='o8pg1tq'>{`
        /* Global scrollbar styling for all pages */
        html {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f9fafb;
        }

        html::-webkit-scrollbar {
          width: 8px;
        }

        html::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 10px;
        }

        html::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
          border: 2px solid #f9fafb;
        }

        html::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        /* Main content area scrollbar styling */
        .main-content-scrollable {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f3f4f6;
        }

        .main-content-scrollable::-webkit-scrollbar {
          width: 8px;
        }

        .main-content-scrollable::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }

        .main-content-scrollable::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
          border: 2px solid #f3f4f6;
        }

        .main-content-scrollable::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
      <Head data-oid='74er9_2'>
        <title data-oid='g6qiatp'>{title}</title>
        <meta name='description' content={description} data-oid='dup23r8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1'
          data-oid='ilm-qi4'
        />

        <link rel='icon' href='/favicon.ico' data-oid='tkjebr-' />
      </Head>

      <div className='flex h-screen bg-gray-50' data-oid='64dpy90'>
        {/* Sidebar */}
        <Sidebar data-oid='a21f2pm' />

        {/* Main Content */}
        <div
          className='flex-1 flex flex-col overflow-hidden'
          data-oid='5twft9.'
        >
          {/* Top Header */}
          <header
            className='bg-white shadow-sm border-b border-gray-200'
            data-oid='y6tuuln'
          >
            <div className='px-6 py-4' data-oid='der.vsb'>
              <div
                className='flex items-center justify-between'
                data-oid='y8n9qmp'
              >
                <div data-oid='jypuu1s'>
                  <h1
                    className='text-2xl font-bold text-gray-900'
                    data-oid='8h-geu1'
                  >
                    {title === 'Optelo'
                      ? 'Dashboard'
                      : title.replace('Optelo - ', '')}
                  </h1>
                  <p className='text-sm text-gray-500 mt-1' data-oid='5oi7fqx'>
                    Welcome to your Optelo Analytics Dashboard
                  </p>
                </div>

                {/* Top right actions */}
                <div className='flex items-center space-x-4' data-oid='7o4ak9p'>
                  {/* Notifications */}
                  <button
                    className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg'
                    data-oid='m9dy_bc'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      data-oid='qwhl15v'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 17h5l-3.5-3.5a.5.5 0 010-.7L19 9.5V9a6 6 0 00-12 0v.5l2.5 3.5a.5.5 0 010 .7L7 17h5m3 0v1a3 3 0 11-6 0v-1m6 0H9'
                        data-oid='f-pfi5:'
                      />
                    </svg>
                  </button>

                  {/* Settings */}
                  <button
                    className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg'
                    data-oid='y:3wga_'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      data-oid='pk5t7cl'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                        data-oid='ksonl39'
                      />

                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                        data-oid='bw93.vl'
                      />
                    </svg>
                  </button>

                  {/* User Profile */}
                  <div
                    className='flex items-center space-x-3'
                    data-oid='qlrc4jj'
                  >
                    <div
                      className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'
                      data-oid='5xsmlte'
                    >
                      <span
                        className='text-white font-medium text-sm'
                        data-oid='hf94e-8'
                      >
                        U
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main
            className='flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 main-content-scrollable'
            data-oid='mbjc2rm'
          >
            <div className='px-6 py-6' data-oid='mphir_-'>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
