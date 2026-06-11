'use client';

import React, { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useAction } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { generateHeadlines } from '@/lib/constants/headlines';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  cn,
} from './ui';

type HeadlineGeneratorWidgetProps = {
  className?: string;
  currentTitle: string;
  onSelect: (headline: string) => void;
};

const HEADLINE_LIMIT = 8;

export function HeadlineGeneratorWidget({
  className,
  currentTitle,
  onSelect,
}: HeadlineGeneratorWidgetProps) {
  const optimizeHeadline = useAction(api.aiChat.optimizeHeadline);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [copiedHeadline, setCopiedHeadline] = useState<string | null>(null);
  const [optimizingHeadline, setOptimizingHeadline] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {return;}
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const openDialog = () => {
    setKeyword(currentTitle.trim());
    setOpen(true);
  };

  const handleGenerate = () => {
    const nextKeyword = keyword.trim() || currentTitle.trim();
    if (!nextKeyword) {
      toast.error('Vui lòng nhập từ khóa để tạo tiêu đề');
      return;
    }

    setKeyword(nextKeyword);
    setHeadlines(generateHeadlines(nextKeyword, HEADLINE_LIMIT));
    setAiSuggestions({});
  };

  const applyHeadline = (headline: string) => {
    const nextHeadline = headline.trim();
    if (!nextHeadline) {return;}
    onSelect(nextHeadline);
    setOpen(false);
    toast.success('Đã áp dụng tiêu đề gợi ý');
  };

  const copyHeadline = async (headline: string) => {
    try {
      await navigator.clipboard.writeText(headline);
      setCopiedHeadline(headline);
      toast.success('Đã copy tiêu đề');
      window.setTimeout(() => setCopiedHeadline(null), 1500);
    } catch {
      toast.error('Không thể copy, vui lòng copy thủ công');
    }
  };

  const handleOptimize = async (headline: string) => {
    if (optimizingHeadline) {return;}

    setOptimizingHeadline(headline);
    try {
      const result = await optimizeHeadline({
        headline,
        keyword: keyword.trim() || undefined,
      });
      setAiSuggestions((prev) => ({ ...prev, [headline]: result.headline }));
      toast.success('AI đã tối ưu tiêu đề');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tối ưu tiêu đề bằng AI');
    } finally {
      setOptimizingHeadline(null);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('gap-2 text-xs', className)}
        onClick={openDialog}
      >
        <Sparkles size={14} />
        Gợi ý tiêu đề hay
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[94vw] max-w-3xl max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <DialogHeader>
            <DialogTitle>Bộ tạo tiêu đề thu hút</DialogTitle>
            <DialogDescription>
              Nhập từ khóa chính để tạo nhanh các tiêu đề tiếng Việt có khả năng tăng CTR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline-keyword">Từ khóa / chủ đề chính</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="headline-keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="VD: chăm sóc tóc, phụ kiện tủ bếp, thiết kế website"
                />
                <Button type="button" variant="accent" className="gap-2" onClick={handleGenerate}>
                  <Sparkles size={16} />
                  Tạo tiêu đề gợi ý
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tiêu đề chỉ được đưa vào form khi bạn bấm “Sử dụng”.
              </p>
            </div>

            {headlines.length > 0 ? (
              <div className="space-y-2">
                {headlines.map((headline) => {
                  const aiHeadline = aiSuggestions[headline];
                  const isOptimizing = optimizingHeadline === headline;

                  return (
                    <div
                      key={headline}
                      className="rounded-lg border border-slate-200 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/20"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">
                          {headline}
                        </p>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button type="button" size="sm" variant="accent" onClick={() => applyHeadline(headline)}>
                            Sử dụng
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => void copyHeadline(headline)}>
                            {copiedHeadline === headline ? <Check size={14} /> : <Copy size={14} />}
                            Copy
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={Boolean(optimizingHeadline)}
                            onClick={() => void handleOptimize(headline)}
                          >
                            {isOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                            Tối ưu bằng AI
                          </Button>
                        </div>
                      </div>

                      {aiHeadline && (
                        <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/60 dark:bg-blue-950/30">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                            <Sparkles size={13} />
                            AI tối ưu
                          </div>
                          <p className="text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">
                            {aiHeadline}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="accent" onClick={() => applyHeadline(aiHeadline)}>
                              Sử dụng bản AI
                            </Button>
                            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => void copyHeadline(aiHeadline)}>
                              {copiedHeadline === aiHeadline ? <Check size={14} /> : <Copy size={14} />}
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                Chưa có gợi ý. Nhập từ khóa rồi bấm “Tạo tiêu đề gợi ý”.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
