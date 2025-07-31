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
            : 'text-neutral-700'
        )}
        data-oid='7ohc7wl'
      />
    ),
  }));

  return (
    <Sidebar open={open} setOpen={setOpen} data-oid='lqe_l9d'>
      <SidebarBody className='justify-between gap-10' data-oid=':g7czth'>
        <div
          className='flex flex-col flex-1 overflow-y-auto overflow-x-hidden'
          data-oid='7_rcz.d'
        >
          {open ? <Logo data-oid='v6qc3u9' /> : <LogoIcon data-oid='.daju_l' />}
          <div className='mt-8 flex flex-col gap-2' data-oid='0_ktc9n'>
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} data-oid='r97jk-i' />
            ))}
          </div>
        </div>
        <div data-oid='f:ablxt'>
          <SidebarLink
            link={{
              label: 'User',
              href: '#',
              icon: (
                <div
                  className='h-7 w-7 flex-shrink-0 rounded-full bg-neutral-300 flex items-center justify-center'
                  data-oid='-4k2ohw'
                >
                  <span
                    className='text-neutral-700 text-sm font-medium'
                    data-oid='weh-d1f'
                  >
                    U
                  </span>
                </div>
              ),
            }}
            data-oid='fltee82'
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
      data-oid='-_fwekm'
    >
      <div
        className='h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0'
        data-oid='y0hgett'
      />

      <span
        className='font-medium text-black whitespace-pre'
        data-oid='ue-h8:0'
      >
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
      data-oid='o7aq:80'
    >
      <div
        className='h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0'
        data-oid='uyzag53'
      />
    </Link>
  );
};
