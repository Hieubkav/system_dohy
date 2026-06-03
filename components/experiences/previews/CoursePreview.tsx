import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Bookmark, ChevronDown, Clock, GraduationCap, Search, SlidersHorizontal, Star, UserRound, X } from 'lucide-react';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type CoursesListLayoutStyle = 'grid' | 'sidebar' | 'masonry';
type CourseDetailLayoutStyle = 'classic' | 'modern' | 'minimal';
type PaginationType = 'pagination' | 'infiniteScroll';

type CoursesListPreviewProps = {
  layoutStyle: CoursesListLayoutStyle;
  gridColumns?: number;
  paginationType?: PaginationType;
  showSearch?: boolean;
  showCategories?: boolean;
  showLevelFilter?: boolean;
  hideEmptyCategories?: boolean;
  postsPerPage?: number;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
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

const getItemRadiusClass = (radius?: 'none' | 'sm' | 'lg') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') return 'rounded';
  return 'rounded-lg';
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
  { title: 'Lộ trình Next.js thực chiến', category: 'Frontend', level: 'Trung cấp', lessons: 42, duration: '18 giờ', price: '2.900.000đ', featured: true, excerpt: 'Xây dựng website thực tế, tối ưu SEO và đưa sản phẩm lên online.', instructorName: 'Nguyễn Minh Đức' },
  { title: 'React căn bản cho người mới', category: 'Cơ bản', level: 'Cơ bản', lessons: 28, duration: '10 giờ', price: 'Miễn phí', excerpt: 'Nắm vững kiến thức React cơ bản thông qua các dự án nhỏ thú vị.', instructorName: 'Trần Văn Sơn' },
  { title: 'Thiết kế hệ thống SaaS', category: 'Chuyên sâu', level: 'Nâng cao', lessons: 36, duration: '24 giờ', price: '4.500.000đ', excerpt: 'Tự tay thiết kế và vận hành hệ thống SaaS quy mô lớn, chịu tải cao.', instructorName: 'Hoàng Anh Tuấn' },
  { title: 'TypeScript nâng cao', category: 'Frontend', level: 'Nâng cao', lessons: 31, duration: '14 giờ', price: '1.900.000đ', excerpt: 'Làm chủ các tính năng nâng cao của TypeScript, viết code an toàn hơn.', instructorName: 'Lê Huy Hoàng' },
];

const MOCK_CATEGORIES = [
  { label: 'Tất cả' },
  { label: 'Cơ bản' },
  { label: 'Frontend' },
  { label: 'Chuyên sâu' },
  { empty: true, label: 'Doanh nghiệp' },
];

const resolveSecondary = (primary: string, secondary?: string, mode?: 'single' | 'dual') =>
  mode === 'dual' && secondary ? secondary : primary;

