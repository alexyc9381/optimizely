import {
  BarChart3,
  Beaker,
  Building2,
  Cog,
  Home,
  Plug,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Sidebar, SidebarBody, SidebarLink } from '../ui/sidebar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    label: 'A/B Testing',
    href: '/ab-testing',
    icon: Beaker,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'AI Models',
    href: '/models',
    icon: Zap,
  },
  {
    label: 'Industries',
    href: '/industries',
    icon: Building2,
  },
  {
    label: 'Integrations',
    href: '/integrations',
    icon: Plug,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Cog,
  },
];

export function NewSidebar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = navItems.map(item => ({
    label: item.label,
    href: item.href,
    icon: (
      <item.icon
        className={cn(
          'h-5 w-5 flex-shrink-0',
          router.pathname === item.href
            ? 'text-neutral-200'
            : 'text-neutral-700 dark:text-neutral-200'
        )}
      />
    ),
  }));

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className='justify-between gap-10'>
        <div className='flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
          {open ? <Logo /> : <LogoIcon />}
          <div className='mt-8 flex flex-col gap-2'>
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div>
          <SidebarLink
            link={{
              label: 'User',
              href: '#',
              icon: (
                <div className='h-7 w-7 flex-shrink-0 rounded-full bg-neutral-300 flex items-center justify-center'>
                  <span className='text-neutral-700 text-sm font-medium'>
                    U
                  </span>
                </div>
              ),
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <Link
      href='/'
      className='font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20'
    >
      <div className='h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0' />

      <span className='font-medium text-black dark:text-white whitespace-pre'>
        Optelo
      </span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href='/'
      className='font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20'
    >
      <div className='h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0' />
    </Link>
  );
};
