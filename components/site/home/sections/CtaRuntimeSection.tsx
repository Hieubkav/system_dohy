'use client';

import React from 'react';
import { CTASectionShared } from '@/app/admin/home-components/cta/_components/CTASectionShared';
import { getCTAColors } from '@/app/admin/home-components/cta/_lib/colors';
import type { CTAConfig, CTAStyle } from '@/app/admin/home-components/cta/_types';
import type { HomeComponentSectionProps } from '../types';

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function CtaRuntimeSection({ config, brandColor, secondary, mode, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const ctaConfig = config as Partial<CTAConfig> & { style?: CTAStyle };
  const style = ctaConfig.style ?? 'banner';
  const tokens = adaptTokensForDarkMode(getCTAColors({ primary: brandColor, secondary, mode, style }), isDark ?? false);

  return (
    <CTASectionShared
      config={{
        badge: ctaConfig.badge ?? '',
        buttonLink: ctaConfig.buttonLink ?? '',
        buttonText: ctaConfig.buttonText ?? '',
        description: ctaConfig.description ?? '',
        secondaryButtonLink: ctaConfig.secondaryButtonLink ?? '',
        secondaryButtonText: ctaConfig.secondaryButtonText ?? '',
        spacing: ctaConfig.spacing,
        cornerRadius: ctaConfig.cornerRadius,
        noBorderRadius: ctaConfig.noBorderRadius,
        noVerticalMargin: ctaConfig.noVerticalMargin,
        containerWidth: ctaConfig.containerWidth,
        title: ctaConfig.title ?? '',
      }}
      style={style}
      tokens={tokens}
      context="site"
    />
  );
}
