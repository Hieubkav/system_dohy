import React from 'react';
import { BookOpen, Clock, GraduationCap, PlayCircle, Search, Star, UserRound } from 'lucide-react';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type CoursesListLayoutStyle = 'grid' | 'sidebar' | 'masonry';
type CourseDetailLayoutStyle = 'classic' | 'modern' | 'minimal';
type PaginationType = 'pagination' | 'infiniteScroll';

type CoursesListPreviewProps = {
  layoutStyle: CoursesListLayoutStyle;
  paginationType?: PaginationType;
  showSearch?: boolean;
  showCategories?: boolean;
  showLevelFilter?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
};

type CourseDetailPreviewProps = {
  layoutStyle: CourseDetailLayoutStyle;
  showCurriculum?: boolean;
  showInstructor?: boolean;
  showRelated?: boolean;
  showStickyCta?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
};

const MOCK_COURSES = [
  { title: 'Lộ trình Next.js thực chiến', category: 'Frontend', level: 'Intermediate', lessons: 42, duration: '18 giờ', price: '2.900.000đ', featured: true },
  { title: 'React căn bản cho người mới', category: 'Cơ bản', level: 'Beginner', lessons: 28, duration: '10 giờ', price: 'Miễn phí' },
  { title: 'Thiết kế hệ thống SaaS', category: 'Chuyên sâu', level: 'Advanced', lessons: 36, duration: '24 giờ', price: '4.500.000đ' },
  { title: 'TypeScript nâng cao', category: 'Frontend', level: 'Advanced', lessons: 31, duration: '14 giờ', price: '1.900.000đ' },
];

const MOCK_CATEGORIES = ['Tất cả', 'Cơ bản', 'Frontend', 'Chuyên sâu', 'Doanh nghiệp'];

const resolveSecondary = (primary: string, secondary?: string, mode?: 'single' | 'dual') =>
  mode === 'dual' && secondary ? secondary : primary;

