import React from 'react';
import { ArrowRight, Download, FileText, Filter, Lock, Search, ShieldCheck, SlidersHorizontal, Star } from 'lucide-react';
import { formatPrice, getRadiusClass, getSmallRadiusClass } from '@/lib/courses/courseUtils';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ResourceListLayoutStyle = 'grid' | 'sidebar' | 'masonry';
type ResourceDetailLayoutStyle = 'classic' | 'modern' | 'minimal';
type PaginationType = 'pagination' | 'infiniteScroll';

type ResourceListPreviewProps = {
  layoutStyle: ResourceListLayoutStyle;
  gridColumns?: number;
  paginationType?: PaginationType;
  showSearch?: boolean;
  showCategories?: boolean;
  hideEmptyCategories?: boolean;
  postsPerPage?: number;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

type ResourceDetailPreviewProps = {
  layoutStyle: ResourceDetailLayoutStyle;
  showGallery?: boolean;
  showRelated?: boolean;
  showStickyCta?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

const MOCK_RESOURCES = [
  { title: 'Checklist ra mắt website', category: 'Checklist', pricingType: 'free', priceAmount: 0, excerpt: 'Danh sách việc cần kiểm tra trước khi public website.', featured: true },
  { title: 'Template kế hoạch nội dung', category: 'Template', pricingType: 'paid', priceAmount: 299000, excerpt: 'Bộ file lập lịch, phân nhóm và đo hiệu quả nội dung.' },
  { title: 'Ebook tối ưu SEO cơ bản', category: 'Ebook', pricingType: 'paid', priceAmount: 199000, excerpt: 'Hướng dẫn nền tảng để tối ưu trang bán hàng và blog.' },
  { title: 'Bộ mẫu brief dự án', category: 'Toolkit', pricingType: 'free', priceAmount: 0, excerpt: 'File mẫu thu thập yêu cầu, phạm vi và checklist nghiệm thu.' },
];

const CATEGORIES = ['Tất cả', 'Ebook', 'Template', 'Checklist', 'Toolkit'];

const resolveSecondary = (primary: string, secondary?: string, mode?: 'single' | 'dual') =>
  mode === 'dual' && secondary ? secondary : primary;

export function ResourcesListPreview({
  layoutStyle,
  gridColumns = 3,
  paginationType = 'pagination',
  showSearch = true,
  showCategories = true,
  hideEmptyCategories = true,
  postsPerPage = 12,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
  cornerRadius = 'lg',
}: ResourceListPreviewProps) {
  void hideEmptyCategories;
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);
  const visibleItems = layoutStyle === 'masonry' ? MOCK_RESOURCES.slice(0, 3) : MOCK_RESOURCES;
  const columns = device === 'mobile' ? 1 : layoutStyle === 'sidebar' ? 2 : Math.min(gridColumns, 4);

  const resourceCard = (resource: typeof MOCK_RESOURCES[number], index: number) => (
    <div key={resource.title} className={`overflow-hidden border border-slate-200 bg-white shadow-sm ${radiusClass} ${layoutStyle === 'masonry' && index === 0 ? 'md:col-span-2' : ''}`}>
      <div className="relative flex aspect-[16/9] items-center justify-center bg-slate-100" style={{ background: index === 0 ? `linear-gradient(135deg, ${brandColor}1f, ${accent}33)` : undefined }}>
        <FileText size={34} style={{ color: index === 0 ? brandColor : '#64748b' }} />
        {resource.featured && (
          <span className={`absolute left-3 top-3 flex items-center gap-1 bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow ${smallRadiusClass}`}>
            <Star size={11} style={{ color: brandColor }} /> Nổi bật
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">{resource.category}</span>
          <span className="text-sm font-semibold" style={{ color: brandColor }}>{formatPrice(resource.pricingType, resource.priceAmount)}</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{resource.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{resource.excerpt}</p>
        </div>
        <button className={`flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white ${smallRadiusClass}`} style={{ backgroundColor: brandColor }}>
          Xem tài nguyên <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 p-5 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className={`border border-slate-200 bg-white p-5 shadow-sm ${radiusClass}`}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: brandColor }}>Thư viện tài nguyên</p>
          <h2 className="mt-2 text-2xl font-bold">Tải checklist, template và ebook</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Tìm nhanh tài nguyên phù hợp để triển khai công việc nhanh hơn.</p>
          {(showSearch || showCategories) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {showSearch && (
                <div className={`flex min-w-[220px] flex-1 items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 ${smallRadiusClass}`}>
                  <Search size={14} /> Tìm tài nguyên...
                </div>
              )}
              {showCategories && CATEGORIES.map((category) => (
                <span key={category} className={`border px-3 py-2 text-xs font-medium ${smallRadiusClass}`} style={{ borderColor: category === 'Tất cả' ? brandColor : '#e2e8f0', color: category === 'Tất cả' ? brandColor : '#475569' }}>
                  {category}
                </span>
              ))}
              {layoutStyle === 'sidebar' && (
                <span className={`flex items-center gap-1 border border-slate-200 px-3 py-2 text-xs text-slate-600 ${smallRadiusClass}`}><SlidersHorizontal size={13} /> Bộ lọc</span>
              )}
            </div>
          )}
        </div>
        <div className={layoutStyle === 'sidebar' && device !== 'mobile' ? 'grid grid-cols-[220px_1fr] gap-5' : ''}>
          {layoutStyle === 'sidebar' && device !== 'mobile' && (
            <aside className={`h-fit border border-slate-200 bg-white p-4 shadow-sm ${radiusClass}`}>
              <div className="mb-3 flex items-center gap-2 font-semibold"><Filter size={16} /> Bộ lọc</div>
              <div className="space-y-2 text-sm text-slate-600">
                {CATEGORIES.slice(1).map((category) => <div key={category} className={`border border-slate-100 px-3 py-2 ${smallRadiusClass}`}>{category}</div>)}
              </div>
            </aside>
          )}
          <div className="space-y-4">
            <div className={`grid gap-4 ${columns === 1 ? 'grid-cols-1' : columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              {visibleItems.map(resourceCard)}
            </div>
            <div className="text-center text-xs text-slate-500">
              {paginationType === 'infiniteScroll' ? 'Tải thêm khi cuộn xuống' : `Hiển thị ${postsPerPage} tài nguyên/trang`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResourceDetailPreview({
  layoutStyle,
  showGallery = true,
  showRelated = true,
  showStickyCta = true,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
  cornerRadius = 'lg',
}: ResourceDetailPreviewProps) {
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);
  const isMobile = device === 'mobile';
  const heroClass = layoutStyle === 'modern'
    ? 'bg-slate-900 text-white'
    : layoutStyle === 'minimal'
      ? 'bg-white text-slate-900'
      : 'bg-slate-50 text-slate-900';

  return (
    <div className="relative bg-white text-slate-900">
      <section className={`p-6 ${heroClass}`}>
        <div className={`mx-auto grid max-w-6xl gap-6 ${isMobile || layoutStyle === 'minimal' ? 'grid-cols-1' : 'md:grid-cols-[1.2fr_0.8fr]'}`}>
          <div className="space-y-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold ${smallRadiusClass}`} style={{ backgroundColor: `${brandColor}1a`, color: layoutStyle === 'modern' ? '#fff' : brandColor }}>
              <FileText size={13} /> Template
            </span>
            <h1 className="text-3xl font-bold">Checklist ra mắt website chuyên nghiệp</h1>
            <p className={layoutStyle === 'modern' ? 'text-sm text-slate-200' : 'text-sm text-slate-600'}>
              Bộ checklist giúp đội ngũ rà soát nội dung, hiệu năng, SEO và tracking trước khi public.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {['PDF', 'Google Sheet', 'Cập nhật 2026'].map((item) => (
                <span key={item} className={`border px-3 py-1 ${smallRadiusClass}`} style={{ borderColor: layoutStyle === 'modern' ? 'rgba(255,255,255,.25)' : '#e2e8f0' }}>{item}</span>
              ))}
            </div>
          </div>
          <div className={`border p-4 shadow-sm ${radiusClass}`} style={{ backgroundColor: layoutStyle === 'modern' ? 'rgba(255,255,255,.08)' : '#fff', borderColor: layoutStyle === 'modern' ? 'rgba(255,255,255,.16)' : '#e2e8f0' }}>
            <div className={`mb-4 flex aspect-[16/10] items-center justify-center ${smallRadiusClass}`} style={{ background: `linear-gradient(135deg, ${brandColor}22, ${accent}33)` }}>
              <Download size={38} style={{ color: brandColor }} />
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Giá</span>
              <strong style={{ color: brandColor }}>Miễn phí</strong>
            </div>
            <button className={`flex w-full items-center justify-center gap-2 px-4 py-3 font-semibold text-white ${smallRadiusClass}`} style={{ backgroundColor: brandColor }}>
              <Download size={16} /> Tải tài nguyên
            </button>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} /> Đăng nhập để lưu quyền tải lại.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-[1fr_280px]">
        <article className={`border border-slate-200 p-5 shadow-sm ${radiusClass}`}>
          <h2 className="text-lg font-semibold">Bạn nhận được gì?</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Kiểm tra nội dung, SEO, form, tracking và performance.</li>
            <li>File có thể copy để dùng lại cho nhiều dự án.</li>
            <li>Gợi ý thứ tự ưu tiên trước ngày ra mắt.</li>
          </ul>
          {showGallery && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className={`flex aspect-[4/3] items-center justify-center bg-slate-100 ${smallRadiusClass}`}><FileText className="text-slate-400" size={24} /></div>
              ))}
            </div>
          )}
        </article>
        <aside className={`h-fit border border-slate-200 bg-slate-50 p-4 ${radiusClass}`}>
          <div className="flex items-center gap-2 text-sm font-semibold"><Lock size={15} /> Quyền truy cập</div>
          <p className="mt-2 text-xs text-slate-500">Mua một lần hoặc tải miễn phí tùy loại tài nguyên.</p>
        </aside>
      </section>

      {showRelated && (
        <section className="mx-auto max-w-6xl p-6 pt-0">
          <h2 className="mb-3 text-lg font-semibold">Tài nguyên liên quan</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {MOCK_RESOURCES.slice(1, 4).map((item) => (
              <div key={item.title} className={`border border-slate-200 p-4 ${radiusClass}`}>
                <p className="text-xs text-slate-500">{item.category}</p>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
              </div>
            ))}
          </div>
        </section>
      )}

      {showStickyCta && (
        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-sm">
            <span className="font-medium">Checklist ra mắt website</span>
            <button className={`px-4 py-2 font-semibold text-white ${smallRadiusClass}`} style={{ backgroundColor: brandColor }}>Tải ngay</button>
          </div>
        </div>
      )}
    </div>
  );
}
