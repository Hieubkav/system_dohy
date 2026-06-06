'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { useProjectsListConfig } from '@/lib/experiences';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { Search } from 'lucide-react';
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const { primary: brandColor } = useBrandColors();
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const listConfig = useProjectsListConfig();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') ?? '');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'title'>('newest');
  const [offset, setOffset] = useState(0);
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const categories = useQuery(api.projectCategories.listActive, { limit: 100 });
  const activeCategory = useMemo(
    () => categories?.find((category) => category.slug === selectedCategory || category._id === selectedCategory),
    [categories, selectedCategory]
  );
  const projects = useQuery(api.projects.listPublishedWithOffset, {
    categoryId: activeCategory?._id,
    limit: listConfig.postsPerPage,
    offset,
    search: searchQuery.trim() || undefined,
    sortBy,
  });
  const totalCount = useQuery(api.projects.countPublished, {
    categoryId: activeCategory?._id,
    search: searchQuery.trim() || undefined,
  });
  const categoryMap = useMemo(() => new Map((categories ?? []).map((category) => [category._id, category])), [categories]);

  if (!categories || !projects) {
    return <ProjectsSkeleton />;
  }

  const getDetailHref = (project: { categoryId: Id<'projectCategories'>; slug: string }) => buildDetailPath({
    categorySlug: categoryMap.get(project.categoryId)?.slug,
    mode: routeMode,
    moduleKey: 'projects',
    recordSlug: project.slug,
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setOffset(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setOffset(0);
  };

  const handleSortChange = (value: 'newest' | 'oldest' | 'popular' | 'title') => {
    setSortBy(value);
    setOffset(0);
  };

  const total = totalCount ?? projects.length;
  const hasMore = offset + listConfig.postsPerPage < total;
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
              value={selectedCategory}
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
            onChange={(event) => handleSortChange(event.target.value as 'newest' | 'oldest' | 'popular' | 'title')}
            className="h-10 rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] px-3 text-sm dark:border-zinc-700 dark:text-[#f5f5f7]"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="popular">Xem nhiều</option>
            <option value="title">Theo tên</option>
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
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${!selectedCategory ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                style={!selectedCategory ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColor}18`, color: brandColor, borderColor: isDark ? '#3a3a3c' : 'transparent', borderWidth: isDark ? '1px' : '0' } : undefined}
              >
                Tất cả
              </button>
            </li>
            {categories.map((category) => (
              <li key={category._id}>
                <button
                  type="button"
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${selectedCategory === category.slug ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                  style={selectedCategory === category.slug ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColor}18`, color: brandColor, borderColor: isDark ? '#3a3a3c' : 'transparent', borderWidth: isDark ? '1px' : '0' } : undefined}
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
          onChange={(event) => handleSortChange(event.target.value as 'newest' | 'oldest' | 'popular' | 'title')}
          className="h-9 w-full rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] px-3 text-sm dark:border-zinc-700 dark:text-[#f5f5f7]"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="popular">Xem nhiều</option>
          <option value="title">Theo tên</option>
        </select>
      </div>
    </aside>
  );

  const paginationBar = (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-slate-500">{total} dự án</span>
      <div className="flex gap-2">
        {offset > 0 && (
          <button
            type="button"
            onClick={() => setOffset(Math.max(0, offset - listConfig.postsPerPage))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#161617] text-slate-700 dark:text-[#f5f5f7] hover:dark:bg-[#2c2c2e]"
          >
            Trước
          </button>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={() => setOffset(offset + listConfig.postsPerPage)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 animate-pulse"
            style={{ backgroundColor: brandColor }}
          >
            Xem thêm
          </button>
        )}
      </div>
    </div>
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
      <Link href={getDetailHref(project)} className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-[#161617]">
        <div className="w-40 flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-[#1c1c1e] sm:w-52">
          {project.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnail} alt={project.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Dự án</div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center space-y-2 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-[#1c1c1e] dark:text-[#f5f5f7]">{category?.name ?? 'Dự án'}</span>
            {listConfig.showClientName && project.clientName && <span className="text-xs text-slate-400">{project.clientName}</span>}
          </div>
          <h2 className="line-clamp-2 text-base font-semibold text-slate-950 transition group-hover:opacity-90 dark:text-[#f5f5f7]">{project.title}</h2>
          {project.excerpt && <p className="line-clamp-2 text-sm leading-5 text-slate-600 dark:text-[#86868b]">{project.excerpt}</p>}
        </div>
      </Link>
    );
  };

  const pageHeader = (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: brandColor }}>Projects</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-[#f5f5f7] md:text-5xl">Dự án đã thực hiện</h1>
      <p className="mt-4 text-base text-slate-600 dark:text-[#86868b]">Các case study, hình ảnh và video giới thiệu nổi bật.</p>
    </div>
  );

  if (layoutStyle === 'grid') {
    return (
      <main className="px-4 py-10 md:py-14 min-h-screen bg-slate-50 dark:bg-black font-active text-slate-700 dark:text-[#f5f5f7] transition-colors duration-200">
        <div className="mx-auto max-w-7xl space-y-8">
          {pageHeader}
          {topFilterBar}
          {projects.length === 0 ? emptyState : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => <GridCard key={project._id} project={project} />)}
            </div>
          )}
          {paginationBar}
        </div>
      </main>
    );
  }

  if (layoutStyle === 'sidebar') {
    return (
      <main className="px-4 py-10 md:py-14 min-h-screen bg-slate-50 dark:bg-black font-active text-slate-700 dark:text-[#f5f5f7] transition-colors duration-200">
        <div className="mx-auto max-w-7xl space-y-8">
          {pageHeader}
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {sidebarFilter}
            <div className="min-w-0 flex-1 space-y-6">
              {projects.length === 0 ? emptyState : (
                <div className="grid gap-6 md:grid-cols-2">
                  {projects.map((project) => <GridCard key={project._id} project={project} />)}
                </div>
              )}
              {paginationBar}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-10 md:py-14 min-h-screen bg-slate-50 dark:bg-black font-active text-slate-700 dark:text-[#f5f5f7] transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-8">
        {pageHeader}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {sidebarFilter}
          <div className="min-w-0 flex-1 space-y-6">
            {projects.length === 0 ? emptyState : (
              <div className="flex flex-col gap-4">
                {projects.map((project) => <ListCard key={project._id} project={project} />)}
              </div>
            )}
            {paginationBar}
          </div>
        </div>
      </div>
    </main>
  );
}
