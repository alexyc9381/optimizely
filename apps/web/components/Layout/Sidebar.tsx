import { BarChart3, Cpu, GitBranch, LayoutDashboard, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
  isAdvanced?: boolean; // Added for advanced settings toggle
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [router, setRouter] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Only use router on client side
    import('next/router').then(({ useRouter }) => {
      setRouter({ pathname: window.location.pathname });
    });
  }, []);

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/',
      icon: (
        <LayoutDashboard
          className='w-5 h-5'
          data-oid='1g8h4bs'
        />
      ),
    },
    {
      name: 'A/B Testing',
      href: '/ab-testing',
      icon: (
        <GitBranch
          className='w-5 h-5'
          data-oid='-fpm62w'
        />
      ),

      badge: '12',
      children: [
        { name: 'Active Tests', href: '/ab-testing/active', icon: null },
        { name: 'Create Test', href: '/ab-testing/create', icon: null },
        { name: 'Test Results', href: '/ab-testing/results', icon: null },
        { name: 'Templates', href: '/ab-testing/templates', icon: null },
      ],
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: (
        <BarChart3
          className='w-5 h-5'
          data-oid='bylhezm'
        />
      ),

      children: [
        { name: 'Performance', href: '/analytics/performance', icon: null },
        { name: 'Revenue Attribution', href: '/analytics/revenue', icon: null },
        { name: 'Customer Journey', href: '/analytics/journey', icon: null },
        { name: 'Real-time Metrics', href: '/analytics/realtime', icon: null },
      ],
    },
    {
      name: 'AI Models',
      href: '/models',
      icon: (
        <Cpu
          className='w-5 h-5'
          data-oid='6guqypx'
        />
      ),

      badge: '94%',
      children: [
        { name: 'Model Performance', href: '/models/performance', icon: null },
        { name: 'Training Data', href: '/models/training', icon: null },
        { name: 'Predictions', href: '/models/predictions', icon: null },
        { name: 'Model Settings', href: '/models/settings', icon: null },
      ],
    },
    {
      name: 'Industry Insights',
      href: '/industries',
      icon: (
        <Lightbulb
          className='w-5 h-5'
          data-oid='4ubn3ya'
        />
      ),

      children: [
        { name: 'SaaS', href: '/industries/saas', icon: null },
        {
          name: 'Manufacturing',
          href: '/industries/manufacturing',
          icon: null,
        },
        { name: 'Healthcare', href: '/industries/healthcare', icon: null },
        { name: 'FinTech', href: '/industries/fintech', icon: null },
        { name: 'Education', href: '/industries/education', icon: null },
      ],
    },
    {
      name: 'Integrations',
      href: '/integrations',
      icon: (
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          data-oid='9i:p454'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            data-oid='awpgeio'
          />
        </svg>
      ),

      children: [
        {
          name: 'Website Integration',
          href: '/integrations/website',
          icon: null,
        },
        { name: 'API Keys', href: '/integrations/api', icon: null },
        { name: 'Webhooks', href: '/integrations/webhooks', icon: null },
        { name: 'Connected Apps', href: '/integrations/apps', icon: null },
      ],
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: (
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          data-oid='lf4yoq9'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
            data-oid='-no0pgs'
          />

          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            data-oid='3qwyrk1'
          />
        </svg>
      ),

      children: [
        { name: 'Account', href: '/settings?tab=account', icon: null },
        { name: 'Team', href: '/settings?tab=team', icon: null },
        { name: 'Billing', href: '/settings?tab=billing', icon: null },
        { name: 'Security', href: '/settings?tab=security', icon: null },
      ],
    },
  ];

  const isActiveLink = (href: string) => {
    if (!mounted || !router) return false; // Prevent SSR issues
    if (href === '/' && router.pathname === '/') return true;
    if (href !== '/' && router.pathname.startsWith(href)) return true;
    return false;
  };

  const NavItemComponent: React.FC<{ item: NavItem; depth?: number }> = ({
    item,
    depth = 0,
  }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isActiveLink(item.href);
    const paddingLeft = depth === 0 ? 'pl-4' : 'pl-8';

    // For Settings, show children conditionally based on showAdvancedSettings
    const visibleChildren = hasChildren
      ? item.children!.filter(
          child => !child.isAdvanced || showAdvancedSettings
        )
      : [];

    return (
      <div className='mb-1' data-oid='j9ws9v6'>
        <div className='flex items-center' data-oid='u7-:jxn'>
          <Link
            href={item.href}
            className={`flex items-center w-full px-2 py-3 text-sm font-medium rounded-lg transition-colors duration-200 min-h-[44px] ${
              isActive
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${paddingLeft}`}
            data-oid='f4pjazq'
          >
            {item.icon && (
              <span className='mr-3' data-oid='h4i69k:'>
                {item.icon}
              </span>
            )}
            {!isCollapsed && (
              <>
                <span className='flex-1' data-oid=':.9_h0_'>
                  {item.name}
                </span>
                {item.badge && (
                  <span
                    className='inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'
                    data-oid='8gm75wg'
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
          {/* Show expand/collapse button only for Settings */}
          {item.name === 'Settings' && hasChildren && !isCollapsed && (
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className='p-2 ml-2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center'
              data-oid='3qyhgxm'
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  showAdvancedSettings ? 'rotate-90' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                data-oid='96h3qzn'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                  data-oid='g.6w_oj'
                />
              </svg>
            </button>
          )}
        </div>
        {/* Show children for Settings item only */}
        {item.name === 'Settings' &&
          visibleChildren.length > 0 &&
          !isCollapsed && (
            <div className='mt-1 space-y-1' data-oid='jhi2m0x'>
              {/* Always show basic settings */}
              {item
                .children!.filter(child => !child.isAdvanced)
                .map(child => (
                  <NavItemComponent
                    key={child.name}
                    item={child}
                    depth={depth + 1}
                    data-oid='e1yv:4s'
                  />
                ))}

              {/* Show advanced settings toggle */}
              {item.children!.some(child => child.isAdvanced) && (
                <>
                  {!showAdvancedSettings && (
                    <button
                      onClick={() => setShowAdvancedSettings(true)}
                      className='flex items-center w-full px-2 py-3 pl-8 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 min-h-[44px]'
                      data-oid='eb7mpg7'
                    >
                      <svg
                        className='w-4 h-4 mr-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        data-oid='inykup4'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                          data-oid='wtbdtdz'
                        />
                      </svg>
                      Show Advanced
                    </button>
                  )}

                  {/* Show advanced items when expanded */}
                  {showAdvancedSettings &&
                    item
                      .children!.filter(child => child.isAdvanced)
                      .map(child => (
                        <NavItemComponent
                          key={child.name}
                          item={child}
                          depth={depth + 1}
                          data-oid='cygb70e'
                        />
                      ))}

                  {showAdvancedSettings && (
                    <button
                      onClick={() => setShowAdvancedSettings(false)}
                      className='flex items-center w-full px-2 py-3 pl-8 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 min-h-[44px]'
                      data-oid='71.f7o3'
                    >
                      <svg
                        className='w-4 h-4 mr-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        data-oid='-3o5s7m'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M18 12H6'
                          data-oid='1ny.cm9'
                        />
                      </svg>
                      Hide Advanced
                    </button>
                  )}
                </>
              )}
            </div>
          )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          bg-white shadow-lg border-r border-gray-200 h-screen transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileMenuOpen ? 'fixed left-0 top-0 z-40' : 'fixed -left-64 md:relative md:left-0'}
          md:block
        `}
        data-oid='qgz4pb.'
      >
      {/* Header */}
      <div
        className='flex items-center justify-between p-4 border-b border-gray-200'
        data-oid='a9rfi.g'
      >
        {!isCollapsed && (
          <div className='flex items-center' data-oid='ra8al5q'>
            <div
              className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'
              data-oid='.r2:f4k'
            >
              <span className='text-white font-bold text-sm' data-oid='hvd6qh-'>
                AI
              </span>
            </div>
            <div className='ml-2' data-oid='qapmma4'>
              <h1
                className='text-lg font-bold text-gray-900'
                data-oid='5vxsc7j'
              >
                Optelo
              </h1>
              <p className='text-xs text-gray-500' data-oid='d86b5gp'>
                Analytics Platform
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100'
          data-oid=':tfb.8:'
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            data-oid='cwgdcw:'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
              data-oid='uqz0.lj'
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-2 py-4 overflow-y-auto' data-oid='m-xhd0x'>
        <div className='space-y-2' data-oid='j86tg2x'>
          {navigation.map(item => (
            <NavItemComponent key={item.name} item={item} data-oid='vjp97um' />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className='p-4 border-t border-gray-200' data-oid='6pe4zgb'>
        {!isCollapsed && (
          <div className='flex items-center' data-oid='dbv5j5y'>
            <div
              className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'
              data-oid='v0z8ot_'
            >
              <span
                className='text-gray-600 font-medium text-sm'
                data-oid='a.-ptn.'
              >
                U
              </span>
            </div>
            <div className='ml-2' data-oid='449m2jz'>
              <p
                className='text-sm font-medium text-gray-900'
                data-oid='h8ovhzt'
              >
                User Account
              </p>
              <p className='text-xs text-gray-500' data-oid='ykx3gno'>
                admin@company.com
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar;
