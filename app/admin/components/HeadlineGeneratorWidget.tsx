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

type ChatjptClientFallback = {
  body: {
    messages: Array<{ content: string; role: 'assistant' | 'system' | 'user' }>;
    model: string;
    stream?: boolean;
  };
  endpoint: string;
};

type OptimizedHeadlineSuggestion = {
  headline: string;
  source: 'ai' | 'browser';
  warning?: string;
};

const HEADLINE_LIMIT = 8;

function findFirstTextField(input: unknown): string {
  if (typeof input === 'string') return input;
  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findFirstTextField(item);
      if (found.trim().length > 0) return found;
    }
    return '';
  }
  if (typeof input !== 'object' || input === null) return '';

  const record = input as Record<string, unknown>;
  const directKeys = ['content', 'text', 'output_text', 'answer', 'message', 'response'];
  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }

  const priorityKeys = ['result', 'output', 'data', 'choices', 'messages', 'message', 'delta'];
  for (const key of priorityKeys) {
    if (!(key in record)) continue;
    const found = findFirstTextField(record[key]);
    if (found.trim().length > 0) return found;
  }

  for (const value of Object.values(record)) {
    const found = findFirstTextField(value);
    if (found.trim().length > 0) return found;
  }
  return '';
}

function extractResponseFromRawStream(raw: string): string {
  const normalized = raw.replace(/\r/g, '');
  const matches = [...normalized.matchAll(/"response"\s*:\s*"((?:\\.|[^"\\])*)"/g)];
  if (matches.length === 0) return '';

  let out = '';
  for (const match of matches) {
    const piece = match[1];
    if (!piece) continue;
    try {
      out += JSON.parse(`"${piece}"`) as string;
    } catch {
      out += piece;
    }
  }

  return out.trim();
}

function extractChatjptText(raw: string): string {
  const text = raw.trim();
  if (!text) return '';
  try {
    const parsed = JSON.parse(text);
    const found = findFirstTextField(parsed);
    return found.trim() || JSON.stringify(parsed);
  } catch {
    return extractResponseFromRawStream(text) || text;
  }
}

const cleanOptimizedHeadline = (headline: string) => {
  const firstLine = headline
    .replace(/^```(?:text)?/i, '')
    .replace(/```$/i, '')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) ?? '';

  return firstLine
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/^\d+[).:-]\s*/, '')
    .trim()
    .slice(0, 160);
};

const isHtmlResponse = (value: string) => /<(?:!doctype|html|head|body)\b/i.test(value);

function buildChatjptHttpError(status: number, raw: string): string {
  const prefix = `ChatJPT API error: HTTP ${status}`;
  const trimmed = raw.trim();
  if (!trimmed) return prefix;
  if (isHtmlResponse(trimmed)) {
    return `${prefix}: ChatJPT đang trả về HTML thay vì JSON.`;
  }

  try {
    const parsed = JSON.parse(trimmed);
    const apiError = findFirstTextField(parsed).trim();
    return apiError ? `${prefix}: ${apiError.slice(0, 180)}` : prefix;
  } catch {
    return `${prefix}: ${trimmed.slice(0, 180)}`;
  }
}

async function optimizeHeadlineFromBrowser(fallback: ChatjptClientFallback) {
  const response = await fetch(fallback.endpoint, {
    body: JSON.stringify(fallback.body),
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(buildChatjptHttpError(response.status, raw));
  }

  const headline = cleanOptimizedHeadline(extractChatjptText(raw));
  if (!headline) {
    throw new Error('ChatJPT không trả về tiêu đề hợp lệ.');
  }
  return headline;
}

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
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, OptimizedHeadlineSuggestion>>({});

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
      if (result.source === 'client-fallback') {
        if (!result.clientFallback) {
          throw new Error('Thiếu cấu hình fallback trình duyệt.');
        }
        const browserHeadline = await optimizeHeadlineFromBrowser(result.clientFallback);
        setAiSuggestions((prev) => ({
          ...prev,
          [headline]: {
            headline: browserHeadline,
            source: 'browser',
            warning: result.warning,
          },
        }));
        toast.success('Đã tối ưu tiêu đề qua trình duyệt');
        return;
      }

      const optimizedHeadline = result.headline;
      if (!optimizedHeadline) {
        throw new Error('AI không trả về tiêu đề hợp lệ.');
      }
      setAiSuggestions((prev) => ({
        ...prev,
        [headline]: {
          headline: optimizedHeadline,
          source: 'ai',
        },
      }));
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
                  const optimizedSuggestion = aiSuggestions[headline];
                  const aiHeadline = optimizedSuggestion?.headline;
                  const isBrowserSuggestion = optimizedSuggestion?.source === 'browser';
                  const suggestionWarning = optimizedSuggestion?.warning;
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
                            {isBrowserSuggestion ? 'AI qua trình duyệt' : 'AI tối ưu'}
                          </div>
                          {suggestionWarning && (
                            <p className="mb-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                              {suggestionWarning}
                            </p>
                          )}
                          <p className="text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">
                            {aiHeadline}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="accent" onClick={() => applyHeadline(aiHeadline)}>
                              {isBrowserSuggestion ? 'Sử dụng bản trình duyệt' : 'Sử dụng bản AI'}
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
