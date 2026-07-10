# I. Primer

## 1. TL;DR kiểu Feynman

- Site **đã lên Google**, nhưng Google đang không lấy được favicon/logo đúng cách.
- Nguyên nhân chính không phải do chưa upload ảnh, mà do ảnh favicon đang đi qua đường `/api/favicon` trong khi `robots.txt` đang chặn `/api/`.
- Tệ hơn, `/api/favicon` redirect sang Convex Storage và response cuối có `x-robots-tag: noindex, nofollow`, tức là ảnh tự báo “đừng index tôi”.
- `/favicon.ico` hiện trả `404`, nên Google fallback cũng hụt.
- Logo trong admin không tự biến thành logo trên Google SERP (trang kết quả tìm kiếm). Google chủ yếu dùng favicon, domain, dữ liệu có cấu trúc và trust.
- SERP còn hiện `vercel.app` vì domain chính đang là `manhhieu.vercel.app`; muốn hiện brand domain thì cần custom domain.

## 2. Elaboration & Self-Explanation

Nhìn ảnh SERP, Google đang hiển thị icon hình quả địa cầu mặc định. Điều đó thường xảy ra khi Google không crawl được favicon hợp lệ. Trong repo hiện tại, homepage có metadata icon, nhưng icon trỏ tới `/api/favicon?...`. File `robots.txt` lại đang disallow toàn bộ `/api/`, nên bot có thể bị chặn ngay từ cửa.

Kể cả khi bot vẫn thử đi tiếp, endpoint `/api/favicon` hiện redirect sang Convex Storage. Public header tôi kiểm tra được cho ảnh đích có `x-robots-tag: noindex, nofollow`. Vì vậy luồng favicon hiện tại không phù hợp với yêu cầu của Google. Google docs cũng nêu rõ: homepage và favicon file đều phải crawlable (có thể crawl, không bị chặn).

Ngoài favicon, homepage public hiện vẫn trả nội dung placeholder “Chưa có nội dung trang chủ...”, sitemap lại lẫn nhiều ngành như wine, spa, mì cay, nồi cơm. Đây không trực tiếp làm mất favicon, nhưng làm tín hiệu thương hiệu bị loãng nên Google khó hiểu site đang đại diện cho ai và bán gì.

## 3. Concrete Examples & Analogies

Ví dụ cụ thể trong repo:

- `app/(site)/layout.tsx:41-44` đang render icon là `/api/favicon?...`.
- `app/robots.ts:18-23` allow `/` nhưng disallow `/api/`.
- `app/api/favicon/route.ts:18-23` redirect sang URL ảnh Convex Storage.
- Probe public cho `/api/favicon` trả `307` sang Convex Storage, ảnh cuối trả `200 image/png` nhưng kèm `x-robots-tag: noindex, nofollow`.
- Probe public cho `/favicon.ico` trả `404`.

Analogy: admin đã dán logo lên cửa hàng, nhưng đường vào chỗ Google tới xem logo lại bị treo biển “không cho robot vào”, rồi ảnh thật phía sau lại dán thêm nhãn “đừng index”. Google thấy vậy thì dùng icon mặc định.

# II. Audit Summary (Tóm tắt kiểm tra)

## 1. Observation (Quan sát)

- Homepage public status `200`, title/meta description có tồn tại.
- `robots.txt` status `200`, có `Disallow: /api/`.
- `sitemap.xml` status `200`, đúng domain `https://manhhieu.vercel.app`.
- HTML head có `<link rel="icon" href="/api/favicon?...">`.
- `/api/favicon` redirect sang Convex Storage.
- Ảnh favicon cuối có `x-robots-tag: noindex, nofollow`.
- `/favicon.ico` trả `404`.
- `og:image` hiện trỏ sang `fast-snail-793.convex.cloud/...` và trả `404`.
- Homepage public có placeholder “Chưa có nội dung trang chủ...”.

## 2. Inference (Suy luận)

Google không hiện favicon/logo đúng vì đường favicon không crawlable và không ổn định theo chuẩn Search. Logo upload trong admin có tồn tại, nhưng pipeline đưa logo/favicon ra public SEO đang sai.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High.** Evidence mạnh nhất là tổ hợp 3 điểm: favicon nằm dưới `/api`, robots chặn `/api/`, và ảnh đích có `x-robots-tag: noindex, nofollow`.

## 2. Counter-Hypothesis (Giả thuyết đối chứng)

- Có thể Google chưa recrawl sau khi upload favicon, nhưng giả thuyết này yếu hơn vì hiện route favicon vẫn vi phạm crawlability.
- Có thể ảnh favicon không đạt kích thước chuẩn, nhưng chưa cần kết luận vì lỗi crawl/noindex đã đủ làm fail trước.
- Có thể Search Console chưa submit sitemap, nhưng sitemap đang trả `200`; vấn đề icon vẫn nằm ở favicon route.

# IV. Proposal (Đề xuất)

## 1. Fix code đường favicon

- Thêm helper server `lib/seo/favicon-response.ts` để:
  - đọc `site_favicon`, `site_brand_primary`, `site_name` từ settings,
  - nếu có favicon URL thì **fetch và proxy bytes** qua domain chính, không redirect sang Convex Storage,
  - trả header public cache và không phát `x-robots-tag: noindex`,
  - fallback SVG chữ cái đầu brand nếu chưa có favicon.

## 2. Thêm public favicon route ổn định

- Thêm `app/favicon.ico/route.ts` để Google có URL chuẩn `/favicon.ico` trả `200`.
- Giữ `app/api/favicon/route.ts` cho backward compatibility, nhưng đổi sang dùng helper proxy thay vì redirect.

