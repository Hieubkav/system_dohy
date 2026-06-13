import type {
  HomepageSnapshotImportReport,
  HomepageSnapshotPayload,
} from './types';
import { getMimeFromExtension, slugify } from '../image/uploadNaming';

export type ParsedSnapshotMediaFile = {
  logicalPath: string;
  file: File;
};

export type ParsedSnapshotBundle = {
  payload: HomepageSnapshotPayload;
  mediaFiles: ParsedSnapshotMediaFile[];
  missingMediaPaths: string[];
  fileName: string;
};

type SnapshotMediaEntry = HomepageSnapshotPayload['index']['mediaIndex'][number];

export type HomepageSnapshotExportWarning = {
  logicalPath: string;
  sourceUrl: string;
  message: string;
};

export type HomepageSnapshotZipResult = {
  blob: Blob;
  mediaCount: number;
  warnings: HomepageSnapshotExportWarning[];
};

const toJsonFile = (value: unknown) => JSON.stringify(value, null, 2);

const MEDIA_EXTENSION_RE = /\.(avif|bmp|gif|ico|jpe?g|m4v|mov|mp4|ogg|png|svg|webm|webp)([?#].*)?$/i;
const STORAGE_URL_RE = /\/api\/storage\/|\/storage\/|convex\.cloud\/api\/storage\//i;
const MEDIA_FIELD_KEYS = new Set([
  'avatar',
  'avatarUrl',
  'avatar_url',
  'backgroundImage',
  'backgroundImageUrl',
  'background_image',
  'backgroundVideo',
  'backgroundVideoUrl',
  'background_video',
  'cover',
  'coverImage',
  'desktopImage',
  'favicon',
  'heroVideo',
  'heroVideoUrl',
  'hero_video',
  'iconUrl',
  'image',
  'imageUrl',
  'image_url',
  'images',
  'logo',
  'logoUrl',
  'logo_url',
  'mobileImage',
  'ogImage',
  'poster',
  'posterUrl',
  'poster_url',
  'seo_og_image',
  'site_favicon',
  'site_logo',
  'src',
  'srcVideo',
  'src_video',
  'thumbnail',
  'thumbnailUrl',
  'thumbnail_url',
  'video',
  'videoUrl',
  'videoSrc',
  'video_url',
  'video_src',
  'videoPath',
  'videoThumbnail',
  'videoThumbnailUrl',
]);

const isHttpUrl = (value: string) => /^https?:\/\//.test(value);

const getExtensionFromUrl = (value?: string) => {
  if (!value) return 'bin';
  const clean = value.split('?')[0]?.split('#')[0] ?? value;
  const last = clean.split('/').pop() ?? '';
  const ext = last.includes('.') ? last.split('.').pop() : undefined;
  return ext?.toLowerCase() ?? 'bin';
};

const isLikelyMediaUrl = (value: string, keyPath: string[] = [], logicalPath?: string) => {
  if (!isHttpUrl(value)) return false;
  if (MEDIA_EXTENSION_RE.test(value) || STORAGE_URL_RE.test(value)) return true;
  if (logicalPath && MEDIA_EXTENSION_RE.test(logicalPath)) return true;
  return keyPath.some((key) => MEDIA_FIELD_KEYS.has(key));
};

const collectMediaUrls = (value: unknown, acc: Set<string>, keyPath: string[] = []) => {
  if (typeof value === 'string') {
    if (isLikelyMediaUrl(value, keyPath)) acc.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectMediaUrls(item, acc, keyPath));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      collectMediaUrls(item, acc, [...keyPath, key]);
    });
  }
};

const buildMediaLogicalPath = (sourceType: string, sourceKey: string, index: number, sourceUrl: string) => {
  const ext = getExtensionFromUrl(sourceUrl);
  return `snapshot-bundles/homepage/${slugify(sourceType)}-${slugify(sourceKey)}-${index + 1}.${ext}`;
};

