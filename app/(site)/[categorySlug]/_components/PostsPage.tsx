'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { ChevronLeft, ChevronRight, Eye, FileText } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { getPostsListColors } from '@/components/site/posts/colors';
import { usePostsListConfig } from '@/lib/experiences';
import type { Id } from '@/convex/_generated/dataModel';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { type SortOption } from '@/components/site/posts';
import { SharedListLayout } from '@/components/shared/SharedListLayout';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';

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

function useEnabledPostFields(): Set<string> {
  const fields = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'posts' });
  return useMemo(() => {
    if (!fields) {return new Set<string>();}
    return new Set(fields.map(f => f.fieldKey));
  }, [fields]);
}

function PostsGridSkeleton({ count = 6 }: { count?: number }) {
  const tokens = getPostsListColors('#3b82f6', undefined, 'single');

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden border"
          style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
        >
          <div className="aspect-video" style={{ backgroundColor: tokens.cardBorder }} />
          <div className="p-5 space-y-3">
            <div className="h-5 w-20 rounded-full" style={{ backgroundColor: tokens.cardBorder }} />
            <div className="h-6 w-full rounded" style={{ backgroundColor: tokens.cardBorder }} />
            <div className="h-4 w-3/4 rounded" style={{ backgroundColor: tokens.cardBorder }} />
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

function PostsListSkeleton() {
  const tokens = getPostsListColors('#3b82f6', undefined, 'single');

  return (
    <div className="py-8 md:py-12 px-4 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-64 rounded mx-auto" style={{ backgroundColor: tokens.cardBorder }} />
        </div>
        <div className="rounded-xl border p-4 mb-8" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 flex-1 max-w-xs rounded-lg" style={{ backgroundColor: tokens.cardBorder }} />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 rounded-full" style={{ backgroundColor: tokens.cardBorder }} />
              ))}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border"
              style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
            >
              <div className="aspect-video" style={{ backgroundColor: tokens.cardBorder }} />
              <div className="p-5 space-y-3">
                <div className="h-5 w-20 rounded-full" style={{ backgroundColor: tokens.cardBorder }} />
                <div className="h-6 w-full rounded" style={{ backgroundColor: tokens.cardBorder }} />
                <div className="h-4 w-3/4 rounded" style={{ backgroundColor: tokens.cardBorder }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<PostsListSkeleton />}>
      <PostsContent />
    </Suspense>
  );
}