## 3. Sửa metadata và manifest

- Sửa `app/(site)/layout.tsx` để icon trỏ về `/favicon.ico`, không trỏ `/api/favicon` nữa.
- Sửa `app/manifest.ts` để icon manifest dùng `/favicon.ico`, bỏ `type: image/svg+xml` đang sai với ảnh PNG thực tế.

## 4. Sửa robots tương thích cache cũ

- Sửa `app/robots.ts` để allow riêng `/api/favicon` nếu Google còn giữ URL icon cũ trong cache.
- Public metadata mới vẫn dùng `/favicon.ico` để tránh phụ thuộc `/api`.

## 5. Sửa tín hiệu ảnh SEO bị hỏng

- Đọc settings hiện tại.
- Nếu `seo_og_image` vẫn trỏ URL `fast-snail-793...` đang `404`, patch tối thiểu sang logo hiện tại hoặc clear để code fallback.
- Cập nhật `lib/seo/resolver.ts` để khi thiếu `seo_og_image`, metadata fallback sang `site_logo`.

```mermaid
flowchart TD
  G[Googlebot] --> H[Homepage]
  H --> I[Icon link]
  I --> F[/favicon.ico]
  F --> P[Proxy image]
  P --> C[Convex image]
  P --> R[200 crawlable]
```

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. SEO server routes

- **Thêm:** `lib/seo/favicon-response.ts`, helper hiện chưa có, sẽ gom logic trả favicon crawlable từ settings.
- **Thêm:** `app/favicon.ico/route.ts`, hiện `/favicon.ico` đang 404, sẽ trả favicon public ổn định.
- **Sửa:** `app/api/favicon/route.ts`, hiện redirect sang Convex Storage, sẽ đổi thành proxy response để tránh header `noindex` của storage.

## 2. Metadata / manifest / robots

- **Sửa:** `app/(site)/layout.tsx`, hiện `icons` trỏ `/api/favicon`, sẽ trỏ `/favicon.ico`.
- **Sửa:** `app/manifest.ts`, hiện manifest icon trỏ `/api/favicon` và khai `image/svg+xml`, sẽ trỏ `/favicon.ico` và tránh type sai.
- **Sửa:** `app/robots.ts`, hiện chặn `/api/`, sẽ allow riêng `/api/favicon` để tương thích link cũ.

## 3. SEO image fallback

- **Sửa:** `lib/seo/resolver.ts`, hiện `resolveSeoImage` không fallback sang `site_logo`, sẽ thêm fallback nhỏ khi thiếu OG image.
- **Data patch tối thiểu:** setting `seo_og_image`, nếu đang là URL 404 thì đổi sang URL hợp lệ hoặc clear.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại các file impacted để giữ style hiện tại.
2. Tạo helper favicon proxy dùng `getConvexClient()` và `api.settings.getMultiple`.
3. Thêm route `/favicon.ico`.
4. Đổi `/api/favicon` từ redirect sang proxy helper.
5. Cập nhật metadata/manifest/robots.
6. Kiểm tra public headers local hoặc sau deploy bằng `curl -I -L`.
7. Đọc setting `seo_og_image`, patch tối thiểu nếu giá trị hiện tại đang 404.
8. Tự review tĩnh, chạy typecheck phù hợp, commit theo rule repo.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## 1. Local/static

- Kiểm tra TypeScript với lệnh giới hạn output: `bunx tsc --noEmit 2>&1 | Select-Object -First 10`.
- Không chạy build nếu không cần.
- Commit hook sẽ chạy staged oxlint và full typecheck theo cấu hình repo.

## 2. Public endpoint sau deploy

- `curl -I -L https://manhhieu.vercel.app/favicon.ico` phải trả `200`, không `404`.
- Response favicon không có `x-robots-tag: noindex`.
- HTML head phải có icon `/favicon.ico`, không còn `/api/favicon`.
- `robots.txt` không chặn favicon.
- `og:image` phải trả `200`, không `404`.

## 3. Google-side

- Submit lại sitemap trong Google Search Console.
- Request indexing homepage.
- Kỳ vọng Google cập nhật favicon sau khi recrawl, thường không tức thì, có thể mất vài ngày.

# VIII. Todo

1. Tạo favicon proxy helper.
2. Thêm `/favicon.ico` route.
3. Sửa `/api/favicon` route.
4. Sửa metadata, manifest, robots.
5. Sửa fallback OG image và patch setting hỏng nếu cần.
6. Chạy verification.
7. Commit thay đổi.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- `/favicon.ico` trả `200` trên domain chính.
- Favicon URL crawlable, không nằm dưới route bị robots chặn.
- Favicon response không mang `noindex/nofollow`.
- Homepage head trỏ favicon ổn định.
- `og:image` không còn URL 404.
- Không làm thay đổi logic admin upload logo/favicon.
- Có commit sau khi hoàn tất.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro thấp: thay đổi chủ yếu ở route favicon và metadata.
- Nếu proxy favicon fetch fail, fallback SVG vẫn trả icon hợp lệ.
- Rollback code bằng revert commit.
- Rollback data bằng trả `seo_og_image` về giá trị before đã ghi lại trước khi patch.

# XI. Out of Scope (Ngoài phạm vi)

- Không xử lý custom domain trong code, vì cần DNS/Vercel domain setup.
- Không dọn toàn bộ dữ liệu seed/demo trong sitemap trong lần fix khẩn cấp này.
- Không đảm bảo Google cập nhật SERP ngay lập tức, chỉ đảm bảo site đủ điều kiện kỹ thuật để Google crawl favicon/logo đúng.