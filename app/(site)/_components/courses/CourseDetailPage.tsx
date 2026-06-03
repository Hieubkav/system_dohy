'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, GraduationCap, PlayCircle, Star, UserRound, ChevronDown } from 'lucide-react';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { useBrandColors } from '@/components/site/hooks';
import { getCourseLevelLabel } from '@/lib/courses/labels';
import { useCoursesDetailConfig } from '@/lib/experiences';

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const getRadiusClass = (radius?: 'none' | 'sm' | 'lg', type: 'card' | 'input' | 'panel' = 'card') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') {
    if (type === 'panel') return 'rounded-xl';
    return 'rounded-lg';
  }
  if (type === 'panel') return 'rounded-2xl';
  return 'rounded-xl';
};

const getSmallRadiusClass = (radius?: 'none' | 'sm' | 'lg') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') return 'rounded';
  return 'rounded-lg';
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
  const router = useRouter();
  const config = useCoursesDetailConfig();
  const brandColors = useBrandColors();
  const course = useQuery(api.courses.getBySlug, { slug });
  const category = useQuery(api.courseCategories.getById, course?.categoryId ? { id: course.categoryId } : 'skip');
  const chapters = useQuery(api.courses.listChapters, course?._id ? { courseId: course._id } : 'skip');
  const lessons = useQuery(api.courses.listLessonsByCourse, course?._id ? { courseId: course._id } : 'skip');
  const relatedCourses = useQuery(api.courses.searchPublished, course?.categoryId ? { categoryId: course.categoryId, limit: 4 } : 'skip');
  const incrementViews = useMutation(api.courses.incrementViews);

  const brandColor = brandColors.primary;
  const secondaryColor = brandColors.secondary || '';
  const colorMode = brandColors.mode || 'single';
  
  // Tự sinh màu gradient Modern ở chế độ 1 màu (T2-02)
  const accent = useMemo(() => {
    if (colorMode === 'single' || !secondaryColor) {
      return brandColor + 'dd';
    }
    return secondaryColor;
  }, [brandColor, secondaryColor, colorMode]);

  const cornerRadius = config.cornerRadius ?? 'lg';
  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);

  // Accordion cho danh sách bài học (T4-01)
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  useEffect(() => {
    if (chapters && chapters.length > 0 && Object.keys(openChapters).length === 0) {
      setOpenChapters({ [chapters[0]._id]: true });
    }
  }, [chapters, openChapters]);

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

  const showAside = config.showStickyCta || (related.length > 0);

  // Điều hướng nút đăng ký học sang trang liên hệ (T0-02)
  const handleRegister = () => {
    router.push(`/contact?subject=${encodeURIComponent(`Đăng ký khóa học: ${course.title}`)}`);
  };

  const CtaCard = () => (
    <div className={`border border-slate-200 bg-white p-5 group ${radiusClass}`}>
      {/* Thumbnail với hiệu ứng Hover Zoom (T4-02) */}
      <div className={`mb-4 flex aspect-video items-center justify-center overflow-hidden bg-slate-100 relative ${smallRadiusClass}`}>
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <>
            <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${accent}22)` }} />
            <PlayCircle size={48} className="relative z-10 transition-transform duration-300 group-hover:scale-105" style={{ color: brandColor }} />
          </>
        )}
      </div>
      {showPrice && (
        <>
          <p className="text-sm text-slate-500">{course.priceNote || 'Học trọn đời'}</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>{price}</p>
        </>
      )}
      {showPrice && course.comparePriceAmount && course.pricingType === 'paid' && (
        <p className="text-sm text-slate-400">
          Giá gốc: <span className="line-through">{formatPrice('paid', course.comparePriceAmount)}</span>
        </p>
      )}
      <button type="button" onClick={handleRegister} className="mt-4 w-full px-5 py-3 font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: brandColor, borderRadius: cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px' }}>
        {!showPrice || course.pricingType === 'contact' ? 'Liên hệ tư vấn' : 'Đăng ký học'}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-white pb-16 lg:pb-0">
      <section className={`border-b border-slate-100 px-4 ${isModern ? 'py-10 text-white' : 'py-8'}`} style={isModern ? { background: `linear-gradient(135deg, ${brandColor}, ${accent})` } : undefined}>
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl space-y-4">
            <Link href="/khoa-hoc" className={`inline-flex items-center gap-2 text-sm ${isModern ? 'text-white/80' : 'text-slate-500'}`}>
              <ArrowLeft size={16} /> Tất cả khóa học
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {course.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                  <Star size={12} className="fill-current" /> Nổi bật
                </span>
              )}
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: isModern ? 'rgba(255,255,255,.18)' : `${brandColor}18`, color: isModern ? '#fff' : brandColor }}>
                {category?.name ?? 'Khóa học'}{course.level ? ` · ${getCourseLevelLabel(course.level)}` : ''}
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
        </div>
      </section>

      {/* Sửa lỗi layout co giãn động khi ẩn cột bên (T0-01) */}
      <section className={`mx-auto grid max-w-7xl gap-6 px-4 py-8 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'max-w-4xl mx-auto'}`}>
        <div className="space-y-8">
          <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600">
            <RichContent content={courseContent} />
          </article>

          {/* Đồng bộ mục kiến thức và tiêu đề "Bạn sẽ học được gì?" (T1-01) */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Bạn sẽ học được gì?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Biết cách tổ chức dự án rõ ràng', 'Tối ưu SEO cho trang học', 'Kết nối dữ liệu động', 'Đưa website lên online'].map((item) => (
                <div key={item} className={`flex items-start gap-2 border border-slate-200 p-3 text-sm text-slate-700 ${smallRadiusClass}`}>
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: brandColor }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {config.showCurriculum && (
            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Nội dung khóa học</h2>
              <div className="space-y-3">
                {chapters?.map((chapter, chapterIndex) => {
                  const chapterLessons = lessonsByChapter.get(chapter._id) ?? [];
                  const isOpen = openChapters[chapter._id] ?? false;
                  return (
                    <div key={chapter._id} className={`border border-slate-200 bg-white overflow-hidden p-4 ${radiusClass}`}>
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapter._id)}
                        className="flex w-full items-center justify-between text-left focus:outline-none"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-900">{chapterIndex + 1}. {chapter.title}</h3>
                          {chapter.summary && <p className="mt-1 text-sm text-slate-500">{chapter.summary}</p>}
                        </div>
                        <ChevronDown
                          size={18}
                          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      
                      {isOpen && (
                        <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2">
                          {chapterLessons.map((lesson) => (
                            <div key={lesson._id} className="flex items-center justify-between gap-3 py-2 text-sm text-slate-700">
                              <span>{chapterIndex + 1}.{lesson.order + 1}. {lesson.title}</span>
                              {lesson.isPreview && <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Xem thử</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {chapters?.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">Nội dung khóa học đang được cập nhật.</div>}
              </div>
            </section>
          )}
        </div>

        {showAside && (
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {config.showStickyCta && <CtaCard />}
            {related.length > 0 && (
              <div className={`border border-slate-200 bg-white p-5 ${radiusClass}`}>
                <h3 className="font-semibold text-slate-900">Khóa học liên quan</h3>
                <div className="mt-3 space-y-3">
                  {related.map((item) => (
                    <Link key={item._id} href={`/khoa-hoc/${item.slug}`} className="block text-sm text-slate-600 hover:text-slate-900 hover:underline">{item.title}</Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </section>

      {/* Sticky Bottom CTA cho Mobile (T2-01) */}
      {config.showStickyCta && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Học phí</p>
            <p className="text-lg font-bold" style={{ color: accent }}>{price}</p>
          </div>
          <button type="button" onClick={handleRegister} className={`px-5 py-2.5 text-xs font-bold text-white shadow-sm`} style={{ backgroundColor: brandColor, borderRadius: cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px' }}>
            {!showPrice || course.pricingType === 'contact' ? 'Liên hệ' : 'Đăng ký'}
          </button>
        </div>
      )}
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