function normalizeSnapshotMediaIndex(payload: HomepageSnapshotPayload): HomepageSnapshotPayload {
  const mediaEntries: SnapshotMediaEntry[] = [];
  const byOriginalUrl = new Map<string, SnapshotMediaEntry>();
  const byLogicalPath = new Set<string>();

  const pushEntry = (entry: SnapshotMediaEntry) => {
    if (!entry.originalUrl || !entry.logicalPath || !isLikelyMediaUrl(entry.originalUrl, [], entry.logicalPath)) return;

    const existing = byOriginalUrl.get(entry.originalUrl);
    if (existing) {
      existing.usedBy = Array.from(new Set([...(existing.usedBy ?? []), ...(entry.usedBy ?? [])]));
      return;
    }

    let logicalPath = entry.logicalPath;
    if (byLogicalPath.has(logicalPath)) {
      const ext = getExtensionFromUrl(logicalPath);
      const base = logicalPath.replace(new RegExp(`\\.${ext}$`), '');
      let suffix = 2;
      while (byLogicalPath.has(`${base}-${suffix}.${ext}`)) suffix += 1;
      logicalPath = `${base}-${suffix}.${ext}`;
    }

    const next: SnapshotMediaEntry = {
      logicalPath,
      originalUrl: entry.originalUrl,
      mimeType: entry.mimeType || getMimeFromExtension(getExtensionFromUrl(entry.originalUrl)) || 'application/octet-stream',
      sourceType: entry.sourceType || 'homepage',
      usedBy: Array.from(new Set(entry.usedBy ?? [])),
    };

    mediaEntries.push(next);
    byOriginalUrl.set(next.originalUrl, next);
    byLogicalPath.add(next.logicalPath);
  };

  (payload.index?.mediaIndex ?? []).forEach(pushEntry);

  const addUrls = (value: unknown, sourceType: string, sourceKey: string, usedBy: string) => {
    const urls = new Set<string>();
    collectMediaUrls(value, urls);
    Array.from(urls).forEach((url, index) => {
      const existing = byOriginalUrl.get(url);
      if (existing) {
        existing.usedBy = Array.from(new Set([...existing.usedBy, usedBy]));
        return;
      }

      pushEntry({
        logicalPath: buildMediaLogicalPath(sourceType, sourceKey, index, url),
        originalUrl: url,
        mimeType: getMimeFromExtension(getExtensionFromUrl(url)) || 'application/octet-stream',
        sourceType,
        usedBy: [usedBy],
      });
    });
  };

  const components = payload.homepage.components.map((component) => {
    addUrls(component.config, component.type, `${component.title}-${component.order}`, component.componentKey);
    const mediaRefs = mediaEntries
      .filter((entry) => entry.usedBy.includes(component.componentKey))
      .map((entry) => entry.logicalPath);
    return {
      ...component,
      mediaRefs: Array.from(new Set([...(component.mediaRefs ?? []), ...mediaRefs])),
    };
  });

  addUrls(payload.homepage.dependencies, 'dependencies', 'homepage-dependencies', 'homepage:dependencies');
  addUrls(payload.homepage.demoBundle, 'demo-bundle', 'homepage-demo-bundle', 'homepage:demoBundle');
  addUrls(payload.gallery?.customThumbnail ? { thumbnail: payload.gallery.customThumbnail.url } : undefined, 'snapshot-thumbnail', 'gallery-custom-thumbnail', 'homepage:customThumbnail');

  return {
    ...payload,
    homepage: {
      ...payload.homepage,
      components,
    },
    index: {
      mediaIndex: mediaEntries,
    },
  };
}

const splitSnapshotFiles = (payload: HomepageSnapshotPayload) => ({
  'manifest.json': toJsonFile(payload.manifest),
  'homepage/components.json': toJsonFile(payload.homepage.components),
  'homepage/component-order.json': toJsonFile(payload.homepage.componentOrder),
  'homepage/dependencies.json': toJsonFile(payload.homepage.dependencies),
  'homepage/system-style.json': toJsonFile(payload.homepage.systemStyle),
  'homepage/demo-bundle.json': toJsonFile(payload.homepage.demoBundle ?? null),
  'gallery/thumbnail.json': toJsonFile(payload.gallery?.customThumbnail ?? null),
  'index/media.index.json': toJsonFile(payload.index.mediaIndex),
  'reports/import-preview.json': toJsonFile({
    summary: { blocking: 0, warnings: 0 },
    errors: [],
    warnings: [],
  } satisfies HomepageSnapshotImportReport),
});

