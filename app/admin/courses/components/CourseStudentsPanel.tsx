'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Loader2, ChevronDown, Search } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Input,
  Button
} from '@/app/admin/components/ui';
import { generatePaginationItems } from '@/app/admin/components/TableUtilities';

const formatDate = (value?: number) => value
  ? new Date(value).toLocaleDateString('vi-VN')
  : 'Chưa có';

type CourseStudentsPanelProps = {
  courseId?: Id<'courses'>;
  showCourseColumn?: boolean;
};

export function CourseStudentsPanel({ courseId, showCourseColumn = false }: CourseStudentsPanelProps) {
  const [status, setStatus] = useState<'active' | 'revoked' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => { clearTimeout(timer); };
  }, [searchTerm]);

  const offset = (currentPage - 1) * pageSize;

  const result = useQuery(api.courses.listCourseStudentsAdmin, {
    courseId,
    limit: pageSize,
    offset,
    search: debouncedSearchTerm.trim() || undefined,
    status: status === 'all' ? undefined : status,
  });

  const students = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;
  
  const totalStudents = result?.stats?.totalStudents ?? 0;
  const completedCount = result?.stats?.completedCount ?? 0;
  const averageProgress = result?.stats?.averageProgress ?? 0;

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatus('active');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Học viên</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {result === undefined ? '-' : totalStudents}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Tiến độ trung bình</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {result === undefined ? '-' : `${averageProgress}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Đã hoàn thành</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {result === undefined ? '-' : completedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm học viên..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-slate-700"
              value={status}
              onChange={(e) => { setStatus(e.target.value as typeof status); setCurrentPage(1); }}
            >
              <option value="active">Đang học</option>
              <option value="revoked">Đã thu hồi</option>
              <option value="all">Tất cả</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          </div>
        </div>

        <CardContent className="p-0">
          {result === undefined ? (
            <div className="flex h-40 items-center justify-center text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Chưa có học viên phù hợp.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học viên</TableHead>
                      {showCourseColumn && <TableHead>Khóa học</TableHead>}
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Bài gần nhất</TableHead>
                      <TableHead>Ngày vào học</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{student.customerName}</div>
                          <div className="text-xs text-slate-500">{student.customerEmail}</div>
                          <div className="text-xs text-slate-400">{student.customerPhone}</div>
                        </TableCell>
                        {showCourseColumn && (
                          <TableCell>
                            <Link href={`/admin/courses/${student.courseId}/edit`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                              {student.courseTitle}
                            </Link>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${student.progressPercent}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{student.progressPercent}%</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {student.completedLessonsCount}/{student.lessonCount} bài
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={student.lastLessonTitle}>
                          {student.lastLessonTitle ?? 'Chưa học bài nào'}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(student.enrolledAt)}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                            {student.status === 'active' ? 'Đang học' : 'Đã thu hồi'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex flex-col gap-4 border-t border-slate-100 p-4 text-sm text-slate-500 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span>Hiển thị</span>
                    <select
                      value={pageSize}
                      onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}
                      className="h-8 w-[72px] rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {[10, 20, 30, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <span>học viên/trang · {totalCount} kết quả</span>
                  </div>
                  <nav className="flex items-center gap-1" aria-label="Phân trang">
                    <button
                      onClick={() => { setCurrentPage((prev) => Math.max(1, prev - 1)); }}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
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
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm ${item === currentPage ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                          aria-current={item === currentPage ? 'page' : undefined}
                        >
                          {item}
                        </button>
                      ))}
                    <button
                      onClick={() => { setCurrentPage((prev) => Math.min(totalPages, prev + 1)); }}
                      disabled={currentPage >= totalPages}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
                      aria-label="Trang sau"
                    >
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
