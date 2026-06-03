'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { CourseStudentsPanel } from '@/app/admin/courses/components/CourseStudentsPanel';

export default function CourseStudentsPage() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-500/10 p-2">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Học viên khóa học</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi học viên, tiến độ học và chứng nhận hoàn thành.</p>
        </div>
      </div>

      <CourseStudentsPanel showCourseColumn />
    </div>
  );
}
