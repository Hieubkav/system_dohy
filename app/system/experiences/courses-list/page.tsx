'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { BookOpen, Eye, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { CoursesListPreview, ExampleLinks, ExperienceHintCard, ExperienceModuleLink } from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  LayoutTabs,
  SelectRow,
  ToggleRow,
  deviceWidths,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useBrandColors } from '@/components/site/hooks';
import { EXPERIENCE_NAMES, MESSAGES, useExperienceConfig, useExperienceSave } from '@/lib/experiences';

type ListLayoutStyle = 'grid' | 'sidebar' | 'masonry';
type PaginationType = 'pagination' | 'infiniteScroll';

type LayoutConfig = {
  showSearch: boolean;
  showCategories: boolean;
  showLevelFilter: boolean;
  paginationType: PaginationType;
  postsPerPage: number;
};

type CoursesListExperienceConfig = {
  layoutStyle: ListLayoutStyle;
  layouts: Record<ListLayoutStyle, LayoutConfig>;
  hideEmptyCategories: boolean;
};

const EXPERIENCE_KEY = 'courses_list_ui';

const LAYOUTS: LayoutOption<ListLayoutStyle>[] = [
  { id: 'grid', label: 'Grid', description: 'Cards khóa học dạng lưới' },
  { id: 'sidebar', label: 'Sidebar', description: 'Filter bên trái' },
  { id: 'masonry', label: 'Magazine', description: 'Nổi bật khóa học hero/magazine' },
];

const DEFAULT_LAYOUT: LayoutConfig = {
  showSearch: true,
  showCategories: true,
  showLevelFilter: true,
  paginationType: 'pagination',
  postsPerPage: 12,
};

const DEFAULT_CONFIG: CoursesListExperienceConfig = {
  layoutStyle: 'grid',
  layouts: {
    grid: { ...DEFAULT_LAYOUT },
    sidebar: { ...DEFAULT_LAYOUT },
    masonry: { ...DEFAULT_LAYOUT },
  },
  hideEmptyCategories: true,
};

export default function CoursesListExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const coursesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'courses' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const serverConfig = useMemo<CoursesListExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<CoursesListExperienceConfig> | undefined;
    const normalizeLayout = (layout?: Partial<LayoutConfig>): LayoutConfig => ({
      showSearch: layout?.showSearch ?? true,
      showCategories: layout?.showCategories ?? true,
      showLevelFilter: layout?.showLevelFilter ?? true,
      paginationType: layout?.paginationType === 'infiniteScroll' ? 'infiniteScroll' : 'pagination',
      postsPerPage: layout?.postsPerPage ?? 12,
    });
    return {
      layoutStyle: raw?.layoutStyle ?? 'grid',
      layouts: {
        grid: normalizeLayout(raw?.layouts?.grid),
        sidebar: normalizeLayout(raw?.layouts?.sidebar),
        masonry: normalizeLayout(raw?.layouts?.masonry),
      },
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || coursesModule === undefined;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
  );
  const currentLayout = config.layouts[config.layoutStyle];

  const updateLayout = <K extends keyof LayoutConfig>(key: K, value: LayoutConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        [prev.layoutStyle]: { ...prev.layouts[prev.layoutStyle], [key]: value },
      },
    }));
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">{MESSAGES.loading}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Danh sách khóa học</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500">
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Thiết lập hiển thị</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ControlCard title="Màu thương hiệu">
            <ColorConfigCard primary={brandColor} secondary={secondaryColor} mode={colorMode} onPrimaryChange={setBrandColor} onSecondaryChange={setSecondaryColor} onModeChange={setColorMode} />
          </ControlCard>
          <ControlCard title="Khối hiển thị">
            <ToggleRow label="Tìm kiếm" checked={currentLayout.showSearch} onChange={(value) => updateLayout('showSearch', value)} accentColor={brandColor} />
            <ToggleRow label="Danh mục" checked={currentLayout.showCategories} onChange={(value) => updateLayout('showCategories', value)} accentColor={brandColor} />
            <ToggleRow label="Filter cấp độ" checked={currentLayout.showLevelFilter} onChange={(value) => updateLayout('showLevelFilter', value)} accentColor={brandColor} />
            <ToggleRow label="Ẩn danh mục rỗng" checked={config.hideEmptyCategories} onChange={(value) => setConfig((prev) => ({ ...prev, hideEmptyCategories: value }))} accentColor={brandColor} />
          </ControlCard>
          <ControlCard title="Phân trang">
            <SelectRow label="Kiểu" value={currentLayout.paginationType} options={[{ value: 'pagination', label: 'Phân trang' }, { value: 'infiniteScroll', label: 'Cuộn vô hạn' }]} onChange={(value) => updateLayout('paginationType', value as PaginationType)} />
            <SelectRow label="Khóa học/trang" value={String(currentLayout.postsPerPage)} options={[12, 20, 24, 48].map((value) => ({ value: String(value), label: String(value) }))} onChange={(value) => updateLayout('postsPerPage', Number(value))} />
          </ControlCard>
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink enabled={coursesModule?.enabled ?? false} href="/system/modules/courses" icon={BookOpen} title="Khóa học" colorScheme="purple" />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Liên kết & ghi chú</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ControlCard title="Link xem thử">
            <ExampleLinks links={[{ label: 'Trang khóa học', url: '/khoa-hoc' }]} color={brandColor} compact />
          </ControlCard>
          <Card className="p-2">
            <ExperienceHintCard hints={['Grid phù hợp catalog khóa học.', 'Sidebar phù hợp khi có nhiều danh mục/cấp độ.', 'Magazine dùng cho landing khóa học cao cấp.']} />
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base"><Eye size={18} /> Preview</CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs layouts={LAYOUTS} activeLayout={config.layoutStyle} onChange={(layout) => setConfig((prev) => ({ ...prev, layoutStyle: layout }))} accentColor={brandColor} />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/khoa-hoc">
              <CoursesListPreview
                layoutStyle={config.layoutStyle}
                showSearch={currentLayout.showSearch}
                showCategories={currentLayout.showCategories}
                showLevelFilter={currentLayout.showLevelFilter}
                paginationType={currentLayout.paginationType}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
              />
            </BrowserFrame>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
