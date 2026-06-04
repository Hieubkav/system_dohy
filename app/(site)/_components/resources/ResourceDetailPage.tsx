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
  const incrementViews = useMutation(api.resources.incrementViews);
  const requestDownload = useMutation(api.resources.requestDownload);

  const [isDownloading, setIsDownloading] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const brandColor = brandColors.primary;
  const secondaryColor = brandColors.secondary || '';
  const accent = brandColors.mode === 'single' || !secondaryColor ? `${brandColor}dd` : secondaryColor;
  const radiusClass = getRadiusClass(config.cornerRadius);
  const isModern = config.layoutStyle === 'modern';

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
    : hasAccess || resource.pricingType === 'free'
      ? 'Tải tài nguyên'
      : commerceMode === 'cart'
        ? 'Thêm vào giỏ hàng'
        : 'Liên hệ mua';

  const CtaCard = () => (
    <div className={`border border-slate-200 bg-white p-5 ${radiusClass}`}>
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
        className="mt-4 inline-flex w-full items-center justify-center gap-2 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: brandColor, borderRadius: config.cornerRadius === 'none' ? '0px' : config.cornerRadius === 'sm' ? '8px' : '12px' }}
      >
        {hasAccess || resource.pricingType === 'free' ? <Download size={18} /> : commerceMode === 'cart' && resource.pricingType !== 'contact' ? <ShoppingCart size={18} /> : <Lock size={18} />}
        {isDownloading ? 'Đang xử lý...' : ctaLabel}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-0 font-active" style={{ fontFamily: 'var(--font-be-vietnam-pro), sans-serif' }}>
      <section className={`border-b border-slate-100 px-4 ${isModern ? 'py-10 text-white' : 'py-8'}`} style={isModern ? { background: `linear-gradient(135deg, ${brandColor}, ${accent})` } : undefined}>
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl space-y-4">
            <Link href="/resources" className={`inline-flex items-center gap-2 text-sm ${isModern ? 'text-white/80' : 'text-slate-500'}`}>
              <ArrowLeft size={16} /> Tất cả tài nguyên
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {resource.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                  <Star size={12} className="fill-current" /> Nổi bật
                </span>
              )}
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: isModern ? 'rgba(255,255,255,.18)' : `${brandColor}12`, color: isModern ? '#fff' : '#334155' }}>
                {category?.name ?? 'Tài nguyên'}
              </span>
            </div>
            <h1 className={`max-w-4xl text-4xl font-bold leading-tight md:text-5xl ${isModern ? 'text-white' : 'text-slate-900'}`}>{resource.title}</h1>
            {resource.excerpt && <p className={`max-w-2xl text-lg ${isModern ? 'text-white/80' : 'text-slate-600'}`}>{resource.excerpt}</p>}
            {assignedFilters && assignedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {assignedFilters.map((filterValue) => (
                  <span
                    key={filterValue._id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${isModern ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                  >
                    {filterValue.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={`mx-auto grid max-w-7xl gap-6 px-4 py-8 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'max-w-4xl'}`}>
        <div className="space-y-8">
          {config.showGallery && gallery.length > 0 && (
            <section className="space-y-3">
              <div className={`aspect-video overflow-hidden border border-slate-200 bg-slate-100 ${radiusClass}`}>
                {activeImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeImage} alt={resource.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon size={42} />
                  </div>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {gallery.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      className={`h-16 w-24 shrink-0 overflow-hidden border bg-slate-100 ${activeImage === image ? 'border-slate-900' : 'border-slate-200'} ${radiusClass}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600">
            <RichContent content={resourceContent} />
          </article>
        </div>

        {showAside && (
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {config.showStickyCta && <CtaCard />}
            {related.length > 0 && (
              <div className={`border border-slate-200 bg-white p-5 ${radiusClass}`}>
                <h3 className="font-semibold text-slate-900">Tài nguyên liên quan</h3>
                <div className="mt-3 space-y-3">
                  {related.map((item) => (
                    <Link key={item._id} href={`/resources/${item.slug}`} className="block text-sm text-slate-600 hover:text-slate-900 hover:underline">{item.title}</Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </section>

      {config.showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white p-4 shadow-lg lg:hidden">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tài nguyên</p>
            <p className="text-lg font-bold" style={{ color: accent }}>{price}</p>
          </div>
          <button
            type="button"
            onClick={() => { void handleDownload(); }}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60"
            style={{ backgroundColor: brandColor, borderRadius: config.cornerRadius === 'none' ? '0px' : config.cornerRadius === 'sm' ? '8px' : '12px' }}
          >
            {hasAccess || resource.pricingType === 'free' ? <Download size={14} /> : <ShoppingCart size={14} />}
            {isDownloading ? 'Đang xử lý' : ctaLabel}
          </button>
        </div>
      )}
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
