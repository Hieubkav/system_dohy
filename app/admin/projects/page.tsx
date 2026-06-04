'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Briefcase, Edit, ExternalLink, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEntityImage } from '../components/AdminEntityImage';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';
import { usePersistedPageSize } from '../components/usePersistedPageSize';

const STATUS_LABEL: Record<string, string> = {
  Published: 'Đã xuất bản',
  Draft: 'Bản nháp',
  Archived: 'Lưu trữ',
};

export default function ProjectsListPage() {
  return (
    <ModuleGuard moduleKey="projects">
      <ProjectsContent />
    </ModuleGuard>
  );
}

function ProjectsContent() {
  const categoriesData = useQuery(api.projectCategories.listAll, {});
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'projects' });
  const deleteProject = useMutation(api.projects.remove);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'Published' | 'Draft' | 'Archived'>('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const projectsPerPage = useMemo(() => {
    const setting = settingsData?.find((item) => item.settingKey === 'projectsPerPage');
    return (setting?.value as number) || 12;
  }, [settingsData]);
  const [resolvedProjectsPerPage, setPageSizeOverride] = usePersistedPageSize('admin_projects_page_size', projectsPerPage);
  const offset = (currentPage - 1) * resolvedProjectsPerPage;

  const projectsData = useQuery(api.projects.listAdminWithOffset, {
    limit: resolvedProjectsPerPage,
    offset,
    search: debouncedSearchTerm.trim() || undefined,
    status: filterStatus || undefined,
  });
  const totalCountData = useQuery(api.projects.countAdmin, {
    search: debouncedSearchTerm.trim() || undefined,
    status: filterStatus || undefined,
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categoriesData?.forEach((category) => map.set(category._id, category.name));
    return map;
  }, [categoriesData]);

  const isLoading = projectsData === undefined || totalCountData === undefined || categoriesData === undefined;
  const totalCount = totalCountData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / resolvedProjectsPerPage));

  const handleDelete = async (id: Id<'projects'>) => {
    if (!confirm('Xóa dự án này? File media liên quan sẽ được dọn qua FLS nếu không còn được sử dụng.')) {return;}
    try {
      await deleteProject({ id });
      toast.success('Đã xóa dự án');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa dự án');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterStatus('');
    setCurrentPage(1);
    setPageSizeOverride(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-500/10 p-2">
            <Briefcase className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản lý dự án</h1>
            <p className="text-sm text-slate-500">Dự án, video giới thiệu và thư viện ảnh.</p>
          </div>
        </div>
        <Link href="/admin/projects/create">
          <Button className="gap-2 bg-teal-600 hover:bg-teal-500"><Plus size={16} /> Thêm dự án</Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm dự án..."
              className="pl-9"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={filterStatus}
              onChange={(event) => {
                setFilterStatus(event.target.value as '' | 'Published' | 'Draft' | 'Archived');
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Published">Đã xuất bản</option>
              <option value="Draft">Bản nháp</option>
              <option value="Archived">Lưu trữ</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Ảnh</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-500" />
                </TableCell>
              </TableRow>
            ) : projectsData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  {searchTerm || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có dự án nào'}
                </TableCell>
              </TableRow>
            ) : (
              projectsData.map((project) => (
                <TableRow key={project._id}>
                  <TableCell>
                    <AdminEntityImage
                      src={project.thumbnail}
                      alt={project.title}
                      variant="project"
                      width={48}
                      height={32}
                      className="h-8 w-12"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{project.title}</div>
                    <div className="font-mono text-xs text-slate-500">{project.slug}</div>
                  </TableCell>
                  <TableCell>{categoryMap.get(project.categoryId) ?? 'Không có'}</TableCell>
                  <TableCell>
                    <Badge variant={project.status === 'Published' ? 'success' : (project.status === 'Draft' ? 'secondary' : 'warning')}>
                      {STATUS_LABEL[project.status] ?? project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-teal-600 hover:text-teal-700" onClick={() => window.open(`/projects/${project.slug}`, '_blank')}>
                        <ExternalLink size={16} />
                      </Button>
                      <Link href={`/admin/projects/${project._id}/edit`}>
                        <Button variant="ghost" size="icon"><Edit size={16} /></Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => { void handleDelete(project._id); }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalCount > 0 && !isLoading && (
          <div className="flex flex-col gap-4 border-t border-slate-100 p-4 text-sm text-slate-500 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select
                value={resolvedProjectsPerPage}
                onChange={(event) => {
                  setPageSizeOverride(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                {[12, 20, 30, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <span>dự án/trang</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Trước</Button>
              <span>Trang {currentPage}/{totalPages}{totalCountData?.hasMore ? '+' : ''}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Sau</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
