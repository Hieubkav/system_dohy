# I. Primer

## 1. TL;DR kiểu Feynman

- Vấn đề không nằm ở AI ngu, mà nằm ở prompt/schema mình đưa cho AI bị thiếu trường.
- Checkbox "Chỉ tạo phần còn thiếu" đang copy data hiện có đúng, nhưng schema product không cho phép AI sinh `focusKeyword`, `tags`, `relatedQueries`, `faqItems`.
- Rule đúng phải là: module nào bật SEO nâng cao trong `/system/modules/[module]` thì AI import mới được yêu cầu và apply SEO nâng cao cho module đó.
- Bug tương tự có ở product, service, course; post thì ngược lại, đang ép SEO nâng cao hơi quá dù field có thể bị tắt.
- Projects và resources có form SEO nâng cao nhưng chưa có AI import, nên nếu muốn parity đầy đủ thì cần thêm surface AI import cho 2 module này.
- Data Convex hiện tại cũng có drift: `posts/products` có đủ field SEO nâng cao, còn `services/projects/courses/resources` đang thiếu record field/feature tương ứng trong module config thật.

## 2. Elaboration & Self-Explanation

Luồng hiện tại hoạt động như sau:

1. Form admin đọc `enabledFields` từ `api.admin.modules.listEnabledModuleFields`.
2. `AiEntityImportDialog` dùng `enabledFields` để build prompt/schema.
3. Khi tick "Chỉ tạo phần còn thiếu", dialog thêm dữ liệu hiện có vào prompt và yêu cầu AI chỉ điền field rỗng.
4. AI trả JSON, parser đọc JSON, sau đó page `onApply` set lại state form.

Lỗi xảy ra ở nhiều lớp nhỏ cộng lại:

- Với product, form đã truyền data SEO nâng cao vào `currentData`, nhưng schema prompt không liệt kê 4 field SEO nâng cao, nên AI bị cấm sinh field đó.
- Với product, `onApply` cũng chưa set 4 state SEO nâng cao, nên kể cả JSON có field thì form vẫn có thể không nhận.
- Với post, 4 field SEO nâng cao đang nằm trong `CORE_FIELDS`, làm prompt/validation luôn coi là bắt buộc thay vì chỉ bật theo module config.
- Với service/course, `onApply` đã biết nhận SEO nâng cao, nhưng prompt/schema chưa đủ spec/map nên AI không được hướng dẫn sinh đúng.
- Với project/resource, form có SEO nâng cao nhưng chưa có AI import dialog.
- Với data module config thật, một số module thiếu record `enableAdvancedSEO` hoặc thiếu các field `focusKeyword/tags/relatedQueries/faqItems`, nên UI không có đủ source-of-truth để bật/tắt nhất quán.

Decision (Quyết định): sửa theo hướng contract-first. `enabledFields` là nguồn quyết định AI import được phép sinh field nào. Prompt, sample, parser, apply và save phải cùng đọc một contract đó.

## 3. Concrete Examples & Analogies

Ví dụ cụ thể từ product hiện tại:

- Product `m1719c67f5wkjepdnc50xgrmex8977t6` có `metaTitle` và `metaDescription`.
- Product này thiếu `focusKeyword`, `tags`, `relatedQueries`, `faqItems`.
- `/system/modules/products` đang bật đủ field SEO nâng cao.
- Nhưng prompt product hiện tại chỉ có schema cho `name`, `slug`, `description/content`, `metaTitle`, `metaDescription`, `image`, `price`, `salePrice`, `stock`.
- AI thấy rule "Không tạo field ngoài schema", nên không sinh SEO nâng cao là hành vi hợp lý.

Analogy (so sánh đời thường):

- Checkbox "Chỉ tạo phần còn thiếu" giống như đưa người phụ việc một danh sách ô trống cần điền.
- Nhưng mình lại đưa mẫu phiếu không có ô "SEO nâng cao".
- Người phụ việc không thể điền đúng ô chưa từng xuất hiện trên phiếu, dù ngoài đời mình biết ô đó đang thiếu.