const responseToFile = async (url: string, logicalPath: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch media thất bại: ${response.status}`);
  }
  const blob = await response.blob();
  return new File([blob], logicalPath.split('/').pop() || 'file.bin', {
    type: response.headers.get('Content-Type') || blob.type || 'application/octet-stream',
  });
};

const parseJson = async <T>(zip: any, path: string, fallback: T): Promise<T> => {
  const file = zip.file(path);
  if (!file) {
    return fallback;
  }
  const text = await file.async('string');
  return JSON.parse(text) as T;
};

export async function createHomepageSnapshotZip(payload: HomepageSnapshotPayload): Promise<HomepageSnapshotZipResult> {
  const normalizedPayload = normalizeSnapshotMediaIndex(payload);
  const JSZipModule = await import('jszip');
  const JSZip = JSZipModule.default;
  const zip = new JSZip();
  const files = splitSnapshotFiles(normalizedPayload);
  Object.entries(files).forEach(([path, content]) => zip.file(path, content));

  const exportWarnings: HomepageSnapshotExportWarning[] = [];
  for (const media of normalizedPayload.index.mediaIndex) {
    try {
      const file = await responseToFile(media.originalUrl, media.logicalPath);
      zip.file(media.logicalPath, file);
    } catch (error) {
      exportWarnings.push({
        logicalPath: media.logicalPath,
        sourceUrl: media.originalUrl,
        message: error instanceof Error ? error.message : 'Không tải được media',
      });
    }
  }

  zip.file('reports/export-warnings.json', toJsonFile(exportWarnings));
  return {
    blob: await zip.generateAsync({ type: 'blob' }),
    mediaCount: normalizedPayload.index.mediaIndex.length,
    warnings: exportWarnings,
  };
}

export async function parseHomepageSnapshotFile(file: File): Promise<ParsedSnapshotBundle> {
  const JSZipModule = await import('jszip');
  const JSZip = JSZipModule.default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const manifest = await parseJson(zip, 'manifest.json', null as HomepageSnapshotPayload['manifest'] | null);
  const components = await parseJson(zip, 'homepage/components.json', [] as HomepageSnapshotPayload['homepage']['components']);
  const componentOrder = await parseJson(zip, 'homepage/component-order.json', [] as HomepageSnapshotPayload['homepage']['componentOrder']);
  const dependencies = await parseJson(zip, 'homepage/dependencies.json', {
    posts: [],
    products: [],
    services: [],
    productCategories: [],
  } as HomepageSnapshotPayload['homepage']['dependencies']);
  const systemStyle = await parseJson(zip, 'homepage/system-style.json', {
    hiddenTypes: [],
    typeColorOverrides: {},
    typeFontOverrides: {},
    globalFontOverride: { enabled: false, fontKey: 'system-default' },
  } as HomepageSnapshotPayload['homepage']['systemStyle']);
  const demoBundle = await parseJson(zip, 'homepage/demo-bundle.json', null as HomepageSnapshotPayload['homepage']['demoBundle'] | null);
  const customThumbnail = await parseJson(zip, 'gallery/thumbnail.json', null as NonNullable<HomepageSnapshotPayload['gallery']>['customThumbnail'] | null);
  const mediaIndex = await parseJson(zip, 'index/media.index.json', [] as HomepageSnapshotPayload['index']['mediaIndex']);

  const mediaFiles: ParsedSnapshotMediaFile[] = [];
  const missingMediaPaths: string[] = [];
  for (const media of mediaIndex) {
    const zipFile = zip.file(media.logicalPath);
    if (!zipFile) {
      missingMediaPaths.push(media.logicalPath);
      continue;
    }
    const blob = await zipFile.async('blob');
    mediaFiles.push({
      logicalPath: media.logicalPath,
      file: new File([blob], media.logicalPath.split('/').pop() || 'file.bin', {
        type: media.mimeType || blob.type || 'application/octet-stream',
      }),
    });
  }

  return {
    payload: {
      manifest: manifest!,
      homepage: {
        components,
        componentOrder,
        dependencies,
        systemStyle,
        demoBundle: demoBundle ?? undefined,
      },
      ...(customThumbnail ? { gallery: { customThumbnail } } : {}),
      index: { mediaIndex },
    },
    mediaFiles,
    missingMediaPaths,
    fileName: file.name,
  };
}
