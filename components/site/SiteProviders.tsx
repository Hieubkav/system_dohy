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

    const applyTheme = () => {
      const override = localStorage.getItem('site_theme_override');
      let isDark = false;
      if (override === 'dark') {
        isDark = true;
      } else if (override === 'light') {
        isDark = false;
      } else {
        isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      }

      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      root.style.colorScheme = isDark ? 'dark' : 'light';
      root.classList.toggle('dark', isDark);
    };

    applyTheme();

    window.addEventListener('site-theme-change', applyTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      applyTheme();
    };
    if (siteDarkMode === 'system') {
      mediaQuery.addEventListener('change', handleSystemChange);
    }

    return () => {
      window.removeEventListener('site-theme-change', applyTheme);
      if (siteDarkMode === 'system') {
        mediaQuery.removeEventListener('change', handleSystemChange);
      }
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
