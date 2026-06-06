'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CustomerAuthProvider } from '@/app/(site)/auth/context';
import { CartProvider } from '@/lib/cart';

import { useSiteSettings } from './hooks';

const CustomToaster = dynamic(
  () => import('@/components/shared/CustomToaster').then((mod) => ({ default: mod.CustomToaster })),
  { ssr: false, loading: () => null }
);

export function SiteProviders({ children }: { children: React.ReactNode }) {
  const { siteDarkMode, isLoading } = useSiteSettings();
  const previousThemeRef = useRef<{
    colorScheme: string;
    dataTheme: string | null;
    hasDarkClass: boolean;
  } | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const root = document.documentElement;
    previousThemeRef.current = {
      colorScheme: root.style.colorScheme,
      dataTheme: root.getAttribute('data-theme'),
      hasDarkClass: root.classList.contains('dark'),
    };

    const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.classList.toggle('dark', isDark);

    if (siteDarkMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        root.style.colorScheme = e.matches ? 'dark' : 'light';
        root.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
        const previous = previousThemeRef.current;
        if (!previous) {return;}
        if (previous.dataTheme) {
          root.setAttribute('data-theme', previous.dataTheme);
        } else {
          root.removeAttribute('data-theme');
        }
        root.style.colorScheme = previous.colorScheme;
        root.classList.toggle('dark', previous.hasDarkClass);
      };
    }

    return () => {
      const previous = previousThemeRef.current;
      if (!previous) {return;}
      if (previous.dataTheme) {
        root.setAttribute('data-theme', previous.dataTheme);
      } else {
        root.removeAttribute('data-theme');
      }
      root.style.colorScheme = previous.colorScheme;
      root.classList.toggle('dark', previous.hasDarkClass);
    };
  }, [siteDarkMode, isLoading]);

  return (
    <CustomerAuthProvider>
      <CartProvider>
        {children}
        <CustomToaster richColors position="top-right" />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
