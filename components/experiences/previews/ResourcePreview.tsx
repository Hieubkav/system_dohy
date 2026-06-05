import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bookmark, ChevronDown, Download, FileText, Filter, Lock, Search, ShieldCheck, SlidersHorizontal, Star, X } from 'lucide-react';
import { formatPrice, getRadiusClass, getSmallRadiusClass } from '@/lib/courses/courseUtils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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
  showResourceFilters?: boolean;
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
  showResourceFilters?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

const getItemRadiusClass = (radius?: 'none' | 'sm' | 'lg') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') return 'rounded';
  return 'rounded-md';
};

type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
};

type CustomDropdownProps = {
  value: string;
  onChange: (value: any) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
  disabled,
  cornerRadius = 'lg',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const buttonRadiusClass = getSmallRadiusClass(cornerRadius);
  const menuRadiusClass = getSmallRadiusClass(cornerRadius);
  const itemRadiusClass = getItemRadiusClass(cornerRadius);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[155px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-full items-center justify-between gap-1.5 border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-slate-300 outline-none ${buttonRadiusClass}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {selectedOption?.icon ? (
            <img src={selectedOption.icon} alt={selectedOption.label} className="h-3.5 w-3.5 object-contain shrink-0" />
          ) : (
            icon
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1 max-h-60 min-w-[170px] overflow-y-auto border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${menuRadiusClass}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-2.5 py-1.5 text-left text-xs transition-colors ${itemRadiusClass} ${
                option.value === value
                  ? 'bg-slate-50 font-semibold text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {option.icon && (
                <img src={option.icon} alt={option.label} className="h-3.5 w-3.5 mr-1.5 object-contain shrink-0" />
              )}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type CategoryOption = {
  value: string;
  label: string;
};

type CategoryDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

function CategoryDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
  disabled,
  cornerRadius = 'lg',
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchTerm]);

  const buttonRadiusClass = getSmallRadiusClass(cornerRadius);
  const menuRadiusClass = getSmallRadiusClass(cornerRadius);
  const searchRadiusClass = getItemRadiusClass(cornerRadius);
  const itemRadiusClass = getItemRadiusClass(cornerRadius);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[155px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-full items-center justify-between gap-1.5 border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-slate-300 outline-none ${buttonRadiusClass}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1 max-h-72 min-w-[170px] overflow-y-auto border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${menuRadiusClass}`}>
          {options.length > 8 && (
            <div className="p-1 border-b border-slate-100 sticky top-0 bg-white z-10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm danh mục..."
                className={`h-7 w-full border border-slate-200 px-2 text-[10px] outline-none focus:border-slate-300 transition-colors ${searchRadiusClass}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-2.5 py-1.5 text-left text-xs transition-colors ${itemRadiusClass} ${
                    option.value === value
                      ? 'bg-slate-50 font-semibold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-2 py-1.5 text-[10px] text-slate-400 text-center">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const MOCK_RESOURCES = [
  { title: 'Checklist ra mắt website', category: 'Checklist', pricingType: 'free', priceAmount: 0, excerpt: 'Danh sách việc cần kiểm tra trước khi public website.', featured: true, filters: [{ name: 'AutoCAD 2D', icon: 'https://img.icons8.com/color/48/autocad.png' }] },
  { title: 'Template kế hoạch nội dung', category: 'Template', pricingType: 'paid', priceAmount: 299000, excerpt: 'Bộ file lập lịch, phân nhóm và đo hiệu quả nội dung.', filters: [{ name: 'PR', icon: 'https://img.icons8.com/color/48/public-relations.png' }] },
  { title: 'Ebook tối ưu SEO cơ bản', category: 'Ebook', pricingType: 'paid', priceAmount: 199000, excerpt: 'Hướng dẫn nền tảng để tối ưu trang bán hàng và blog.', filters: [{ name: 'Blender', icon: 'https://img.icons8.com/color/48/blender-3d.png' }] },
  { title: 'Bộ mẫu brief dự án', category: 'Toolkit', pricingType: 'free', priceAmount: 0, excerpt: 'File mẫu thu thập yêu cầu, phạm vi và checklist nghiệm thu.', filters: [{ name: 'Adobe after effects', icon: 'https://img.icons8.com/color/48/adobe-after-effects.png' }] },
];

const CATEGORIES = ['Tất cả', 'Ebook', 'Template', 'Checklist', 'Toolkit'];
const MOCK_FILTERS = [
  { name: 'Blender', icon: 'https://img.icons8.com/color/48/blender-3d.png' },
  { name: 'Adobe after effects', icon: 'https://img.icons8.com/color/48/adobe-after-effects.png' },
  { name: 'PR', icon: 'https://img.icons8.com/color/48/public-relations.png' },
  { name: 'AutoCAD 2D', icon: 'https://img.icons8.com/color/48/autocad.png' },
];

const resolveSecondary = (primary: string, secondary?: string, mode?: 'single' | 'dual') =>
  mode === 'dual' && secondary ? secondary : primary;

export function ResourcesListPreview({
  layoutStyle,
  gridColumns = 3,
  paginationType = 'pagination',
  showSearch = true,
  showCategories = true,
  showResourceFilters = true,
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

  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });

  const [searchVal, setSearchVal] = useState('');
  const [activeCat, setActiveCat] = useState('Tất cả');
  const [filterVal, setFilterVal] = useState('');
  const [sortByVal, setSortByVal] = useState('newest');
  const [categoryQuery, setCategoryQuery] = useState('');

  const processedResources = useMemo(() => {
    let list = [...MOCK_RESOURCES];
    if (activeCat !== 'Tất cả') {
      list = list.filter(r => r.category === activeCat);
    }
    if (filterVal) {
      list = list.filter(r => r.filters?.some(f => f.name === filterVal));
    }
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.excerpt.toLowerCase().includes(q));
    }
    if (sortByVal === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortByVal === 'price_asc') {
      list.sort((a, b) => a.priceAmount - b.priceAmount);
    } else if (sortByVal === 'price_desc') {
      list.sort((a, b) => b.priceAmount - a.priceAmount);
    }
    return list;
  }, [activeCat, filterVal, searchVal, sortByVal]);

  const visibleItems = layoutStyle === 'masonry' ? processedResources.slice(0, 3) : processedResources;
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
        {resourceFiltersFeature?.enabled && showResourceFilters && resource.filters && resource.filters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.filters.map((f) => (
              <span key={f.name} className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 inline-flex items-center gap-1">
                {f.icon && (
                  <img src={f.icon} alt={f.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                )}
                <span>{f.name}</span>
              </span>
            ))}
          </div>
        )}
        <button className={`flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white ${smallRadiusClass}`} style={{ backgroundColor: brandColor }}>
          Xem tài nguyên <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  const filterPanel = (showSearch || showCategories) ? (
    layoutStyle === 'sidebar' ? (
      <div className="space-y-4">
        {showSearch && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Search size={12} className="text-slate-400" />
              Tìm kiếm
            </h3>
            <div className="relative">
              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className={`h-9 w-full border border-slate-200 pl-8 pr-2.5 text-xs outline-none focus:border-slate-300 transition-colors ${getSmallRadiusClass(cornerRadius)}`}
                placeholder="Tìm tài nguyên..."
              />
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        {showCategories && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Bookmark size={12} className="text-slate-400" />
              Danh mục tài nguyên
            </h3>
            {CATEGORIES.length > 8 && (
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Tìm nhanh danh mục..."
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  className={`w-full pl-8 pr-8 py-1.5 border border-slate-200 text-[10px] outline-none focus:border-slate-300 transition-colors ${getSmallRadiusClass(cornerRadius)}`}
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {categoryQuery && (
                  <button onClick={() => setCategoryQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 opacity-60 hover:opacity-100">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setActiveCat('Tất cả')}
                className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${activeCat === 'Tất cả' ? 'font-semibold' : ''}`}
                style={activeCat === 'Tất cả' ? { backgroundColor: `${brandColor}18`, color: brandColor } : { backgroundColor: 'transparent', color: '#475569' }}
              >
                Tất cả danh mục
              </button>
              {CATEGORIES.slice(1).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${activeCat === cat ? 'font-semibold' : ''}`}
                  style={activeCat === cat ? { backgroundColor: `${brandColor}18`, color: brandColor } : { backgroundColor: 'transparent', color: '#475569' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {resourceFiltersFeature?.enabled && showResourceFilters && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Filter size={12} className="text-slate-400" />
              Bộ lọc phần mềm
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setFilterVal('')}
                className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${!filterVal ? 'font-semibold' : ''}`}
                style={!filterVal ? { backgroundColor: `${brandColor}18`, color: brandColor } : { backgroundColor: 'transparent', color: '#475569' }}
              >
                Tất cả phần mềm
              </button>
              {MOCK_FILTERS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setFilterVal(item.name)}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent flex items-center gap-1.5 ${filterVal === item.name ? 'font-semibold' : ''}`}
                  style={filterVal === item.name ? { backgroundColor: `${brandColor}18`, color: brandColor } : { backgroundColor: 'transparent', color: '#475569' }}
                >
                  {item.icon && (
                    <img src={item.icon} alt={item.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                  )}
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className={`border border-slate-200 bg-white p-4 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
            {showSearch && (
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className={`h-9 w-full border border-slate-200 pl-8 pr-2.5 text-xs outline-none focus:border-slate-300 transition-colors ${getSmallRadiusClass(cornerRadius)}`}
                  placeholder="Tìm tài nguyên..."
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {showCategories && (
              <CategoryDropdown
                value={activeCat}
                onChange={setActiveCat}
                options={[
                  { value: 'Tất cả', label: 'Tất cả danh mục' },
                  ...CATEGORIES.slice(1).map((cat) => ({ value: cat, label: cat })),
                ]}
                icon={<Bookmark size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
              />
            )}
            {resourceFiltersFeature?.enabled && showResourceFilters && (
              <CustomDropdown
                value={filterVal}
                onChange={setFilterVal}
                options={[
                  { value: '', label: 'Tất cả phần mềm' },
                  ...MOCK_FILTERS.map((item) => ({ value: item.name, label: item.name, icon: item.icon })),
                ]}
                icon={<Filter size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
              />
            )}
            <CustomDropdown
              value={sortByVal}
              onChange={setSortByVal}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'popular', label: 'Xem nhiều' },
                { value: 'price_asc', label: 'Giá tăng dần' },
                { value: 'price_desc', label: 'Giá giảm dần' },
                { value: 'title', label: 'Tên A-Z' },
              ]}
              icon={<SlidersHorizontal size={14} className="text-slate-400" />}
              cornerRadius={cornerRadius}
            />
          </div>
        </div>
      </div>
    )
  ) : null;

  return (
    <div className="bg-slate-50 p-5 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className={`border border-slate-200 bg-white p-5 shadow-sm ${radiusClass}`}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: brandColor }}>Thư viện tài nguyên</p>
          <h2 className="mt-2 text-2xl font-bold">Tải checklist, template và ebook</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Tìm nhanh tài nguyên phù hợp để triển khai công việc nhanh hơn.</p>
        </div>

        {layoutStyle !== 'sidebar' && filterPanel}

        <div className={layoutStyle === 'sidebar' && device !== 'mobile' ? 'grid grid-cols-[280px_1fr] gap-5' : ''}>
          {layoutStyle === 'sidebar' && device !== 'mobile' && filterPanel}
          <div className="space-y-4 flex-1">
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
  showResourceFilters = true,
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

  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });

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
            {resourceFiltersFeature?.enabled && showResourceFilters && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[{ name: 'AutoCAD 2D', icon: 'https://img.icons8.com/color/48/autocad.png' }].map((item) => (
                  <span
                    key={item.name}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${layoutStyle === 'modern' ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                  >
                    {item.icon && (
                      <img src={item.icon} alt={item.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                    )}
                    <span>{item.name}</span>
                  </span>
                ))}
              </div>
            )}
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
