'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { BookOpen, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';
import { QuickCreateCourseCategoryModal } from '@/app/admin/components/QuickCreateCourseCategoryModal';
import { AiEntityImportDialog, type AiEntityImportPayload } from '@/app/admin/components/AiEntityImportDialog';
import { stripHtml, truncateText } from '@/lib/seo';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { ImageUploader } from '../../../components/ImageUploader';
import { LexicalEditor } from '../../../components/LexicalEditor';

const MODULE_KEY = 'courses';

const generateSlug = (value: string) => value.toLowerCase()
  .normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-');

type CourseStatus = 'Draft' | 'Published' | 'Archived';
type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
type PricingType = 'free' | 'paid' | 'contact';
type RenderType = 'content' | 'markdown' | 'html';
type VideoType = 'none' | 'youtube' | 'drive' | 'external';

export default function CourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const courseId = id as Id<'courses'>;

  const courseData = useQuery(api.courses.getById, { id: courseId });
  const additionalCategoryIdsData = useQuery(api.courses.getAdditionalCategoryIds, { id: courseId });
  const categoriesData = useQuery(api.courseCategories.listAll, {});
  const chaptersData = useQuery(api.courses.listChapters, { courseId });
  const lessonsData = useQuery(api.courses.listLessonsByCourse, { courseId });
  const updateCourse = useMutation(api.courses.update);
  const createChapter = useMutation(api.courses.createChapter);
  const updateChapter = useMutation(api.courses.updateChapter);
  const removeChapter = useMutation(api.courses.removeChapter);
  const createLesson = useMutation(api.courses.createLesson);
  const updateLesson = useMutation(api.courses.updateLesson);
  const removeLesson = useMutation(api.courses.removeLesson);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [thumbnailStorageId, setThumbnailStorageId] = useState<Id<'_storage'> | undefined | null>();
  const [status, setStatus] = useState<CourseStatus>('Draft');
  const [pricingType, setPricingType] = useState<PricingType>('free');
  const [priceAmount, setPriceAmount] = useState<number | undefined>();
  const [comparePriceAmount, setComparePriceAmount] = useState<number | undefined>();
  const [priceNote, setPriceNote] = useState('');
  const [isPriceVisible, setIsPriceVisible] = useState(true);
  const [instructorName, setInstructorName] = useState('');
  const [level, setLevel] = useState<CourseLevel | ''>('');
  const [durationText, setDurationText] = useState('');
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>();
  const [introVideoType, setIntroVideoType] = useState<VideoType>('none');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [renderType, setRenderType] = useState<RenderType>('content');
  const [markdownRender, setMarkdownRender] = useState('');
  const [htmlRender, setHtmlRender] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);

  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterSummary, setNewChapterSummary] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState<number | undefined>();
  const [newLessonPreview, setNewLessonPreview] = useState(false);
  const [isCurriculumSaving, setIsCurriculumSaving] = useState(false);

  const enabledFields = useMemo(() => new Set(fieldsData?.map((field) => field.fieldKey) ?? []), [fieldsData]);
  const multiCategoryEnabled = Boolean(settingsData?.find((setting) => setting.settingKey === 'enableMultipleCategories')?.value);
  const selectedCategorySlug = categoriesData?.find((category) => category._id === categoryId)?.slug;
  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRender = hasMarkdownRender || hasHtmlRender;

  const lessonsByChapter = useMemo(() => {
    const map: Record<string, typeof lessonsData> = {};
    lessonsData?.forEach((lesson) => {
      map[lesson.chapterId] = [...(map[lesson.chapterId] ?? []), lesson];
    });
    Object.values(map).forEach((items) => items?.sort((a, b) => a.order - b.order));
    return map;
  }, [lessonsData]);

  useEffect(() => {
    if (!courseData || additionalCategoryIdsData === undefined || initialized) {return;}
    setTitle(courseData.title);
    setSlug(courseData.slug);
    setContent(courseData.content);
    setExcerpt(courseData.excerpt ?? '');
    setCategoryId(courseData.categoryId);
    setAdditionalCategoryIds(additionalCategoryIdsData ?? []);
    setThumbnail(courseData.thumbnail);
    setThumbnailStorageId(courseData.thumbnailStorageId);
    setStatus(courseData.status);
    setPricingType(courseData.pricingType);
    setPriceAmount(courseData.priceAmount);
    setComparePriceAmount(courseData.comparePriceAmount);
    setPriceNote(courseData.priceNote ?? '');
    setIsPriceVisible(courseData.isPriceVisible ?? true);
    setInstructorName(courseData.instructorName ?? '');
    setLevel(courseData.level ?? '');
    setDurationText(courseData.durationText ?? '');
    setDurationSeconds(courseData.durationSeconds);
    setIntroVideoType(courseData.introVideoType ?? 'none');
    setIntroVideoUrl(courseData.introVideoUrl ?? '');
    setFeatured(courseData.featured ?? false);
    setRenderType(courseData.renderType ?? 'content');
    setMarkdownRender(courseData.markdownRender ?? '');
    setHtmlRender(courseData.htmlRender ?? '');
    setMetaTitle(courseData.metaTitle ?? '');
    setMetaDescription(courseData.metaDescription ?? '');
    setEditorResetKey((prev) => prev + 1);
    setInitialized(true);
  }, [courseData, additionalCategoryIdsData, initialized]);

  useEffect(() => {
    if (!selectedChapterId && chaptersData?.[0]) {
      setSelectedChapterId(chaptersData[0]._id);
    }
  }, [chaptersData, selectedChapterId]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleApplyAiCourse = (item: AiEntityImportPayload) => {
    const nextTitle = item.title?.trim() || item.name?.trim() || '';
    if (!nextTitle) {return;}

    const nextContent = item.content || item.description || item.htmlRender || item.markdownRender || '';
    const nextPrice = typeof item.price === 'number' ? item.price : undefined;
    const nextComparePrice = typeof item.comparePriceAmount === 'number'
      ? item.comparePriceAmount
      : item.salePrice;
    const nextPricingType: PricingType = item.pricingType === 'free' || item.pricingType === 'paid' || item.pricingType === 'contact'
      ? item.pricingType
      : (typeof nextPrice === 'number' ? 'paid' : pricingType);
    const nextLevel = item.level === 'Beginner' || item.level === 'Intermediate' || item.level === 'Advanced'
      ? item.level
      : '';
    const nextIntroVideoType: VideoType = item.introVideoType === 'youtube' || item.introVideoType === 'drive' || item.introVideoType === 'external' || item.introVideoType === 'none'
      ? item.introVideoType
      : introVideoType;

    setTitle(nextTitle);
    setSlug(item.slug?.trim() || generateSlug(nextTitle));
    setContent(nextContent);
    if (item.content) {
      setRenderType('content');
      setHtmlRender(item.htmlRender || '');
      setMarkdownRender(item.markdownRender || '');
    } else if (item.htmlRender) {
      setRenderType('html');
      setHtmlRender(item.htmlRender);
      setMarkdownRender(item.markdownRender || '');
    } else if (item.markdownRender) {
      setRenderType('markdown');
      setMarkdownRender(item.markdownRender);
      setHtmlRender('');
    }
    setExcerpt(item.excerpt || item.description || truncateText(stripHtml(nextContent), 180));
    setMetaTitle(item.metaTitle || truncateText(nextTitle, 60));
    setMetaDescription(item.metaDescription || truncateText(stripHtml(item.excerpt || nextContent), 160));
    if (item.thumbnail || item.image) {
      setThumbnail(item.thumbnail || item.image);
      setThumbnailStorageId(undefined);
    }
    setPricingType(nextPricingType);
    if (typeof nextPrice === 'number') {setPriceAmount(nextPrice);}
    if (typeof nextComparePrice === 'number') {setComparePriceAmount(nextComparePrice);}
    if (item.priceNote) {setPriceNote(item.priceNote);}
    if (typeof item.isPriceVisible === 'boolean') {setIsPriceVisible(item.isPriceVisible);}
    if (item.instructorName) {setInstructorName(item.instructorName);}
    if (nextLevel) {setLevel(nextLevel);}
    if (item.durationText || item.duration) {setDurationText(item.durationText || item.duration || '');}
    if (typeof item.durationSeconds === 'number') {setDurationSeconds(item.durationSeconds);}
    setIntroVideoType(nextIntroVideoType);
    if (item.introVideoUrl) {setIntroVideoUrl(item.introVideoUrl);}
    if (typeof item.featured === 'boolean') {setFeatured(item.featured);}
    setEditorResetKey((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) {return;}

    setIsSubmitting(true);
    try {
      const resolvedMetaTitle = truncateText(title.trim(), 60);
      const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);
      await updateCourse({
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((item) => item !== categoryId) as Id<'courseCategories'>[]
          : undefined,
        categoryId: categoryId as Id<'courseCategories'>,
        comparePriceAmount: pricingType === 'paid' ? comparePriceAmount : undefined,
        content,
        durationSeconds,
        durationText: durationText.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        featured,
        htmlRender: hasHtmlRender ? (htmlRender.trim() || undefined) : undefined,
        id: courseId,
        instructorName: instructorName.trim() || undefined,
        introVideoType,
        introVideoUrl: introVideoType !== 'none' ? (introVideoUrl.trim() || undefined) : undefined,
        isPriceVisible,
        level: level || undefined,
        markdownRender: hasMarkdownRender ? (markdownRender.trim() || undefined) : undefined,
        metaDescription: enabledFields.has('metaDescription') ? (metaDescription.trim() || resolvedMetaDescription || undefined) : undefined,
        metaTitle: enabledFields.has('metaTitle') ? (metaTitle.trim() || resolvedMetaTitle || undefined) : undefined,
        priceAmount: pricingType === 'paid' ? priceAmount : undefined,
        priceNote: priceNote.trim() || undefined,
        pricingType,
        renderType,
        slug: slug.trim() || generateSlug(title),
        status,
        thumbnail: thumbnail ?? '',
        thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
        title: title.trim(),
      });
      toast.success('Đã cập nhật khóa học');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể cập nhật khóa học'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) {return;}
    setIsCurriculumSaving(true);
    try {
      const chapterId = await createChapter({
        courseId,
        summary: newChapterSummary.trim() || undefined,
        title: newChapterTitle.trim(),
      });
      setSelectedChapterId(chapterId);
      setNewChapterTitle('');
      setNewChapterSummary('');
      toast.success('Đã thêm chương học');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể thêm chương'));
    } finally {
      setIsCurriculumSaving(false);
    }
  };

  const handleRenameChapter = async (chapterId: Id<'courseChapters'>, currentTitle: string) => {
    const nextTitle = window.prompt('Tên chương', currentTitle)?.trim();
    if (!nextTitle || nextTitle === currentTitle) {return;}
    await updateChapter({ id: chapterId, title: nextTitle });
    toast.success('Đã cập nhật chương');
  };

  const handleDeleteChapter = async (chapterId: Id<'courseChapters'>) => {
    if (!confirm('Xóa chương này và toàn bộ bài học bên trong?')) {return;}
    await removeChapter({ id: chapterId });
    if (selectedChapterId === chapterId) {setSelectedChapterId('');}
    toast.success('Đã xóa chương');
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim() || !selectedChapterId) {return;}
    setIsCurriculumSaving(true);
    try {
      await createLesson({
        chapterId: selectedChapterId as Id<'courseChapters'>,
        courseId,
        durationSeconds: newLessonDuration,
        isPreview: newLessonPreview,
        title: newLessonTitle.trim(),
        videoType: newLessonVideoUrl.trim() ? 'youtube' : 'none',
        videoUrl: newLessonVideoUrl.trim() || undefined,
      });
      setNewLessonTitle('');
      setNewLessonVideoUrl('');
      setNewLessonDuration(undefined);
      setNewLessonPreview(false);
      toast.success('Đã thêm bài học');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể thêm bài học'));
    } finally {
      setIsCurriculumSaving(false);
    }
  };

  const handleRenameLesson = async (lessonId: Id<'courseLessons'>, currentTitle: string) => {
    const nextTitle = window.prompt('Tên bài học', currentTitle)?.trim();
    if (!nextTitle || nextTitle === currentTitle) {return;}
    await updateLesson({ id: lessonId, title: nextTitle });
    toast.success('Đã cập nhật bài học');
  };

  const handleDeleteLesson = async (lessonId: Id<'courseLessons'>) => {
    if (!confirm('Xóa bài học này?')) {return;}
    await removeLesson({ id: lessonId });
    toast.success('Đã xóa bài học');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) {return '';}
    const minutes = Math.round(seconds / 60);
    return `${minutes} phút`;
  };

  if (courseData === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (courseData === null) {
    return <div className="py-8 text-center text-slate-500">Không tìm thấy khóa học</div>;
  }

  return (
    <>
      <QuickCreateCourseCategoryModal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); }}
        onCreated={(createdId) => { setCategoryId(createdId); }}
      />
      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa khóa học</h1>
            <p className="mt-1 text-sm text-slate-500">Cập nhật nội dung, giá và curriculum.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                  <Input value={title} onChange={handleTitleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) => { setSlug(e.target.value); }} className="font-mono text-sm" />
                </div>
                {enabledFields.has('excerpt') && (
                  <div className="space-y-2">
                    <Label>Mô tả ngắn</Label>
                    <Input value={excerpt} onChange={(e) => { setExcerpt(e.target.value); }} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <LexicalEditor onChange={setContent} initialContent={content} resetKey={editorResetKey} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Curriculum</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <Input value={newChapterTitle} onChange={(e) => { setNewChapterTitle(e.target.value); }} placeholder="Tên chương mới" />
                  <Input value={newChapterSummary} onChange={(e) => { setNewChapterSummary(e.target.value); }} placeholder="Tóm tắt chương" />
                  <Button type="button" onClick={() => { void handleAddChapter(); }} disabled={isCurriculumSaving || !newChapterTitle.trim()} className="bg-indigo-600 hover:bg-indigo-500">
                    <Plus size={16} className="mr-2" /> Thêm chương
                  </Button>
                </div>

                <div className="space-y-3">
                  {chaptersData?.map((chapter) => {
                    const lessons = lessonsByChapter[chapter._id] ?? [];
                    return (
                      <div key={chapter._id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <button
                              type="button"
                              onClick={() => { setSelectedChapterId(chapter._id); }}
                              className="text-left font-semibold text-slate-900 hover:text-indigo-600 dark:text-slate-100"
                            >
                              {chapter.order + 1}. {chapter.title}
                            </button>
                            {chapter.summary && <p className="mt-1 text-sm text-slate-500">{chapter.summary}</p>}
                            <p className="mt-1 text-xs text-slate-400">{lessons.length} bài học</p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => { void handleRenameChapter(chapter._id, chapter.title); }}>Đổi tên</Button>
                            <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => { void handleDeleteChapter(chapter._id); }}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        {lessons.length > 0 && (
                          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                            {lessons.map((lesson) => (
                              <div key={lesson._id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{lesson.order + 1}. {lesson.title}</div>
                                  <div className="text-xs text-slate-500">
                                    {lesson.videoType !== 'none' ? lesson.videoType : 'Không video'}
                                    {formatDuration(lesson.durationSeconds) ? ` · ${formatDuration(lesson.durationSeconds)}` : ''}
                                    {lesson.isPreview ? ' · Preview' : ''}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => { void handleRenameLesson(lesson._id, lesson.title); }}>Đổi tên</Button>
                                  <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => { void handleDeleteLesson(lesson._id); }}>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {chaptersData?.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                      Chưa có chương học. Hãy thêm chương đầu tiên.
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <h3 className="mb-3 text-sm font-semibold text-indigo-900 dark:text-indigo-100">Thêm bài học</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Chương</Label>
                      <select value={selectedChapterId} onChange={(e) => { setSelectedChapterId(e.target.value); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                        <option value="">-- Chọn chương --</option>
                        {chaptersData?.map((chapter) => <option key={chapter._id} value={chapter._id}>{chapter.title}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tên bài học</Label>
                      <Input value={newLessonTitle} onChange={(e) => { setNewLessonTitle(e.target.value); }} placeholder="Tên bài học" />
                    </div>
                    <div className="space-y-2">
                      <Label>Video URL</Label>
                      <Input value={newLessonVideoUrl} onChange={(e) => { setNewLessonVideoUrl(e.target.value); }} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Thời lượng (giây)</Label>
                      <Input type="number" value={newLessonDuration ?? ''} onChange={(e) => { setNewLessonDuration(e.target.value ? Number(e.target.value) : undefined); }} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={newLessonPreview} onChange={(e) => { setNewLessonPreview(e.target.checked); }} className="h-4 w-4 rounded border-slate-300" />
                      Cho xem thử
                    </label>
                    <Button type="button" onClick={() => { void handleAddLesson(); }} disabled={isCurriculumSaving || !selectedChapterId || !newLessonTitle.trim()} className="bg-indigo-600 hover:bg-indigo-500">
                      <Plus size={16} className="mr-2" /> Thêm bài học
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {showAdvancedRender && (
              <Card>
                <CardHeader><CardTitle className="text-base">Render nâng cao</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kiểu render</Label>
                    <select value={renderType} onChange={(e) => { setRenderType(e.target.value as RenderType); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                      <option value="content">Content</option>
                      {hasMarkdownRender && <option value="markdown">Markdown</option>}
                      {hasHtmlRender && <option value="html">HTML</option>}
                    </select>
                  </div>
                  {hasMarkdownRender && (
                    <div className="space-y-2">
                      <Label>Markdown render</Label>
                      <textarea value={markdownRender} onChange={(e) => { setMarkdownRender(e.target.value); }} className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                  )}
                  {hasHtmlRender && (
                    <div className="space-y-2">
                      <Label>HTML render</Label>
                      <textarea value={htmlRender} onChange={(e) => { setHtmlRender(e.target.value); }} className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(enabledFields.has('metaTitle') || enabledFields.has('metaDescription')) && (
              <Card>
                <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {enabledFields.has('metaTitle') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Meta Title</Label>
                        <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>{metaTitle.length}/60</span>
                      </div>
                      <Input value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); }} />
                    </div>
                  )}
                  {enabledFields.has('metaDescription') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Meta Description</Label>
                        <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>{metaDescription.length}/160</span>
                      </div>
                      <textarea value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); }} className="min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Xuất bản</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <select value={status} onChange={(e) => { setStatus(e.target.value as CourseStatus); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Đã xuất bản</option>
                    <option value="Archived">Lưu trữ</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  {multiCategoryEnabled ? (
                    <>
                      <CategoryTagsInput
                        categories={categoriesData}
                        value={[categoryId, ...additionalCategoryIds].filter(Boolean)}
                        onQuickCreate={() => { setShowCategoryModal(true); }}
                        onChange={(ids) => {
                          setCategoryId(ids[0] ?? '');
                          setAdditionalCategoryIds(ids.slice(1));
                        }}
                      />
                      <p className="text-xs text-slate-500">Thẻ đầu tiên là danh mục chính.</p>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); }} className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                        {categoriesData?.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                      </select>
                      <Button type="button" variant="outline" size="icon" onClick={() => { setShowCategoryModal(true); }} title="Tạo danh mục mới">
                        <Plus size={16} />
                      </Button>
                    </div>
                  )}
                </div>
                {enabledFields.has('featured') && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={featured} onChange={(e) => { setFeatured(e.target.checked); }} className="h-4 w-4 rounded border-slate-300" />
                    <span className="text-sm">Khóa học nổi bật</span>
                  </label>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Thông tin khóa học</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {enabledFields.has('instructorName') && (
                  <div className="space-y-2">
                    <Label>Giảng viên</Label>
                    <Input value={instructorName} onChange={(e) => { setInstructorName(e.target.value); }} />
                  </div>
                )}
                {enabledFields.has('level') && (
                  <div className="space-y-2">
                    <Label>Cấp độ</Label>
                    <select value={level} onChange={(e) => { setLevel(e.target.value as CourseLevel | ''); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                      <option value="">-- Chọn cấp độ --</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Thời lượng hiển thị</Label>
                  <Input value={durationText} onChange={(e) => { setDurationText(e.target.value); }} />
                </div>
                <div className="space-y-2">
                  <Label>Thời lượng (giây)</Label>
                  <Input type="number" value={durationSeconds ?? ''} onChange={(e) => { setDurationSeconds(e.target.value ? Number(e.target.value) : undefined); }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Giá khóa học</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kiểu giá</Label>
                  <select value={pricingType} onChange={(e) => { setPricingType(e.target.value as PricingType); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                    <option value="free">Miễn phí</option>
                    <option value="paid">Trả phí</option>
                    <option value="contact">Liên hệ</option>
                  </select>
                </div>
                {pricingType === 'paid' && (
                  <>
                    <div className="space-y-2">
                      <Label>Giá bán (VND)</Label>
                      <Input type="number" value={priceAmount ?? ''} onChange={(e) => { setPriceAmount(e.target.value ? Number(e.target.value) : undefined); }} />
                    </div>
                    <div className="space-y-2">
                      <Label>Giá gạch (VND)</Label>
                      <Input type="number" value={comparePriceAmount ?? ''} onChange={(e) => { setComparePriceAmount(e.target.value ? Number(e.target.value) : undefined); }} />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Ghi chú giá</Label>
                  <Input value={priceNote} onChange={(e) => { setPriceNote(e.target.value); }} />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isPriceVisible} onChange={(e) => { setIsPriceVisible(e.target.checked); }} className="h-4 w-4 rounded border-slate-300" />
                  <span className="text-sm">Hiển thị giá</span>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Video giới thiệu</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Loại video</Label>
                  <select value={introVideoType} onChange={(e) => { setIntroVideoType(e.target.value as VideoType); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                    <option value="none">Không có</option>
                    <option value="youtube">YouTube</option>
                    <option value="drive">Google Drive</option>
                    <option value="external">External</option>
                  </select>
                </div>
                {introVideoType !== 'none' && (
                  <div className="space-y-2">
                    <Label>URL video</Label>
                    <Input value={introVideoUrl} onChange={(e) => { setIntroVideoUrl(e.target.value); }} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Ảnh đại diện</CardTitle></CardHeader>
              <CardContent>
                <ImageUploader
                  value={thumbnail}
                  storageId={thumbnailStorageId ?? undefined}
                  onChange={(url, storageId) => {
                    setThumbnail(url);
                    setThumbnailStorageId(storageId);
                  }}
                  folder="courses"
                  naming={{ entityName: slug.trim() || 'course', style: 'slug-index', index: 1 }}
                  deleteMode="defer"
                  aspectRatio="video"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          submitLabel="Lưu thay đổi"
          onCancel={() => { router.push('/admin/courses'); }}
          submitClassName="bg-indigo-600 hover:bg-indigo-500"
        >
          <>
            <Button type="button" variant="ghost" onClick={() => { router.push('/admin/courses'); }}>Hủy bỏ</Button>
            <div className="flex flex-wrap justify-end gap-2">
              <AiEntityImportDialog kind="course" enabledFields={enabledFields} onApply={handleApplyAiCourse} />
              <Button
                type="button"
                variant="outline"
                onClick={() => { window.open(`/${selectedCategorySlug || 'khoa-hoc'}/${slug}`, '_blank'); }}
                disabled={!slug.trim()}
                className="gap-2"
              >
                <ExternalLink size={16} />
                Xem trên web
              </Button>
              <Button type="submit" variant="accent" disabled={isSubmitting || !title.trim() || !categoryId} className="bg-indigo-600 hover:bg-indigo-500">
                {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </>
        </HomeComponentStickyFooter>
      </form>
    </>
  );
}
