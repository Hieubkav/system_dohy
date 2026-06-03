'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Edit2,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  Video,
  Eye,
  Settings,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { stripHtml } from '@/lib/seo';
import { LexicalEditor } from '../../components/LexicalEditor';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  cn
} from '../../components/ui';

type VideoType = 'none' | 'youtube' | 'drive' | 'external';

interface CourseCurriculumEditorProps {
  courseId: Id<'courses'>;
}

export function CourseCurriculumEditor({ courseId }: CourseCurriculumEditorProps) {
  // Convex API hooks
  const chapters = useQuery(api.courses.listChapters, { courseId });
  const lessons = useQuery(api.courses.listLessonsByCourse, { courseId });

  const createChapter = useMutation(api.courses.createChapter);
  const updateChapter = useMutation(api.courses.updateChapter);
  const removeChapter = useMutation(api.courses.removeChapter);
  const reorderChapters = useMutation(api.courses.reorderChapters);

  const createLesson = useMutation(api.courses.createLesson);
  const updateLesson = useMutation(api.courses.updateLesson);
  const removeLesson = useMutation(api.courses.removeLesson);
  const reorderLessons = useMutation(api.courses.reorderLessons);

  // States
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterSummary, setEditChapterSummary] = useState('');
  const [isChapterSaving, setIsChapterSaving] = useState(false);

  // Add Chapter Form
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterSummary, setNewChapterSummary] = useState('');
  const [newChapterResetKey, setNewChapterResetKey] = useState(0);
  const [isChapterAdding, setIsChapterAdding] = useState(false);

  // Add Lesson Form (Inline)
  const [addingLessonToChapterId, setAddingLessonToChapterId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonVideoType, setNewLessonVideoType] = useState<VideoType>('none');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState<number | undefined>();
  const [newLessonPreview, setNewLessonPreview] = useState(false);
  const [isLessonAdding, setIsLessonAdding] = useState(false);

  // Edit Lesson Modal
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [isLessonSaving, setIsLessonSaving] = useState(false);

  // Drag and Drop States
  const [draggingChapterId, setDraggingChapterId] = useState<string | null>(null);
  const [draggingLessonId, setDraggingLessonId] = useState<string | null>(null);
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null);
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null);

  // Mapping lessons by chapter
  const lessonsByChapter = useMemo(() => {
    const map: Record<string, typeof lessons> = {};
    lessons?.forEach((lesson) => {
      map[lesson.chapterId] = [...(map[lesson.chapterId] ?? []), lesson];
    });
    // Sort lessons by order
    Object.keys(map).forEach((key) => {
      map[key]?.sort((a, b) => a.order - b.order);
    });
    return map;
  }, [lessons]);

  // Open the first chapter by default when loaded
  useEffect(() => {
    if (chapters && chapters.length > 0 && Object.keys(openChapters).length === 0) {
      setOpenChapters({ [chapters[0]._id]: true });
    }
  }, [chapters]);

  // Toggle chapter open/close
  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  // Expand / Collapse all
  const handleExpandAll = () => {
    if (!chapters) {return;}
    const state: Record<string, boolean> = {};
    chapters.forEach((ch) => { state[ch._id] = true; });
    setOpenChapters(state);
  };

  const handleCollapseAll = () => {
    setOpenChapters({});
  };

  // Chapter CRUD handlers
  const handleAddChapter = async (e?: React.FormEvent) => {
    if (e) { e.preventDefault(); }
    if (!newChapterTitle.trim()) {return;}

    setIsChapterAdding(true);
    try {
      const id = await createChapter({
        courseId,
        title: newChapterTitle.trim(),
        summary: newChapterSummary.trim() || undefined,
      });
      setNewChapterTitle('');
      setNewChapterSummary('');
      setNewChapterResetKey((prev) => prev + 1);
      setOpenChapters((prev) => ({ ...prev, [id]: true }));
      toast.success('Đã thêm chương mới thành công');
    } catch (err) {
      toast.error(getAdminMutationErrorMessage(err, 'Không thể thêm chương'));
    } finally {
      setIsChapterAdding(false);
    }
  };

  const startEditChapter = (chapter: any) => {
    setEditingChapterId(chapter._id);
    setEditChapterTitle(chapter.title);
    setEditChapterSummary(chapter.summary ?? '');
  };

  const handleSaveChapter = async (chapterId: Id<'courseChapters'>) => {
    if (!editChapterTitle.trim()) {return;}
    setIsChapterSaving(true);
    try {
      await updateChapter({
        id: chapterId,
        title: editChapterTitle.trim(),
        summary: editChapterSummary.trim() || undefined,
      });
      setEditingChapterId(null);
      toast.success('Đã cập nhật chương học');
    } catch (err) {
      toast.error(getAdminMutationErrorMessage(err, 'Không thể cập nhật chương'));
    } finally {
      setIsChapterSaving(false);
    }
  };

  const handleDeleteChapter = async (chapterId: Id<'courseChapters'>) => {
    if (!confirm('Xóa chương này và toàn bộ bài học bên trong? Bạn không thể hoàn tác hành động này.')) {
      return;
    }
    try {
      await removeChapter({ id: chapterId });
      toast.success('Đã xóa chương và các bài học thành công');
    } catch (err) {
      toast.error(getAdminMutationErrorMessage(err, 'Không thể xóa chương'));
    }
  };

  // Lesson CRUD handlers
  const handleAddLesson = async (chapterId: Id<'courseChapters'>) => {
    if (!newLessonTitle.trim()) {return;}
    setIsLessonAdding(true);
    try {
      await createLesson({
        courseId,
        chapterId,
        title: newLessonTitle.trim(),
        videoType: newLessonVideoType,
        videoUrl: newLessonVideoUrl.trim() || undefined,
        durationSeconds: newLessonDuration,
        isPreview: newLessonPreview,
      });
      setNewLessonTitle('');
      setNewLessonVideoType('none');
      setNewLessonVideoUrl('');
      setNewLessonDuration(undefined);
      setNewLessonPreview(false);
      setAddingLessonToChapterId(null);
      toast.success('Đã thêm bài học thành công');
    } catch (err) {
      toast.error(getAdminMutationErrorMessage(err, 'Không thể thêm bài học'));
    } finally {
      setIsLessonAdding(false);
    }
  };

  const handleOpenEditLesson = (lesson: any) => {
    setEditingLesson({
      id: lesson._id,
      title: lesson.title,
      videoType: lesson.videoType || 'none',
      videoUrl: lesson.videoUrl || '',
      durationSeconds: lesson.durationSeconds || '',
      isPreview: lesson.isPreview || false,
      description: lesson.description || '',
    });
  };

  const handleSaveLesson = async () => {
    if (!editingLesson || !editingLesson.title.trim()) {return;}
    setIsLessonSaving(true);
    try {
      await updateLesson({
        id: editingLesson.id,
        title: editingLesson.title.trim(),
        videoType: editingLesson.videoType,
        videoUrl: editingLesson.videoUrl.trim() || undefined,
        durationSeconds: editingLesson.durationSeconds ? Number(editingLesson.durationSeconds) : undefined,
        isPreview: editingLesson.isPreview,
        description: editingLesson.description.trim() || undefined,
      });
      setEditingLesson(null);
      toast.success('Đã cập nhật chi tiết bài học');
    } catch (err) {
      toast.error(getAdminMutationErrorMessage(err, 'Không thể cập nhật bài học'));
    } finally {
      setIsLessonSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: Id<'courseLessons'>) => {
    if (!confirm('Xóa bài học này?')) {return;}
    try {
      await removeLesson({ id: lessonId });
      toast.success('Đã xóa bài học');
    } catch (err) {
      toast.error(getAdminMutationErrorMessage(err, 'Không thể xóa bài học'));
    }
  };

  // Drag & Drop Chapters (HTML5 API)
  const handleChapterDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('type', 'chapter');
    e.dataTransfer.setData('id', id);
    setDraggingChapterId(id);
  };

  const handleChapterDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingChapterId && draggingChapterId !== id) {
      setDragOverChapterId(id);
    }
  };

  const handleChapterDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData('type');
    const dragId = e.dataTransfer.getData('id');

    setDraggingChapterId(null);
    setDragOverChapterId(null);

    if (dragType !== 'chapter' || dragId === targetId || !chapters) {return;}

    const dragIndex = chapters.findIndex((c) => c._id === dragId);
    const targetIndex = chapters.findIndex((c) => c._id === targetId);
    if (dragIndex === -1 || targetIndex === -1) {return;}

    const reordered = [...chapters];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Prepare batch orders update
    const ordersUpdate = reordered.map((c, index) => ({
      id: c._id,
      order: index,
    }));

    // Optimistic toast/update state logic
    try {
      await reorderChapters({ orders: ordersUpdate });
      toast.success('Đã cập nhật vị trí chương');
    } catch (err) {
      toast.error(getAdminMutationErrorMessage(err, 'Không thể sắp xếp chương'));
    }
  };

  // Drag & Drop Lessons (HTML5 API)
  const handleLessonDragStart = (e: React.DragEvent, lessonId: string, sourceChapterId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('type', 'lesson');
    e.dataTransfer.setData('id', lessonId);
    e.dataTransfer.setData('sourceChapterId', sourceChapterId);
    setDraggingLessonId(lessonId);
  };

  const handleLessonDragOver = (e: React.DragEvent, lessonId: string, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingLessonId && draggingLessonId !== lessonId) {
      setDragOverLessonId(lessonId);
    }
    setDragOverChapterId(chapterId);
  };

  const handleLessonDropOnChapter = async (e: React.DragEvent, targetChapterId: string) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData('type');
    const dragId = e.dataTransfer.getData('id') as Id<'courseLessons'>;
    const sourceChapterId = e.dataTransfer.getData('sourceChapterId');

    setDraggingLessonId(null);
    setDragOverLessonId(null);
    setDragOverChapterId(null);

    if (dragType !== 'lesson' || !lessons) {return;}

    const targetLessons = lessonsByChapter[targetChapterId] ?? [];

    // Drop on chapter body means put at the end of the chapter
    if (sourceChapterId === targetChapterId) {
      // Just reorder within same chapter, if dropped on chapter background it goes to bottom
      const currentLessons = [...targetLessons];
      const dragIndex = currentLessons.findIndex((l) => l._id === dragId);
      if (dragIndex === -1) {return;}
      const [removed] = currentLessons.splice(dragIndex, 1);
      currentLessons.push(removed);

      const ordersUpdate = currentLessons.map((l, index) => ({
        id: l._id,
        order: index,
      }));
      try {
        await reorderLessons({ orders: ordersUpdate });
        toast.success('Đã di chuyển bài học');
      } catch (err) {
        toast.error(getAdminMutationErrorMessage(err, 'Lỗi sắp xếp bài học'));
      }
    } else {
      // Move to a different chapter
      const newOrder = targetLessons.length;
      try {
        await reorderLessons({
          orders: [{
            id: dragId,
            order: newOrder,
            chapterId: targetChapterId as Id<'courseChapters'>,
          }]
        });
        setOpenChapters((prev) => ({ ...prev, [targetChapterId]: true }));
        toast.success('Đã di chuyển bài học sang chương mới');
      } catch (err) {
        toast.error(getAdminMutationErrorMessage(err, 'Lỗi di chuyển bài học'));
      }
    }
  };

  const handleLessonDropOnLesson = async (e: React.DragEvent, targetLessonId: string, targetChapterId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const dragType = e.dataTransfer.getData('type');
    const dragId = e.dataTransfer.getData('id') as Id<'courseLessons'>;
    const sourceChapterId = e.dataTransfer.getData('sourceChapterId');

    setDraggingLessonId(null);
    setDragOverLessonId(null);
    setDragOverChapterId(null);

    if (dragType !== 'lesson' || dragId === targetLessonId || !lessons) {return;}

    // Case 1: Same Chapter Reorder
    if (sourceChapterId === targetChapterId) {
      const currentLessons = [...(lessonsByChapter[targetChapterId] ?? [])];
      const dragIndex = currentLessons.findIndex((l) => l._id === dragId);
      const targetIndex = currentLessons.findIndex((l) => l._id === targetLessonId);
      if (dragIndex === -1 || targetIndex === -1) {return;}

      const [removed] = currentLessons.splice(dragIndex, 1);
      currentLessons.splice(targetIndex, 0, removed);

      const ordersUpdate = currentLessons.map((l, index) => ({
        id: l._id,
        order: index,
      }));

      try {
        await reorderLessons({ orders: ordersUpdate });
        toast.success('Đã cập nhật vị trí bài học');
      } catch (err) {
        toast.error(getAdminMutationErrorMessage(err, 'Lỗi sắp xếp bài học'));
      }
    }
    // Case 2: Cross Chapter Reorder (Drop directly onto a lesson in another chapter)
    else {
      const sourceLessons = [...(lessonsByChapter[sourceChapterId] ?? [])];
      const targetLessons = [...(lessonsByChapter[targetChapterId] ?? [])];

      const dragIndex = sourceLessons.findIndex((l) => l._id === dragId);
      const targetIndex = targetLessons.findIndex((l) => l._id === targetLessonId);
      if (dragIndex === -1 || targetIndex === -1) {return;}

      // Perform movement locally to calculate correct orders
      const [removed] = sourceLessons.splice(dragIndex, 1);
      targetLessons.splice(targetIndex, 0, { ...removed, chapterId: targetChapterId as Id<'courseChapters'> });

      // Build batch list
      const sourceUpdates = sourceLessons.map((l, idx) => ({ id: l._id, order: idx }));
      const targetUpdates = targetLessons.map((l, idx) => ({
        id: l._id,
        order: idx,
        chapterId: l._id === dragId ? (targetChapterId as Id<'courseChapters'>) : undefined
      }));

      try {
        await reorderLessons({ orders: [...sourceUpdates, ...targetUpdates] });
        setOpenChapters((prev) => ({ ...prev, [targetChapterId]: true }));
        toast.success('Đã chuyển bài học sang chương khác');
      } catch (err) {
        toast.error(getAdminMutationErrorMessage(err, 'Lỗi di chuyển bài học'));
      }
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) {return '';}
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} phút`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (chapters === undefined || lessons === undefined) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Chi tiết Lộ trình học</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sắp xếp chương/bài học bằng kéo thả. Sửa đổi trực quan.</p>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={handleExpandAll}
            title="Mở rộng tất cả"
          >
            <ChevronsDown size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={handleCollapseAll}
            title="Thu gọn tất cả"
          >
            <ChevronsUp size={18} />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 space-y-6">
        {/* Chapters & Lessons Area */}
        <div className="space-y-4">
          {chapters.map((chapter, chapterIdx) => {
            const isExpanded = !!openChapters[chapter._id];
            const chapterLessons = lessonsByChapter[chapter._id] ?? [];
            const isEditing = editingChapterId === chapter._id;

            return (
              <div
                key={chapter._id}
                draggable={!isEditing}
                onDragStart={(e) => handleChapterDragStart(e, chapter._id)}
                onDragOver={(e) => handleChapterDragOver(e, chapter._id)}
                onDrop={(e) => {
                  if (draggingChapterId) {
                    void handleChapterDrop(e, chapter._id);
                  } else if (draggingLessonId) {
                    void handleLessonDropOnChapter(e, chapter._id);
                  }
                }}
                className={cn(
                  "rounded-lg border bg-white dark:bg-slate-900 transition-all duration-200",
                  draggingChapterId === chapter._id ? "opacity-40 border-dashed border-indigo-400 bg-slate-50" : "border-slate-200 dark:border-slate-800",
                  dragOverChapterId === chapter._id && draggingChapterId ? "border-indigo-500 scale-[1.01] bg-indigo-50/20" : "",
                  dragOverChapterId === chapter._id && draggingLessonId ? "bg-indigo-50/10 border-indigo-400" : ""
                )}
              >
                {/* Chapter Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Kéo thả để sắp xếp chương"
                    >
                      <GripVertical size={16} />
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter._id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="min-w-0 cursor-pointer flex-1" onClick={() => toggleChapter(chapter._id)}>
                      <h4 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 truncate">
                        Chương {chapterIdx + 1}: {chapter.title}
                      </h4>
                      {chapter.summary && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{stripHtml(chapter.summary)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {chapterLessons.length} bài
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                      onClick={() => startEditChapter(chapter)}
                      title="Sửa tên chương"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() => void handleDeleteChapter(chapter._id)}
                      title="Xóa chương học"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Chapter Lessons List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 p-3 space-y-2">
                    {chapterLessons.map((lesson, lessonIdx) => (
                      <div
                        key={lesson._id}
                        draggable={true}
                        onDragStart={(e) => handleLessonDragStart(e, lesson._id, chapter._id)}
                        onDragOver={(e) => handleLessonDragOver(e, lesson._id, chapter._id)}
                        onDrop={(e) => draggingLessonId && void handleLessonDropOnLesson(e, lesson._id, chapter._id)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-md border bg-white dark:bg-slate-800/50 transition-all duration-150",
                          draggingLessonId === lesson._id ? "opacity-30 border-dashed border-indigo-300" : "border-slate-100 dark:border-slate-800/80 shadow-sm",
                          dragOverLessonId === lesson._id && draggingLessonId ? "border-indigo-500 translate-y-1 bg-indigo-50/30" : ""
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
                            title="Kéo thả bài học"
                          >
                            <GripVertical size={13} />
                          </div>
                          <span className="text-xs font-semibold text-slate-400 shrink-0">
                            {lessonIdx + 1}.
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block truncate">
                              {lesson.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {lesson.videoType !== 'none' && (
                                <span className="text-[10px] flex items-center gap-0.5 text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  <Video size={10} /> Video: {lesson.videoType}
                                </span>
                              )}
                              {lesson.durationSeconds && (
                                <span className="text-[10px] text-slate-400">
                                  ⏱️ {formatDuration(lesson.durationSeconds)}
                                </span>
                              )}
                              {lesson.isPreview && (
                                <span className="text-[10px] flex items-center gap-0.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                                  <Eye size={10} /> Xem thử
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                            onClick={() => handleOpenEditLesson(lesson)}
                            title="Chỉnh sửa bài học chi tiết"
                          >
                            <Settings size={13} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-500"
                            onClick={() => void handleDeleteLesson(lesson._id)}
                            title="Xóa bài học"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {chapterLessons.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-400 italic">
                        Chưa có bài học trong chương này. Kéo thả bài học vào đây hoặc thêm mới ở dưới.
                      </div>
                    )}

                    {/* Inline Add Lesson Action */}
                    {addingLessonToChapterId === chapter._id ? (
                      <div className="border border-indigo-100 bg-indigo-50/20 dark:border-indigo-900/30 dark:bg-indigo-950/10 p-3 rounded-md space-y-3 mt-2">
                        <div className="flex items-center justify-between border-b border-indigo-100/50 pb-1.5 dark:border-indigo-900/20">
                          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Thêm bài học vào Chương {chapterIdx + 1}</span>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600"
                            onClick={() => setAddingLessonToChapterId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Tên bài học <span className="text-red-500">*</span></Label>
                            <Input
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              placeholder="Nhập tên bài học..."
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Loại Video</Label>
                            <select
                              value={newLessonVideoType}
                              onChange={(e) => setNewLessonVideoType(e.target.value as VideoType)}
                              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="none">Không có video</option>
                              <option value="youtube">YouTube</option>
                              <option value="drive">Google Drive</option>
                              <option value="external">Đường dẫn ngoài</option>
                            </select>
                          </div>

                          {newLessonVideoType !== 'none' && (
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs">URL Video</Label>
                              <Input
                                value={newLessonVideoUrl}
                                onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                                placeholder="https://..."
                                className="h-8 text-xs"
                              />
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs">Thời lượng bài học (giây)</Label>
                            <Input
                              type="number"
                              value={newLessonDuration ?? ''}
                              onChange={(e) => setNewLessonDuration(e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="VD: 600"
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-5">
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newLessonPreview}
                                onChange={(e) => setNewLessonPreview(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                              />
                              Cho xem thử
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-slate-500 hover:text-slate-700"
                            onClick={() => setAddingLessonToChapterId(null)}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            disabled={isLessonAdding || !newLessonTitle.trim()}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                            onClick={() => void handleAddLesson(chapter._id)}
                          >
                            {isLessonAdding && <Loader2 size={12} className="mr-1 animate-spin" />}
                            Thêm bài học
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-400 flex items-center justify-center gap-1 bg-slate-50/50"
                          onClick={() => {
                            setAddingLessonToChapterId(chapter._id);
                            setNewLessonTitle('');
                            setNewLessonVideoType('none');
                            setNewLessonVideoUrl('');
                            setNewLessonDuration(undefined);
                            setNewLessonPreview(false);
                          }}
                        >
                          <Plus size={12} /> Thêm bài học mới vào chương này
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {chapters.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 italic">
              Khóa học chưa có chương học nào. Vui lòng điền form bên dưới để tạo chương học đầu tiên.
            </div>
          )}
        </div>

        {/* Add Chapter Panel */}
        <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
            <Plus size={16} className="text-indigo-600" /> Thêm chương học mới
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Tên chương <span className="text-red-500">*</span></Label>
                <Input
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Nhập tên chương học..."
                  required
                  className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleAddChapter();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Tóm tắt chương (tùy chọn)</Label>
                <LexicalEditor
                  onChange={setNewChapterSummary}
                  initialContent={newChapterSummary}
                  folder="chapters"
                  resetKey={newChapterResetKey}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="default"
                disabled={isChapterAdding || !newChapterTitle.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4"
                onClick={() => void handleAddChapter()}
              >
                {isChapterAdding && <Loader2 size={12} className="mr-1 animate-spin" />}
                Thêm chương
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Edit Lesson Modal Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent className="max-w-md w-[95vw] border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Chỉnh sửa chi tiết bài học</DialogTitle>
          </DialogHeader>

          {editingLesson && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs">Tiêu đề bài học <span className="text-red-500">*</span></Label>
                <Input
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  placeholder="Nhập tiêu đề..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Loại video</Label>
                  <select
                    value={editingLesson.videoType}
                    onChange={(e) => setEditingLesson({ ...editingLesson, videoType: e.target.value as VideoType })}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="none">Không có video</option>
                    <option value="youtube">YouTube</option>
                    <option value="drive">Google Drive</option>
                    <option value="external">Đường dẫn ngoài</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Thời lượng (giây)</Label>
                  <Input
                    type="number"
                    value={editingLesson.durationSeconds}
                    onChange={(e) => setEditingLesson({ ...editingLesson, durationSeconds: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="VD: 600"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {editingLesson.videoType !== 'none' && (
                <div className="space-y-1">
                  <Label className="text-xs">URL Video</Label>
                  <Input
                    value={editingLesson.videoUrl}
                    onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Mô tả bài học</Label>
                <textarea
                  value={editingLesson.description}
                  onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                  placeholder="Nhập nội dung mô tả hoặc ghi chú cho bài học này..."
                  className="w-full min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingLesson.isPreview}
                    onChange={(e) => setEditingLesson({ ...editingLesson, isPreview: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                  />
                  Cho phép người dùng chưa mua khóa học xem thử
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingLesson(null)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={isLessonSaving || !editingLesson?.title?.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
              onClick={() => void handleSaveLesson()}
            >
              {isLessonSaving && <Loader2 size={12} className="mr-1 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Chapter Modal Dialog */}
      <Dialog open={editingChapterId !== null} onOpenChange={(open) => !open && setEditingChapterId(null)}>
        <DialogContent className="max-w-lg w-[95vw] border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Chỉnh sửa chi tiết chương học</DialogTitle>
          </DialogHeader>

          {editingChapterId && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs">Tên chương <span className="text-red-500">*</span></Label>
                <Input
                  value={editChapterTitle}
                  onChange={(e) => setEditChapterTitle(e.target.value)}
                  placeholder="Nhập tên chương..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Tóm tắt chương</Label>
                <LexicalEditor
                  onChange={setEditChapterSummary}
                  initialContent={editChapterSummary}
                  folder="chapters"
                  resetKey={editingChapterId}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingChapterId(null)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={isChapterSaving || !editChapterTitle.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
              onClick={() => void handleSaveChapter(editingChapterId as Id<'courseChapters'>)}
            >
              {isChapterSaving && <Loader2 size={12} className="mr-1 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
