import { Briefcase, ExternalLink, Image as ImageIcon, PlayCircle } from 'lucide-react';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ColorMode = 'single' | 'dual';

type ProjectsListPreviewProps = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  filterPosition?: 'sidebar' | 'top' | 'none';
  showSearch?: boolean;
  showCategories?: boolean;
  showClientName?: boolean;
  showIntroVideo?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: ColorMode;
  device?: DeviceType;
};

type ProjectDetailPreviewProps = {
  layoutStyle: 'classic' | 'modern' | 'minimal';
  showClientName?: boolean;
  showGallery?: boolean;
  showIntroVideo?: boolean;
  showRelated?: boolean;
  showShare?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: ColorMode;
  device?: DeviceType;
};

const sampleProjects = [
  { client: 'Dohy Co.', title: 'Website thương hiệu', category: 'Website', featured: true },
  { client: 'VietAdmin', title: 'Hệ thống quản trị', category: 'Ứng dụng', featured: false },
  { client: 'Factory Studio', title: 'Landing campaign', category: 'Marketing', featured: false },
  { client: 'SaaS Lab', title: 'Branding kit', category: 'Branding', featured: false },
];

function getAccent(brandColor = '#7c3aed', secondaryColor = '', colorMode: ColorMode = 'single') {
  return colorMode === 'dual' && secondaryColor ? secondaryColor : brandColor;
}

function ProjectCard({
  project,
  accent,
  showClientName,
  showIntroVideo,
  isList = false,
}: {
  project: typeof sampleProjects[number];
  accent: string;
  showClientName: boolean;
  showIntroVideo: boolean;
  isList?: boolean;
}) {
  if (isList) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col sm:flex-row w-full">
        <div className="relative aspect-video sm:aspect-auto sm:w-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-slate-400" />
          </div>
          {project.featured && (
            <span className="absolute left-3 top-3 rounded-full px-2 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: accent }}>
              Nổi bật
            </span>
          )}
          {showIntroVideo && (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-slate-700">
              <PlayCircle size={14} />
            </span>
          )}
        </div>
        <div className="space-y-2 p-4 flex-1 flex flex-col justify-center">
          <span className="text-xs font-medium" style={{ color: accent }}>{project.category}</span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{project.title}</h3>
          {showClientName && <p className="text-xs text-slate-500">Khách hàng: {project.client}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <Briefcase className="h-8 w-8 text-slate-400" />
        </div>
        {project.featured && (
          <span className="absolute left-3 top-3 rounded-full px-2 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: accent }}>
            Nổi bật
          </span>
        )}
        {showIntroVideo && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-slate-700">
            <PlayCircle size={14} />
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <span className="text-xs font-medium" style={{ color: accent }}>{project.category}</span>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{project.title}</h3>
        {showClientName && <p className="text-xs text-slate-500">Khách hàng: {project.client}</p>}
      </div>
    </div>
  );
}

export function ProjectsListPreview({
  layoutStyle,
  filterPosition = 'top',
  showSearch = true,
  showCategories = true,
  showClientName = true,
  showIntroVideo = true,
  brandColor = '#7c3aed',
  secondaryColor = '',
  colorMode = 'single',
  device = 'desktop',
}: ProjectsListPreviewProps) {
  const accent = getAccent(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';
  const columns = isMobile || layoutStyle === 'list' ? 'grid-cols-1' : layoutStyle === 'sidebar' ? 'grid-cols-2' : 'grid-cols-3';
  const showSidebar = layoutStyle === 'sidebar' && filterPosition !== 'top' && !isMobile;

  return (
    <div className="min-h-[520px] bg-slate-50 p-4 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>Projects</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Dự án đã thực hiện</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">Một số dự án tiêu biểu theo ngành, mục tiêu và kết quả triển khai.</p>
        </div>

        {(showSearch || showCategories) && !showSidebar && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {showSearch && <div className="h-9 min-w-48 flex-1 rounded-full bg-slate-100 dark:bg-slate-800" />}
            {showCategories && ['Tất cả', 'Website', 'Branding', 'Ứng dụng'].map((item, index) => (
              <span key={item} className="rounded-full px-3 py-2 text-xs" style={index === 0 ? { backgroundColor: accent, color: 'white' } : undefined}>
                {item}
              </span>
            ))}
          </div>
        )}

        <div className={showSidebar ? 'grid grid-cols-[220px_1fr] gap-5' : ''}>
          {showSidebar && (
            <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {showSearch && <div className="h-9 rounded-full bg-slate-100 dark:bg-slate-800" />}
              {showCategories && ['Tất cả', 'Website', 'Branding', 'Ứng dụng'].map((item, index) => (
                <div key={item} className="rounded-xl px-3 py-2 text-sm" style={index === 0 ? { backgroundColor: accent, color: 'white' } : undefined}>
                  {item}
                </div>
              ))}
            </aside>
          )}
          <div className={`grid gap-4 ${columns}`}>
            {sampleProjects.map((project) => (
              <ProjectCard key={project.title} project={project} accent={accent} showClientName={showClientName} showIntroVideo={showIntroVideo} isList={layoutStyle === 'list'} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectDetailPreview({
  layoutStyle,
  showClientName = true,
  showGallery = true,
  showIntroVideo = true,
  showRelated = true,
  showShare = true,
  brandColor = '#7c3aed',
  secondaryColor = '',
  colorMode = 'single',
  device = 'desktop',
}: ProjectDetailPreviewProps) {
  const accent = getAccent(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';

  return (
    <div className="min-h-[620px] bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className={`mx-auto max-w-5xl space-y-6 p-5 ${layoutStyle === 'minimal' ? 'max-w-3xl' : ''}`}>
        <div className={layoutStyle === 'modern' && !isMobile ? 'grid grid-cols-[1.1fr_.9fr] gap-6 items-center' : 'space-y-5'}>
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">Website</span>
            <h1 className="text-3xl font-bold">Website thương hiệu Dohy Co.</h1>
            {showClientName && <p className="text-sm text-slate-500">Khách hàng: Dohy Co.</p>}
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Thiết kế và phát triển website tập trung vào tốc độ, nhận diện thương hiệu và chuyển đổi khách hàng.</p>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>
                Xem dự án <ExternalLink size={14} />
              </button>
              {showShare && <button className="rounded-full border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">Chia sẻ</button>}
            </div>
          </div>
          <div className="aspect-video rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <div className="flex h-full items-center justify-center">
              <Briefcase className="h-10 w-10 text-slate-400" />
            </div>
          </div>
        </div>

        {showIntroVideo && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><PlayCircle size={18} style={{ color: accent }} /> Video giới thiệu</div>
            <div className="aspect-video rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        <div className="grid gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <p>Đội ngũ triển khai wireframe, thiết kế UI, phát triển frontend và kết nối quản trị nội dung.</p>
          <p>Kết quả là hệ thống dễ vận hành, thể hiện đúng tinh thần thương hiệu và sẵn sàng mở rộng.</p>
        </div>

        {showGallery && (
          <div>
            <h2 className="mb-3 text-lg font-bold">Thư viện ảnh</h2>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="aspect-video rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon size={20} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showRelated && (
          <div>
            <h2 className="mb-3 text-lg font-bold">Dự án liên quan</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {sampleProjects.slice(1, 4).map((project) => (
                <ProjectCard key={project.title} project={project} accent={accent} showClientName={showClientName} showIntroVideo={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
