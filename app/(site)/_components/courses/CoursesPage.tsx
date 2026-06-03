'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { BookOpen, Bookmark, ChevronDown, Clock, GraduationCap, Search, SlidersHorizontal, Star, UserRound } from 'lucide-react';
import { useBrandColors } from '@/components/site/hooks';
import { COURSE_LEVEL_OPTIONS, getCourseLevelLabel } from '@/lib/courses/labels';
import { useCoursesListConfig } from '@/lib/experiences';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const urlPage = Math.max(Number(searchParams.get('page')) || 1, 1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title'>('newest');
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

  const isSearchActive = debouncedSearch.length > 0;
  const isPaginationMode = config.paginationType === 'pagination' || isSearchActive || level.length > 0;
  const offset = isPaginationMode ? (urlPage - 1) * postsPerPage : 0;
  const coursesLimit = isPaginationMode ? postsPerPage : visibleLimit;
  const courses = useQuery(api.courses.listPublishedWithOffset, {
    categoryId: activeCategoryId ?? undefined,
    level: level ? level as 'Beginner' | 'Intermediate' | 'Advanced' : undefined,
    limit: coursesLimit,
    offset,
    search: debouncedSearch || undefined,
    sortBy,
  });
  const totalCount = useQuery(api.courses.countPublished, {
    categoryId: activeCategoryId ?? undefined,
    level: level ? level as 'Beginner' | 'Intermediate' | 'Advanced' : undefined,
    search: debouncedSearch || undefined,
  });

  useEffect(() => {
    if (urlPage === 1) {return;}
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [activeCategoryId, debouncedSearch, level, pathname, router, searchParams, sortBy, urlPage]);

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

  const courseItems = courses ?? [];
  const totalCourses = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCourses / postsPerPage));

  const isLoading = courses === undefined || categories === undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900">{activeCategoryName ?? 'Khóa học'}</h1>
          </div>

          <div className={config.layoutStyle === 'sidebar' ? 'grid gap-6 lg:grid-cols-[280px_1fr]' : 'space-y-6'}>
            {(config.showSearch || config.showCategories || config.showLevelFilter) && (
              <aside className={`border border-slate-200 bg-white p-5 shadow-sm ${getRadiusClass(config.cornerRadius, 'panel')}`}>
                <div className={config.layoutStyle === 'sidebar' ? 'space-y-4' : 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between'}>
                  <div className={config.layoutStyle === 'sidebar' ? 'space-y-4 w-full' : 'flex flex-1 flex-col gap-4 md:flex-row md:items-center md:flex-wrap'}>
                    {config.showSearch && (
                      <div className={config.layoutStyle === 'sidebar' ? 'relative w-full' : 'relative w-full md:max-w-xs'}>
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
                  
                  <div className={config.layoutStyle === 'sidebar' ? 'grid gap-3 grid-cols-1 pt-2 border-t border-slate-100' : 'flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto'}>
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
            )}


            <div>
              {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-white" />)}
                </div>
              ) : courseItems.length > 0 ? (
                <>
                  <div className={
                    config.layoutStyle === 'masonry'
                      ? 'grid gap-5 grid-cols-1'
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

                      if (config.layoutStyle === 'masonry') {
                        return (
                          <Link key={course._id} href={href} className={`group overflow-hidden ${getRadiusClass(config.cornerRadius)} border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col md:flex-row`}>
                            {/* Thumbnail Area - ~42% width on desktop */}
                            <div className="relative flex aspect-video md:aspect-auto md:w-[42%] items-center justify-center bg-slate-100 shrink-0 min-h-[200px]">
                              {course.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                              ) : (
                                <GraduationCap size={48} style={{ color: brandColors.primary }} />
                              )}
                              {course.featured && (
                                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                                  <Star size={12} className="fill-current" /> Nổi bật
                                </span>
                              )}
                            </div>
                            
                            {/* Content Area */}
                            <div className="flex-1 flex flex-col justify-between p-5 md:p-6 space-y-4">
                              <div className="space-y-2.5">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="rounded-full px-2.5 py-1 font-semibold" style={{ backgroundColor: `${brandColors.primary}18`, color: brandColors.primary }}>{category?.name ?? 'Khóa học'}</span>
                                  {course.level && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{getCourseLevelLabel(course.level)}</span>}
                                </div>
                                <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug group-hover:text-slate-700">{course.title}</h2>
                                {course.excerpt && <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{course.excerpt}</p>}
                                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                                  <span className="inline-flex items-center gap-1.5"><BookOpen size={14} className="text-slate-400" />{course.lessonCount} bài học</span>
                                  {course.durationText && <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-slate-400" />{course.durationText}</span>}
                                  {course.instructorName && <span className="inline-flex items-center gap-1.5"><UserRound size={14} className="text-slate-400" />{course.instructorName}</span>}
                                </div>
                              </div>
                              
                              {showPrice && (
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Học phí</span>
                                    <span className="text-lg font-bold" style={{ color: brandColors.secondary || brandColors.primary }}>
                                      {formatPrice(course.pricingType, course.priceAmount)}
                                    </span>
                                  </div>
                                  <span className="rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow transition-all" style={{ backgroundColor: brandColors.primary }}>Xem khóa học</span>
                                </div>
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
                            {showPrice && (
                              <div className="border-t border-slate-100 pt-3 font-bold" style={{ color: brandColors.secondary || brandColors.primary }}>
                                {formatPrice(course.pricingType, course.priceAmount)}
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
