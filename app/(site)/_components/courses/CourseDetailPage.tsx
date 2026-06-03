'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, GraduationCap, PlayCircle, Star, UserRound, ChevronDown, Lock, Play } from 'lucide-react';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { useBrandColors } from '@/components/site/hooks';
import { getCourseLevelLabel } from '@/lib/courses/labels';
import { useCoursesDetailConfig } from '@/lib/experiences';
import { getRadiusClass, getSmallRadiusClass, formatPrice, convertToSlug } from '@/lib/courses/courseUtils';

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

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
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

  const [showPromoVideo, setShowPromoVideo] = useState(false);

  const promoVideoEmbedUrl = useMemo(() => {
    if (!course?.introVideoUrl || course.introVideoType === 'none') return null;
    if (course.introVideoType === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = course.introVideoUrl.match(regExp);
      const videoId = match && match[2].length === 11 ? match[2] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (course.introVideoType === 'drive') {
      return course.introVideoUrl.replace('/view', '/preview');
    }
    return course.introVideoUrl;
  }, [course?.introVideoUrl, course?.introVideoType]);

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

  const CtaCard = () => {
    const hasPromoVideo = !!promoVideoEmbedUrl;
    return (
      <div className={`border border-slate-200 bg-white p-5 group ${radiusClass}`}>
        {/* Thumbnail với hiệu ứng Hover Zoom (T4-02) */}
        <div 
          onClick={hasPromoVideo ? () => setShowPromoVideo(true) : undefined}
          className={`mb-4 flex aspect-video items-center justify-center overflow-hidden bg-slate-100 relative ${smallRadiusClass} ${hasPromoVideo ? 'cursor-pointer group/thumb' : ''}`}
        >
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <>
              <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${accent}22)` }} />
              <PlayCircle size={48} className="relative z-10 transition-transform duration-300 group-hover:scale-105" style={{ color: brandColor }} />
            </>
          )}

          {/* Overlay nút Play tròn lớn nếu có video giới thiệu */}
          {hasPromoVideo && (
            <div className="absolute inset-0 bg-black/35 group-hover/thumb:bg-black/50 transition-colors flex items-center justify-center z-10">
              <div 
                className="bg-white/90 text-slate-900 rounded-full shadow-xl transition-all duration-300 group-hover/thumb:scale-110 group-hover/thumb:bg-white flex items-center justify-center w-14 h-14"
              >
                <Play size={22} fill={brandColor} style={{ color: brandColor }} className="translate-x-[2px]" />
              </div>
              <span className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm tracking-wide">
                Xem giới thiệu
              </span>
            </div>
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
  };

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-0">
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
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: isModern ? 'rgba(255,255,255,.18)' : `${brandColor}12`, color: isModern ? '#fff' : '#334155' }}>
                {category?.name ?? 'Khóa học'}{course.level ? ` · ${getCourseLevelLabel(course.level)}` : ''}
              </span>
            </div>
            <h1 className={`max-w-4xl text-4xl font-bold leading-tight md:text-5xl mt-2 ${isModern ? 'text-white' : 'text-slate-900'}`}>{course.title}</h1>
            {course.excerpt && <p className={`max-w-2xl text-lg mt-2.5 ${isModern ? 'text-white/80' : 'text-slate-600'}`}>{course.excerpt}</p>}
            <div className={`flex flex-wrap gap-4 text-sm mt-3 ${isModern ? 'text-white/80' : 'text-slate-500'}`}>
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
                  
                  const shouldShowSummary = !!chapter.summary;

                  return (
                    <div key={chapter._id} className={`border border-slate-200 bg-white overflow-hidden p-4 ${radiusClass}`}>
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapter._id)}
                        className="flex w-full items-center justify-between text-left focus:outline-none py-1"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-900 text-base md:text-lg">
                            {chapterIndex + 1}. {chapter.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {chapterLessons.length} bài học
                          </p>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      
                      {isOpen && (
                        <div className="mt-3 border-t border-slate-100 pt-3 space-y-3">
                          {shouldShowSummary && (
                            <div className="text-sm text-slate-600 prose-sm prose dark:prose-invert max-w-none bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <RichContent content={withFormatMarker('richtext', chapter.summary!)} />
                            </div>
                          )}
                          
                          {chapterLessons.length > 0 && (
                            <div className="divide-y divide-slate-100 pl-4 md:pl-6">
                              {chapterLessons.map((lesson, lessonIndex) => (
                                <Link
                                  key={lesson._id}
                                  href={`/khoa-hoc/${course.slug}/bai-hoc/${convertToSlug(lesson.title)}--${lesson._id}`}
                                  className="flex items-center justify-between gap-3 py-2.5 text-sm text-slate-700 hover:text-slate-900 transition-colors group/item"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-slate-400 font-mono text-xs w-6 shrink-0">{chapterIndex + 1}.{lessonIndex + 1}</span>
                                    <span className="group-hover/item:underline">{lesson.title}</span>
                                  </span>
                                  {lesson.isPreview ? (
                                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0 group-hover/item:bg-emerald-100 transition-colors">
                                      Học thử
                                    </span>
                                  ) : (
                                    <Lock size={12} className="text-slate-300 group-hover/item:text-slate-400 shrink-0" />
                                  )}
                                </Link>
                              ))}
                            </div>
                          )}
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

      {/* Promo Video Lightbox Modal */}
      {showPromoVideo && promoVideoEmbedUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowPromoVideo(false)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`${promoVideoEmbedUrl}?autoplay=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <button 
              onClick={() => setShowPromoVideo(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2.5 rounded-full transition-colors font-medium text-xs flex items-center justify-center"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CourseDetailSkeleton() {
  const config = useCoursesDetailConfig();
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const secondaryColor = brandColors.secondary || '';
  const colorMode = brandColors.mode || 'single';
  
  const accent = useMemo(() => {
    if (colorMode === 'single' || !secondaryColor) {
      return brandColor + 'dd';
    }
    return secondaryColor;
  }, [brandColor, secondaryColor, colorMode]);

  const cornerRadius = (config as any).cornerRadius ?? 'lg';
  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);
  const isModern = config.layoutStyle === 'modern';
  const showAside = config.showStickyCta || config.showRelated;
  const pulseHeaderClass = isModern ? 'bg-white/20' : 'bg-slate-200';

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Header Skeleton */}
      <section 
        className={`border-b border-slate-100 px-4 ${isModern ? 'py-10 text-white' : 'py-8'}`} 
        style={isModern ? { background: `linear-gradient(135deg, ${brandColor}, ${accent})` } : { backgroundColor: '#f8fafc' }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl space-y-4">
            <div className={`h-4 w-32 animate-pulse rounded ${pulseHeaderClass}`} />
            <div className="flex gap-2">
              <div className={`h-6 w-24 animate-pulse rounded-full ${pulseHeaderClass}`} />
              <div className={`h-6 w-16 animate-pulse rounded-full ${pulseHeaderClass}`} />
            </div>
            <div className="space-y-2.5 max-w-3xl">
              <div className={`h-10 w-full animate-pulse rounded-md ${pulseHeaderClass}`} />
              <div className={`h-10 w-2/3 animate-pulse rounded-md ${pulseHeaderClass}`} />
            </div>
            <div className="space-y-2 max-w-2xl pt-2">
              <div className={`h-5 w-full animate-pulse rounded ${pulseHeaderClass}`} />
              <div className={`h-5 w-5/6 animate-pulse rounded ${pulseHeaderClass}`} />
            </div>
            <div className="flex flex-wrap gap-4 pt-3">
              <div className={`h-5 w-24 animate-pulse rounded-full ${pulseHeaderClass}`} />
              <div className={`h-5 w-28 animate-pulse rounded-full ${pulseHeaderClass}`} />
              <div className={`h-5 w-32 animate-pulse rounded-full ${pulseHeaderClass}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Main grid skeleton */}
      <section className={`mx-auto grid max-w-7xl gap-6 px-4 py-8 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'max-w-4xl mx-auto'}`}>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            </div>
          </div>

          <div className="pt-4">
            <div className="h-7 w-48 animate-pulse rounded bg-slate-200 mb-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex items-start gap-2 border border-slate-100 p-3.5 ${smallRadiusClass}`}>
                  <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200 shrink-0 mt-0.5" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>

          {config.showCurriculum && (
            <div className="pt-4">
              <div className="h-7 w-56 animate-pulse rounded bg-slate-200 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`border border-slate-200 bg-white p-5 flex items-center justify-between ${radiusClass}`}>
                    <div className="space-y-2 w-3/4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                    </div>
                    <div className="h-5 w-5 animate-pulse rounded bg-slate-200 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showAside && (
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {config.showStickyCta && (
              <div className={`border border-slate-200 bg-white p-5 space-y-4 ${radiusClass}`}>
                <div className={`aspect-video animate-pulse bg-slate-200 ${smallRadiusClass}`} />
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
                </div>
                <div 
                  className="h-12 w-full animate-pulse bg-slate-200" 
                  style={{ borderRadius: cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px' }} 
                />
              </div>
            )}

            {config.showRelated && (
              <div className={`border border-slate-200 bg-white p-5 space-y-3.5 ${radiusClass}`}>
                <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            )}
          </aside>
        )}
      </section>
    </div>
  );
}