# II. Audit Summary (Tóm tắt kiểm tra)

## 1. Scope kiểm tra

- Admin entity import: `product`, `post`, `service`, `course`.
- Admin forms có SEO nâng cao: `products`, `posts`, `services`, `projects`, `courses`, `resources`.
- Module config source-of-truth: `lib/modules/configs/*.config.ts`, `moduleFeatures`, `moduleFields`.
- Convex data thật: đọc bằng Convex CLI, không mutate.

## 2. Evidence chính

- `app/admin/components/AiEntityImportDialog.tsx:27`: `AiEntityImportKind` chỉ có `product | service | post | course`.
- `app/admin/components/AiEntityImportDialog.tsx:250-254`: `CORE_FIELDS.post` đang hard-code `focusKeyword`, `relatedQueries`, `tags`, `faqItems`.
- `app/admin/components/AiEntityImportDialog.tsx:394-412`: `buildSchema` chỉ sinh field nếu có trong `OPTIONAL_FIELD_MAP` và có `FIELD_SPECS`.
- `app/admin/components/AiEntityImportDialog.tsx:897-909`: parser chỉ validate bắt buộc SEO nâng cao cho `post`.
- `app/admin/products/create/page.tsx:382-399` và `app/admin/products/[id]/edit/page.tsx:598-616`: product đã truyền SEO nâng cao vào `aiImportCurrentData`.
- `app/admin/products/create/page.tsx:523-613` và `app/admin/products/[id]/edit/page.tsx:671-761`: product `handleApplyAiProduct` chưa set SEO nâng cao.
- `app/admin/services/create/page.tsx:153-156`, `app/admin/services/[id]/edit/page.tsx:231-234`: service đã apply SEO nếu parser nhận được.
- `app/admin/courses/create/page.tsx:225-228`, `app/admin/courses/[id]/edit/page.tsx:426-429`: course đã apply SEO nếu parser nhận được.
- `app/admin/projects/create/page.tsx:111-152` và `app/admin/resources/create/page.tsx:84-136`: project/resource có UI/save SEO nâng cao nhưng chưa có AI import dialog.
- `lib/modules/hooks/useModuleConfig.ts:12-13`, `267-271`: UI module config đã có logic bật/tắt đồng loạt 4 field SEO nâng cao cho 6 module.
- `convex/admin/modules.ts:852-972`: server `toggleModuleFeature` chỉ xử lý `linkedFieldKey`, chưa đảm bảo bật/tắt đồng loạt 4 field SEO nâng cao khi gọi từ server/CLI.

## 3. Convex data thật đã đọc

Product record `m1719c67f5wkjepdnc50xgrmex8977t6`:

- Có: `name`, `slug`, `description`, `image`, `metaTitle`, `metaDescription`, `price`, `stock`, `combos`.
- Thiếu: `focusKeyword`, `tags`, `relatedQueries`, `faqItems`.

Enabled SEO fields hiện tại từ `listEnabledModuleFields`:

- `posts`: `tags`, `metaTitle`, `metaDescription`, `focusKeyword`, `relatedQueries`, `faqItems`.
- `products`: `metaTitle`, `metaDescription`, `focusKeyword`, `tags`, `relatedQueries`, `faqItems`.
- `services`: chỉ có `metaTitle`, `metaDescription`.
- `projects`: chỉ có `metaTitle`, `metaDescription`.
- `courses`: chỉ có `metaTitle`, `metaDescription`.
- `resources`: chỉ có `metaTitle`, `metaDescription`.

Inference (Suy luận): code config định nghĩa SEO nâng cao cho cả 6 module, nhưng dữ liệu `moduleFields/moduleFeatures` thật đang thiếu một phần ở 4 module sau. Đây là data contract drift, không phải chỉ là lỗi prompt.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

High.

Reason (Lý do):

