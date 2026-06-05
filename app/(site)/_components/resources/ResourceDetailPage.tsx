'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, Download, FileText, Image as ImageIcon, Lock, ShoppingCart, Star } from 'lucide-react';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { useBrandColors } from '@/components/site/hooks';
import { useResourcesDetailConfig } from '@/lib/experiences';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/app/(site)/auth/context';

type ResourceContentSource = {
  content: string;
  htmlRender?: string;
  markdownRender?: string;
  renderType?: 'content' | 'markdown' | 'html';
};

const resolveResourceContent = (resource: ResourceContentSource) => {
  if (resource.renderType === 'markdown') {
    return resource.markdownRender ? withFormatMarker('markdown', resource.markdownRender) : '';
  }
  if (resource.renderType === 'html') {
    return resource.htmlRender ? withFormatMarker('html', resource.htmlRender) : '';
  }
  return resource.content ? withFormatMarker('richtext', resource.content) : '';
};

const formatPrice = (pricingType: string, price?: number) => {
  if (pricingType === 'free') {return 'Miễn phí';}
  if (pricingType === 'contact') {return 'Liên hệ';}
  if (!price) {return 'Liên hệ';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

const getRadiusClass = (radius?: 'none' | 'sm' | 'lg') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') return 'rounded-lg';
  return 'rounded-xl';
};

type ResourceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const config = useResourcesDetailConfig();
  const brandColors = useBrandColors();
  const { addItem, openDrawer } = useCart();
  const { openLoginModal, token } = useCustomerAuth();
  const resource = useQuery(api.resources.getBySlug, { slug });
  const resourceCommerceSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'resources', settingKey: 'commerceMode' });
  const category = useQuery(api.resourceCategories.getById, resource?.categoryId ? { id: resource.categoryId } : 'skip');
  const resourceAccess = useQuery(api.resources.getResourceAccess, resource?._id ? { resourceId: resource._id, token: token ?? undefined } : 'skip');
  const relatedResources = useQuery(api.resources.searchPublished, resource?.categoryId ? { categoryId: resource.categoryId, limit: 4 } : 'skip');
  const assignedFilters = useQuery(api.resourceFilters.listByResource, resource?._id ? { resourceId: resource._id } : 'skip');
  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });
  const incrementViews = useMutation(api.resources.incrementViews);
  const requestDownload = useMutation(api.resources.requestDownload);

  const [isDownloading, setIsDownloading] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const brandColor = brandColors.primary;
  const secondaryColor = brandColors.secondary || '';
  const accent = brandColors.mode === 'single' || !secondaryColor ? `${brandColor}dd` : secondaryColor;
  const radiusClass = getRadiusClass(config.cornerRadius);

  useEffect(() => {
    if (resource?._id) {
      void incrementViews({ id: resource._id });
    }
  }, [incrementViews, resource?._id]);

  useEffect(() => {
    if (!activeImage && resource?.thumbnail) {
      setActiveImage(resource.thumbnail);
    }
  }, [activeImage, resource?.thumbnail]);

  if (resource === undefined) {
    return <ResourceDetailSkeleton />;
  }

  if (resource === null || resource.status !== 'Published') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy tài nguyên</h1>
          <p className="mt-2 text-slate-500">Tài nguyên không tồn tại hoặc chưa được xuất bản.</p>
          <Link href="/resources" className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-white" style={{ backgroundColor: brandColors.primary }}>
            <ArrowLeft size={18} /> Xem tất cả tài nguyên
          </Link>
        </div>
      </div>
    );
  }

  const related = config.showRelated ? (relatedResources?.filter((item) => item._id !== resource._id).slice(0, 3) ?? []) : [];
  const price = formatPrice(resource.pricingType, resource.priceAmount);
  const showPrice = resource.isPriceVisible !== false;
  const resourceContent = resolveResourceContent(resource);
  const commerceMode = resourceCommerceSetting?.value === 'contact' ? 'contact' : 'cart';
  const hasAccess = Boolean(resourceAccess?.hasAccess);
  const gallery = [resource.thumbnail, ...(resource.images ?? [])].filter((item): item is string => Boolean(item));
  const showAside = config.showStickyCta || related.length > 0;

  const handleDownload = async () => {
    if (!token) {
      toast.info('Vui lòng đăng nhập để tải tài nguyên.');
      openLoginModal();
      return;
    }
    if (resource.pricingType === 'contact') {
      router.push(`/contact?subject=${encodeURIComponent(`Tư vấn tài nguyên: ${resource.title}`)}`);
      return;
    }
    if (!hasAccess && resource.pricingType === 'paid') {
      if (commerceMode === 'cart') {
        const ok = await addItem({ itemType: 'resource', resourceId: resource._id, quantity: 1 });
        if (ok) {
          toast.success('Đã thêm tài nguyên vào giỏ hàng');
          openDrawer();
        }
        return;
      }
      router.push(`/contact?subject=${encodeURIComponent(`Mua tài nguyên: ${resource.title}`)}`);
      return;
    }

    setIsDownloading(true);
    try {
      const result = await requestDownload({ resourceId: resource._id, token });
      if (result.ok && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast.success('Đang mở link tải');
        return;
      }
      if (result.reason === 'login_required') {
        openLoginModal();
        return;
      }
      if (result.reason === 'purchase_required') {
        toast.error('Bạn cần mua tài nguyên trước khi tải.');
        return;
      }
      toast.error('Không thể tải tài nguyên.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải tài nguyên.');
    } finally {
      setIsDownloading(false);
    }
  };

  const ctaLabel = resource.pricingType === 'contact'
    ? 'Liên hệ tư vấn'
    : !token
      ? (resource.pricingType === 'free' ? 'Đăng nhập để tải' : 'Đăng nhập để mua')
      : hasAccess || resource.pricingType === 'free'
        ? 'Tải tài nguyên'
        : commerceMode === 'cart'
          ? 'Thêm vào giỏ hàng'
          : 'Liên hệ mua';

  const CtaCard = ({ isModernLayout }: { isModernLayout?: boolean }) => (
    <div 
      className={`border bg-white p-5 transition-all duration-300 ${radiusClass} ${
        isModernLayout 
          ? 'shadow-lg border-indigo-50/50 hover:shadow-indigo-100/30' 
          : 'shadow-sm border-slate-200'
      }`}
    >
      <div className={`mb-4 flex aspect-video items-center justify-center overflow-hidden bg-slate-100 ${radiusClass}`}>
        {resource.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resource.thumbnail} alt={resource.title} className="h-full w-full object-cover" />
        ) : (
          <FileText size={48} style={{ color: brandColor }} />
        )}
      </div>
      {showPrice && (
        <>
          <p className="text-sm text-slate-500">{resource.priceNote || (resource.pricingType === 'free' ? 'Đăng nhập để tải' : 'Tải sau khi thanh toán')}</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>{price}</p>
        </>
      )}
      {showPrice && resource.comparePriceAmount && resource.pricingType === 'paid' && (
        <p className="text-sm text-slate-400">
          Giá gốc: <span className="line-through">{formatPrice('paid', resource.comparePriceAmount)}</span>
        </p>
      )}
      {resourceAccess?.reason === 'login_required' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <span>Vui lòng đăng nhập để tải tài nguyên.</span>
        </div>
      )}
      <button
        type="button"
        onClick={() => { void handleDownload(); }}
        disabled={isDownloading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 px-5 py-3 font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        style={{ 
          backgroundColor: brandColor, 
          borderRadius: config.cornerRadius === 'none' ? '0px' : config.cornerRadius === 'sm' ? '8px' : '12px',
          boxShadow: isModernLayout ? `0 4px 14px ${brandColor}33` : undefined
        }}
      >
        {isDownloading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
        ) : hasAccess || (resource.pricingType === 'free' && token) ? (
          <Download size={18} />
        ) : !token && resource.pricingType === 'free' ? (
          <Lock size={18} />
        ) : commerceMode === 'cart' && resource.pricingType !== 'contact' ? (
          <ShoppingCart size={18} />
        ) : (
          <Lock size={18} />
        )}
        {isDownloading ? 'Đang xử lý...' : ctaLabel}
      </button>
    </div>
  );

  const GalleryBlock = () => {
    if (!config.showGallery || gallery.length === 0) return null;
    const galleryMode = config.galleryMode ?? 'grid';
    return (
      <section className="space-y-3">
        <div className={`aspect-video overflow-hidden border border-slate-200 bg-slate-100 transition-all duration-300 shadow-sm ${radiusClass}`}>
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeImage} alt={resource.title} className="h-full w-full object-cover animate-fade-in" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <ImageIcon size={42} />
            </div>
          )}
        </div>
        {gallery.length > 1 && (
          galleryMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-2.5">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`aspect-video overflow-hidden border transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
                    activeImage === image 
                      ? 'border-2 ring-1' 
                      : 'border-slate-200 hover:border-slate-400'
                  } ${radiusClass}`}
                  style={activeImage === image ? { borderColor: brandColor, boxShadow: `0 0 0 1.5px ${brandColor}` } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`h-16 w-24 shrink-0 overflow-hidden border transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
                    activeImage === image 
                      ? 'border-2 ring-1' 
                      : 'border-slate-200 hover:border-slate-400'
                  } ${radiusClass}`}
                  style={activeImage === image ? { borderColor: brandColor, boxShadow: `0 0 0 1.5px ${brandColor}` } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )
        )}
      </section>
    );
  };

  const MobileStickyCta = () => (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white/85 backdrop-blur-md p-4 shadow-lg lg:hidden">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tài nguyên</p>
        <p className="text-lg font-bold" style={{ color: accent }}>{price}</p>
      </div>
      <button
        type="button"
        onClick={() => { void handleDownload(); }}
        disabled={isDownloading}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60 active:scale-[0.97] transition-all"
        style={{ backgroundColor: brandColor, borderRadius: config.cornerRadius === 'none' ? '0px' : config.cornerRadius === 'sm' ? '8px' : '12px' }}
      >
        {isDownloading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
        ) : hasAccess || (resource.pricingType === 'free' && token) ? (
          <Download size={14} />
        ) : !token && resource.pricingType === 'free' ? (
          <Lock size={14} />
        ) : commerceMode === 'cart' && resource.pricingType !== 'contact' ? (
          <ShoppingCart size={14} />
        ) : (
          <Lock size={14} />
        )}
        {isDownloading ? 'Đang xử lý' : ctaLabel}
      </button>
    </div>
  );

  // Layout 1: CLASSIC (Cổ điển)
  if (config.layoutStyle === 'classic') {
    return (
      <main className="min-h-screen bg-white pb-24 lg:pb-12 font-active" style={{ fontFamily: 'var(--font-be-vietnam-pro), sans-serif' }}>
        {/* Hero Banner */}
        <section className="border-b border-slate-100 bg-slate-50/60 px-4 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl space-y-4">
              <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft size={16} /> Tất cả tài nguyên
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                {resource.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    <Star size={12} className="fill-current" /> Nổi bật
                  </span>
                )}
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-200/60 text-slate-700">
                  {category?.name ?? 'Tài nguyên'}
                </span>
              </div>
              <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">{resource.title}</h1>
              {resource.excerpt && <p className="max-w-2xl text-base text-slate-500 leading-relaxed font-light">{resource.excerpt}</p>}
              {resourceFiltersFeature?.enabled && config.showResourceFilters && assignedFilters && assignedFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {assignedFilters.map((filterValue) => (
                    <span
                      key={filterValue._id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-semibold text-slate-700"
                    >
                      {filterValue.icon && (
                        <img src={filterValue.icon} alt={filterValue.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                      )}
                      <span>{filterValue.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content body */}
        <section className={`mx-auto grid max-w-7xl gap-8 px-4 py-8 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'max-w-4xl'}`}>
          <div className="space-y-8">
            <GalleryBlock />
            <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600">
              <RichContent content={resourceContent} />
            </article>
          </div>

          {showAside && (
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              {config.showStickyCta && <CtaCard />}
              {related.length > 0 && (
                <div className={`border border-slate-200 bg-white p-5 ${radiusClass} shadow-sm`}>
                  <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 mb-3">Tài nguyên liên quan</h3>
                  <div className="space-y-2.5 text-sm font-medium">
                    {related.map((item) => (
                      <Link key={item._id} href={`/resources/${item.slug}`} className="block text-slate-600 hover:text-slate-900 transition-colors truncate">
                        • {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </section>

        {/* Sticky Mobile CTA */}
        {config.showStickyCta && <MobileStickyCta />}
      </main>
    );
  }

  // Layout 2: MODERN (Hiện đại)
  if (config.layoutStyle === 'modern') {
    return (
      <main className="min-h-screen bg-white pb-24 lg:pb-12 font-active" style={{ fontFamily: 'var(--font-be-vietnam-pro), sans-serif' }}>
        {/* Hero Banner với màu Gradient sang trọng */}
        <section className="relative overflow-hidden py-12 px-4 text-white" style={{ background: `linear-gradient(135deg, ${brandColor}, ${accent})` }}>
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="mx-auto max-w-7xl relative z-10">
            <div className="max-w-4xl space-y-4">
              <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Tất cả tài nguyên
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                {resource.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                    <Star size={12} className="fill-current" /> Nổi bật
                  </span>
                )}
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                  {category?.name ?? 'Tài nguyên'}
                </span>
              </div>
              <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">{resource.title}</h1>
              {resource.excerpt && <p className="max-w-2xl text-lg text-white/90 leading-relaxed font-light">{resource.excerpt}</p>}
              {resourceFiltersFeature?.enabled && config.showResourceFilters && assignedFilters && assignedFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {assignedFilters.map((filterValue) => (
                    <span
                      key={filterValue._id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-semibold text-white"
                    >
                      {filterValue.icon && (
                        <img src={filterValue.icon} alt={filterValue.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                      )}
                      <span>{filterValue.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content body */}
        <section className={`mx-auto grid max-w-7xl gap-8 px-4 py-8 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'max-w-4xl'}`}>
          <div className="space-y-8">
            <GalleryBlock />
            <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-650">
              <RichContent content={resourceContent} />
            </article>
          </div>

          {showAside && (
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              {config.showStickyCta && <CtaCard isModernLayout={true} />}
              {related.length > 0 && (
                <div className={`border border-indigo-50/50 bg-white p-5 ${radiusClass} shadow-md hover:shadow-lg transition-all duration-300`}>
                  <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brandColor }} />
                    Tài nguyên liên quan
                  </h3>
                  <div className="space-y-3 text-sm font-semibold">
                    {related.map((item) => (
                      <Link key={item._id} href={`/resources/${item.slug}`} className="block text-slate-650 hover:text-slate-900 transition-colors truncate">
                        • {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </section>

        {/* Sticky Mobile CTA */}
        {config.showStickyCta && <MobileStickyCta />}
      </main>
    );
  }

  // Layout Minimal (1 cột căn giữa rộng 850px)
  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-12 font-active" style={{ fontFamily: 'var(--font-be-vietnam-pro), sans-serif' }}>
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Breadcrumb & Category */}
        <div className="space-y-3">
          <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-slate-450 hover:text-slate-700 transition-colors">
            <ArrowLeft size={16} /> Tất cả tài nguyên
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{category?.name ?? 'Tài nguyên'}</span>
            {resource.featured && (
              <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">Nổi bật</span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-900 md:text-4xl">{resource.title}</h1>
          {resource.excerpt && <p className="text-base text-slate-500 leading-relaxed font-light">{resource.excerpt}</p>}
          {resourceFiltersFeature?.enabled && config.showResourceFilters && assignedFilters && assignedFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {assignedFilters.map((filterValue) => (
                <span
                  key={filterValue._id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-150 bg-slate-50/50 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                >
                  {filterValue.icon && (
                    <img src={filterValue.icon} alt={filterValue.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                  )}
                  <span>{filterValue.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gallery */}
        <GalleryBlock />

        {/* Inline CTA Card (Kiểu Apple/macOS tinh gọn) */}
        {config.showStickyCta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100 bg-slate-50/60 p-4 rounded-xl shadow-inner animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-12 w-16 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                {resource.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resource.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <FileText size={20} />
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">{resource.title}</p>
                <p className="text-xs text-slate-500">{showPrice ? price : 'Đăng nhập để tải'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { void handleDownload(); }}
              disabled={isDownloading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: brandColor, borderRadius: '8px' }}
            >
              {isDownloading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
              ) : hasAccess || (resource.pricingType === 'free' && token) ? (
                <Download size={15} />
              ) : !token && resource.pricingType === 'free' ? (
                <Lock size={15} />
              ) : commerceMode === 'cart' && resource.pricingType !== 'contact' ? (
                <ShoppingCart size={15} />
              ) : (
                <Lock size={15} />
              )}
              {isDownloading ? 'Đang tải...' : ctaLabel}
            </button>
          </div>
        )}

        {/* Content Body */}
        <article className="prose prose-slate max-w-none pt-2 prose-headings:text-slate-900 prose-p:text-slate-655">
          <RichContent content={resourceContent} />
        </article>

        {/* Related Section ở cuối */}
        {config.showRelated && related.length > 0 && (
          <div className="border-t border-slate-100 pt-6 mt-8">
            <h4 className="font-semibold text-sm text-slate-800 mb-3">Tài nguyên liên quan khác</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map((item) => (
                <Link key={item._id} href={`/resources/${item.slug}`}>
                  <div className="border border-slate-150 p-3 rounded-lg hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/30">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{category?.name ?? 'Tài nguyên'}</p>
                    <h5 className="font-semibold text-xs text-slate-700 mt-1 truncate">{item.title}</h5>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile CTA */}
      {config.showStickyCta && <MobileStickyCta />}
    </main>
  );
}

function ResourceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-16">
      <section className="border-b border-slate-100 bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="aspect-video animate-pulse rounded-xl bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      </section>
    </div>
  );
}
