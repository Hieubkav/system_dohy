'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  cn,
  Checkbox,
} from '../../components/ui';
import { AiDirectGeneratePanel } from '../../components/AiDirectGenerateButton';
import {
  buildAiFillMissingPrompt,
  buildAiFillMissingSample,
  mergeAiMissingFields,
} from '@/lib/ai-import/fill-missing';

export type AiSeoImportPayload = {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_brand_aliases?: string;
  seo_brand_summary?: string;
  seo_brand_entity_type?: string;
  seo_brand_search_queries?: string;
  seo_brand_topics?: string;
  seo_brand_services?: string;
  seo_brand_audience?: string;
  seo_brand_differentiators?: string;
  seo_brand_proof_points?: string;
  seo_brand_same_as?: string;
  seo_site_search_path?: string;
};

type ParseResult = {
  item: AiSeoImportPayload | null;
  errors: string[];
};

const SAMPLE_JSON = `{
  "seo_title": "Dịch vụ dựng hình 3D chuyên nghiệp | Dohy Studio",
  "seo_description": "Dohy Studio cung cấp hình ảnh 3D, render kiến trúc và animation chuyên nghiệp cho thương hiệu cần visual bán hàng rõ nét.",
  "seo_keywords": "dịch vụ dựng hình 3D, render kiến trúc, animation 3D, Dohy Studio",
  "seo_brand_aliases": "Dohy, Dohy Studio, DOHY Media, dohystudio, dohy studio",
  "seo_brand_summary": "Dohy Studio là studio hình ảnh 3D chuyên render kiến trúc, diễn họa sản phẩm, animation và visual marketing cho doanh nghiệp.",
  "seo_brand_entity_type": "ProfessionalService",
  "seo_brand_search_queries": "dohy, dohystudio, dohy studio, dohy media",
  "seo_brand_topics": "3D visualization, architectural rendering, product rendering, animation 3D, visual marketing",
  "seo_brand_services": "dựng hình 3D, render kiến trúc, render sản phẩm, làm video 3D quảng cáo, animation 3D",
  "seo_brand_audience": "Doanh nghiệp, chủ dự án, kiến trúc sư và đội marketing cần hình ảnh 3D chất lượng để bán hàng hoặc thuyết trình.",
  "seo_brand_differentiators": "Tập trung vào hình ảnh sắc nét, quy trình rõ ràng, output phù hợp marketing và tư vấn theo mục tiêu kinh doanh.",
  "seo_brand_proof_points": "Portfolio dự án thực tế, quy trình sản xuất minh bạch, hỗ trợ tư vấn trước khi triển khai.",
  "seo_brand_same_as": "https://www.youtube.com/@dohystudio\\nhttps://www.tiktok.com/@dohystudio",
  "seo_site_search_path": "/search?q={search_term_string}"
}`;