- Có evidence trực tiếp từ code: product schema AI thiếu 4 field SEO nâng cao, trong khi module config và data product cho thấy đây là field hợp lệ.
- Có evidence từ Convex CLI: product cụ thể đang thiếu đúng 4 field này và module `products` đang bật đủ field SEO nâng cao.
- Có evidence từ parser/apply: service/course apply được SEO nhưng prompt không đủ spec; product prompt và apply đều thiếu.
- Có evidence từ module config thật: một số module chưa có record SEO nâng cao dù config source có định nghĩa.

## 2. Trả lời Audit & Root Cause Protocol

1. Triệu chứng quan sát được là gì?
   - Expected: tick "Chỉ tạo phần còn thiếu" trên product có SEO nâng cao bật thì AI sinh JSON chứa `focusKeyword`, `tags`, `relatedQueries`, `faqItems`.
   - Actual: AI không sinh các field này vì schema prompt không có chúng.

2. Phạm vi ảnh hưởng?
   - Product bị lỗi rõ nhất.
   - Service/course có nguy cơ tương tự ở prompt.
   - Post có nguy cơ ngược, prompt/validation bắt buộc SEO nâng cao ngay cả khi config tắt field.
   - Project/resource chưa có AI import dù có form SEO nâng cao.

3. Có tái hiện ổn định không?
   - Có. Chỉ cần product có `enabledFields` chứa SEO nâng cao nhưng product `FIELD_SPECS/OPTIONAL_FIELD_MAP` không chứa 4 field đó, prompt sẽ thiếu field.

4. Mốc thay đổi gần nhất?
   - Không đủ evidence commit trong phạm vi audit này. Dấu hiệu là drift giữa module config, data module config thật và `AiEntityImportDialog`.

5. Dữ liệu nào còn thiếu?
   - Cần kiểm tra sau khi sync module config xem `services/projects/courses/resources` có nên bật SEO nâng cao mặc định theo config hiện tại hay giữ tắt theo dữ liệu cũ.

6. Giả thuyết thay thế hợp lý?
   - AI bên ngoài bỏ sót do chất lượng thấp. Bị loại trừ phần lớn vì prompt đang cấm field ngoài schema.
   - Convex schema không hỗ trợ SEO nâng cao. Bị loại trừ vì `convex/schema.ts` và mutations của nhiều module đã có field SEO nâng cao.
   - Checkbox merge missing bị lỗi. Bị loại trừ phần lớn vì `mergeAiMissingFields` xử lý field rỗng đúng, nhưng field không được sinh từ prompt.

7. Rủi ro nếu fix sai nguyên nhân?
   - Có thể làm AI sinh field khi module đang tắt.
   - Có thể làm form apply field ẩn và save mất tính nhất quán module config.
   - Có thể bật SEO nâng cao cho module thật mà user chưa muốn bật.

8. Tiêu chí pass/fail sau sửa?
   - Pass khi prompt, sample, parser, apply và save đều theo `enabledFields`.
   - Fail nếu prompt vẫn sinh field SEO nâng cao khi module đã tắt, hoặc không sinh khi module bật và field đang thiếu.

## 3. Counter-Hypothesis (Giả thuyết đối chứng)

- Không sửa bằng cách "nhắc AI mạnh hơn" trong prompt product, vì schema vẫn thiếu field.
- Không chỉ sửa product, vì service/course/post có cùng contract drift.
- Không chỉ sync data Convex, vì code prompt/apply vẫn sai.
- Không chỉ sửa frontend dialog, vì server toggle hiện chưa đảm bảo invariant bật/tắt cả 4 field SEO nâng cao nếu gọi từ mutation ngoài UI.

# IV. Proposal (Đề xuất)

## 1. Mục tiêu

Chuẩn hóa AI import để mọi resource dùng cùng nguyên tắc:

- AI chỉ được sinh field có trong module config đang bật.
- SEO nâng cao chỉ xuất hiện trong prompt/schema/sample khi field SEO nâng cao đang enabled.
- Chế độ "Chỉ tạo phần còn thiếu" phải sinh đúng các field đang rỗng, không ghi đè field đã có.
- Apply vào form phải nhận đủ field được phép.
- Save mutation vẫn gate theo `enabledFields` như hiện tại.