function PostsContent() {
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const tokens = useMemo(
    () => getPostsListColors(brandColors.primary, brandColors.secondary, brandColors.mode || 'single', isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  const enabledFields = useEnabledPostFields();
  const listConfig = usePostsListConfig();
  const layout = listConfig.layoutStyle;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  
  // Read page from URL for pagination mode
  const urlPage = Number(searchParams.get('page')) || 1;
  
  // Filter states (client-side for search)
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [pageSizeOverride, setPageSizeOverride] = useState<number | null>(null);
  const postsPerPage = pageSizeOverride ?? (listConfig.postsPerPage ?? 12);
  
  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchQuery]);

  // Queries
  const categories = useQuery(api.postCategories.listActive, { limit: 20 });
  const nonEmptyCategoryIds = useQuery(api.postCategories.listNonEmptyCategoryIds, { limit: 20 });

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
    if (!segment || segment === 'posts') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const categoryFromUrl = useMemo(() => {
    const catSlug = categorySlugFromPath ?? searchParams.get('catpost');
    if (!catSlug || categoryOptions.length === 0) {return null;}
    const matchedCategory = categoryOptions.find((c) => c.slug === catSlug);
    return matchedCategory?._id ?? null;
  }, [categorySlugFromPath, searchParams, categoryOptions]);

  const activeCategory = categoryFromUrl;
  
  // Map sortBy to the limited options supported by listPublishedPaginated
  const paginatedSortBy = sortBy === 'popular' ? 'popular' : (sortBy === 'oldest' ? 'oldest' : 'newest');
  
  // Use usePaginatedQuery for infinite scroll mode (reactive, accumulates results)
  const {
    results: infiniteResults,
    status: infiniteStatus,
    loadMore,
  } = usePaginatedQuery(
    api.posts.listPublishedPaginated,
    { 
      categoryId: activeCategory ?? undefined,
      sortBy: paginatedSortBy,
    },
    { initialNumItems: postsPerPage }
  );
  
  // Use offset-based query for pagination mode (proper server-side pagination)
  const isPaginationMode = listConfig.paginationType === 'pagination';

  const offset = (urlPage - 1) * postsPerPage;
  const paginatedPosts = useQuery(
    api.posts.listPublishedWithOffset,
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
  
  const posts = useMemo(() => {
    if (isPaginationMode) {
      return paginatedPosts ?? [];
    }
    return infiniteResults;
  }, [infiniteResults, isPaginationMode, paginatedPosts]);
  
  // Loading state for pagination mode  
  const isLoadingPosts = isPaginationMode && paginatedPosts === undefined;
  
  const totalCount = useQuery(api.posts.countPublished, {
    categoryId: activeCategory ?? undefined,
  });
  
  // Load more when scrolling to bottom (infinite scroll mode)
  useEffect(() => {
    if (isPaginationMode) {
      return;
    }
    if (inView && infiniteStatus === 'CanLoadMore') {
      loadMore(postsPerPage);
    }
  }, [inView, infiniteStatus, loadMore, postsPerPage, isPaginationMode]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.ceil(totalCount / postsPerPage);
  }, [totalCount, postsPerPage]);

  // Build category map for O(1) lookup
  const categoryMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.name]));
  }, [categories]);

  const categorySlugMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.slug]));
  }, [categories]);

  const getPostDetailHref = useCallback((post: { slug: string; categoryId: Id<'postCategories'> }) => buildDetailPath({
    categorySlug: categorySlugMap.get(post.categoryId),
    mode: routeMode,
    moduleKey: 'posts',
    recordSlug: post.slug,
  }), [categorySlugMap, routeMode]);

  // Handlers
  const handleCategoryChange = useCallback((categoryId: Id<"postCategories"> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (categoryId && categoryOptions.length > 0) {
      const category = categoryOptions.find(c => c._id === categoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'posts' }), { scroll: false });
          return;
        }
        params.set('catpost', category.slug);
      }
    } else {
      params.delete('catpost');
    }
    
    const newUrl = params.toString()
      ? `${buildModuleListPath('posts')}?${params.toString()}`
      : buildModuleListPath('posts');
    router.push(newUrl, { scroll: false });
  }, [searchParams, categoryOptions, router, routeMode]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSizeOverride(value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, pathname, router]);

  const filterKey = `${activeCategory ?? ''}|${debouncedSearchQuery}|${sortBy}|${postsPerPage}`;
  const prevFilterKeyRef = useRef(filterKey);
  
  // Update URL when page changes (pagination mode)
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
    const catSlug = categorySlugFromPath ?? searchParams.get('catpost');
    if (!catSlug || categoryOptions.length === 0) {return;}
    const hasMatch = categoryOptions.some((category) => category.slug === catSlug);
    if (hasMatch) {return;}
    if (routeMode === 'unified' && categorySlugFromPath) {
      router.replace(buildModuleListPath('posts'), { scroll: false });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('catpost');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [categoryOptions, categorySlugFromPath, pathname, router, routeMode, searchParams]);
  
  // Reset page to 1 when search/filter/page size changes
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

  const markThumbnailBroken = useCallback((id: Id<"posts">) => {
    setBrokenThumbnails((prev) => {
      const key = String(id);
      if (prev.has(key)) {return prev;}
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  // Initial loading state only (not on search/filter changes)
  const isInitialLoading = categories === undefined;

  if (isInitialLoading) {
    return <PostsListSkeleton />;
  }

  const PostGridCard = ({ post }: { post: typeof posts[number] }) => {
    const showImage = Boolean(post.thumbnail) && !brokenThumbnails.has(String(post._id));
    const showExcerpt = enabledFields.has('excerpt');
    const cardRadiusClass = getRadiusClass('lg');

    return (
      <Link href={getPostDetailHref(post)} className="group block h-full">
        <article
          className={`overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border h-full flex flex-col ${cardRadiusClass}`}
          style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
        >
          <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: tokens.cardBorder }}>
            {showImage ? (
              <Image
                src={post.thumbnail as string}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                mode="thumb"
                onLoadingComplete={(img) => {
                  if (img.naturalWidth === 0) {
                    markThumbnailBroken(post._id);
                  }
                }}
                onError={() => { markThumbnailBroken(post._id); }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[120px]">
                <FileText size={32} style={{ color: tokens.neutralTextLight }} />
              </div>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              {categoryMap.get(post.categoryId) && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: tokens.categoryBadgeBg,
                    color: tokens.categoryBadgeText,
                    borderColor: tokens.categoryBadgeBorder,
                  }}
                >
                  {categoryMap.get(post.categoryId)}
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold line-clamp-2 flex-1 text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" style={{ color: tokens.bodyText }}>
              {post.title}
            </h2>
            {showExcerpt && post.excerpt && (
              <p className="text-xs line-clamp-2 mt-1.5 text-slate-500 dark:text-slate-400 leading-relaxed">{post.excerpt}</p>
            )}
            <div
              className="flex items-center justify-between text-xs mt-2.5 pt-2.5 border-t"
              style={{ color: tokens.neutralTextLight, borderColor: tokens.cardBorder }}
            >
              <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</span>
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {post.views.toLocaleString()}
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  };

  const PostListCard = ({ post }: { post: typeof posts[number] }) => {
    const showImage = Boolean(post.thumbnail) && !brokenThumbnails.has(String(post._id));
    const showExcerpt = enabledFields.has('excerpt');
    const cardRadiusClass = getRadiusClass('lg');

    return (
      <Link href={getPostDetailHref(post)} className="group block">
        <article
          className={`overflow-hidden hover:shadow-md transition-all duration-350 border ${cardRadiusClass}`}
          style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="sm:w-40 md:w-48 flex-shrink-0">
              <div className="aspect-video sm:aspect-[4/3] sm:h-full overflow-hidden relative" style={{ backgroundColor: tokens.cardBorder }}>
                {showImage ? (
                  <Image
                    src={post.thumbnail as string}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    mode="thumb"
                    onLoadingComplete={(img) => {
                      if (img.naturalWidth === 0) {
                        markThumbnailBroken(post._id);
                      }
                    }}
                    onError={() => { markThumbnailBroken(post._id); }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center min-h-[100px]">
                    <FileText size={28} style={{ color: tokens.neutralTextLight }} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5">
                {categoryMap.get(post.categoryId) && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      backgroundColor: tokens.categoryBadgeBg,
                      color: tokens.categoryBadgeText,
                      borderColor: tokens.categoryBadgeBorder,
                    }}
                  >
                    {categoryMap.get(post.categoryId)}
                  </span>
                )}
                {post.publishedAt && (
                  <span className="text-xs text-slate-450 dark:text-slate-500">
                    {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-bold line-clamp-2 mb-1.5 leading-snug text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" style={{ color: tokens.bodyText }}>
                {post.title}
              </h2>
              {showExcerpt && post.excerpt && (
                <p className="text-xs line-clamp-2 mb-2 leading-relaxed text-slate-500 dark:text-slate-400" style={{ color: tokens.metaText }}>{post.excerpt}</p>
              )}
              <div className="flex items-center gap-1 text-xs mt-1 text-slate-450 dark:text-slate-500">
                <Eye size={12} />
                <span>{post.views.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  };

  const paginationBar = isPaginationMode && totalPages > 1 && (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="order-2 flex w-full items-center justify-between text-sm sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
        <div className="flex items-center gap-2">
          <span style={{ color: tokens.metaText }}>Hiển thị</span>
          <select
            value={postsPerPage}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="h-8 w-[70px] appearance-none rounded-md border px-2 text-sm font-medium shadow-sm focus:outline-none dark:border-zinc-800 bg-white dark:bg-[#161617]"
            style={{
              borderColor: tokens.inputBorder,
              color: tokens.inputText,
            }}
            aria-label="Số bài mỗi trang"
          >
            {[12, 20, 24, 48, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="dark:text-[#86868b]">bài/trang</span>
        </div>

        <div className="text-right sm:text-left">
          <span className="font-medium" style={{ color: tokens.bodyText }}>
            {totalCount ? ((urlPage - 1) * postsPerPage) + 1 : 0}–{Math.min(urlPage * postsPerPage, totalCount ?? 0)}
          </span>
          <span className="mx-1" style={{ color: tokens.neutralTextLight }}>/</span>
          <span className="font-medium" style={{ color: tokens.bodyText }}>{totalCount ?? 0}</span>
          <span className="ml-1" style={{ color: tokens.metaText }}>bài viết</span>
        </div>
      </div>

      <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
        <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
          <button
            onClick={() => handlePageChange(urlPage - 1)}
            disabled={urlPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800"
            style={urlPage === 1 ? undefined : { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder }}
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {generatePaginationItems(urlPage, totalPages).map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center" style={{ color: tokens.paginationEllipsisText }}>
                  …
                </div>
              );
            }

            const pageNum = item as number;
            const isActive = pageNum === urlPage;
            const isMobileHidden = !isActive && pageNum !== 1 && pageNum !== totalPages;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-sm border font-medium'
                    : ''
                } ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                style={isActive ? {
                  backgroundColor: tokens.paginationActiveBg,
                  borderColor: tokens.paginationActiveBorder,
                  color: tokens.paginationActiveText,
                } : {
                  color: tokens.paginationButtonText,
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(urlPage + 1)}
            disabled={urlPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800"
            style={urlPage === totalPages ? undefined : { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder }}
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );

  const infiniteScrollTrigger = listConfig.paginationType === 'infiniteScroll' && (
    <>
      {infiniteStatus !== 'Exhausted' && (
        <div ref={loadMoreRef} className="text-center mt-6 py-8">
          {infiniteStatus === 'LoadingMore' ? (
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotStrong }} />
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotMedium }} />
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotSoft }} />
            </div>
          ) : infiniteStatus === 'CanLoadMore' ? (
            <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Cuộn để xem thêm...</p>
          ) : null}
        </div>
      )}
      {infiniteStatus === 'Exhausted' && posts.length > 0 && (
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Đã hiển thị tất cả {posts.length} bài viết</p>
        </div>
      )}
    </>
  );

  const activeCategoryName = activeCategory && categoryMap ? categoryMap.get(activeCategory as any) : null;

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-black font-active transition-colors duration-200">
      <SharedListLayout
        items={posts}
        totalCount={totalCount}
        isLoading={isLoadingPosts}
        unit="bài viết"
        layoutStyle={layout}
        gridColumns={listConfig.gridColumns}
        cornerRadius="lg"
        showSearch={listConfig.showSearch}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm kiếm bài viết..."
        sortBy={sortBy}
        onSortChange={handleSortChange}
        sortOptions={[
          { value: 'newest', label: 'Mới nhất' },
          { value: 'oldest', label: 'Cũ nhất' },
          { value: 'popular', label: 'Xem nhiều nhất' },
          { value: 'title', label: 'Theo tên A-Z' },
          { value: 'title_desc', label: 'Theo tên Z-A' },
        ]}
        hasActiveFilters={!!activeCategory || !!searchQuery}
        onClearFilters={() => {
          setSearchQuery('');
          setDebouncedSearchQuery('');
          setSortBy('newest');
          handleCategoryChange(null);
        }}
        renderItem={(post) => layout === 'list' ? <PostListCard key={post._id} post={post} /> : <PostGridCard key={post._id} post={post} />}
        renderSkeleton={() => <PostsGridSkeleton count={postsPerPage} />}
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
        headerTitle={activeCategoryName ?? 'Tin tức & Bài viết'}
        headerDescription={activeCategory && categories ? categories.find(c => c._id === activeCategory)?.description : undefined}
        brandColor={brandColor}
        isDark={isDark}
      />
    </div>
  );
}
