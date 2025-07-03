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
      <style jsx global data-oid='4mq82x3'>{`
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
      <Head data-oid='ocgwb83'>
        <title data-oid='g9e4:n3'>{title}</title>
        <meta name='description' content={description} data-oid='ygax1qc' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1'
          data-oid='kv-d2kp'
        />

        <link rel='icon' href='/favicon.ico' data-oid='4lcr620' />
      </Head>

      <div className='flex h-screen bg-gray-50' data-oid='zqoov8r'>
        {/* Sidebar */}
        <Sidebar data-oid='oz1m6pr' />

        {/* Main Content */}
        <div
          className='flex-1 flex flex-col overflow-hidden'
          data-oid='gcq0mkl'
        >
          {/* Top Header */}
          <header
            className='bg-white shadow-sm border-b border-gray-200'
            data-oid='ri-l65y'
          >
            <div className='px-6 py-4' data-oid='c9xslje'>
              <div
                className='flex items-center justify-between'
                data-oid='e4m.vkd'
              >
                <div data-oid='bwvh6p-'>
                  <h1
                    className='text-2xl font-bold text-gray-900'
                    data-oid='gyhpg40'
                  >
                    {title === 'Optelo'
                      ? 'Dashboard'
                      : title.replace('Optelo - ', '')}
                  </h1>
                  <p className='text-sm text-gray-500 mt-1' data-oid='ox5u4s7'>
                    Welcome to your Optelo Analytics Dashboard
                  </p>
                </div>

                {/* Top right actions */}
                <div className='flex items-center space-x-4' data-oid=':l:f.o5'>
                  {/* Notifications */}
                  <button
                    className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg'
                    data-oid='v-ro:nq'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      data-oid='g-0p67h'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 17h5l-3.5-3.5a.5.5 0 010-.7L19 9.5V9a6 6 0 00-12 0v.5l2.5 3.5a.5.5 0 010 .7L7 17h5m3 0v1a3 3 0 11-6 0v-1m6 0H9'
                        data-oid='aeujvry'
                      />
                    </svg>
                  </button>

                  {/* Settings */}
                  <button
                    className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg'
                    data-oid='e8ow86w'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      data-oid='utef8.x'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                        data-oid='9-:zh:w'
                      />

                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                        data-oid='mgsqt8w'
                      />
                    </svg>
                  </button>

                  {/* User Profile */}
                  <div
                    className='flex items-center space-x-3'
                    data-oid='qhw57ce'
                  >
                    <div
                      className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'
                      data-oid='d_i7wr0'
                    >
                      <span
                        className='text-white font-medium text-sm'
                        data-oid='0quupf0'
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
            data-oid='o8zj6-6'
          >
            <div className='px-6 py-6' data-oid='pkx4n3:'>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