## 2. Thiết kế sửa

a) Chuẩn hóa field SEO nâng cao trong AI dialog

- Thêm constant:
  - `ADVANCED_SEO_AI_FIELDS = ['focusKeyword', 'tags', 'relatedQueries', 'faqItems']`.
- Thêm field specs dùng chung cho các kind có SEO nâng cao.
- Bổ sung vào `OPTIONAL_FIELD_MAP` cho `product`, `service`, `course`, `post`, và nếu triển khai parity thì thêm `project`, `resource`.
- Gỡ 4 field SEO nâng cao khỏi `CORE_FIELDS.post`.
- Đảm bảo `buildSchema` vẫn chỉ add field nếu `enabledFields` có field đó.

b) Sửa parser theo `enabledFields`

- Cho `parseAiEntity` nhận thêm `enabledFields?: Iterable<string>`.
- Tính `enabledFieldSet`.
- Chỉ validate SEO nâng cao khi field đó enabled.
- Nếu field SEO nâng cao disabled, parser không ép lỗi và không cần auto-complete.
- Với post, chỉ auto-complete `relatedQueries/tags/faqItems` khi field tương ứng enabled.

c) Sửa product apply

- Trong `handleApplyAiProduct` của create/edit:
  - `if (item.focusKeyword) setFocusKeyword(item.focusKeyword)`
  - `if (item.tags?.length) setTags(normalizeSeoStringList(item.tags))`
  - `if (item.relatedQueries?.length) setRelatedQueries(normalizeSeoStringList(item.relatedQueries))`
  - `if (item.faqItems?.length) setFaqItems(normalizeSeoFaqItems(item.faqItems))`
- Không set field nếu field không enabled, hoặc dựa vào payload đã được filter theo enabledFields trong dialog.

d) Sửa server module toggle invariant

- Trong `convex/admin/modules.ts`, khi `moduleKey` thuộc `posts/products/services/projects/courses/resources` và `featureKey === 'enableAdvancedSEO'`, patch đồng loạt 4 field SEO nâng cao:
  - `focusKeyword`
  - `tags`
  - `relatedQueries`
  - `faqItems`
- Giữ behavior hiện có cho `linkedFieldKey`, nhưng tránh chỉ bật/tắt mỗi `focusKeyword`.

e) Data contract sync tối thiểu

- Dùng mutation sẵn có `admin/modules:syncModuleConfigFromDefinition` cho:
  - `services`
  - `projects`
  - `courses`
  - `resources`
- Mục tiêu: thêm record config còn thiếu từ runtime definition, không reset module, không xóa cấu hình user.
- Sau sync, đọc lại `listModuleFeatures` và `listModuleFields` để verify.
- Nếu môi trường được coi là production-like, bước sync này nên chạy sau khi user duyệt implementation và đã thấy before/after.

f) Parity cho projects/resources

- Vì `project/resource` có UI SEO nâng cao và save gate, có 2 hướng:
  - Full parity (Recommend): thêm `project` và `resource` vào `AiEntityImportKind`, `ENTITY_COPY`, `FIELD_SPECS`, `OPTIONAL_FIELD_MAP`, `KIND_GUIDE`, sample, và mount dialog trong create/edit.
  - Minimal bug fix: chỉ sửa 4 kind đã có AI import, để project/resource ngoài scope.
- Decision trong spec này: chọn Full parity vì user đã nêu rõ danh sách gồm dự án và tài nguyên.

## 3. Output behavior sau sửa

- Product bật SEO nâng cao: prompt fill-missing sẽ có 4 field SEO nâng cao, AI sinh phần còn thiếu.
- Product tắt SEO nâng cao: prompt không có 4 field SEO nâng cao, AI không sinh, parser không ép.
- Post tắt `tags` nhưng bật `focusKeyword`: prompt chỉ có `focusKeyword` nếu đó là field enabled, không ép tags.
- Service/course bật SEO nâng cao: prompt sẽ sinh SEO nâng cao đúng schema.
- Project/resource có AI import parity, nếu triển khai full parity.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. UI / Shared AI import

