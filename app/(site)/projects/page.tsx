'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { useProjectsListConfig } from '@/lib/experiences';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { Search } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';

function ProjectsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="aspect-video bg-slate-200" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-6 w-full rounded bg-slate-200" />
              <div className="h-4 w-3/4 rounded bg-slate-200" />
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
  const listConfig = useProjectsListConfig();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') ?? '');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'title'>('newest');
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
    offset: 0,
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

  return (
    <main className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: brandColor }}>Projects</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white md:text-5xl">Dự án đã thực hiện</h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">Các case study, hình ảnh và video giới thiệu nổi bật.</p>
        </div>

        {(listConfig.showSearch || listConfig.showCategories) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {listConfig.showSearch && (
                <div className="relative max-w-sm flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Tìm kiếm dự án..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {listConfig.showCategories && (
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.slug}>{category.name}</option>
                    ))}
                  </select>
                )}
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as 'newest' | 'oldest' | 'popular' | 'title')}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="popular">Xem nhiều</option>
                  <option value="title">Theo tên</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-slate-500">{totalCount ?? projects.length} dự án</div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500 dark:border-slate-800">
            Chưa có dự án phù hợp.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const category = categoryMap.get(project.categoryId);
              return (
                <Link key={project._id} href={getDetailHref(project)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {project.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={project.thumbnail} alt={project.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">Dự án</div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{category?.name ?? 'Dự án'}</span>
                      {listConfig.showClientName && project.clientName && <span className="truncate text-xs text-slate-400">{project.clientName}</span>}
                    </div>
                    <h2 className="line-clamp-2 text-xl font-semibold text-slate-950 transition group-hover:text-teal-600 dark:text-white">{project.title}</h2>
                    {project.excerpt && <p className="line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{project.excerpt}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