const buildPrompt = (form: Record<string, string | boolean>) => {
  const siteName = form.site_name || '[Tên thương hiệu]';
  const siteDesc = form.site_tagline || '[Mô tả website]';
  const hotline = form.contact_hotline || '[Hotline]';

  return `Bạn là chuyên gia SEO và viết nội dung website.

Nhiệm vụ: Tạo bộ SEO cho trang chủ và phần nhận diện thương hiệu. Output phải giúp Google và các công cụ AI hiểu đúng thương hiệu, kể cả khi người dùng gõ viết liền, viết rời, viết hoa/thường hoặc tên cũ.

Thông tin doanh nghiệp (Context):
- Tên thương hiệu: ${siteName}
- Mô tả/Ngành nghề: ${siteDesc}
- Liên hệ: ${hotline}

Quy tắc bắt buộc:
1. Mô tả trang phải trả lời nhanh: thương hiệu làm gì, giúp ai, lợi ích chính là gì. Không dùng từ sáo rỗng.
2. Không nhồi từ khóa. Dùng từ tự nhiên, bám đúng sản phẩm/dịch vụ thật.
3. Meta Title (seo_title):
   - Tối đa 60 ký tự.
   - Đưa dịch vụ hoặc chủ đề chính lên đầu.
   - Kết thúc bằng tên thương hiệu.
4. Meta Description (seo_description):
   - Tối đa 160 ký tự.
   - Nói rõ lợi ích chính trong 120 ký tự đầu.
   - Có lời mời hành động nhẹ nếu phù hợp.
5. Keywords (seo_keywords): 3-5 từ khóa chính, cách nhau dấu phẩy.
6. Tên gọi khác (seo_brand_aliases): Liệt kê tên chính, tên viết tắt, tên viết liền, tên viết rời, tên cũ nếu có. Ví dụ: "Dohy, Dohy Studio, DOHY Media, dohystudio, dohy studio".
7. Cách khách tìm thương hiệu (seo_brand_search_queries): Liệt kê các cách người dùng có thể gõ tên thương hiệu. Không thêm đối thủ.
8. Chủ đề và dịch vụ chính: Dùng cụm thật, gần với sản phẩm/dịch vụ đang bán.
9. Kênh chính thức (seo_brand_same_as): Mỗi dòng một URL public thật như social, Google Business, LinkedIn, YouTube, TikTok.
10. Giọng văn rõ ràng, đáng tin, không clickbait.

Output rule:
- Chỉ trả về JSON hợp lệ với cấu trúc như sau.
- Không dùng markdown fence.
- Không giải thích ngoài JSON.

Cấu trúc bắt buộc:
{
  "seo_title": "string, max 60 chars",
  "seo_description": "string, max 160 chars",
  "seo_keywords": "string, comma separated",
  "seo_brand_aliases": "string, comma separated",
  "seo_brand_summary": "string, 1-2 sentences",
  "seo_brand_entity_type": "Organization | LocalBusiness | ProfessionalService",
  "seo_brand_search_queries": "string, comma separated",
  "seo_brand_topics": "string, comma separated",
  "seo_brand_services": "string, comma separated",
  "seo_brand_audience": "string",
  "seo_brand_differentiators": "string",
  "seo_brand_proof_points": "string",
  "seo_brand_same_as": "string, one URL per line",
  "seo_site_search_path": "/search?q={search_term_string}"
}`;
};

const cleanJsonInput = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

const trimText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') { return ''; }
  return value.trim().slice(0, maxLength); // Only used for extreme safety, not for SEO limits
};

const parseAiEntity = (raw: string, fallbackItem?: AiSeoImportPayload): ParseResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object đúng cấu trúc.'], item: null };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { errors: ['Root JSON phải là object.'], item: null };
  }

  const record = parsed as Record<string, unknown>;
  const errors: string[] = [];
  
  if (!record.seo_title && !fallbackItem?.seo_title) {
    errors.push('Thiếu seo_title.');
  }

  const item: AiSeoImportPayload = {
    seo_title: trimText(record.seo_title ?? fallbackItem?.seo_title, 255),
    seo_description: trimText(record.seo_description, 1000),
    seo_keywords: trimText(record.seo_keywords, 500),
    seo_brand_aliases: trimText(record.seo_brand_aliases, 500),
    seo_brand_summary: trimText(record.seo_brand_summary, 1200),
    seo_brand_entity_type: trimText(record.seo_brand_entity_type, 80),
    seo_brand_search_queries: trimText(record.seo_brand_search_queries, 500),
    seo_brand_topics: trimText(record.seo_brand_topics, 700),
    seo_brand_services: trimText(record.seo_brand_services, 700),
    seo_brand_audience: trimText(record.seo_brand_audience, 1200),
    seo_brand_differentiators: trimText(record.seo_brand_differentiators, 1200),
    seo_brand_proof_points: trimText(record.seo_brand_proof_points, 1200),
    seo_brand_same_as: trimText(record.seo_brand_same_as, 1200),
    seo_site_search_path: trimText(record.seo_site_search_path, 255) || '/search?q={search_term_string}',
  };

  return { errors, item: errors.length > 0 ? null : item };
};