- Sửa: `app/admin/components/AiEntityImportDialog.tsx`
  - Vai trò hiện tại: component dùng chung để copy prompt, dán JSON AI, preview và apply vào form.
  - Thay đổi: chuẩn hóa Advanced SEO theo `enabledFields`, bổ sung specs/maps/samples, cho parser validate theo field đang bật, thêm kind `project/resource` nếu triển khai full parity.

## 2. Admin products

- Sửa: `app/admin/products/create/page.tsx`
  - Vai trò hiện tại: form tạo sản phẩm, đã truyền SEO nâng cao vào `currentData` nhưng chưa apply từ AI.
  - Thay đổi: apply `focusKeyword`, `tags`, `relatedQueries`, `faqItems` từ AI payload khi field được phép.

- Sửa: `app/admin/products/[id]/edit/page.tsx`
  - Vai trò hiện tại: form sửa sản phẩm, case bug thực tế từ URL user đưa.
  - Thay đổi: apply SEO nâng cao từ AI payload, bảo toàn missing-only merge.

## 3. Admin posts/services/courses

- Sửa gián tiếp: `app/admin/posts/create/page.tsx`, `app/admin/posts/[id]/edit/page.tsx`
  - Vai trò hiện tại: đã dùng AI import và apply SEO nâng cao.
  - Thay đổi: không cần sửa lớn ở page nếu dialog xử lý `enabledFields`, nhưng cần static review để chắc prompt không ép field disabled.

- Sửa gián tiếp: `app/admin/services/create/page.tsx`, `app/admin/services/[id]/edit/page.tsx`
  - Vai trò hiện tại: đã dùng AI import và apply SEO nâng cao nếu payload có field.
  - Thay đổi: chủ yếu hưởng lợi từ dialog specs/maps mới.

- Sửa gián tiếp: `app/admin/courses/create/page.tsx`, `app/admin/courses/[id]/edit/page.tsx`
  - Vai trò hiện tại: đã dùng AI import và apply SEO nâng cao nếu payload có field.
  - Thay đổi: chủ yếu hưởng lợi từ dialog specs/maps mới.

## 4. Admin projects/resources

- Thêm/Sửa: `app/admin/projects/create/page.tsx`, `app/admin/projects/[id]/edit/page.tsx`
  - Vai trò hiện tại: có form SEO nâng cao và save gate, chưa có AI import.
  - Thay đổi: thêm `AiEntityImportDialog kind="project"` cùng `aiImportCurrentData` và `handleApplyAiProject`.

- Thêm/Sửa: `app/admin/resources/create/page.tsx`, `app/admin/resources/[id]/edit/page.tsx`
  - Vai trò hiện tại: có form SEO nâng cao và save gate, chưa có AI import.
  - Thay đổi: thêm `AiEntityImportDialog kind="resource"` cùng `aiImportCurrentData` và `handleApplyAiResource`.

## 5. Convex / System modules

- Sửa: `convex/admin/modules.ts`
  - Vai trò hiện tại: mutation toggle feature/field/module settings.
  - Thay đổi: đảm bảo `enableAdvancedSEO` bật/tắt đồng bộ cả 4 field SEO nâng cao ở server.

- Data ops có kiểm soát: `admin/modules:syncModuleConfigFromDefinition`
  - Vai trò hiện tại: mutation sẵn có để sync runtime definition vào `moduleFeatures/moduleFields/moduleSettings`.
  - Thay đổi: không sửa code, chỉ dùng để thêm missing config records cho module drift nếu được duyệt.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại vùng liên quan trong `AiEntityImportDialog.tsx` trước khi sửa.
