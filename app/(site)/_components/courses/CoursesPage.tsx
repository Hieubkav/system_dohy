'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { BookOpen, Clock, GraduationCap, Search, Star, UserRound } from 'lucide-react';
import { useBrandColors } from '@/components/site/hooks';
import { useCoursesListConfig } from '@/lib/experiences';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';

const formatPrice = (pricingType: string, price?: number) => {
  if (pricingType === 'free') {return 'Miễn phí';}
  if (pricingType === 'contact') {return 'Liên hệ';}
  if (!price) {return 'Liên hệ';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

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
      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-slate-900">Khóa học</h1>
            <p className="mt-3 text-slate-600">Chọn lộ trình học phù hợp và bắt đầu nâng cấp kỹ năng.</p>
          </div>

          <div className={config.layoutStyle === 'sidebar' ? 'grid gap-6 lg:grid-cols-[280px_1fr]' : 'space-y-6'}>
            {(config.showSearch || config.showCategories || config.showLevelFilter) && (
              <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {config.showSearch && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => { setSearch(event.target.value); }}
                      placeholder="Tìm khóa học..."
                      className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-slate-300"
                    />
                  </div>
                )}
                {config.showCategories && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { handleCategoryChange(null); }}
                      className="rounded-full px-3 py-1.5 text-sm font-medium"
                      style={activeCategoryId ? { backgroundColor: '#f1f5f9', color: '#475569' } : { backgroundColor: brandColors.primary, color: '#fff' }}
                    >
                      Tất cả
                    </button>
                    {visibleCategories.map((category) => (
                      <button
                        key={category._id}
                        type="button"
                        onClick={() => { handleCategoryChange(category._id); }}
                        className="rounded-full px-3 py-1.5 text-sm font-medium"
                        style={activeCategoryId === category._id ? { backgroundColor: brandColors.primary, color: '#fff' } : { backgroundColor: '#f1f5f9', color: '#475569' }}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {config.showLevelFilter && (
                    <select value={level} onChange={(event) => { setLevel(event.target.value); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                      <option value="">Mọi cấp độ</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  )}
                  <select value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    <option value="newest">Mới nhất</option>
                    <option value="popular">Xem nhiều</option>
                    <option value="title">Tên A-Z</option>
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                  </select>
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
                  <div className={config.layoutStyle === 'masonry' ? 'grid gap-5 md:grid-cols-2' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
                    {courseItems.map((course) => {
                      const category = categoryMap.get(course.categoryId);
                      const href = buildDetailPath({
                        categorySlug: category?.slug,
                        mode: routeMode,
                        moduleKey: 'courses',
                        recordSlug: course.slug,
                      });
                      const showPrice = course.isPriceVisible !== false;
                      return (
                        <Link key={course._id} href={href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
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
                              {course.level && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{course.level}</span>}
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
