'use client';

import React, { use, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, GraduationCap, PlayCircle, Star, UserRound } from 'lucide-react';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { useBrandColors } from '@/components/site/hooks';
import { useCoursesDetailConfig } from '@/lib/experiences';

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const formatPrice = (pricingType: string, price?: number) => {
  if (pricingType === 'free') {return 'Miễn phí';}
  if (pricingType === 'contact') {return 'Liên hệ';}
  if (!price) {return 'Liên hệ';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

type CourseContentSource = {
  content: string;
  htmlRender?: string;
  markdownRender?: string;
  renderType?: 'content' | 'markdown' | 'html';
};

const resolveCourseContent = (course: CourseContentSource) => {
  if (course.renderType === 'markdown') {
    return course.markdownRender ? withFormatMarker('markdown', course.markdownRender) : '';
  }
  if (course.renderType === 'html') {
    return course.htmlRender ? withFormatMarker('html', course.htmlRender) : '';
  }
  return course.content ? withFormatMarker('richtext', course.content) : '';
};

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = use(params);
  const config = useCoursesDetailConfig();
  const brandColors = useBrandColors();
  const course = useQuery(api.courses.getBySlug, { slug });
  const category = useQuery(api.courseCategories.getById, course?.categoryId ? { id: course.categoryId } : 'skip');
  const chapters = useQuery(api.courses.listChapters, course?._id ? { courseId: course._id } : 'skip');
  const lessons = useQuery(api.courses.listLessonsByCourse, course?._id ? { courseId: course._id } : 'skip');
  const relatedCourses = useQuery(api.courses.searchPublished, course?.categoryId ? { categoryId: course.categoryId, limit: 4 } : 'skip');
  const incrementViews = useMutation(api.courses.incrementViews);

  useEffect(() => {
    if (course?._id) {
      void incrementViews({ id: course._id });
    }
  }, [course?._id, incrementViews]);

  const lessonsByChapter = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    lessons?.forEach((lesson) => {
      map.set(lesson.chapterId, [...(map.get(lesson.chapterId) ?? []), lesson]);
    });
    return map;
  }, [lessons]);

  if (course === undefined) {
    return <CourseDetailSkeleton />;
  }

  if (course === null || course.status !== 'Published') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy khóa học</h1>
          <p className="mt-2 text-slate-500">Khóa học không tồn tại hoặc chưa được xuất bản.</p>
          <Link href="/khoa-hoc" className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-white" style={{ backgroundColor: brandColors.primary }}>
            <ArrowLeft size={18} /> Xem tất cả khóa học
          </Link>
        </div>
      </div>
    );
  }

  const related = config.showRelated ? (relatedCourses?.filter((item) => item._id !== course._id).slice(0, 3) ?? []) : [];
  const price = formatPrice(course.pricingType, course.priceAmount);
  const showPrice = course.isPriceVisible !== false;
  const courseContent = resolveCourseContent(course);
  const isModern = config.layoutStyle === 'modern';
  const isMinimal = config.layoutStyle === 'minimal';

  const CtaCard = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-slate-100">
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <PlayCircle size={48} style={{ color: brandColors.primary }} />
        )}
      </div>
      {showPrice && (
        <>
          <p className="text-sm text-slate-500">{course.priceNote || 'Học trọn đời'}</p>
          <p className="mt-1 text-3xl font-bold" style={{ color: brandColors.secondary || brandColors.primary }}>{price}</p>
        </>
      )}
      {showPrice && course.comparePriceAmount && course.pricingType === 'paid' && (
        <p className="text-sm text-slate-400 line-through">{formatPrice('paid', course.comparePriceAmount)}</p>
      )}
      <button type="button" className="mt-4 w-full rounded-xl px-5 py-3 font-semibold text-white" style={{ backgroundColor: brandColors.primary }}>
        {!showPrice || course.pricingType === 'contact' ? 'Liên hệ tư vấn' : 'Đăng ký học'}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-white">
      <section className={`px-4 ${isModern ? 'py-14 text-white' : 'py-10'}`} style={isModern ? { background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary || brandColors.primary})` } : undefined}>
        <div className={`mx-auto max-w-7xl ${isMinimal ? '' : 'grid gap-8 lg:grid-cols-[1fr_360px]'}`}>
          <div className="space-y-5">
            <Link href="/khoa-hoc" className={`inline-flex items-center gap-2 text-sm ${isModern ? 'text-white/80' : 'text-slate-500'}`}>
              <ArrowLeft size={16} /> Tất cả khóa học
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {course.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                  <Star size={12} className="fill-current" /> Nổi bật
                </span>
              )}
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: isModern ? 'rgba(255,255,255,.18)' : `${brandColors.primary}18`, color: isModern ? '#fff' : brandColors.primary }}>
                {category?.name ?? 'Khóa học'}{course.level ? ` · ${course.level}` : ''}
              </span>
            </div>
            <h1 className={`max-w-4xl text-4xl font-bold leading-tight md:text-5xl ${isModern ? 'text-white' : 'text-slate-900'}`}>{course.title}</h1>
            {course.excerpt && <p className={`max-w-2xl text-lg ${isModern ? 'text-white/80' : 'text-slate-600'}`}>{course.excerpt}</p>}
            <div className={`flex flex-wrap gap-4 text-sm ${isModern ? 'text-white/80' : 'text-slate-500'}`}>
              <span className="inline-flex items-center gap-1"><BookOpen size={16} />{course.lessonCount} bài học</span>
              {course.durationText && <span className="inline-flex items-center gap-1"><Clock size={16} />{course.durationText}</span>}
              {config.showInstructor && course.instructorName && <span className="inline-flex items-center gap-1"><UserRound size={16} />{course.instructorName}</span>}
            </div>
          </div>
          {!isMinimal && <CtaCard />}
        </div>
      </section>

      <section className={`mx-auto grid max-w-7xl gap-8 px-4 py-10 ${isMinimal ? '' : 'lg:grid-cols-[1fr_320px]'}`}>
        <div className="space-y-10">
          <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600">
            <RichContent content={courseContent} />
          </article>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Bạn sẽ nhận được</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Lộ trình học rõ ràng theo chương', 'Bài học video dễ theo dõi', 'Bài preview trước khi đăng ký', 'Nội dung thực chiến có thể áp dụng'].map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                  <CheckCircle2 size={16} style={{ color: brandColors.primary }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {config.showCurriculum && (
            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Nội dung khóa học</h2>
              <div className="space-y-3">
                {chapters?.map((chapter) => {
                  const chapterLessons = lessonsByChapter.get(chapter._id) ?? [];
                  return (
                    <div key={chapter._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h3 className="font-semibold text-slate-900">{chapter.order + 1}. {chapter.title}</h3>
                      {chapter.summary && <p className="mt-1 text-sm text-slate-500">{chapter.summary}</p>}
                      {chapterLessons.length > 0 && (
                        <div className="mt-3 divide-y divide-slate-100">
                          {chapterLessons.map((lesson) => (
                            <div key={lesson._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                              <span className="text-slate-700">{lesson.order + 1}. {lesson.title}</span>
                              {lesson.isPreview && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">Preview</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {chapters?.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">Curriculum đang được cập nhật.</div>}
              </div>
            </section>
          )}
        </div>

        {!isMinimal && (
          <aside className="space-y-4">
            {config.showStickyCta && <CtaCard />}
            {related.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">Khóa học liên quan</h3>
                <div className="mt-3 space-y-3">
                  {related.map((item) => (
                    <Link key={item._id} href={`/khoa-hoc/${item.slug}`} className="block text-sm text-slate-600 hover:text-slate-900">{item.title}</Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </section>
    </main>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-12">
      <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-12 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
      <div className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