2. Thêm constants/helper cho Advanced SEO field specs và field gating.
3. Sửa `CORE_FIELDS`, `OPTIONAL_FIELD_MAP`, `FIELD_SPECS`, sample và guide để không drift giữa kind.
4. Sửa `parseAiEntity` nhận `enabledFields`, validate/autocomplete SEO theo enabled field.
5. Sửa call `parseAiEntity(...)` trong dialog để truyền `enabledFieldList`.
6. Sửa product create/edit apply SEO nâng cao.
7. Thêm project/resource kind và mount dialog nếu triển khai full parity.
8. Sửa `convex/admin/modules.ts` server toggle invariant.
9. Chạy read-only Convex check trước sync:
   - `listModuleFeatures`
   - `listModuleFields`
   - `listEnabledModuleFields`
10. Nếu được duyệt data sync, chạy `syncModuleConfigFromDefinition` theo từng module thiếu config.
11. Verify lại prompt behavior bằng static review:
   - SEO bật: schema có fields.
   - SEO tắt: schema không có fields.
   - Fill missing: current data copy nguyên field đã có.
12. Chạy typecheck theo quy định repo nếu sau này code được triển khai.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## 1. Static verification (bắt buộc)

- Kiểm tra `FIELD_SPECS[kind]` có đủ spec cho mọi field mà `OPTIONAL_FIELD_MAP[kind]` trỏ tới.
- Kiểm tra `CORE_FIELDS.post` không còn hard-code SEO nâng cao.
- Kiểm tra parser chỉ validate field SEO nâng cao khi field enabled.
- Kiểm tra product create/edit có apply đủ 4 field SEO nâng cao.
- Kiểm tra project/resource nếu thêm dialog thì có:
  - `currentData`
  - `handleApplyAi...`
  - `enabledFields`
  - `onApply`
  - save vẫn gate theo enabled fields.

## 2. Convex verification (read-before-write, verify-after-write)

Trước data sync:

- Đọc `getModuleFeature` cho `enableAdvancedSEO`.
- Đọc `listModuleFields` cho 4 field SEO nâng cao.
- Đọc `listEnabledModuleFields`.

Sau data sync nếu chạy:

- Đọc lại cùng 3 surface trên.
- Kỳ vọng các missing records xuất hiện.
- Không dùng `resetModuleConfig` vì reset có rủi ro mất cấu hình user.

## 3. Manual UI verification

Case product bug gốc:

1. Mở `/admin/products/m1719c67f5wkjepdnc50xgrmex8977t6/edit`.
2. Mở "Nhập sản phẩm bằng AI".
3. Tick "Chỉ tạo phần còn thiếu".
4. Copy prompt.
5. Kỳ vọng schema prompt có `focusKeyword`, `tags`, `relatedQueries`, `faqItems` nếu `/system/modules/products` bật SEO nâng cao.
6. Dán JSON có 4 field này.
7. Apply.
8. Kỳ vọng tab SEO nâng cao được điền, field cũ không bị ghi đè.

Case disabled field:

1. Tắt `enableAdvancedSEO` hoặc tắt từng field SEO nâng cao.
2. Mở AI import.
3. Kỳ vọng prompt không có field disabled.
4. JSON chứa field disabled không làm form/save phụ thuộc field đó.

## 4. Typecheck

Sau khi code được triển khai:

```powershell
bunx tsc --noEmit 2>&1 | Select-Object -First 10
```

Không chạy lint/unit/build nếu không được yêu cầu, theo rule repo.

## 5. Gate matrix

| Gate | Critical? | Pass condition |
|---|---:|---|
| Prompt theo `enabledFields` | Yes | SEO nâng cao chỉ xuất hiện khi field enabled |
| Product apply đủ SEO nâng cao | Yes | Apply JSON điền được 4 field vào form |
| Post không ép SEO disabled | Yes | Post prompt/validation không bắt field đã tắt |
| Service/course prompt có SEO khi bật | Yes | Schema có đủ 4 field khi enabled |
| Server toggle invariant | Yes | `enableAdvancedSEO` patch đồng loạt 4 field |
| Project/resource AI import parity | Non-critical nếu tách phase | Có dialog và apply nếu chọn full parity |
| Data config sync | Critical nếu UI đang thiếu field | Missing records được thêm bằng sync, không reset |

