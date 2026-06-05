'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { BookOpen, Bookmark, ChevronDown, Clock, Filter, GraduationCap, Search, SlidersHorizontal, Star, UserRound, X } from 'lucide-react';
import { useBrandColors } from '@/components/site/hooks';
import { COURSE_LEVEL_OPTIONS, getCourseLevelLabel } from '@/lib/courses/labels';
import { useCoursesListConfig } from '@/lib/experiences';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { useCustomerAuth } from '@/app/(site)/auth/context';

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

const getItemRadiusClass = (radius?: 'none' | 'sm' | 'lg') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') return 'rounded';
  return 'rounded-lg';
};

type DropdownOption = {
  value: string;
  label: string;
};

type CustomDropdownProps = {
  value: string;
  onChange: (value: any) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
  disabled,
  cornerRadius = 'lg',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const buttonRadiusClass = getRadiusClass(cornerRadius, 'input');
  const menuRadiusClass = getRadiusClass(cornerRadius, 'input');
  const itemRadiusClass = getItemRadiusClass(cornerRadius);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[170px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-11 w-full items-center justify-between gap-2 border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-slate-300 outline-none ${buttonRadiusClass}`}
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1.5 max-h-60 min-w-[180px] overflow-y-auto border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${menuRadiusClass}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${itemRadiusClass} ${
                option.value === value
                  ? 'bg-slate-50 font-semibold text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type CategoryOption = {
  value: string | null;
  label: string;
};

type CategoryDropdownProps = {
  value: string | null;
  onChange: (value: any) => void;
  options: CategoryOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

function CategoryDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
  disabled,
  cornerRadius = 'lg',
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const buttonRadiusClass = getRadiusClass(cornerRadius, 'input');
  const menuRadiusClass = getRadiusClass(cornerRadius, 'input');
  const searchRadiusClass = getRadiusClass(cornerRadius, 'input');
  const itemRadiusClass = getItemRadiusClass(cornerRadius);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchTerm]);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[170px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-11 w-full items-center justify-between gap-2 border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-slate-300 outline-none ${buttonRadiusClass}`}
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1.5 max-h-72 min-w-[190px] overflow-y-auto border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${menuRadiusClass}`}>
          {options.length > 8 && (
            <div className="p-1.5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm danh mục..."
                className={`h-8 w-full border border-slate-200 px-2.5 text-xs outline-none focus:border-slate-300 transition-colors ${searchRadiusClass}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${itemRadiusClass} ${
                    option.value === value
                      ? 'bg-slate-50 font-semibold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesSkeleton />}>
      <CoursesContent />
    </Suspense>
  );
}