export function AiSeoImportDialog({
  form,
  onApply,
}: {
  form: Record<string, string | boolean>;
  onApply: (item: AiSeoImportPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const [fillMissingOnly, setFillMissingOnly] = useState(false);
  
  const currentSeoData = useMemo<AiSeoImportPayload>(() => ({
    seo_brand_aliases: String(form.seo_brand_aliases || ''),
    seo_brand_audience: String(form.seo_brand_audience || ''),
    seo_brand_differentiators: String(form.seo_brand_differentiators || ''),
    seo_brand_entity_type: String(form.seo_brand_entity_type || ''),
    seo_brand_proof_points: String(form.seo_brand_proof_points || ''),
    seo_brand_same_as: String(form.seo_brand_same_as || ''),
    seo_brand_search_queries: String(form.seo_brand_search_queries || ''),
    seo_brand_services: String(form.seo_brand_services || ''),
    seo_brand_summary: String(form.seo_brand_summary || ''),
    seo_brand_topics: String(form.seo_brand_topics || ''),
    seo_description: String(form.seo_description || ''),
    seo_keywords: String(form.seo_keywords || ''),
    seo_site_search_path: String(form.seo_site_search_path || ''),
    seo_title: String(form.seo_title || ''),
  }), [form]);
  const basePrompt = useMemo(() => buildPrompt(form), [form]);
  const prompt = useMemo(() => fillMissingOnly
    ? buildAiFillMissingPrompt(basePrompt, currentSeoData, { contextLabel: 'Dữ liệu SEO hiện có trong form' })
    : basePrompt, [basePrompt, currentSeoData, fillMissingOnly]);
  const sample = useMemo(() => fillMissingOnly
    ? buildAiFillMissingSample(SAMPLE_JSON, currentSeoData)
    : SAMPLE_JSON, [currentSeoData, fillMissingOnly]);
  const result = useMemo(() => parseAiEntity(rawInput, fillMissingOnly ? currentSeoData : undefined), [currentSeoData, fillMissingOnly, rawInput]);
  const canApply = rawInput.trim().length > 0 && Boolean(result.item) && result.errors.length === 0;

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const applyItem = () => {
    if (!canApply || !result.item) { return; }
    const appliedItem = fillMissingOnly
      ? mergeAiMissingFields(currentSeoData, result.item) as AiSeoImportPayload
      : result.item;
    onApply(appliedItem);
    toast.success(fillMissingOnly ? 'Đã áp dụng phần SEO còn thiếu vào form' : 'Đã áp dụng nội dung AI vào form');
    setOpen(false);
    setRawInput('');
  };

  return (
    <>
      <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Bot size={16} /> Import AI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo SEO bằng AI</DialogTitle>
            <DialogDescription>
              Copy prompt, nhờ AI tạo JSON, dán kết quả để xem trước rồi áp dụng vào form.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/30">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Tùy chọn Prompt AI:</span>
            <label className="flex cursor-pointer select-none items-center gap-2">
              <Checkbox checked={fillMissingOnly} onCheckedChange={(checked) => setFillMissingOnly(checked)} />
              <span className="font-medium text-slate-600 dark:text-slate-400">Chỉ tạo phần còn thiếu</span>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5">
                    <FileText size={14} /> Prompt chuẩn (Đã chèn thông tin web)
                  </Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(prompt, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {prompt}
                </pre>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(sample, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {sample}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <AiDirectGeneratePanel
                  allowEmptyBrief={fillMissingOnly}
                  prompt={prompt}
                  sessionId="admin-seo-import"
                  onGenerated={setRawInput}
                  placeholder="Ví dụ: Website Dohy Studio chuyên đào tạo 3D, tài nguyên miễn phí và dịch vụ thiết kế, cần SEO trang chủ dễ hiểu và rõ thương hiệu."
                />
                <textarea
                  className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder={sample}
                  value={rawInput}
                  onChange={(event) => setRawInput(event.target.value)}
                />
              </div>

              {rawInput.trim().length > 0 && (
                <div className={cn(
                  'rounded-lg border p-3 text-sm',
                  result.errors.length > 0
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
                    : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300'
                )}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">
                      {result.errors.map((error) => (
                        <li key={error} className="flex gap-1.5">
                          <X size={14} className="mt-0.5 shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Check size={14} />
                      JSON hợp lệ, sẵn sàng áp dụng.
                    </div>
                  )}
                </div>
              )}

              {result.item && (
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{result.item.seo_title}</div>
                    {result.item.seo_description && (
                      <div className="line-clamp-3 text-slate-500">{result.item.seo_description}</div>
                    )}
                    {result.item.seo_keywords && (
                      <div className="truncate text-xs text-slate-400">Keywords: {result.item.seo_keywords}</div>
                    )}
                    {result.item.seo_brand_aliases && (
                      <div className="truncate text-xs text-slate-400">Aliases: {result.item.seo_brand_aliases}</div>
                    )}
                    {result.item.seo_brand_summary && (
                      <div className="line-clamp-2 text-xs text-slate-400">Entity: {result.item.seo_brand_summary}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="button" variant="accent" disabled={!canApply} onClick={applyItem}>
              Áp dụng vào form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
