'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Bookmark, ChevronDown, FileText, Filter, Search, SlidersHorizontal, Star, X, Check } from 'lucide-react';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { useResourcesListConfig } from '@/lib/experiences';

const formatPrice = (pricingType: string, price?: number) => {
  if (pricingType === 'free') {return 'Miễn phí';}
  if (pricingType === 'contact') {return 'Liên hệ';}
  if (!price) {return 'Liên hệ';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

const getRadiusClass = (radius?: 'none' | 'sm' | 'lg', type: 'card' | 'input' | 'panel' = 'card') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') {
    if (type === 'panel') return 'rounded-xl';
    return 'rounded-lg';
  }
  if (type === 'panel') return 'rounded-2xl';
  return 'rounded-xl';
};

type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
};

type AssignedResourceFilterValue = {
  _id: Id<'resourceFilterValues'>;
  name: string;
  slug: string;
  icon?: string;
};

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
  cornerRadius = 'lg',
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  cornerRadius?: 'none' | 'sm' | 'lg';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={containerRef} className="relative w-full min-w-[170px] sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-11 w-full items-center justify-between gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] px-3.5 text-sm font-medium text-slate-700 dark:text-[#f5f5f7] shadow-sm transition hover:bg-slate-50 dark:hover:bg-[#2c2c2e] ${getRadiusClass(cornerRadius, 'input')}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedOption.icon} alt={selectedOption.label} className="h-4 w-4 object-contain shrink-0" />
          ) : (
            icon
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className={`absolute left-0 right-0 z-30 mt-1.5 max-h-60 min-w-[180px] overflow-y-auto border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#161617] p-1 shadow-lg ${getRadiusClass(cornerRadius, 'input')}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${option.value === value ? 'bg-slate-50 dark:bg-[#2c2c2e] font-semibold text-slate-900 dark:text-[#f5f5f7]' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
            >
              {option.icon && (
                <img src={option.icon} alt={option.label} className="h-4 w-4 mr-2 object-contain shrink-0" />
              )}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({
  values,
  onChange,
  onClear,
  options,
  placeholder,
  icon,
  cornerRadius = 'lg',
  brandColor = '#4f46e5',
}: {
  values: string[];
  onChange: (value: string) => void;
  onClear: () => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  cornerRadius?: 'none' | 'sm' | 'lg';
  brandColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter((opt) => opt.value !== '' && values.includes(opt.value));
  const hasSelection = selectedOptions.length > 0;

  const displayLabel = useMemo(() => {
    if (!hasSelection) return placeholder;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions[0].label} (+${selectedOptions.length - 1})`;
  }, [hasSelection, selectedOptions, placeholder]);

  const displayIcon = useMemo(() => {
    if (selectedOptions.length === 1 && selectedOptions[0].icon) {
      return <img src={selectedOptions[0].icon} alt="" className="h-4 w-4 object-contain shrink-0" />;
    }
    return icon;
  }, [selectedOptions, icon]);

  return (
    <div ref={containerRef} className="relative w-full min-w-[170px] sm:w-auto">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-11 w-full items-center justify-between gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] px-3.5 text-sm font-medium text-slate-700 dark:text-[#f5f5f7] shadow-sm transition hover:bg-slate-50 dark:hover:bg-[#2c2c2e] ${getRadiusClass(cornerRadius, 'input')}`}
        >
          <span className="flex items-center gap-2 truncate">
            {displayIcon}
            <span className="truncate">{displayLabel}</span>
          </span>
          <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {hasSelection && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Xóa bộ lọc"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] text-slate-400 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-650 dark:hover:text-[#f5f5f7] transition shadow-sm"
            style={{ borderRadius: cornerRadius === 'none' ? '0' : cornerRadius === 'sm' ? '8px' : '12px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={`absolute left-0 right-0 z-30 mt-1.5 max-h-72 min-w-[200px] overflow-y-auto border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#161617] p-1.5 shadow-lg ${getRadiusClass(cornerRadius, 'input')}`}>
          <button
            type="button"
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors rounded-lg ${!hasSelection ? 'bg-slate-50 dark:bg-[#2c2c2e] font-semibold text-slate-900 dark:text-[#f5f5f7]' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
          >
            <span className="truncate">Tất cả phần mềm</span>
            {!hasSelection && <Check size={14} style={{ color: brandColor }} className="shrink-0" />}
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

          {options
            .filter((opt) => opt.value !== '')
            .map((option) => {
              const isSelected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors rounded-lg ${
                    isSelected ? 'font-semibold font-bold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'
                  }`}
                  style={isSelected ? { backgroundColor: `${brandColor}12`, color: brandColor } : undefined}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon && (
                      <img src={option.icon} alt={option.label} className="h-4 w-4 object-contain shrink-0" />
                    )}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {isSelected && <Check size={14} style={{ color: brandColor }} className="shrink-0" />}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<ResourcesSkeleton />}>
      <ResourcesContent />
    </Suspense>
  );
}

function ResourcesContent() {
  const brandColors = useBrandColors();
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const config = useResourcesListConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const urlPage = Math.max(Number(searchParams.get('page')) || 1, 1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title'>('newest');
  const [categoryQuery, setCategoryQuery] = useState('');
  const postsPerPage = config.postsPerPage ?? 12;
  const [visibleLimit, setVisibleLimit] = useState(postsPerPage);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setVisibleLimit(postsPerPage);
  }, [debouncedSearch, postsPerPage, sortBy, searchParams.get('filter')]);

  const categories = useQuery(api.resourceCategories.listActive, { limit: 100 });
  const nonEmptyCategoryIds = useQuery(
    api.resourceCategories.listNonEmptyCategoryIds,
    config.hideEmptyCategories ? { limit: 100 } : 'skip'
  );
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    categories?.forEach((category) => { map.set(category._id, { name: category.name, slug: category.slug }); });
    return map;
  }, [categories]);

  const visibleCategories = useMemo(() => {
    if (!categories) {return [];}
    if (!config.hideEmptyCategories || !nonEmptyCategoryIds) {return categories;}
    const allowed = new Set(nonEmptyCategoryIds);
    return categories.filter((category) => allowed.has(category._id));
  }, [categories, config.hideEmptyCategories, nonEmptyCategoryIds]);

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return visibleCategories;
    return visibleCategories.filter((category) => category.name.toLowerCase().includes(query));
  }, [visibleCategories, categoryQuery]);

  const categorySlugFromPath = useMemo(() => {
    if (routeMode !== 'unified') {return null;}
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment || segment === 'resources') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const activeCategoryId = useMemo(() => {
    const categorySlug = categorySlugFromPath ?? searchParams.get('category');
    if (!categorySlug || !categories) {return null;}
    return categories.find((category) => category.slug === categorySlug)?._id ?? null;
  }, [categories, categorySlugFromPath, searchParams]);

  const activeCategoryName = useMemo(() => {
    if (!activeCategoryId || !categories) return null;
    return categories.find((category) => category._id === activeCategoryId)?.name ?? null;
  }, [activeCategoryId, categories]);

  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });
  const activeFilters = useQuery(api.resourceFilters.listActive, {});
  const allFilterValues = useQuery(api.resourceFilters.listAllValues, {});

  const activeFilterSlugs = useMemo(() => {
    const raw = searchParams.get('filter');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const activeValueIds = useMemo(() => {
    if (activeFilterSlugs.length === 0 || !allFilterValues) return [];
    return activeFilterSlugs
      .map((filterSlug) => allFilterValues.find((value) => value.slug === filterSlug)?._id)
      .filter((id): id is Id<'resourceFilterValues'> => id !== undefined);
  }, [activeFilterSlugs, allFilterValues]);

  const isSearchActive = debouncedSearch.length > 0;
  const isPaginationMode = config.paginationType === 'pagination' || isSearchActive || activeFilterSlugs.length > 0;
  const offset = isPaginationMode ? (urlPage - 1) * postsPerPage : 0;
  const resourcesLimit = isPaginationMode ? postsPerPage : visibleLimit;
  const resources = useQuery(api.resources.listPublishedWithOffset, {
    categoryId: activeCategoryId ?? undefined,
    limit: resourcesLimit,
    offset,
    search: debouncedSearch || undefined,
    sortBy,
    valueIds: activeValueIds.length > 0 ? activeValueIds : undefined,
  });
  const totalCount = useQuery(api.resources.countPublished, {
    categoryId: activeCategoryId ?? undefined,
    search: debouncedSearch || undefined,
    valueIds: activeValueIds.length > 0 ? activeValueIds : undefined,
  });

  const resourceIds = useMemo(() => resources?.map((resource) => resource._id) ?? [], [resources]);
  const assignments = useQuery(api.resourceFilters.listAssignmentsByResources, { resourceIds: resourceIds.length > 0 ? resourceIds : [] });
  const resourceFiltersMap = useMemo(() => {
    const map = new Map<string, AssignedResourceFilterValue[]>();
    assignments?.forEach((item) => {
      map.set(item.resourceId, item.values);
    });
    return map;
  }, [assignments]);

  useEffect(() => {
    if (urlPage === 1) {return;}
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [activeCategoryId, debouncedSearch, searchParams.get('filter'), pathname, router, searchParams, sortBy, urlPage]);

  const handleCategoryChange = useCallback((nextCategoryId: Id<'resourceCategories'> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (nextCategoryId) {
      const category = categories?.find((item) => item._id === nextCategoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'resources' }), { scroll: false });
          return;
        }
        params.set('category', category.slug);
      }
    } else {
      params.delete('category');
    }

    const nextUrl = params.toString()
      ? `${buildModuleListPath('resources')}?${params.toString()}`
      : buildModuleListPath('resources');
    router.push(nextUrl, { scroll: false });
  }, [categories, routeMode, router, searchParams]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, router, searchParams]);

  const handleFilterChange = useCallback((filterSlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (filterSlug === null) {
      params.delete('filter');
    } else {
      const current = params.get('filter')?.split(',').filter(Boolean) ?? [];
      const next = current.includes(filterSlug)
        ? current.filter((slug) => slug !== filterSlug)
        : [...current, filterSlug];
      if (next.length > 0) {
        params.set('filter', next.join(','));
      } else {
        params.delete('filter');
      }
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  const resourceItems = resources ?? [];
  const totalResources = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResources / postsPerPage));
  const isLoading = resources === undefined || categories === undefined;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black font-active text-slate-700 dark:text-zinc-200 transition-colors duration-200" style={{ fontFamily: 'var(--font-be-vietnam-pro), sans-serif' }}>
      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f7]">{activeCategoryName ?? 'Tài nguyên'}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Tải ebook, template, checklist và tài liệu hữu ích.</p>
          </div>

          <div className={config.layoutStyle === 'sidebar' || config.layoutStyle === 'list' ? 'grid gap-6 lg:grid-cols-[280px_1fr]' : 'space-y-6'}>
            {(config.showSearch || config.showCategories) && (
              config.layoutStyle === 'sidebar' || config.layoutStyle === 'list' ? (
                <aside className="space-y-4 lg:block flex-shrink-0">
                  {config.showSearch && (
                    <div className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-4 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        <Search size={14} className="text-slate-400" />
                        Tìm kiếm
                      </h3>
                      <div className="relative">
                        <input
                          value={search}
                          onChange={(event) => { setSearch(event.target.value); }}
                          placeholder="Tìm tài nguyên..."
                          className={`h-11 w-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-[#f5f5f7] pl-10 pr-3 text-sm outline-none transition-colors focus:border-slate-300 dark:focus:border-zinc-700 ${getRadiusClass(config.cornerRadius, 'input')}`}
                        />
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  )}

                  {config.showCategories && (
                    <div className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-4 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        <Bookmark size={14} className="text-slate-400" />
                        Danh mục tài nguyên
                      </h3>
                      {visibleCategories.length > 8 && (
                        <div className="relative mb-2">
                          <input
                            type="text"
                            placeholder="Tìm nhanh danh mục..."
                            value={categoryQuery}
                            onChange={(event) => setCategoryQuery(event.target.value)}
                            className={`w-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-[#f5f5f7] py-2 pl-9 pr-9 text-xs outline-none transition-colors focus:border-slate-300 dark:focus:border-zinc-700 ${getRadiusClass(config.cornerRadius, 'input')}`}
                          />
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          {categoryQuery && (
                            <button type="button" onClick={() => setCategoryQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 opacity-60 hover:opacity-100">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      )}
                      <div className={`space-y-1 ${visibleCategories.length > 8 ? 'max-h-60 overflow-y-auto pr-1' : ''}`}>
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(null)}
                          className={`w-full rounded-lg border border-transparent px-3.5 py-2 text-left text-sm transition-colors ${!activeCategoryId ? 'font-semibold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                          style={!activeCategoryId ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary, borderColor: isDark ? '#3a3a3c' : 'transparent' } : undefined}
                        >
                          Tất cả danh mục
                        </button>
                        {filteredCategories.map((category) => (
                          <button
                            key={category._id}
                            type="button"
                            onClick={() => handleCategoryChange(category._id)}
                            className={`w-full rounded-lg border border-transparent px-3.5 py-2 text-left text-sm transition-colors ${activeCategoryId === category._id ? 'font-semibold' : 'text-slate-600 dark:text-zinc-405 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                            style={activeCategoryId === category._id ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary, borderColor: isDark ? '#3a3a3c' : 'transparent' } : undefined}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {resourceFiltersFeature?.enabled && config.showResourceFilters && activeFilters && allFilterValues && activeFilters.length > 0 && (
                    <div className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-4 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        <Filter size={14} className="text-slate-400" />
                        Bộ lọc
                      </h3>
                      <div className="space-y-3">
                        {activeFilters.map((filter) => {
                          const values = allFilterValues.filter((value) => value.filterId === filter._id && value.active);
                          return (
                            <div key={filter._id}>
                              <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500">{filter.name}</div>
                              <div className="flex flex-wrap gap-2">
                                {values.map((value) => {
                                  const active = activeFilterSlugs.includes(value.slug);
                                  return (
                                    <button
                                      key={value._id}
                                      type="button"
                                      onClick={() => handleFilterChange(value.slug)}
                                      className={`rounded-full border px-3 py-1 text-xs font-medium transition inline-flex items-center gap-1.5 ${active ? '' : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                                      style={active ? { backgroundColor: brandColors.primary, borderColor: brandColors.primary, color: '#fff' } : undefined}
                                    >
                                      {value.icon && (
                                        <img src={value.icon} alt={value.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                                      )}
                                      <span>{value.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {activeFilterSlugs.length > 0 && (
                          <button type="button" onClick={() => handleFilterChange(null)} className="text-xs font-medium text-slate-500 dark:text-[#86868b] hover:text-slate-900 dark:hover:text-[#f5f5f7]">Xóa bộ lọc</button>
                        )}
                      </div>
                    </div>
                  )}
                </aside>
              ) : (
                <div className={`flex flex-col gap-3 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-3 shadow-sm md:flex-row md:items-center md:justify-between ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                  <div className="relative w-full md:max-w-sm">
                    <input
                      value={search}
                      onChange={(event) => { setSearch(event.target.value); }}
                      placeholder="Tìm tài nguyên..."
                      className={`h-11 w-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-[#f5f5f7] pl-10 pr-3 text-sm outline-none transition-colors focus:border-slate-350 dark:focus:border-zinc-700 ${getRadiusClass(config.cornerRadius, 'input')}`}
                    />
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CustomDropdown
                      value={activeCategoryId ?? ''}
                      onChange={(value) => handleCategoryChange(value ? value as Id<'resourceCategories'> : null)}
                      options={[{ value: '', label: 'Tất cả danh mục' }, ...visibleCategories.map((category) => ({ value: category._id, label: category.name }))]}
                      icon={<Bookmark size={15} className="text-slate-400" />}
                      cornerRadius={config.cornerRadius}
                    />
                    {resourceFiltersFeature?.enabled && config.showResourceFilters && allFilterValues && allFilterValues.filter((v) => v.active).length > 0 && (
                      <MultiSelectDropdown
                        values={activeFilterSlugs}
                        onChange={(value) => handleFilterChange(value)}
                        onClear={() => handleFilterChange(null)}
                        options={[
                          { value: '', label: activeFilters?.[0]?.name ? `Tất cả ${activeFilters[0].name.toLowerCase()}` : 'Tất cả bộ lọc' },
                          ...allFilterValues.filter((v) => v.active).map((val) => ({ value: val.slug, label: val.name, icon: val.icon })),
                        ]}
                        placeholder={activeFilters?.[0]?.name ? `Tất cả ${activeFilters[0].name.toLowerCase()}` : 'Bộ lọc'}
                        icon={<Filter size={15} className="text-slate-400" />}
                        cornerRadius={config.cornerRadius}
                        brandColor={brandColors.primary}
                      />
                    )}
                    <CustomDropdown
                      value={sortBy}
                      onChange={(value) => setSortBy(value as typeof sortBy)}
                      options={[
                        { value: 'newest', label: 'Mới nhất' },
                        { value: 'popular', label: 'Xem nhiều' },
                        { value: 'price_asc', label: 'Giá tăng dần' },
                        { value: 'price_desc', label: 'Giá giảm dần' },
                        { value: 'title', label: 'Tên A-Z' },
                      ]}
                      icon={<SlidersHorizontal size={15} className="text-slate-400" />}
                      cornerRadius={config.cornerRadius}
                    />
                  </div>
                </div>
              )
            )}

            <div className="space-y-6">
              {config.layoutStyle === 'list' ? (
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: postsPerPage }).map((_, index) => (
                      <div key={index} className={`h-28 animate-pulse border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] ${getRadiusClass(config.cornerRadius)}`} />
                    ))
                  ) : resourceItems.map((resource) => {
                    const category = categoryMap.get(resource.categoryId);
                    const detailHref = buildDetailPath({
                      categorySlug: category?.slug,
                      mode: routeMode,
                      moduleKey: 'resources',
                      recordSlug: resource.slug,
                    });
                    const assignedValues = resourceFiltersMap.get(resource._id) ?? [];
                    return (
                      <Link
                        key={resource._id}
                        href={detailHref}
                        className={`group flex items-stretch gap-4 overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${getRadiusClass(config.cornerRadius)}`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-40 shrink-0 overflow-hidden bg-slate-100 dark:bg-[#1c1c1e]" style={{ aspectRatio: '16/9' }}>
                          {resource.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={resource.thumbnail} alt={resource.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center" style={{ background: isDark ? '#1c1c1e' : `linear-gradient(135deg, ${brandColors.primary}18, ${brandColors.primary}05)` }}>
                              <FileText size={28} style={{ color: brandColors.primary }} />
                            </div>
                          )}
                          {resource.featured && (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                              <Star size={10} className="fill-current" /> Nổi bật
                            </span>
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-3 pr-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-slate-100 dark:bg-[#1c1c1e] px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-zinc-350">{category?.name ?? 'Tài nguyên'}</span>
                            {resourceFiltersFeature?.enabled && config.showResourceFilters && assignedValues.slice(0, 3).map((value) => (
                              <span key={value._id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-[11px] font-medium text-slate-550 dark:text-[#86868b]">
                                {value.icon && <img src={value.icon} alt={value.name} className="h-3 w-3 object-contain shrink-0" />}
                                <span>{value.name}</span>
                              </span>
                            ))}
                          </div>
                          <h2 className="line-clamp-1 text-base font-bold text-slate-900 dark:text-[#f5f5f7] group-hover:underline">{resource.title}</h2>
                          {resource.excerpt && <p className="line-clamp-2 text-xs text-slate-500 dark:text-zinc-450 leading-relaxed">{resource.excerpt}</p>}
                        </div>
                        {/* Price + CTA */}
                        <div className="flex shrink-0 flex-col items-end justify-center gap-2 py-3 pr-4">
                          <span className="text-sm font-bold" style={{ color: brandColors.primary }}>{formatPrice(resource.pricingType, resource.priceAmount)}</span>
                          <span className="text-xs font-semibold group-hover:underline" style={{ color: brandColors.primary }}>Xem chi tiết →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                /* Grid / Sidebar layout: vertical cards */
                <div className={`grid gap-5 ${config.gridColumns >= 4 ? 'lg:grid-cols-4' : config.gridColumns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} sm:grid-cols-2`}>
                  {isLoading ? (
                    Array.from({ length: postsPerPage }).map((_, index) => (
                      <div key={index} className={`h-72 animate-pulse border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] ${getRadiusClass(config.cornerRadius)}`} />
                    ))
                  ) : resourceItems.map((resource) => {
                    const category = categoryMap.get(resource.categoryId);
                    const detailHref = buildDetailPath({
                      categorySlug: category?.slug,
                      mode: routeMode,
                      moduleKey: 'resources',
                      recordSlug: resource.slug,
                    });
                    const assignedValues = resourceFiltersMap.get(resource._id) ?? [];
                    return (
                      <Link
                        key={resource._id}
                        href={detailHref}
                        className={`group mb-5 block overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${getRadiusClass(config.cornerRadius)}`}
                      >
                        <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-[#1c1c1e]">
                          {resource.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={resource.thumbnail} alt={resource.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center" style={{ background: isDark ? '#1c1c1e' : `linear-gradient(135deg, ${brandColors.primary}18, ${brandColors.primary}05)` }}>
                              <FileText size={42} style={{ color: brandColors.primary }} />
                            </div>
                          )}
                          {resource.featured && (
                            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                              <Star size={12} className="fill-current" /> Nổi bật
                            </span>
                          )}
                        </div>
                        <div className="space-y-3 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-slate-100 dark:bg-[#1c1c1e] px-2.5 py-1 text-xs font-semibold text-slate-655 dark:text-zinc-350">{category?.name ?? 'Tài nguyên'}</span>
                            <span className="text-sm font-bold" style={{ color: brandColors.primary }}>{formatPrice(resource.pricingType, resource.priceAmount)}</span>
                          </div>
                          <h2 className="line-clamp-2 text-lg font-bold text-slate-900 dark:text-[#f5f5f7] group-hover:underline">{resource.title}</h2>
                          {resource.excerpt && <p className="line-clamp-2 text-sm text-slate-500 dark:text-[#86868b]">{resource.excerpt}</p>}
                          {resourceFiltersFeature?.enabled && config.showResourceFilters && assignedValues.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {assignedValues.slice(0, 4).map((value) => (
                                <span key={value._id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-slate-550 dark:text-[#86868b]">
                                  {value.icon && (
                                    <img src={value.icon} alt={value.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                                  )}
                                  <span>{value.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm font-semibold group-hover:underline" style={{ color: brandColors.primary }}>
                            Xem chi tiết →
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {!isLoading && resourceItems.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 bg-white dark:bg-[#161617] p-10 text-center text-slate-500 dark:text-zinc-400">
                  Không có tài nguyên phù hợp.
                </div>
              )}

              {!isLoading && resourceItems.length > 0 && (
                config.paginationType === 'pagination' || isPaginationMode ? (
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" disabled={urlPage <= 1} onClick={() => handlePageChange(urlPage - 1)} className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-300 disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-[#2c2c2e]">Trước</button>
                    <span className="text-sm text-slate-500">Trang {urlPage}/{totalPages}</span>
                    <button type="button" disabled={urlPage >= totalPages} onClick={() => handlePageChange(urlPage + 1)} className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-300 disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-[#2c2c2e]">Sau</button>
                  </div>
                ) : (visibleLimit < totalResources && (
                  <div className="flex justify-center">
                    <button type="button" onClick={() => setVisibleLimit((current) => current + postsPerPage)} className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ backgroundColor: brandColors.primary }}>
                      Tải thêm
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResourcesSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black px-4 py-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mx-auto h-9 w-56 animate-pulse rounded bg-slate-200 dark:bg-[#161617]" />
        <div className="h-16 animate-pulse rounded-2xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-zinc-800" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-zinc-800" />)}
        </div>
      </div>
    </main>
  );
}
