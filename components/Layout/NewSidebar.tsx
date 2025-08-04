'use client';

import { motion } from 'framer-motion';
import {
    BarChart3,
    Brain,
    Building2,
    ChevronRight,
    LayoutDashboard,
    Puzzle,
    Settings,
    TestTube,
    User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Sidebar, SidebarBody, SidebarLink } from '../ui/sidebar';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

export function NewSidebar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
        <LayoutDashboard
          className='text-gray-700 h-5 w-5 flex-shrink-0'
          data-oid='k47cdl3'
        />
      ),
    },
    {
      name: 'A/B Testing',
      href: '/ab-testing',
      icon: (
        <TestTube
          className='text-gray-700 h-5 w-5 flex-shrink-0'
          data-oid='5w4btd2'
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
          className='text-gray-700 h-5 w-5 flex-shrink-0'
          data-oid='me35bpp'
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
        <Brain
          className='text-gray-700 h-5 w-5 flex-shrink-0'
          data-oid='yl1g.md'
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
        <Building2
          className='text-gray-700 h-5 w-5 flex-shrink-0'
          data-oid='_dtb61i'
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
        <Puzzle
          className='text-gray-700 h-5 w-5 flex-shrink-0'
          data-oid='ntwz7.1'
        />
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
        <Settings
          className='text-gray-700 h-5 w-5 flex-shrink-0'
          data-oid='uucd0k:'
        />
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
    if (href === '/' && router.pathname === '/') return true;
    if (href !== '/' && router.pathname.startsWith(href)) return true;
    return false;
  };

  // Handle nested navigation separately
  const NavItemWithChildren: React.FC<{ item: NavItem }> = ({ item }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);
    const isActive = isActiveLink(item.href);

    if (!hasChildren) {
      return (
        <SidebarLink
          link={{
            label: item.name,
            href: item.href,
            icon: item.icon,
          }}
          className={cn(
            'relative',
            isActive && 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
          )}
          data-oid='k0e_qxc'
        />
      );
    }

    return (
      <div className='mb-1' data-oid='mufvrk0'>
        <div className='flex items-center' data-oid='hokv.6a'>
          <Link
            href={item.href}
            className={cn(
              'flex items-center justify-start gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors flex-1',
              isActive && 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
            )}
            data-oid='688ibf9'
          >
            {item.icon}
            <motion.span
              animate={{
                display: open ? 'inline-block' : 'none',
                opacity: open ? 1 : 0,
              }}
              className='text-gray-700 text-sm transition duration-150 whitespace-pre inline-block !p-0 !m-0 flex-1'
              data-oid='ix2a74v'
            >
              {item.name}
            </motion.span>
            {item.badge && open && (
              <span
                className='inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'
                data-oid=':wuks.u'
              >
                {item.badge}
              </span>
            )}
          </Link>
          {hasChildren && open && (
            <button
              onClick={() => toggleExpanded(item.name)}
              className='p-1 ml-2 text-gray-400 hover:text-gray-600'
              data-oid='s9m2r-b'
            >
              <ChevronRight
                className={cn(
                  'w-4 h-4 transform transition-transform',
                  isExpanded && 'rotate-90'
                )}
                data-oid='v15vi3u'
              />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && open && (
          <div className='mt-1 space-y-1 ml-4' data-oid='s2uiggh'>
            {item.children!.map(child => (
              <Link
                key={child.name}
                href={child.href}
                className={cn(
                  'block px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors',
                  isActiveLink(child.href) && 'bg-blue-50 text-blue-700'
                )}
                data-oid='-qjlq_2'
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='h-screen flex flex-col' data-oid='1ixjseb'>
      <Sidebar open={open} setOpen={setOpen} data-oid='wsc4grl'>
        <SidebarBody className='justify-between gap-10' data-oid='ifzmt_l'>
          <div
            className='flex flex-col flex-1 overflow-y-auto overflow-x-hidden'
            data-oid='t-d07n2'
          >
            {/* Logo */}
            {open ? (
              <Logo data-oid='keh1j6h' />
            ) : (
              <LogoIcon data-oid='a_5l795' />
            )}

            {/* Navigation */}
            <div className='mt-8 flex flex-col gap-2' data-oid='a:zo0hp'>
              {navigation.map(item => (
                <NavItemWithChildren
                  key={item.name}
                  item={item}
                  data-oid='v1:qhy_'
                />
              ))}
            </div>
          </div>

          {/* User Section */}
          <div data-oid='kobn4o2'>
            <SidebarLink
              link={{
                label: 'User Account',
                href: '#',
                icon: (
                  <div
                    className='h-7 w-7 bg-gray-300 rounded-full flex items-center justify-center'
                    data-oid='dao8wff'
                  >
                    <User
                      className='h-4 w-4 text-gray-600'
                      data-oid='6_.zj3p'
                    />
                  </div>
                ),
              }}
              data-oid='s.hk-ju'
            />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href='/'
      className='font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20'
      data-oid='ql-y28:'
    >
      <div
        className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0'
        data-oid='wgif.2b'
      >
        <span className='text-white font-bold text-sm' data-oid='h34-iox'>
          AI
        </span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='flex flex-col'
        data-oid='oorm_-_'
      >
        <span
          className='font-bold text-gray-900 text-xl whitespace-pre'
          data-oid='ed1-6ew'
        >
          Universal AI
        </span>
        <span
          className='text-xs text-gray-500 whitespace-pre'
          data-oid='ptg.pgz'
        >
          Analytics Platform
        </span>
      </motion.div>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href='/'
      className='font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20'
      data-oid='b8wioru'
    >
      <div
        className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0'
        data-oid='iz1x.cj'
      >
        <span className='text-white font-bold text-sm' data-oid='2nw7q7d'>
          AI
        </span>
      </div>
    </Link>
  );
};