# VIII. Todo

1. [ ] Sửa `AiEntityImportDialog` để Advanced SEO theo `enabledFields`.
2. [ ] Bổ sung specs/maps/samples cho product/service/course/post và project/resource nếu full parity.
3. [ ] Sửa parser nhận `enabledFields` và validate có điều kiện.
4. [ ] Sửa product create/edit apply SEO nâng cao.
5. [ ] Thêm AI import cho project/resource nếu triển khai full parity.
6. [ ] Sửa server `toggleModuleFeature` đồng bộ 4 field SEO nâng cao.
7. [ ] Đọc trước module config thật cho 6 module.
8. [ ] Sync missing module config bằng `syncModuleConfigFromDefinition` nếu được duyệt.
9. [ ] Verify prompt/schema/apply/save bằng static review và manual UI checklist.
10. [ ] Chạy typecheck sau code.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Product đang bật SEO nâng cao sẽ copy prompt có đủ:
  - `focusKeyword`
  - `tags`
  - `relatedQueries`
  - `faqItems`
- Product `Chỉ tạo phần còn thiếu` sinh và apply được 4 field đang rỗng, không ghi đè `name`, `description`, `metaTitle`, `metaDescription` đã có.
- Nếu `/system/modules/products` tắt SEO nâng cao, product AI import không yêu cầu 4 field SEO nâng cao.
- Post không còn bắt buộc SEO nâng cao khi field tương ứng disabled.
- Service/course prompt sinh SEO nâng cao khi field tương ứng enabled.
- Project/resource có AI import parity nếu chọn full parity trong implementation.
- Server toggle `enableAdvancedSEO` bật/tắt đồng bộ 4 field SEO nâng cao, không chỉ `focusKeyword`.
- Data config thật không còn thiếu record field/feature cho module cần dùng AI SEO nâng cao sau sync.
- Không dùng reset module config diện rộng.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

## 1. Risks (Rủi ro)

- Parser thay đổi có thể làm JSON cũ bị xử lý khác nếu filter field quá mạnh.
- Thêm project/resource kind có thể tăng scope và phát sinh type errors nếu payload thiếu field đặc thù.
- Data sync module config có thể làm field SEO nâng cao xuất hiện ở UI các module trước đây đang thiếu record.
- Server toggle thay đổi có thể ảnh hưởng thao tác bật/tắt module feature từ nơi khác ngoài `/system/modules`.

## 2. Mitigation (Giảm rủi ro)

- Giữ thay đổi nhỏ, không refactor layout/form không liên quan.
- Không reset module config.
- Sync missing config bằng mutation sẵn có, từng module, có read-before-write và verify-after-write.
- Với parser, chỉ thêm điều kiện enabled field, không đổi logic parse chung.
- Với project/resource, nếu phát sinh scope lớn thì tách phase sau, không block bug fix product/post/service/course.

## 3. Rollback (Hoàn tác)

- Code rollback: revert các file touched trong patch.
- Data rollback nếu sync thêm config record không mong muốn:
  - Tắt `enableAdvancedSEO` trong `/system/modules/[module]`.
  - Hoặc patch `moduleFields.enabled=false` cho 4 field SEO nâng cao bằng mutation hiện có.
  - Không xóa data entity SEO đã nhập nếu không có yêu cầu riêng.

# XI. Out of Scope (Ngoài phạm vi)

- Không sinh nội dung SEO thật cho product hiện tại trong spec này.
- Không sửa layout/filter/search của các experience "Danh sách bài viết/dịch vụ/dự án/khóa học/tài nguyên/sản phẩm".
- Không refactor toàn bộ admin forms.
- Không thay đổi Convex schema entity nếu schema hiện đã có field SEO nâng cao.
- Không chạy seed/reset module config diện rộng.
- Không chạy lint/unit/build trong bước spec.