type DropdownOption = {
  value: string;
  label: string;
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
          {icon}
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
              {option.label}
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

function CourseCard({
  brandColor,
  className = '',
  course,
  secondaryColor,
  cornerRadius = 'lg',
}: {
  brandColor: string;
  className?: string;
  course: typeof MOCK_COURSES[number];
  secondaryColor: string;
  cornerRadius?: 'none' | 'sm' | 'lg';
}) {
  const radiusClass = getRadiusClass(cornerRadius);
  return (
    <article className={`overflow-hidden ${radiusClass} border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer group ${className}`}>
      <div className="relative flex aspect-video items-center justify-center bg-slate-100" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${secondaryColor}22)` }}>
        <GraduationCap size={40} style={{ color: brandColor }} />
        {course.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white">
            <Star size={11} className="fill-current" /> Nổi bật
          </span>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2 py-1 font-medium" style={{ backgroundColor: `${brandColor}18`, color: brandColor }}>{course.category}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{course.level}</span>
        </div>
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-slate-700">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-500">{course.excerpt}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><BookOpen size={13} />{course.lessons} bài</span>
          <span className="inline-flex items-center gap-1"><Clock size={13} />{course.duration}</span>
          <span className="inline-flex items-center gap-1"><UserRound size={13} />{course.instructorName}</span>
        </div>
        {course.price && (
          <div className="border-t border-slate-100 pt-3 font-bold" style={{ color: secondaryColor || brandColor }}>
            {course.price}
          </div>
        )}
      </div>
    </article>
  );
}

function FeaturedCourseCard({
  brandColor,
  className = '',
  course,
  secondaryColor,
  cornerRadius = 'lg',
}: {
  brandColor: string;
  className?: string;
  course: typeof MOCK_COURSES[number];
  secondaryColor: string;
  cornerRadius?: 'none' | 'sm' | 'lg';
}) {
  const radiusClass = getRadiusClass(cornerRadius);
  return (
    <article className={`overflow-hidden ${radiusClass} border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row transition hover:-translate-y-1 hover:shadow-md cursor-pointer group ${className}`}>
      {/* Thumbnail Area - ~42% width on desktop */}
      <div className="relative flex aspect-video md:aspect-auto md:w-[42%] items-center justify-center bg-slate-100 shrink-0 min-h-[200px]" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${secondaryColor}22)` }}>
        <GraduationCap size={48} style={{ color: brandColor }} />
        {course.featured && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            <Star size={12} className="fill-current" /> Nổi bật
          </span>
        )}
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between p-5 md:p-6 space-y-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full px-2.5 py-1 font-semibold" style={{ backgroundColor: `${brandColor}18`, color: brandColor }}>{course.category}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{course.level}</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug group-hover:text-slate-700">{course.title}</h3>
          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{course.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
            <span className="inline-flex items-center gap-1.5"><BookOpen size={14} className="text-slate-400" />{course.lessons} bài học</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-slate-400" />{course.duration}</span>
            <span className="inline-flex items-center gap-1.5"><UserRound size={14} className="text-slate-400" />{course.instructorName}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Học phí</span>
            <span className="text-lg font-bold" style={{ color: secondaryColor }}>{course.price}</span>
          </div>
          <span className="rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow transition-all" style={{ backgroundColor: brandColor }}>Xem khóa học</span>
        </div>
      </div>
    </article>
  );
}

