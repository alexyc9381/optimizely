import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/',
      icon: (
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z'
          />
        </svg>
      ),
    },
    {
      name: 'A/B Testing',
      href: '/ab-testing',
      icon: (
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
          />
        </svg>
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
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
          />
        </svg>
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
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
          />
        </svg>
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
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6'
          />
        </svg>
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
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
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
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
          />
        </svg>
      ),
      children: [
        { name: 'Account', href: '/settings/account', icon: null },
        { name: 'Team', href: '/settings/team', icon: null },
        { name: 'Billing', href: '/settings/billing', icon: null },
        { name: 'Security', href: '/settings/security', icon: null },
      ],
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/' && router.pathname === '/') return true;
    if (href !== '/' && router.pathname.startsWith(href)) return true;
    return false;
  };

  const NavItemComponent: React.FC<{ item: NavItem; depth?: number }> = ({
    item,
    depth = 0,
  }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);
    const isActive = isActiveLink(item.href);

    const paddingLeft = depth === 0 ? 'pl-4' : 'pl-8';

    return (
      <div className='mb-1'>
        <div className='flex items-center'>
          <Link
            href={item.href}
            className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              isActive
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${paddingLeft}`}
          >
            {item.icon && <span className='mr-3'>{item.icon}</span>}
            {!isCollapsed && (
              <>
                <span className='flex-1'>{item.name}</span>
                {item.badge && (
                  <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
          {hasChildren && !isCollapsed && (
            <button
              onClick={() => toggleExpanded(item.name)}
              className='p-1 ml-2 text-gray-400 hover:text-gray-600'
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </button>
          )}
        </div>
        {hasChildren && isExpanded && !isCollapsed && (
          <div className='mt-1 space-y-1'>
            {item.children!.map(child => (
              <NavItemComponent
                key={child.name}
                item={child}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white shadow-lg border-r border-gray-200 h-screen transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        {!isCollapsed && (
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>AI</span>
            </div>
            <div className='ml-2'>
              <h1 className='text-lg font-bold text-gray-900'>Universal AI</h1>
              <p className='text-xs text-gray-500'>Analytics Platform</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100'
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-2 py-4 overflow-y-auto'>
        <div className='space-y-2'>
          {navigation.map(item => (
            <NavItemComponent key={item.name} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className='p-4 border-t border-gray-200'>
        {!isCollapsed && (
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
              <span className='text-gray-600 font-medium text-sm'>U</span>
            </div>
            <div className='ml-2'>
              <p className='text-sm font-medium text-gray-900'>User Account</p>
              <p className='text-xs text-gray-500'>admin@company.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
