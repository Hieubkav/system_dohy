'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Loader2, Users } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';

const formatDate = (value?: number) => value
  ? new Date(value).toLocaleDateString('vi-VN')
  : 'Chưa có';

type CourseStudentsPanelProps = {
  courseId?: Id<'courses'>;
  showCourseColumn?: boolean;
};

export function CourseStudentsPanel({ courseId, showCourseColumn = false }: CourseStudentsPanelProps) {
  const [status, setStatus] = useState<'active' | 'revoked' | 'all'>('active');
  const result = useQuery(api.courses.listCourseStudentsAdmin, {
    courseId,
    limit: 100,
    offset: 0,
    status: status === 'all' ? undefined : status,
  });
  const students = result?.items ?? [];
  const completedCount = students.filter((student) => student.progressPercent >= 100).length;
  const averageProgress = students.length
    ? Math.round(students.reduce((sum, student) => sum + student.progressPercent, 0) / students.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Học viên</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Tiến độ trung bình</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{averageProgress}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Đã hoàn thành</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users size={18} className="text-indigo-500" />
            Danh sách học viên
          </CardTitle>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="active">Đang học</option>
            <option value="revoked">Đã thu hồi</option>
            <option value="all">Tất cả</option>
          </select>
        </CardHeader>
        <CardContent>
          {result === undefined ? (
            <div className="flex h-40 items-center justify-center text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Chưa có học viên phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3 pr-4 font-semibold">Học viên</th>
                    {showCourseColumn && <th className="py-3 pr-4 font-semibold">Khóa học</th>}
                    <th className="py-3 pr-4 font-semibold">Tiến độ</th>
                    <th className="py-3 pr-4 font-semibold">Bài gần nhất</th>
                    <th className="py-3 pr-4 font-semibold">Ngày vào học</th>
                    <th className="py-3 pr-4 font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.studentId}>
                      <td className="py-4 pr-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{student.customerName}</div>
                        <div className="text-xs text-slate-500">{student.customerEmail}</div>
                        <div className="text-xs text-slate-400">{student.customerPhone}</div>
                      </td>
                      {showCourseColumn && (
                        <td className="py-4 pr-4">
                          <Link href={`/admin/courses/${student.courseId}/edit`} className="font-medium text-indigo-600 hover:underline">
                            {student.courseTitle}
                          </Link>
                        </td>
                      )}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${student.progressPercent}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{student.progressPercent}%</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {student.completedLessonsCount}/{student.lessonCount} bài
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">{student.lastLessonTitle ?? 'Chưa học bài nào'}</td>
                      <td className="py-4 pr-4 text-slate-600">{formatDate(student.enrolledAt)}</td>
                      <td className="py-4 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {student.status === 'active' ? 'Đang học' : 'Đã thu hồi'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.hasMore && (
                <p className="mt-4 text-xs text-slate-400">Đang hiển thị 100 học viên đầu tiên.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