export function CoursesListPreview({
  layoutStyle,
  gridColumns = 3,
  paginationType = 'pagination',
  showSearch = true,
  showCategories = true,
  showLevelFilter = true,
  hideEmptyCategories = true,
  postsPerPage = 12,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
  cornerRadius = 'lg',
}: CoursesListPreviewProps) {
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';

  const [searchVal, setSearchVal] = useState('');
  const [activeCat, setActiveCat] = useState('Tất cả');
  const [levelVal, setLevelVal] = useState('');
  const [sortByVal, setSortByVal] = useState('newest');
  const [categoryQuery, setCategoryQuery] = useState('');

  // Lọc khóa học giả lập cho Preview thêm sống động
  const processedCourses = useMemo(() => {
    let list = [...MOCK_COURSES];
    
    if (activeCat !== 'Tất cả') {
      list = list.filter(c => c.category === activeCat);
    }
    
    if (levelVal) {
      list = list.filter(c => c.level === levelVal);
    }
    
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q));
    }
    
    if (sortByVal === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortByVal === 'price_asc') {
      const getPriceVal = (p: string) => {
        if (p === 'Miễn phí') return 0;
        return Number(p.replace(/[^0-9]/g, '')) || 0;
      };
      list.sort((a, b) => getPriceVal(a.price) - getPriceVal(b.price));
    } else if (sortByVal === 'price_desc') {
      const getPriceVal = (p: string) => {
        if (p === 'Miễn phí') return 0;
        return Number(p.replace(/[^0-9]/g, '')) || 0;
      };
      list.sort((a, b) => getPriceVal(b.price) - getPriceVal(a.price));
    }
    
    return list;
  }, [activeCat, levelVal, searchVal, sortByVal]);

  const courses = layoutStyle === 'masonry' ? processedCourses : processedCourses.slice(0, isMobile ? 2 : 4);
  const visibleCategories = hideEmptyCategories ? MOCK_CATEGORIES.filter((category) => !category.empty) : MOCK_CATEGORIES;

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return visibleCategories;
    return visibleCategories.filter((cat) => cat.label.toLowerCase().includes(query));
  }, [visibleCategories, categoryQuery]);

  const filterPanel = (showSearch || showCategories || showLevelFilter) ? (
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
                placeholder="Tìm khóa học..."
              />
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        {showCategories && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Bookmark size={12} className="text-slate-400" />
              Danh mục khóa học
            </h3>
            {visibleCategories.length > 8 && (
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
                  <button
                    onClick={() => setCategoryQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 opacity-60 hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <div className={`space-y-1 ${visibleCategories.length > 8 ? 'max-h-60 overflow-y-auto pr-1' : ''}`}>
              {(!categoryQuery || 'tất cả danh mục'.includes(categoryQuery.toLowerCase())) && (
                <button
                  onClick={() => setActiveCat('Tất cả')}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${activeCat === 'Tất cả' ? 'font-semibold' : ''}`}
                  style={activeCat === 'Tất cả'
                    ? { backgroundColor: `${brandColor}18`, color: brandColor }
                    : { backgroundColor: 'transparent', color: '#475569' }
                  }
                >
                  Tất cả danh mục
                </button>
              )}
              {filteredCategories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCat(cat.label)}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${activeCat === cat.label ? 'font-semibold' : ''}`}
                  style={activeCat === cat.label
                    ? { backgroundColor: `${brandColor}18`, color: brandColor }
                    : { backgroundColor: 'transparent', color: '#475569' }
                  }
                >
                  {cat.label}
                </button>
              ))}
              {visibleCategories.length > 8 && filteredCategories.length === 0 && (
                <div className="px-2 py-1.5 text-[10px] text-slate-400 text-center">
                  Không tìm thấy kết quả.
                </div>
              )}
            </div>
          </div>
        )}

        {showLevelFilter && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <GraduationCap size={12} className="text-slate-400" />
              Trình độ
            </h3>
            <div className="space-y-1">
              {[
                { value: '', label: 'Tất cả trình độ' },
                { value: 'Cơ bản', label: 'Cơ bản' },
                { value: 'Trung cấp', label: 'Trung cấp' },
                { value: 'Nâng cao', label: 'Nâng cao' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLevelVal(opt.value)}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${levelVal === opt.value ? 'font-semibold' : ''}`}
                  style={levelVal === opt.value
                    ? { backgroundColor: `${brandColor}18`, color: brandColor }
                    : { backgroundColor: 'transparent', color: '#475569' }
                  }
                >
                  {opt.label}
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
                  placeholder="Tìm khóa học..."
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
                  ...visibleCategories.map((category) => ({ value: category.label, label: category.label })),
                ]}
                icon={<Bookmark size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
              />
            )}
            {showLevelFilter && (
              <CustomDropdown
                value={levelVal}
                onChange={setLevelVal}
                options={[
                  { value: '', label: 'Tất cả trình độ' },
                  { value: 'Cơ bản', label: 'Cơ bản' },
                  { value: 'Trung cấp', label: 'Trung cấp' },
                  { value: 'Nâng cao', label: 'Nâng cao' },
                ]}
                icon={<GraduationCap size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
              />
            )}
            <CustomDropdown
              value={sortByVal}
              onChange={setSortByVal}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'popular', label: 'Xem nhiều' },
                { value: 'title', label: 'Tên A-Z' },
                { value: 'price_asc', label: 'Giá tăng dần' },
                { value: 'price_desc', label: 'Giá giảm dần' },
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
    <div className="bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeCat === 'Tất cả' ? 'Khóa học' : activeCat}
          </h1>
        </div>

        {layoutStyle !== 'sidebar' && filterPanel}

        <div className={layoutStyle === 'sidebar' ? 'grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]' : ''}>
          {layoutStyle === 'sidebar' && filterPanel}
          
          <div className="space-y-4 flex-1 min-w-0">
            {/* Toolbar ngang */}
            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 mb-2">
              <p className="text-xs text-slate-500 font-medium">
                Hiển thị <span className="font-semibold text-slate-700">{courses.length}</span>
                {processedCourses.length > courses.length && <> / <span className="font-semibold text-slate-700">{processedCourses.length}</span></>} khóa học
              </p>
              
              {layoutStyle === 'sidebar' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sắp xếp:</span>
                  <CustomDropdown
                    value={sortByVal}
                    onChange={setSortByVal}
                    options={[
                      { value: 'newest', label: 'Mới nhất' },
                      { value: 'popular', label: 'Xem nhiều' },
                      { value: 'title', label: 'Tên A-Z' },
                      { value: 'price_asc', label: 'Giá tăng dần' },
                      { value: 'price_desc', label: 'Giá giảm dần' },
                    ]}
                    icon={<SlidersHorizontal size={12} className="text-slate-400" />}
                    cornerRadius={cornerRadius}
                  />
                </div>
              )}
            </div>

            <div className={
              layoutStyle === 'masonry'
                ? 'grid gap-5 grid-cols-1'
                : gridColumns === 4
                  ? 'grid gap-5 grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
                  : 'grid gap-5 grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
            }>
              {courses.map((course) => {
                if (layoutStyle === 'masonry') {
                  return (
                    <FeaturedCourseCard
                      key={course.title}
                      course={course}
                      brandColor={brandColor}
                      secondaryColor={accent}
                      cornerRadius={cornerRadius}
                    />
                  );
                }
                return (
                  <CourseCard
                    key={course.title}
                    course={course}
                    brandColor={brandColor}
                    secondaryColor={accent}
                    cornerRadius={cornerRadius}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center">
          {paginationType === 'pagination' ? (
            <span className="inline-flex rounded-lg px-5 py-2 text-sm font-medium text-white" style={{ backgroundColor: brandColor }}>
              {postsPerPage} khóa học/trang · 1&nbsp;&nbsp;2&nbsp;&nbsp;3&nbsp;&nbsp;...
            </span>
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
      <section className={`border-b border-slate-100 px-4 ${isModern ? 'py-10 text-white' : 'py-8'}`} style={isModern ? { background: `linear-gradient(135deg, ${brandColor}, ${accent})` } : undefined}>
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl space-y-4">
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: isModern ? 'rgba(255,255,255,.18)' : `${brandColor}18`, color: isModern ? '#fff' : brandColor }}>
              Frontend · Trung cấp
            </span>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold leading-tight ${isModern ? 'text-white' : 'text-slate-900'}`}>Lộ trình Next.js thực chiến</h1>
            <p className={`max-w-2xl text-base ${isModern ? 'text-white/80' : 'text-slate-600'}`}>Xây dựng website thực tế, biết cách tổ chức dữ liệu, tối ưu SEO và đưa sản phẩm lên online.</p>
            <div className={`flex flex-wrap gap-4 text-sm ${isModern ? 'text-white/80' : 'text-slate-500'}`}>
              <span className="inline-flex items-center gap-1"><BookOpen size={16} />42 bài học</span>
              <span className="inline-flex items-center gap-1"><Clock size={16} />18 giờ</span>
              {showInstructor && <span className="inline-flex items-center gap-1"><UserRound size={16} />Nguyễn Minh Đức</span>}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">Bạn sẽ học được gì?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Biết cách tổ chức dự án rõ ràng', 'Tối ưu SEO cho trang học', 'Kết nối dữ liệu động', 'Đưa website lên online'].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">{item}</div>
              ))}
            </div>
          </section>

          {showCurriculum && (
            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-900">Nội dung khóa học</h2>
              <div className="space-y-3">
                {['Nền tảng xây dựng trang', 'Kết nối và hiển thị dữ liệu', 'Đăng nhập, SEO và đưa lên online'].map((chapter, index) => (
                  <div key={chapter} className="rounded-xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900">Chương {index + 1}: {chapter}</div>
                    <div className="mt-2 text-sm text-slate-500">{10 + index * 4} bài học · {3 + index} giờ</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
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
      </main>
    </div>
  );
}
