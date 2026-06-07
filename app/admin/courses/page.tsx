'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getCourseLevelLabel } from '@/lib/courses/labels';
import { BookOpen, ChevronDown, Copy, Edit, ExternalLink, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEntityImage } from '../components/AdminEntityImage';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { ModuleGuard } from '../components/ModuleGuard';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';

type CourseStatus = '' | 'Published' | 'Draft' | 'Archived';

function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export default function CoursesListPage() {
  return (
    <ModuleGuard moduleKey="courses">
      <CoursesContent />
    </ModuleGuard>
  );
}

function CoursesContent() {
  const categoriesData = useQuery(api.courseCategories.listAll, {});
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'courses' });
  const deleteCourse = useMutation(api.courses.remove);
  const duplicateCourse = useMutation(api.courses.duplicate);
  const bulkClearBrokenMedia = useMutation(api.courses.bulkClearBrokenMedia);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<CourseStatus>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<'courses'> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [cloningCourseId, setCloningCourseId] = useState<Id<'courses'> | null>(null);
  const [isClearingMedia, setIsClearingMedia] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 300);
    return () => { clearTimeout(timer); };
  }, [searchTerm]);

  const defaultPageSize = useMemo(() => {
    const setting = settingsData?.find((item) => item.settingKey === 'coursesPerPage');
    return (setting?.value as number) || 10;
  }, [settingsData]);
  const [pageSize, setPageSizeOverride] = usePersistedPageSize('admin_courses_page_size', defaultPageSize);
  const offset = (currentPage - 1) * pageSize;

  const coursesData = useQuery(api.courses.listAdminWithOffset, {
    limit: pageSize,
    offset,
    search: debouncedSearchTerm.trim() || undefined,
    status: filterStatus || undefined,
  });
  const totalCountData = useQuery(api.courses.countAdmin, {
    search: debouncedSearchTerm.trim() || undefined,
    status: filterStatus || undefined,
  });
  const deleteInfo = useQuery(api.courses.getDeleteInfo, deleteTargetId ? { id: deleteTargetId } : 'skip');

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; slug: string }> = {};
    categoriesData?.forEach((category) => {
      map[category._id] = { name: category.name, slug: category.slug };
    });
    return map;
  }, [categoriesData]);

  const courses = coursesData ?? [];
  const isLoading = coursesData === undefined || totalCountData === undefined || categoriesData === undefined;
  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  const formatPrice = (pricingType: string, price?: number) => {
    if (pricingType === 'free') {return 'Miễn phí';}
    if (pricingType === 'contact') {return 'Liên hệ';}
    if (!price) {return '-';}
    return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  };

  const openFrontend = (slug: string, categoryId: string) => {
    const categorySlug = categoryMap[categoryId]?.slug;
    window.open(categorySlug ? `/${categorySlug}/${slug}` : `/khoa-hoc/${slug}`, '_blank');
  };

  const handleDuplicateCourse = async (id: Id<'courses'>) => {
    setCloningCourseId(id);
    try {
      const result = await duplicateCourse({ id });
      toast.success(`Đã tạo bản sao: ${result.title}`);
    } catch {
      toast.error('Không thể copy khóa học');
    } finally {
      setCloningCourseId(null);
    }
  };

  const handleDelete = (id: Id<'courses'>) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteCourse({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa khóa học');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Không thể xóa khóa học');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleClearBrokenMedia = async () => {
    if (courses.length === 0) {return;}
    setIsClearingMedia(true);
    try {
      const result = await bulkClearBrokenMedia({ ids: courses.map((course) => course._id) });
      if (result.cleared > 0) {
        toast.success(`Đã xóa ${result.cleared} ảnh lỗi`);
      } else {
        toast.info('Không tìm thấy ảnh lỗi trên trang hiện tại');
      }
    } catch {
      toast.error('Không thể quét ảnh lỗi');
    } finally {
      setIsClearingMedia(false);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản lý khóa học</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Khóa học, giá, giảng viên và nội dung học</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { void handleClearBrokenMedia(); }} disabled={isClearingMedia || courses.length === 0}>
            {isClearingMedia ? 'Đang quét...' : 'Dọn ảnh lỗi'}
          </Button>
          <Link href="/admin/courses/create">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500"><Plus size={16} /> Thêm khóa học</Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm khóa học..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as CourseStatus); setCurrentPage(1); }}
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
              <TableHead>Khóa học</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Nội dung học</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell><div className="h-10 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="ml-auto h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                </TableRow>
              ))
            ) : courses.map((course) => (
              <TableRow key={course._id}>
                <TableCell>
                  <AdminEntityImage
                    src={course.thumbnail}
                    alt={course.title}
                    variant="course"
                    width={64}
                    height={40}
                    className="h-10 w-16"
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{course.title}</div>
                  <div className="text-xs text-slate-500">{course.instructorName || 'Chưa có giảng viên'}{course.level ? ` · ${getCourseLevelLabel(course.level)}` : ''}</div>
                </TableCell>
                <TableCell>{categoryMap[course.categoryId]?.name ?? 'Không có'}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">{formatPrice(course.pricingType, course.priceAmount)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{course.chapterCount} chương · {course.lessonCount} bài</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={course.status === 'Published' ? 'success' : course.status === 'Draft' ? 'secondary' : 'warning'}>
                    {course.status === 'Published' ? 'Đã xuất bản' : course.status === 'Draft' ? 'Bản nháp' : 'Lưu trữ'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Xem khóa học" onClick={() => { openFrontend(course.slug, course.categoryId); }}>
                      <ExternalLink size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Copy khóa học"
                      onClick={() => { void handleDuplicateCourse(course._id); }}
                      disabled={cloningCourseId === course._id}
                    >
                      {cloningCourseId === course._id ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                    </Button>
                    <Link href={`/admin/courses/${course._id}/edit`}><Button variant="ghost" size="icon"><Edit size={16} /></Button></Link>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => { handleDelete(course._id); }}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  {searchTerm || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có khóa học nào'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalCount > 0 && !isLoading && (
          <div className="flex flex-col gap-4 border-t border-slate-100 p-4 text-sm text-slate-500 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(event) => { setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); }}
                className="h-8 w-[72px] rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900"
              >
                {[10, 20, 30, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <span>khóa học/trang · {totalCount}{totalCountData?.hasMore ? '+' : ''} kết quả</span>
            </div>
            <nav className="flex items-center gap-1" aria-label="Phân trang">
              <button
                onClick={() => { setCurrentPage((prev) => Math.max(1, prev - 1)); }}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>
              {generatePaginationItems(currentPage, totalPages).map((item, index) => item === 'ellipsis'
                ? <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">…</div>
                : (
                  <button
                    key={item}
                    onClick={() => { setCurrentPage(item); }}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm ${item === currentPage ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                    aria-current={item === currentPage ? 'page' : undefined}
                  >
                    {item}
                  </button>
                ))}
              <button
                onClick={() => { setCurrentPage((prev) => Math.min(totalPages, prev + 1)); }}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </nav>
          </div>
        )}
      </Card>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa khóa học"
        itemName={courses.find((course) => course._id === deleteTargetId)?.title ?? 'khóa học'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
