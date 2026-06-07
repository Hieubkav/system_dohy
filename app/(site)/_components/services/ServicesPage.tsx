'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { getServicesListColors } from '@/components/site/services/colors';

function getRadiusClass(radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full') {
  switch (radius) {
    case 'none': return 'rounded-none';
    case 'sm': return 'rounded-sm';
    case 'md': return 'rounded-md';
    case 'lg': return 'rounded-lg';
    case 'xl': return 'rounded-xl';
    case '2xl': return 'rounded-2xl';
    case 'full': return 'rounded-full';
    default: return 'rounded-xl';
  }
}
import { useServicesListConfig } from '@/lib/experiences';
import { ChevronLeft, ChevronRight, Briefcase, Clock, Star } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { type ServiceSortOption } from '@/components/site/services';
import { SharedListLayout } from '@/components/shared/SharedListLayout';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';

function ServicesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#161617] rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800">
          <div className="aspect-video bg-slate-200 dark:bg-zinc-800" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-6 w-full bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  const siblingCount = 1;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftRange = 3 + 2 * siblingCount;
    for (let i = 1; i <= leftRange; i++) {
      items.push(i);
    }
    items.push('ellipsis');
    items.push(totalPages);
    return items;
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    items.push(firstPageIndex);
    items.push('ellipsis');
    const rightRange = 3 + 2 * siblingCount;
    for (let i = totalPages - rightRange + 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  items.push(firstPageIndex);
  items.push('ellipsis');
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    items.push(i);
  }
  items.push('ellipsis');
  items.push(lastPageIndex);

  return items;
}

function useEnabledServiceFields(): Set<string> {
  const fields = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'services' });
  return useMemo(() => {
    if (!fields) {return new Set<string>();}
    return new Set(fields.map(f => f.fieldKey));
  }, [fields]);
}

function ServicesListSkeleton() {
  return (
    <div className="py-8 md:py-12 px-4 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-64 bg-slate-200 dark:bg-zinc-800 rounded mx-auto" />
        </div>
        <div className="bg-white dark:bg-[#161617] rounded-xl border border-slate-200 dark:border-zinc-800 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 flex-1 max-w-xs bg-slate-200 dark:bg-zinc-800 rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-[#161617] rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800">
              <div className="aspect-video bg-slate-200 dark:bg-zinc-800" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                <div className="h-6 w-full bg-slate-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesListSkeleton />}>
      <ServicesContent />
    </Suspense>
  );
}