function CoursesContent() {
  const brandColors = useBrandColors();
  const config = useCoursesListConfig();
  const router = useRouter();
  const { token } = useCustomerAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const urlPage = Math.max(Number(searchParams.get('page')) || 1, 1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('');
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
  }, [debouncedSearch, level, postsPerPage, sortBy]);

  const categories = useQuery(api.courseCategories.listActive, { limit: 100 });
  const nonEmptyCategoryIds = useQuery(
    api.courseCategories.listNonEmptyCategoryIds,
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
    return visibleCategories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [visibleCategories, categoryQuery]);

  const categorySlugFromPath = useMemo(() => {
    if (routeMode !== 'unified') {return null;}
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment || segment === 'courses' || segment === 'khoa-hoc') {return null;}
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

  const courseFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'courses', featureKey: 'enableCourseFilters' });
  const activeFilters = useQuery(api.courseFilters.listActive, {});
  const allFilterValues = useQuery(api.courseFilters.listAllValues, {});

  const activeFilterSlugs = useMemo(() => {
    const raw = searchParams.get('filter');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const activeValueIds = useMemo(() => {
    if (activeFilterSlugs.length === 0 || !allFilterValues) return [];
    return activeFilterSlugs
      .map((slug) => allFilterValues.find((v) => v.slug === slug)?._id)
      .filter((id): id is Id<'courseFilterValues'> => id !== undefined);
  }, [activeFilterSlugs, allFilterValues]);

  const isSearchActive = debouncedSearch.length > 0;
  const isPaginationMode = config.paginationType === 'pagination' || isSearchActive || level.length > 0 || activeFilterSlugs.length > 0;
  const offset = isPaginationMode ? (urlPage - 1) * postsPerPage : 0;
  const coursesLimit = isPaginationMode ? postsPerPage : visibleLimit;
  const courses = useQuery(api.courses.listPublishedWithOffset, {
    categoryId: activeCategoryId ?? undefined,
    level: level ? level as 'Beginner' | 'Intermediate' | 'Advanced' : undefined,
    limit: coursesLimit,
    offset,
    search: debouncedSearch || undefined,
    sortBy,
    valueIds: activeValueIds.length > 0 ? activeValueIds : undefined,
  });
  const totalCount = useQuery(api.courses.countPublished, {
    categoryId: activeCategoryId ?? undefined,
    level: level ? level as 'Beginner' | 'Intermediate' | 'Advanced' : undefined,
    search: debouncedSearch || undefined,
    valueIds: activeValueIds.length > 0 ? activeValueIds : undefined,
  });

  const courseIds = useMemo(() => courses?.map((c) => c._id) ?? [], [courses]);
  const assignments = useQuery(api.courseFilters.listAssignmentsByCourses, { courseIds: courseIds.length > 0 ? courseIds : [] });
  const courseFiltersMap = useMemo(() => {
    const map = new Map<string, any[]>();
    assignments?.forEach((item) => {
      map.set(item.courseId, item.values);
    });
    return map;
  }, [assignments]);

  useEffect(() => {
    if (urlPage === 1) {return;}
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [activeCategoryId, debouncedSearch, level, searchParams.get('filter'), pathname, router, searchParams, sortBy, urlPage]);

  const handleCategoryChange = useCallback((nextCategoryId: Id<'courseCategories'> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (nextCategoryId) {
      const category = categories?.find((item) => item._id === nextCategoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'courses' }), { scroll: false });
          return;
        }
        params.set('category', category.slug);
      }
    } else {
      params.delete('category');
    }

    const nextUrl = params.toString()
      ? `${buildModuleListPath('courses')}?${params.toString()}`
      : buildModuleListPath('courses');
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
      let next: string[];
      if (current.includes(filterSlug)) {
        next = current.filter((s) => s !== filterSlug);
      } else {
        next = [...current, filterSlug];
      }
      if (next.length > 0) {
        params.set('filter', next.join(','));
      } else {
        params.delete('filter');
      }
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  const courseItems = courses ?? [];
  const progressSummaries = useQuery(
    api.courses.getCourseProgressSummaries,
    courseItems.length > 0 ? { courseIds: courseItems.map((course) => course._id), token: token ?? undefined } : 'skip'
  );
  const progressMap = useMemo(() => {
    return new Map((progressSummaries ?? []).map((progress) => [progress.courseId, progress]));
  }, [progressSummaries]);
  const totalCourses = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCourses / postsPerPage));

  const isLoading = courses === undefined || categories === undefined;

  return (
    <main className="min-h-screen bg-slate-50 font-active" style={{ fontFamily: 'var(--font-be-vietnam-pro), sans-serif' }}>
      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900">{activeCategoryName ?? 'Khóa học'}</h1>
          </div>

          <div className={config.layoutStyle === 'sidebar' || config.layoutStyle === 'list' ? 'grid gap-6 lg:grid-cols-[280px_1fr]' : 'space-y-6'}>
            {(config.showSearch || config.showCategories || config.showLevelFilter) && (
              config.layoutStyle === 'sidebar' || config.layoutStyle === 'list' ? (
                <aside className="space-y-4 lg:block flex-shrink-0">
                  {config.showSearch && (
                    <div className={`border border-slate-200 bg-white p-4 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                      <h3 className="font-semibold text-sm text-slate-700 mb-2.5 flex items-center gap-2">
                        <Search size={14} className="text-slate-400" />
                        Tìm kiếm
                      </h3>
                      <div className="relative">
                        <input
                          value={search}
                          onChange={(event) => { setSearch(event.target.value); }}
                          placeholder="Tìm khóa học..."
                          className={`h-11 w-full border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-300 transition-colors ${getRadiusClass(config.cornerRadius, 'input')}`}
                        />
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  )}

                  {config.showCategories && (
                    <div className={`border border-slate-200 bg-white p-4 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                      <h3 className="font-semibold text-sm text-slate-700 mb-2.5 flex items-center gap-2">
                        <Bookmark size={14} className="text-slate-400" />
                        Danh mục khóa học
                      </h3>
                      {visibleCategories.length > 8 && (
                        <div className="relative mb-2">
                          <input
                            type="text"
                            placeholder="Tìm nhanh danh mục..."
                            value={categoryQuery}
                            onChange={(e) => setCategoryQuery(e.target.value)}
                            className={`w-full pl-9 pr-9 py-2 border border-slate-200 text-xs outline-none focus:border-slate-300 transition-colors ${getRadiusClass(config.cornerRadius, 'input')}`}
                          />
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          {categoryQuery && (
                            <button
                              onClick={() => setCategoryQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 opacity-60 hover:opacity-100"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      )}
                      <div className={`space-y-1 ${visibleCategories.length > 8 ? 'max-h-60 overflow-y-auto pr-1' : ''}`}>
                        {(!categoryQuery || 'tất cả danh mục'.includes(categoryQuery.toLowerCase())) && (
                          <button
                            onClick={() => handleCategoryChange(null)}
                            className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${!activeCategoryId ? 'font-semibold' : ''}`}
                            style={!activeCategoryId
                              ? { backgroundColor: `${brandColors.primary}18`, color: brandColors.primary }
                              : { backgroundColor: 'transparent', color: '#475569' }
                            }
                          >
                            Tất cả danh mục
                          </button>
                        )}
                        {filteredCategories.map((cat) => (
                          <button
                            key={cat._id}
                            onClick={() => handleCategoryChange(cat._id)}
                            className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${activeCategoryId === cat._id ? 'font-semibold' : ''}`}
                            style={activeCategoryId === cat._id
                              ? { backgroundColor: `${brandColors.primary}18`, color: brandColors.primary }
                              : { backgroundColor: 'transparent', color: '#475569' }
                            }
                          >
                            {cat.name}
                          </button>
                        ))}
                        {visibleCategories.length > 8 && filteredCategories.length === 0 && (
                          <div className="px-3 py-2 text-xs text-slate-400 text-center">
                            Không tìm thấy kết quả.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {config.showLevelFilter && (
                    <div className={`border border-slate-200 bg-white p-4 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                      <h3 className="font-semibold text-sm text-slate-700 mb-2.5 flex items-center gap-2">
                        <GraduationCap size={14} className="text-slate-400" />
                        Trình độ
                      </h3>
                      <div className="space-y-1">
                        {[
                          { value: '', label: 'Tất cả trình độ' },
                          ...COURSE_LEVEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setLevel(opt.value)}
                            className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${level === opt.value ? 'font-semibold' : ''}`}
                            style={level === opt.value
                              ? { backgroundColor: `${brandColors.primary}18`, color: brandColors.primary }
                              : { backgroundColor: 'transparent', color: '#475569' }
                            }
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {courseFiltersFeature?.enabled && activeFilters && activeFilters.length > 0 && (
                    <div className={`border border-slate-200 bg-white p-4 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                      <h3 className="font-semibold text-sm text-slate-700 mb-2.5 flex items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        Bộ lọc khóa học
                      </h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        <div>
                          <button
                            onClick={() => handleFilterChange(null)}
                            className={`w-full py-1.5 px-2.5 rounded-lg text-left text-xs transition-colors border border-transparent flex items-center gap-2 ${activeFilterSlugs.length === 0 ? 'font-semibold' : ''}`}
                            style={activeFilterSlugs.length === 0
                              ? { backgroundColor: `${brandColors.primary}18`, color: brandColors.primary }
                              : { backgroundColor: 'transparent', color: '#475569' }
                            }
                          >
                            Tất cả bộ lọc
                          </button>
                        </div>
                        {activeFilters.map((filter) => {
                          const childValues = allFilterValues?.filter((v) => v.filterId === filter._id && v.active) ?? [];
                          if (childValues.length === 0) return null;
                          return (
                            <div key={filter._id} className="space-y-1">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5">
                                {filter.name}
                              </div>
                              {childValues.map((val) => {
                                const isValActive = activeFilterSlugs.includes(val.slug);
                                return (
                                  <button
                                    key={val._id}
                                    onClick={() => handleFilterChange(val.slug)}
                                    className={`w-full py-1.5 px-2.5 rounded-lg text-left text-xs transition-colors border border-transparent flex items-center gap-2 ${isValActive ? 'font-semibold' : ''}`}
                                    style={isValActive
                                      ? { backgroundColor: `${brandColors.primary}18`, color: brandColors.primary }
                                      : { backgroundColor: 'transparent', color: '#475569' }
                                    }
                                  >
                                    {val.icon && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={val.icon} alt={val.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                                    )}
                                    <span className="truncate">{val.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </aside>
              ) : (
                <aside className={`border border-slate-200 bg-white p-5 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
                      {config.showSearch && (
                        <div className="relative w-full md:max-w-xs">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={search}
                            onChange={(event) => { setSearch(event.target.value); }}
                            placeholder="Tìm khóa học..."
                            className={`h-11 w-full border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-slate-300 transition-colors ${getRadiusClass(config.cornerRadius, 'input')}`}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      {config.showCategories && (
                        <CategoryDropdown
                          value={activeCategoryId}
                          onChange={handleCategoryChange}
                          options={[
                            { value: null, label: 'Tất cả danh mục' },
                            ...visibleCategories.map((category) => ({ value: category._id, label: category.name })),
                          ]}
                          icon={<Bookmark size={16} className="text-slate-400" />}
                          cornerRadius={config.cornerRadius}
                        />
                      )}
                      {config.showLevelFilter && (
                        <CustomDropdown
                          value={level}
                          onChange={setLevel}
                          options={[
                            { value: '', label: 'Tất cả trình độ' },
                            ...COURSE_LEVEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
                          ]}
                          icon={<GraduationCap size={16} className="text-slate-400" />}
                          cornerRadius={config.cornerRadius}
                        />
                      )}
                      {courseFiltersFeature?.enabled && allFilterValues && allFilterValues.filter(v => v.active).length > 0 && (
                        <CustomDropdown
                          value={activeFilterSlugs.length === 1 ? activeFilterSlugs[0] : ''}
                          onChange={(value) => handleFilterChange(value || null)}
                          options={[
                            { value: '', label: 'Tất cả phần mềm' },
                            ...allFilterValues.filter(v => v.active).map((val) => ({ value: val.slug, label: val.name })),
                          ]}
                          placeholder={activeFilterSlugs.length > 1 ? `Đã chọn (${activeFilterSlugs.length})` : 'Tất cả phần mềm'}
                          icon={<Filter size={16} className="text-slate-400" />}
                          cornerRadius={config.cornerRadius}
                        />
                      )}
                      <CustomDropdown
                        value={sortBy}
                        onChange={(value) => { setSortBy(value as typeof sortBy); }}
                        options={[
                          { value: 'newest', label: 'Mới nhất' },
                          { value: 'popular', label: 'Xem nhiều' },
                          { value: 'title', label: 'Tên A-Z' },
                          { value: 'price_asc', label: 'Giá tăng dần' },
                          { value: 'price_desc', label: 'Giá giảm dần' },
                        ]}
                        icon={<SlidersHorizontal size={16} className="text-slate-400" />}
                        cornerRadius={config.cornerRadius}
                      />
                    </div>
                  </div>
                </aside>
              )
            )}


            <div>
              {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-white" />)}
                </div>
              ) : courseItems.length > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 mb-4">
                    <p className="text-sm text-slate-500 font-medium">
                      Hiển thị <span className="font-semibold text-slate-700">{courseItems.length}</span>
                      {totalCourses > courseItems.length && (
                        <> / <span className="font-semibold text-slate-700">{totalCourses}</span></>
                      )} khóa học
                    </p>

                    {(config.layoutStyle === 'sidebar' || config.layoutStyle === 'list') && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Sắp xếp:</span>
                        <CustomDropdown
                          value={sortBy}
                          onChange={(value) => { setSortBy(value as typeof sortBy); }}
                          options={[
                            { value: 'newest', label: 'Mới nhất' },
                            { value: 'popular', label: 'Xem nhiều' },
                            { value: 'title', label: 'Tên A-Z' },
                            { value: 'price_asc', label: 'Giá tăng dần' },
                            { value: 'price_desc', label: 'Giá giảm dần' },
                          ]}
                          icon={<SlidersHorizontal size={14} className="text-slate-400" />}
                          cornerRadius={config.cornerRadius}
                        />
                      </div>
                    )}
                  </div>
                  <div className={
                    config.layoutStyle === 'list'
                      ? 'grid gap-4 grid-cols-1'
                      : config.gridColumns === 4
                        ? 'grid gap-5 grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
                        : 'grid gap-5 grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
                  }>
                    {courseItems.map((course) => {
                      const category = categoryMap.get(course.categoryId);
                      const href = buildDetailPath({
                        categorySlug: category?.slug,
                        mode: routeMode,
                        moduleKey: 'courses',
                        recordSlug: course.slug,
                      });
                      const showPrice = course.isPriceVisible !== false;
                      const progress = progressMap.get(course._id);
                      const hasLearningAccess = Boolean(progress?.hasAccess);
                      const progressPercent = progress?.progressPercent ?? 0;

                      if (config.layoutStyle === 'list') {
                        return (
                          <Link key={course._id} href={href} className={`group flex items-stretch gap-4 overflow-hidden ${getRadiusClass(config.cornerRadius)} border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}>
                            {/* Thumbnail */}
                            <div className="relative w-40 shrink-0 overflow-hidden bg-slate-100" style={{ minHeight: '7rem' }}>
                              {course.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <GraduationCap size={32} style={{ color: brandColors.primary }} />
                                </div>
                              )}
                              {course.featured && (
                                <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                  <Star size={10} className="fill-current" /> Nổi bật
                                </span>
                              )}
                            </div>
                            {/* Content */}
                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-3 pr-2">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="rounded-full px-2 py-0.5 font-semibold" style={{ backgroundColor: `${brandColors.primary}18`, color: brandColors.primary }}>{category?.name ?? 'Khóa học'}</span>
                                {course.level && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{getCourseLevelLabel(course.level)}</span>}
                              </div>
                              <h2 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:underline">{course.title}</h2>
                              {course.excerpt && <p className="line-clamp-1 text-xs text-slate-500 leading-relaxed">{course.excerpt}</p>}
                              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                                <span className="inline-flex items-center gap-1"><BookOpen size={12} className="text-slate-400" />{course.lessonCount} bài học</span>
                                {course.durationText && <span className="inline-flex items-center gap-1"><Clock size={12} className="text-slate-400" />{course.durationText}</span>}
                                {course.instructorName && <span className="inline-flex items-center gap-1"><UserRound size={12} className="text-slate-400" />{course.instructorName}</span>}
                              </div>
                            </div>
                            {/* Price + CTA */}
                            <div className="flex shrink-0 flex-col items-end justify-center gap-2 py-3 pr-4">
                              {hasLearningAccess ? (
                                <>
                                  <span className="text-xs font-semibold" style={{ color: brandColors.primary }}>Tiến độ: {progressPercent}%</span>
                                  <span className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: brandColors.primary }}>Vào học</span>
                                </>
                              ) : showPrice ? (
                                <>
                                  <span className="text-sm font-bold" style={{ color: brandColors.secondary || brandColors.primary }}>{formatPrice(course.pricingType, course.priceAmount)}</span>
                                  <span className="text-xs font-semibold group-hover:underline" style={{ color: brandColors.primary }}>Xem khóa học →</span>
                                </>
                              ) : (
                                <span className="text-xs font-semibold group-hover:underline" style={{ color: brandColors.primary }}>Xem khóa học →</span>
                              )}
                            </div>
                          </Link>
                        );
                      }

                      return (
                        <Link key={course._id} href={href} className={`group overflow-hidden ${getRadiusClass(config.cornerRadius)} border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md`}>
                          <div className="relative flex aspect-video items-center justify-center bg-slate-100">
                            {course.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                            ) : (
                              <GraduationCap size={44} style={{ color: brandColors.primary }} />
                            )}
                            {course.featured && (
                              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white">
                                <Star size={11} className="fill-current" /> Nổi bật
                              </span>
                            )}
                          </div>
                          <div className="space-y-3 p-5">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-full px-2 py-1 font-medium" style={{ backgroundColor: `${brandColors.primary}18`, color: brandColors.primary }}>{category?.name ?? 'Khóa học'}</span>
                              {course.level && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{getCourseLevelLabel(course.level)}</span>}
                            </div>
                            <h2 className="line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-slate-700">{course.title}</h2>
                            <p className="line-clamp-2 text-sm text-slate-500">{course.excerpt}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1"><BookOpen size={13} />{course.lessonCount} bài</span>
                              {course.durationText && <span className="inline-flex items-center gap-1"><Clock size={13} />{course.durationText}</span>}
                              {course.instructorName && <span className="inline-flex items-center gap-1"><UserRound size={13} />{course.instructorName}</span>}
                            </div>
                            {courseFiltersFeature?.enabled && courseFiltersMap.get(course._id) && (courseFiltersMap.get(course._id) ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {(courseFiltersMap.get(course._id) ?? []).map((filter: any) => (
                                  <span key={filter._id} title={filter.name} className="inline-flex items-center gap-1 rounded bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {filter.icon && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={filter.icon} alt={filter.name} className="h-3.5 w-3.5 object-contain" />
                                    )}
                                    <span>{filter.name}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {(hasLearningAccess || showPrice) && (
                              <div className="border-t border-slate-100 pt-3">
                                {hasLearningAccess ? (
                                  <div>
                                    <div className="mb-2 flex items-center justify-between text-xs font-semibold" style={{ color: brandColors.primary }}>
                                      <span>Vào học</span>
                                      <span>{progressPercent}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                      <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: brandColors.primary }} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-bold" style={{ color: brandColors.secondary || brandColors.primary }}>
                                    {formatPrice(course.pricingType, course.priceAmount)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {isPaginationMode && totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => { handlePageChange(urlPage - 1); }}
                        disabled={urlPage <= 1}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <span className="text-sm text-slate-500">Trang {Math.min(urlPage, totalPages)} / {totalPages}</span>
                      <button
                        type="button"
                        onClick={() => { handlePageChange(urlPage + 1); }}
                        disabled={urlPage >= totalPages}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </div>
                  )}
                  {!isPaginationMode && courseItems.length < totalCourses && (
                    <div className="mt-8 text-center">
                      <button
                        type="button"
                        onClick={() => { setVisibleLimit((current) => current + postsPerPage); }}
                        className="rounded-full px-5 py-3 text-sm font-semibold text-white"
                        style={{ backgroundColor: brandColors.primary }}
                      >
                        Tải thêm khóa học
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Chưa có khóa học phù hợp.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CoursesSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 space-y-3 text-center">
            <div className="mx-auto h-10 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mx-auto h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