function CourseCard({ course, brandColor, secondaryColor }: { course: typeof MOCK_COURSES[number]; brandColor: string; secondaryColor: string }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex aspect-video items-center justify-center bg-slate-100" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${secondaryColor}22)` }}>
        <GraduationCap size={40} style={{ color: brandColor }} />
        {course.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white">
            <Star size={11} className="fill-current" /> Nổi bật
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2 py-1 font-medium" style={{ backgroundColor: `${brandColor}18`, color: brandColor }}>{course.category}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{course.level}</span>
        </div>
        <h3 className="line-clamp-2 font-semibold text-slate-900">{course.title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><BookOpen size={13} />{course.lessons} bài</span>
          <span className="inline-flex items-center gap-1"><Clock size={13} />{course.duration}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="font-bold" style={{ color: secondaryColor }}>{course.price}</span>
          <span className="rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: brandColor }}>Xem khóa học</span>
        </div>
      </div>
    </article>
  );
}

export function CoursesListPreview({
  layoutStyle,
  paginationType = 'pagination',
  showSearch = true,
  showCategories = true,
  showLevelFilter = true,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
}: CoursesListPreviewProps) {
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';
  const courses = layoutStyle === 'masonry' ? MOCK_COURSES : MOCK_COURSES.slice(0, isMobile ? 2 : 4);

  return (
    <div className="bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Khóa học nổi bật</h1>
          <p className="mt-2 text-sm text-slate-500">Học theo lộ trình, có curriculum rõ ràng.</p>
        </div>

        {(showSearch || showCategories || showLevelFilter) && (
          <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${layoutStyle === 'sidebar' ? 'lg:max-w-xs' : ''}`}>
            {showSearch && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input disabled className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" placeholder="Tìm khóa học..." />
              </div>
            )}
            {showCategories && (
              <div className="mb-3 flex flex-wrap gap-2">
                {MOCK_CATEGORIES.map((category, index) => (
                  <span key={category} className="rounded-full px-3 py-1 text-xs font-medium" style={index === 0 ? { backgroundColor: brandColor, color: '#fff' } : { backgroundColor: '#f1f5f9', color: '#475569' }}>
                    {category}
                  </span>
                ))}
              </div>
            )}
            {showLevelFilter && (
              <div className="flex gap-2 text-xs text-slate-500">
                <span>Beginner</span><span>Intermediate</span><span>Advanced</span>
              </div>
            )}
          </div>
        )}

        <div className={layoutStyle === 'sidebar' ? 'grid gap-5 lg:grid-cols-[280px_1fr]' : ''}>
          {layoutStyle === 'sidebar' && <div className="hidden lg:block" />}
          <div className={layoutStyle === 'masonry' ? 'grid gap-5 md:grid-cols-2' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-4'}>
            {courses.map((course) => <CourseCard key={course.title} course={course} brandColor={brandColor} secondaryColor={accent} />)}
          </div>
        </div>

        <div className="text-center">
          {paginationType === 'pagination' ? (
            <span className="inline-flex rounded-lg px-5 py-2 text-sm font-medium text-white" style={{ backgroundColor: brandColor }}>1&nbsp;&nbsp;2&nbsp;&nbsp;3&nbsp;&nbsp;...</span>
          ) : (
            <span className="text-sm text-slate-500">Cuộn để xem thêm khóa học...</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CourseDetailPreview({
  layoutStyle,
  showCurriculum = true,
  showInstructor = true,
  showRelated = true,
  showStickyCta = true,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
}: CourseDetailPreviewProps) {
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const isModern = layoutStyle === 'modern';
  const isMinimal = layoutStyle === 'minimal';
  const isMobile = device === 'mobile';

  return (
    <div className="bg-white">
      <section className={`px-4 ${isModern ? 'py-10 text-white' : 'py-8'}`} style={isModern ? { background: `linear-gradient(135deg, ${brandColor}, ${accent})` } : undefined}>
        <div className={`mx-auto max-w-6xl ${isModern ? '' : 'grid gap-8 lg:grid-cols-[1fr_360px]'}`}>
          <div className="space-y-4">
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: isModern ? 'rgba(255,255,255,.18)' : `${brandColor}18`, color: isModern ? '#fff' : brandColor }}>
              Frontend · Intermediate
            </span>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold leading-tight ${isModern ? 'text-white' : 'text-slate-900'}`}>Lộ trình Next.js thực chiến</h1>
            <p className={`max-w-2xl text-base ${isModern ? 'text-white/80' : 'text-slate-600'}`}>Xây dựng sản phẩm thực tế với App Router, Convex, auth, SEO và deployment.</p>
            <div className={`flex flex-wrap gap-4 text-sm ${isModern ? 'text-white/80' : 'text-slate-500'}`}>
              <span className="inline-flex items-center gap-1"><BookOpen size={16} />42 bài học</span>
              <span className="inline-flex items-center gap-1"><Clock size={16} />18 giờ</span>
              {showInstructor && <span className="inline-flex items-center gap-1"><UserRound size={16} />Nguyễn Minh Đức</span>}
            </div>
          </div>
          {!isModern && (
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex aspect-video items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${accent}22)` }}>
                <PlayCircle size={46} style={{ color: brandColor }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: accent }}>2.900.000đ</p>
              <button className="mt-4 w-full rounded-xl px-5 py-3 font-semibold text-white" style={{ backgroundColor: brandColor }}>Đăng ký học</button>
            </aside>
          )}
        </div>
      </section>

      <main className={`mx-auto grid max-w-6xl gap-8 px-4 py-8 ${isMinimal ? '' : 'lg:grid-cols-[1fr_320px]'}`}>
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">Bạn sẽ học được gì?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Thiết kế kiến trúc Next.js', 'Tối ưu SEO và performance', 'Tích hợp Convex backend', 'Deploy production-ready'].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">{item}</div>
              ))}
            </div>
          </section>

          {showCurriculum && (
            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-900">Nội dung khóa học</h2>
              <div className="space-y-3">
                {['Nền tảng App Router', 'Data fetching với Convex', 'Auth, SEO và deployment'].map((chapter, index) => (
                  <div key={chapter} className="rounded-xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900">Chương {index + 1}: {chapter}</div>
                    <div className="mt-2 text-sm text-slate-500">{10 + index * 4} bài học · {3 + index} giờ</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {!isMinimal && (
          <aside className="space-y-4">
            {showStickyCta && (
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Học trọn đời</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>2.900.000đ</p>
                <button className="mt-4 w-full rounded-xl px-5 py-3 font-semibold text-white" style={{ backgroundColor: brandColor }}>Đăng ký học</button>
              </div>
            )}
            {showRelated && (
              <div className="rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900">Khóa liên quan</h3>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <p>React căn bản</p>
                  <p>TypeScript nâng cao</p>
                  <p>Thiết kế hệ thống SaaS</p>
                </div>
              </div>
            )}
          </aside>
        )}
      </main>
    </div>
  );
}
