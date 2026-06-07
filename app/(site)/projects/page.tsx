'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { PageHeaderWithCount } from '@/components/shared/PageHeaderWithCount';
import { useProjectsListConfig } from '@/lib/experiences';
import { buildDetailPath, normalizeRouteMode, buildCategoryPath, buildModuleListPath } from '@/lib/ia/route-mode';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import type { Id } from '@/convex/_generated/dataModel';

function ProjectsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white dark:bg-[#161617] dark:border-zinc-800">
            <div className="aspect-video bg-slate-200 dark:bg-[#1c1c1e]" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-[#1c1c1e]" />
              <div className="h-6 w-full rounded bg-slate-200 dark:bg-[#1c1c1e]" />
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-[#1c1c1e]" />
            </div>
          </div>
        ))}
      </div>
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const listConfig = useProjectsListConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [pageSizeOverride, setPageSizeOverride] = useState<number | null>(null);
  const postsPerPage = pageSizeOverride ?? (listConfig.postsPerPage ?? 12);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'title' | 'title_desc'>('newest');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  
  const categories = useQuery(api.projectCategories.listActive, { limit: 100 });

  const categorySlugFromPath = useMemo(() => {
    if (routeMode !== 'unified') {return null;}
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment || segment === 'projects') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const categoryFromUrl = useMemo(() => {
    const catSlug = categorySlugFromPath ?? searchParams.get('category');
    if (!catSlug || !categories) {return null;}
    return categories.find((c) => c.slug === catSlug)?._id ?? null;
  }, [categorySlugFromPath, searchParams, categories]);

  const activeCategory = useMemo(
    () => categories?.find((category) => category._id === categoryFromUrl),
    [categories, categoryFromUrl]
  );

  const isPaginationMode = listConfig.paginationType === 'pagination';
  const offset = (urlPage - 1) * postsPerPage;

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const paginatedSortBy = sortBy === 'popular' ? 'popular' : (sortBy === 'oldest' ? 'oldest' : 'newest');

  const {
    results: infiniteResults,
    status: infiniteStatus,
    loadMore,
  } = usePaginatedQuery(
    api.projects.listPublishedPaginated,
    {
      categoryId: activeCategory?._id,
      sortBy: paginatedSortBy,
    },
    { initialNumItems: postsPerPage }
  );

  const paginatedProjects = useQuery(
    api.projects.listPublishedWithOffset,
    isPaginationMode
      ? {
          categoryId: activeCategory?._id,
          limit: postsPerPage,
          offset,
          search: debouncedSearchQuery || undefined,
          sortBy,
        }
      : 'skip'
  );

  const projects = useMemo(() => {
    if (isPaginationMode) {
      return paginatedProjects ?? [];
    }
    return infiniteResults;
  }, [infiniteResults, isPaginationMode, paginatedProjects]);

  const isLoadingProjects = isPaginationMode && paginatedProjects === undefined;

  const totalCount = useQuery(api.projects.countPublished, {
    categoryId: activeCategory?._id,
    search: debouncedSearchQuery || undefined,
  });

  // Load more when scrolling (infinite scroll mode)
  useEffect(() => {
    if (isPaginationMode) {
      return;
    }
    if (inView && infiniteStatus === 'CanLoadMore') {
      loadMore(postsPerPage);
    }
  }, [inView, infiniteStatus, loadMore, postsPerPage, isPaginationMode]);

  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.ceil(totalCount / postsPerPage);
  }, [totalCount, postsPerPage]);

  const categoryMap = useMemo(() => new Map((categories ?? []).map((category) => [category._id, category])), [categories]);

  const getDetailHref = useCallback((project: { categoryId: Id<'projectCategories'>; slug: string }) => buildDetailPath({
    categorySlug: categoryMap.get(project.categoryId)?.slug,
    mode: routeMode,
    moduleKey: 'projects',
    recordSlug: project.slug,
  }), [categoryMap, routeMode]);

  const handleCategoryChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (value && categories) {
      const category = categories.find(c => c.slug === value || c._id === value);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'projects' }), { scroll: false });
          return;
        }
        params.set('category', category.slug);
      }
    } else {
      params.delete('category');
    }

    const nextUrl = params.toString()
      ? `${buildModuleListPath('projects')}?${params.toString()}`
      : buildModuleListPath('projects');
    router.push(nextUrl, { scroll: false });
  }, [categories, routeMode, router, searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSortChange = (value: 'newest' | 'oldest' | 'popular' | 'title' | 'title_desc') => {
    setSortBy(value);
  };

  const filterKey = `${activeCategory?._id ?? ''}|${debouncedSearchQuery}|${sortBy}|${postsPerPage}`;
  const prevFilterKeyRef = useRef(filterKey);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (!isPaginationMode) {
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
  }, [filterKey, isPaginationMode, pathname, router, searchParams, urlPage]);

  if (!categories || !projects) {
    return <ProjectsSkeleton />;
  }

  const layoutStyle = listConfig.layoutStyle ?? 'grid';

  const topFilterBar = (listConfig.showSearch || listConfig.showCategories) && (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {listConfig.showSearch && (
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm kiếm dự án..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] pl-9 pr-3 text-sm outline-none transition focus:border-slate-450 dark:border-zinc-700 dark:text-[#f5f5f7]"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {listConfig.showCategories && (
            <select
              value={activeCategory?.slug ?? ''}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] px-3 text-sm dark:border-zinc-700 dark:text-[#f5f5f7]"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category._id} value={category.slug}>{category.name}</option>
              ))}
            </select>
          )}
          <select
            value={sortBy}
            onChange={(event) => handleSortChange(event.target.value as 'newest' | 'oldest' | 'popular' | 'title' | 'title_desc')}
            className="h-10 rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] px-3 text-sm dark:border-zinc-700 dark:text-[#f5f5f7]"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="popular">Xem nhiều</option>
            <option value="title">Theo tên A-Z</option>
            <option value="title_desc">Theo tên Z-A</option>
          </select>
        </div>
      </div>
    </div>
  );

  const sidebarFilter = (
    <aside className="w-full space-y-4 lg:w-64 lg:flex-shrink-0">
      {listConfig.showSearch && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Tìm kiếm</p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm dự án..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] pl-8 pr-3 text-sm outline-none transition focus:border-slate-450 dark:border-zinc-700 dark:text-[#f5f5f7]"
            />
          </div>
        </div>
      )}
      {listConfig.showCategories && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Danh mục</p>
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => handleCategoryChange('')}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${!activeCategory ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                style={!activeCategory ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColor}18`, color: brandColor, borderColor: isDark ? '#3a3a3c' : 'transparent', borderWidth: isDark ? '1px' : '0' } : undefined}
              >
                Tất cả
              </button>
            </li>
            {categories.map((category) => (
              <li key={category._id}>
                <button
                  type="button"
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${activeCategory?._id === category._id ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                  style={activeCategory?._id === category._id ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColor}18`, color: brandColor, borderColor: isDark ? '#3a3a3c' : 'transparent', borderWidth: isDark ? '1px' : '0' } : undefined}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Sắp xếp</p>
        <select
          value={sortBy}
          onChange={(event) => handleSortChange(event.target.value as 'newest' | 'oldest' | 'popular' | 'title' | 'title_desc')}
          className="h-9 w-full rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] px-3 text-sm dark:border-zinc-700 dark:text-[#f5f5f7]"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="popular">Xem nhiều</option>
          <option value="title">Theo tên A-Z</option>
          <option value="title_desc">Theo tên Z-A</option>
        </select>
      </div>
    </aside>
  );

  const paginationBar = isPaginationMode && totalPages > 1 && (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="order-2 flex w-full items-center justify-between text-sm sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Hiển thị</span>
          <select
            value={postsPerPage}
            onChange={(event) => {
              setPageSizeOverride(Number(event.target.value));
              const params = new URLSearchParams(searchParams.toString());
              params.delete('page');
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="h-8 w-[70px] appearance-none rounded-md border px-2 text-sm font-medium shadow-sm focus:outline-none dark:border-zinc-800 bg-white dark:bg-[#161617]"
            aria-label="Số dự án mỗi trang"
          >
            {[6, 12, 20, 24].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-slate-500">dự án/trang</span>
        </div>

        <div>
          <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">
            {totalCount ? ((urlPage - 1) * postsPerPage) + 1 : 0}–{Math.min(urlPage * postsPerPage, totalCount ?? 0)}
          </span>
          <span className="mx-1 text-slate-300 dark:text-zinc-700">/</span>
          <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">{totalCount ?? 0}</span>
          <span className="ml-1 text-slate-500">dự án</span>
        </div>
      </div>

      <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
        <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              const page = urlPage - 1;
              if (page <= 1) params.delete('page');
              else params.set('page', String(page));
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={urlPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] text-slate-700 dark:text-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {generatePaginationItems(urlPage, totalPages).map((item, index) => {
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
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (pageNum <= 1) params.delete('page');
                  else params.set('page', String(pageNum));
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', String(urlPage + 1));
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={urlPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] text-slate-700 dark:text-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div ref={loadMoreRef} className="text-center py-6">
          {infiniteStatus === 'LoadingMore' ? (
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 rounded-full animate-pulse bg-slate-400" />
              <div className="w-2 h-2 rounded-full animate-pulse bg-slate-400 delay-75" />
              <div className="w-2 h-2 rounded-full animate-pulse bg-slate-400 delay-150" />
            </div>
          ) : infiniteStatus === 'CanLoadMore' ? (
            <p className="text-sm text-slate-450 dark:text-zinc-500">Cuộn để xem thêm...</p>
          ) : null}
        </div>
      )}
      {infiniteStatus === 'Exhausted' && projects.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-slate-450 dark:text-zinc-500">Đã hiển thị tất cả {projects.length} dự án</p>
        </div>
      )}
    </>
  );

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500 dark:border-zinc-800 dark:text-[#86868b]">
      Chưa có dự án phù hợp.
    </div>
  );

  const GridCard = ({ project }: { project: typeof projects[number] }) => {
    const category = categoryMap.get(project.categoryId);
    return (
      <Link href={getDetailHref(project)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-[#161617]">
        <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-[#1c1c1e]">
          {project.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnail} alt={project.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Dự án</div>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-[#1c1c1e] dark:text-zinc-350">{category?.name ?? 'Dự án'}</span>
            {listConfig.showClientName && project.clientName && <span className="truncate text-xs text-slate-400">{project.clientName}</span>}
          </div>
          <h2 className="line-clamp-2 text-xl font-semibold text-slate-950 transition group-hover:opacity-90 dark:text-[#f5f5f7]">{project.title}</h2>
          {project.excerpt && <p className="line-clamp-2 text-sm leading-6 text-slate-650 dark:text-[#86868b]">{project.excerpt}</p>}
        </div>
      </Link>
    );
  };

  const ListCard = ({ project }: { project: typeof projects[number] }) => {
    const category = categoryMap.get(project.categoryId);
    return (
      <Link
        href={getDetailHref(project)}
        className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-[#161617]"
      >
        {/* Thumbnail */}
        <div className="w-40 flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-[#1c1c1e] sm:w-52">
          {project.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnail} alt={project.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Dự án</div>
          )}
        </div>

        {/* Content layout: 2 columns on Desktop */}
        <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-6 p-4">
          {/* Left Column: Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-[#1c1c1e] dark:text-[#f5f5f7]">{category?.name ?? 'Dự án'}</span>
              {listConfig.showClientName && project.clientName && <span className="text-xs text-slate-400">{project.clientName}</span>}
            </div>
            <h2 className="line-clamp-2 text-base font-semibold text-slate-950 transition group-hover:opacity-90 dark:text-[#f5f5f7]">{project.title}</h2>
            {project.excerpt && <p className="line-clamp-2 text-sm leading-5 text-slate-650 dark:text-[#86868b]">{project.excerpt}</p>}
          </div>

          {/* Right Column: CTA */}
          <div className="flex shrink-0 items-center justify-start md:justify-end border-t md:border-t-0 border-slate-150 dark:border-zinc-850/60 pt-3 md:pt-0">
            <span
              className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 group-hover:bg-[var(--btn-hover-bg)] group-hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow whitespace-nowrap"
              style={{
                borderColor: brandColor,
                color: brandColor,
                '--btn-hover-bg': `${brandColor}08`,
              } as React.CSSProperties}
            >
              Xem chi tiết →
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const pageHeader = (
    <PageHeaderWithCount
      title={activeCategory ? activeCategory.name : 'Dự án đã thực hiện'}
      count={projects.length}
      totalCount={totalCount}
      unit="Dự án"
      titleColor={isDark ? '#f5f5f7' : '#0f172a'}
      subtitleColor={isDark ? '#86868b' : '#64748b'}
      description={activeCategory?.description}
    />
  );

  const renderContent = () => {
    const gridCols = listConfig.gridColumns ?? 3;
    const gridClass = gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    const sidebarGridClass = gridCols === 4 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';

    if (layoutStyle === 'grid') {
      return (
        <div className="space-y-6">
          {topFilterBar}
          {isLoadingProjects ? (
            <div className={`grid gap-6 ${gridClass}`}>
              {Array.from({ length: postsPerPage }).map((_, i) => (
                <div key={i} className="animate-pulse h-64 bg-slate-200 dark:bg-[#1c1c1e] rounded-2xl" />
              ))}
            </div>
          ) : projects.length === 0 ? emptyState : (
            <div className={`grid gap-6 ${gridClass}`}>
              {projects.map((project) => <GridCard key={project._id} project={project} />)}
            </div>
          )}
          {paginationBar}
          {infiniteScrollTrigger}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {sidebarFilter}
        <div className="min-w-0 flex-1 space-y-6">
          {isLoadingProjects ? (
            <div className="space-y-4">
              {Array.from({ length: postsPerPage }).map((_, i) => (
                <div key={i} className="animate-pulse h-28 bg-slate-200 dark:bg-[#1c1c1e] rounded-2xl" />
              ))}
            </div>
          ) : projects.length === 0 ? emptyState : (
            layoutStyle === 'sidebar' ? (
              <div className={`grid gap-6 ${sidebarGridClass}`}>
                {projects.map((project) => <GridCard key={project._id} project={project} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {projects.map((project) => <ListCard key={project._id} project={project} />)}
              </div>
            )
          )}
          {paginationBar}
          {infiniteScrollTrigger}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full px-4 py-6 md:py-10 bg-slate-50 dark:bg-black font-active text-slate-700 dark:text-[#f5f5f7] transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-6">
        {pageHeader}
        {renderContent()}
      </div>
    </div>
  );
}