function ServicesContent() {
  const { primary: brandColor, secondary, mode } = useBrandColors();
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const tokens = useMemo(
    () => getServicesListColors(brandColor, secondary, mode || 'single', isDark),
    [brandColor, secondary, mode, isDark]
  );
  const listConfig = useServicesListConfig();
  const layout = listConfig.layoutStyle;
  const enabledFields = useEnabledServiceFields();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);

  const urlPage = Number(searchParams.get('page')) || 1;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ServiceSortOption>('newest');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [pageSizeOverride, setPageSizeOverride] = useState<number | null>(null);
  const postsPerPage = pageSizeOverride ?? (listConfig.postsPerPage ?? 12);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const categories = useQuery(api.serviceCategories.listActive, { limit: 20 });
  const nonEmptyCategoryIds = useQuery(api.serviceCategories.listNonEmptyCategoryIds, { limit: 20 });

  const visibleCategories = useMemo(() => {
    if (!categories) {return undefined;}
    if (!listConfig.hideEmptyCategories) {return categories;}
    if (!nonEmptyCategoryIds) {return categories;}
    const nonEmptySet = new Set(nonEmptyCategoryIds);
    return categories.filter((category) => nonEmptySet.has(category._id));
  }, [categories, listConfig.hideEmptyCategories, nonEmptyCategoryIds]);

  const categoryOptions = useMemo(
    () => visibleCategories ?? categories ?? [],
    [visibleCategories, categories]
  );

  const categorySlugFromPath = useMemo(() => {
    if (routeMode !== 'unified') {return null;}
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment || segment === 'services') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const categoryFromUrl = useMemo(() => {
    const catSlug = categorySlugFromPath ?? searchParams.get('category');
    if (!catSlug || categoryOptions.length === 0) {return null;}
    const matchedCategory = categoryOptions.find((c) => c.slug === catSlug);
    return matchedCategory?._id ?? null;
  }, [categorySlugFromPath, searchParams, categoryOptions]);

  const activeCategory = categoryFromUrl;

  const paginatedSortBy = sortBy === 'popular' ? 'popular' : (sortBy === 'oldest' ? 'oldest' : 'newest');

  const {
    results: infiniteResults,
    status: infiniteStatus,
    loadMore,
  } = usePaginatedQuery(
    api.services.listPublishedPaginated,
    {
      categoryId: activeCategory ?? undefined,
      sortBy: paginatedSortBy,
    },
    { initialNumItems: postsPerPage }
  );

  const isSearchActive = !!debouncedSearchQuery?.trim();
  const isPaginationMode = listConfig.paginationType === 'pagination' || isSearchActive;

  const offset = (urlPage - 1) * postsPerPage;
  const paginatedServices = useQuery(
    api.services.listPublishedWithOffset,
    isPaginationMode
      ? {
          categoryId: activeCategory ?? undefined,
          limit: postsPerPage,
          offset,
          search: debouncedSearchQuery || undefined,
          sortBy,
        }
      : 'skip'
  );

  const services = useMemo(() => {
    if (isPaginationMode) {
      return paginatedServices ?? [];
    }
    return infiniteResults;
  }, [infiniteResults, isPaginationMode, paginatedServices]);

  const totalCount = useQuery(api.services.countPublished, {
    categoryId: activeCategory ?? undefined,
  });

  const isSearching = !!searchQuery && searchQuery !== debouncedSearchQuery;
  const isLoadingServices = isSearching || (isSearchActive && paginatedServices === undefined) || (listConfig.paginationType === 'pagination' ? paginatedServices === undefined : infiniteStatus === 'LoadingFirstPage');

  // Build category map for O(1) lookup
  const categoryMap = useMemo(() => {
    if (!categories) return new Map<string, string>();
    return new Map(categories.map((c) => [c._id, c.name]));
  }, [categories]);

  const categorySlugMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.slug]));
  }, [categories]);

  const getServiceDetailHref = useCallback((service: { slug: string; categoryId: Id<'serviceCategories'> }) => buildDetailPath({
    categorySlug: categorySlugMap.get(service.categoryId),
    mode: routeMode,
    moduleKey: 'services',
    recordSlug: service.slug,
  }), [categorySlugMap, routeMode]);

  useEffect(() => {
    if (isPaginationMode) {
      return;
    }
    if (inView && infiniteStatus === 'CanLoadMore') {
      loadMore(postsPerPage);
    }
  }, [inView, infiniteStatus, loadMore, postsPerPage, isPaginationMode]);

  // Handlers
  const handleCategoryChange = useCallback((categoryId: Id<"serviceCategories"> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (categoryId && categoryOptions.length > 0) {
      const category = categoryOptions.find(c => c._id === categoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'services' }), { scroll: false });
          return;
        }
        params.set('category', category.slug);
      }
    } else {
      params.delete('category');
    }
    
    const newUrl = params.toString()
      ? `${buildModuleListPath('services')}?${params.toString()}`
      : buildModuleListPath('services');
    router.push(newUrl, { scroll: false });
  }, [searchParams, categoryOptions, router, routeMode]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = useCallback((sort: ServiceSortOption) => {
    setSortBy(sort);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSizeOverride(value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, pathname, router]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    const catSlug = categorySlugFromPath ?? searchParams.get('category');
    if (!catSlug || categoryOptions.length === 0) {return;}
    const hasMatch = categoryOptions.some((category) => category.slug === catSlug);
    if (hasMatch) {return;}
    if (routeMode === 'unified' && categorySlugFromPath) {
      router.replace(buildModuleListPath('services'), { scroll: false });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [categoryOptions, categorySlugFromPath, pathname, router, routeMode, searchParams]);

  const filterKey = `${activeCategory ?? ''}|${debouncedSearchQuery}|${sortBy}|${postsPerPage}`;
  const prevFilterKeyRef = useRef(filterKey);

  useEffect(() => {
    if (listConfig.paginationType !== 'pagination') {
      prevFilterKeyRef.current = filterKey;
      return;
    }

    const hasFilterChanged = prevFilterKeyRef.current !== filterKey;
    if (hasFilterChanged && urlPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    prevFilterKeyRef.current = filterKey;
  }, [filterKey, listConfig.paginationType, pathname, router, searchParams, urlPage]);

  const [brokenThumbnails, setBrokenThumbnails] = useState<Set<string>>(new Set());

  const markThumbnailBroken = useCallback((id: Id<"services">) => {
    setBrokenThumbnails((prev) => {
      const key = String(id);
      if (prev.has(key)) {return prev;}
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const formatPriceValue = (price?: number): string => {
    if (price === undefined || price === null) {return 'Liên hệ';} 
    return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  };

  const ServiceGridCard = ({ service }: { service: typeof services[number] }) => {
    const showImage = Boolean(service.thumbnail) && !brokenThumbnails.has(String(service._id));
    const showExcerpt = enabledFields.has('excerpt');
    const showPrice = enabledFields.has('price');
    const showDuration = enabledFields.has('duration');
    const showFeatured = enabledFields.has('featured');
    const cardRadiusClass = getRadiusClass('lg');

    return (
      <Link href={getServiceDetailHref(service)} className="group block h-full">
        <article
          className={`overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border h-full flex flex-col bg-white dark:bg-[#161617] dark:border-zinc-800 ${cardRadiusClass}`}
          style={{ borderColor: tokens.cardBorder }}
        >
          <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-[#1c1c1e]" style={{ backgroundColor: tokens.cardBorder }}>
            {showImage ? (
              <Image
                src={service.thumbnail as string}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                mode="thumb"
                onLoadingComplete={(img) => {
                  if (img.naturalWidth === 0) {
                    markThumbnailBroken(service._id);
                  }
                }}
                onError={() => { markThumbnailBroken(service._id); }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[120px]">
                <Briefcase size={32} style={{ color: tokens.neutralTextLight }} />
              </div>
            )}
            {showFeatured && service.featured && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1">
                <Star size={10} className="fill-current" /> Nổi bật
              </div>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              {categoryMap.get(service.categoryId) && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: tokens.badgeBg,
                    color: tokens.badgeText,
                  }}
                >
                  {categoryMap.get(service.categoryId)}
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold line-clamp-2 flex-1 text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" style={{ color: tokens.bodyText }}>
              {service.title}
            </h2>
            {showExcerpt && service.excerpt && (
              <p className="text-xs line-clamp-2 mt-1.5 text-slate-500 dark:text-slate-405 leading-relaxed">{service.excerpt}</p>
            )}
            <div
              className="flex items-center justify-between text-xs mt-2.5 pt-2.5 border-t"
              style={{ color: tokens.neutralTextLight, borderColor: tokens.cardBorder }}
            >
              <div className="flex items-center gap-2">
                {showDuration && service.duration && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {service.duration}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showPrice && (
                  <span className="font-bold text-sm" style={{ color: tokens.priceColor }}>
                    {formatPriceValue(service.price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  };

  const ServiceListCard = ({ service }: { service: typeof services[number] }) => {
    const showImage = Boolean(service.thumbnail) && !brokenThumbnails.has(String(service._id));
    const showExcerpt = enabledFields.has('excerpt');
    const showPrice = enabledFields.has('price');
    const showDuration = enabledFields.has('duration');
    const showFeatured = enabledFields.has('featured');
    const cardRadiusClass = getRadiusClass('lg');

    return (
      <Link href={getServiceDetailHref(service)} className="group block">
        <article
          className={`overflow-hidden hover:shadow-md transition-all duration-350 border bg-white dark:bg-[#161617] dark:border-zinc-800 ${cardRadiusClass}`}
          style={{ borderColor: tokens.cardBorder }}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="sm:w-40 md:w-48 flex-shrink-0">
              <div className="aspect-video sm:aspect-[4/3] sm:h-full overflow-hidden relative bg-slate-100 dark:bg-[#1c1c1e]" style={{ backgroundColor: tokens.cardBorder }}>
                {showImage ? (
                  <Image
                    src={service.thumbnail as string}
                    alt={service.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    mode="thumb"
                    onLoadingComplete={(img) => {
                      if (img.naturalWidth === 0) {
                        markThumbnailBroken(service._id);
                      }
                    }}
                    onError={() => { markThumbnailBroken(service._id); }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center min-h-[100px]">
                    <Briefcase size={28} style={{ color: tokens.neutralTextLight }} />
                  </div>
                )}
                {showFeatured && service.featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1">
                    <Star size={10} className="fill-current" /> Nổi bật
                  </div>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5">
                {categoryMap.get(service.categoryId) && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      backgroundColor: tokens.badgeBg,
                      color: tokens.badgeText,
                    }}
                  >
                    {categoryMap.get(service.categoryId)}
                  </span>
                )}
                <span className="text-xs text-slate-450 dark:text-zinc-500">
                  {service.publishedAt ? new Date(service.publishedAt).toLocaleDateString('vi-VN') : ''}
                </span>
              </div>
              <h2 className="text-sm font-bold line-clamp-2 mb-1.5 leading-snug text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" style={{ color: tokens.bodyText }}>
                {service.title}
              </h2>
              {showExcerpt && service.excerpt && (
                <p className="text-xs line-clamp-2 mb-2 leading-relaxed text-slate-500 dark:text-slate-400" style={{ color: tokens.metaText }}>{service.excerpt}</p>
              )}
              <div className="flex items-center justify-between text-xs mt-1 text-slate-450 dark:text-zinc-500">
                <div className="flex items-center gap-2">
                  {showDuration && service.duration && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {service.duration}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {showPrice && (
                    <span className="font-bold text-sm" style={{ color: tokens.priceColor }}>
                      {formatPriceValue(service.price)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  };

  const paginationBar = isPaginationMode && totalCount && totalCount > postsPerPage && (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <div className="order-2 flex w-full items-center justify-between text-sm sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-zinc-400">Hiển thị</span>
          <select
            value={postsPerPage}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] px-2 text-sm font-medium shadow-sm focus:outline-none text-slate-705 dark:text-[#f5f5f7]"
            aria-label="Số dịch vụ mỗi trang"
          >
            {[12, 20, 24, 48].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-slate-500 dark:text-zinc-400">dịch vụ/trang</span>
        </div>

        <div>
          <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">
            {totalCount ? ((urlPage - 1) * postsPerPage) + 1 : 0}–{Math.min(urlPage * postsPerPage, totalCount)}
          </span>
          <span className="mx-1 text-slate-300 dark:text-zinc-700">/</span>
          <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">{totalCount}</span>
          <span className="ml-1 text-slate-500">dịch vụ</span>
        </div>
      </div>

      <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
        <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
          <button
            onClick={() => handlePageChange(urlPage - 1)}
            disabled={urlPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] text-slate-700 dark:text-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {generatePaginationItems(urlPage, Math.ceil(totalCount / postsPerPage)).map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">
                  …
                </div>
              );
            }

            const pageNum = item as number;
            const isActive = pageNum === urlPage;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-sm border font-medium'
                    : 'text-slate-700 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-[#2c2c2e]'
                }`}
                style={isActive ? {
                  backgroundColor: brandColor,
                  borderColor: brandColor,
                  color: '#fff',
                } : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(urlPage + 1)}
            disabled={urlPage === Math.ceil(totalCount / postsPerPage)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] text-slate-705 dark:text-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );

  const infiniteScrollTrigger = !isPaginationMode && (
    <>
      {infiniteStatus !== 'Exhausted' && (
        <div ref={loadMoreRef} className="text-center py-6 w-full animate-pulse">
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <div className="w-2 h-2 rounded-full bg-slate-400 delay-75" />
            <div className="w-2 h-2 rounded-full bg-slate-400 delay-150" />
          </div>
        </div>
      )}
      {infiniteStatus === 'Exhausted' && services.length > 0 && (
        <div className="text-center py-6 w-full">
          <p className="text-sm text-slate-450 dark:text-zinc-500">Đã hiển thị tất cả {services.length} dịch vụ</p>
        </div>
      )}
    </>
  );

  const activeCategoryName = activeCategory && categoryMap ? categoryMap.get(activeCategory as any) : null;

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-black font-active transition-colors duration-200">
      <SharedListLayout
        items={services}
        totalCount={totalCount ?? 0}
        isLoading={isLoadingServices}
        unit="dịch vụ"
        layoutStyle={layout}
        gridColumns={listConfig.gridColumns}
        cornerRadius="lg"
        showSearch={listConfig.showSearch}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm dịch vụ..."
        sortBy={sortBy}
        onSortChange={handleSortChange}
        sortOptions={[
          { value: 'newest', label: 'Mới nhất' },
          { value: 'oldest', label: 'Cũ nhất' },
          { value: 'popular', label: 'Xem nhiều nhất' },
          { value: 'title', label: 'Tên A-Z' },
          { value: 'title_desc', label: 'Tên Z-A' },
        ]}
        hasActiveFilters={!!activeCategory || !!searchQuery}
        onClearFilters={() => {
          setSearchQuery('');
          setDebouncedSearchQuery('');
          setSortBy('newest');
          handleCategoryChange(null);
        }}
        renderItem={(service) => layout === 'list' ? <ServiceListCard key={service._id} service={service} /> : <ServiceGridCard key={service._id} service={service} />}
        renderSkeleton={() => <ServicesGridSkeleton count={postsPerPage} />}
        renderSidebarFilters={() => listConfig.showCategories && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2 dark:text-[#f5f5f7]">Danh mục</h3>
            <ul className="space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryChange(null)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${!activeCategory ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                  style={!activeCategory ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColor}18`, color: brandColor } : undefined}
                >
                  Tất cả
                </button>
              </li>
              {categoryOptions.map((category) => (
                <li key={category._id}>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(category._id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${activeCategory === category._id ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                    style={activeCategory === category._id ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColor}18`, color: brandColor } : undefined}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        renderToolbarFilters={() => listConfig.showCategories && (
          <div className="relative">
            <select
              value={activeCategory ?? ''}
              onChange={(event) => handleCategoryChange((event.target.value as any) || null)}
              className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white dark:bg-[#1c1c1e] dark:border-zinc-700 dark:text-[#f5f5f7] text-xs outline-none font-medium appearance-none min-w-[140px]"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <option value="">Tất cả danh mục</option>
              {categoryOptions.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
        renderMobileFilters={(closeSheet) => listConfig.showCategories && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm dark:text-[#f5f5f7]">Danh mục</h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { handleCategoryChange(null); closeSheet(); }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${!activeCategory ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                style={!activeCategory ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColor}18`, color: brandColor } : undefined}
              >
                Tất cả
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => { handleCategoryChange(category._id); closeSheet(); }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${activeCategory === category._id ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                  style={activeCategory === category._id ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColor}18`, color: brandColor } : undefined}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
        paginationNode={paginationBar}
        infiniteScrollTriggerNode={infiniteScrollTrigger}
        headerTitle={activeCategoryName ?? 'Dịch vụ của chúng tôi'}
        brandColor={brandColor}
        isDark={isDark}
      />
    </div>
  );
}
