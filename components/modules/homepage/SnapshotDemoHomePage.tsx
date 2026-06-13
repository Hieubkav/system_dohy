'use client';

import React from 'react';
import { HomeComponentRenderer } from '@/components/site/home/HomeComponentRenderer';
import type { SnapshotDemoPayload } from './snapshot-demo-types';

const resolveSnapshotTheme = (mode: unknown): 'light' | 'dark' => {
  if (mode === 'dark') {return 'dark';}
  if (mode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export function SnapshotDemoHomePage({
  applyThemeBoundary = true,
  payload,
}: {
  applyThemeBoundary?: boolean;
  payload: SnapshotDemoPayload;
}) {
  const components = [...payload.components]
    .filter((component) => component.active)
    .sort((a, b) => a.order - b.order);
  const themeMode = payload.bundle.settings.site.site_dark_mode ?? 'light';
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => resolveSnapshotTheme(themeMode));

  React.useEffect(() => {
    setTheme(resolveSnapshotTheme(themeMode));
    if (themeMode !== 'system') {return;}
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setTheme(resolveSnapshotTheme(themeMode));
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const content = (
    <>
      {components.map((component) => (
        <HomeComponentRenderer
          key={component._id}
          component={component}
          snapshotComponentKey={component._id}
        />
      ))}
    </>
  );

  if (!applyThemeBoundary) {
    return content;
  }

  return (
    <div className={theme === 'dark' ? 'dark' : undefined} data-snapshot-demo-root data-theme={theme} style={{ colorScheme: theme }}>
      {content}
    </div>
  );
}
