'use client';

import type { ImageAspectRatioInput } from '@/lib/products/image-aspect-ratio';
import type { PartnersStyle } from '../_types';

export const PARTNERS_STYLES = [
  { id: 'grid' as const, label: 'Grid' },
  { id: 'marquee' as const, label: 'Marquee' },
  { id: 'badge' as const, label: 'Badge' },
  { id: 'carousel' as const, label: 'Carousel' },
  { id: 'logoCloud' as const, label: 'Logo Cloud' },
  { id: 'clean' as const, label: 'Clean' },
  { id: 'divider' as const, label: 'Divider' },
];

export const PARTNERS_CROP_ASPECT_RATIO_BY_STYLE: Record<PartnersStyle, ImageAspectRatioInput> = {
  grid: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  marquee: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  badge: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  carousel: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  logoCloud: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  clean: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  divider: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
};
