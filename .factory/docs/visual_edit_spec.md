# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta sẽ thêm tính năng "sửa trực quan" (visual edit / inline WYSIWYG) cho 5 component: Hero, CTA, About, Contact và Marquee.
- **Từ Backend xuống Frontend:** Lấy cấu hình `typeVisualEditOverrides` từ Convex để xem hệ thống có cho phép sửa trực quan không (`isVisualEditAllowed`).
- **Nút bật/tắt ở Preview:** Trên đầu khu vực Preview, hiển thị 1 banner/nút để Bật/Tắt sửa trực quan.
- **Tác động trực tiếp lên chữ (Inline Edit):** Khi bật, các đoạn chữ (tiêu đề, mô tả, nút, badge...) sẽ được thêm thuộc tính `contentEditable={true}` cùng với viền nét đứt màu xanh dương để người dùng gõ trực tiếp lên Preview.
- **Đồng bộ hóa tức thì (State Sync):** Khi người dùng gõ xong và click ra ngoài (sự kiện `onBlur`), dữ liệu mới sẽ được ghi nhận vào Form State để sẵn sàng lưu.

## 2. Elaboration & Self-Explanation
Tính năng sửa trực quan giúp người quản trị website chỉnh sửa giao diện một cách trực quan, sinh động hơn thay vì chỉ nhập liệu khô khan qua các ô input trong form.
Khi người dùng truy cập trang Create hoặc Edit của các component này:
1. Hệ thống gửi query đến Convex lấy cấu hình hệ thống: `getConfig`.
2. Lấy ra cờ `isVisualEditAllowed = config?.typeVisualEditOverrides?.[COMPONENT_TYPE]?.enabled ?? true`.
3. Cờ này được truyền vào Preview component của từng loại (ví dụ: `HeroPreview`, `CTAPreview`, v.v.).
4. Trong Preview component, chúng ta duy trì một state cục bộ `visualEditEnabled`. Khi cờ hệ thống chuyển thành `false`, ta tắt ngay sửa trực quan. Cờ kích hoạt thực tế sẽ là `isVisualEditActive = isVisualEditAllowed && visualEditEnabled`.
5. Khi `isVisualEditActive` là `true`, các thẻ chứa nội dung chữ sẽ có thuộc tính `contentEditable={true}` và các class CSS làm nổi bật viền nét đứt.
6. Mỗi khi người dùng chỉnh sửa xong một vùng chữ và chuyển focus đi nơi khác (`onBlur`), ta lấy giá trị `e.currentTarget.textContent` để cập nhật ngược lại form state của trang cha (Create/Edit).

## 3. Concrete Examples & Analogies
Hãy tưởng tượng form nhập liệu truyền thống giống như việc bạn viết một bức thư bằng cách điền thông tin vào các ô trống trên một tờ khai (Họ tên, Địa chỉ, Lời nhắn). Sửa trực quan (inline WYSIWYG) giống như việc bạn viết trực tiếp lên chính bức thư thật, bạn thấy ngay nét chữ, màu giấy và căn lề hiển thị thế nào.
Ví dụ cụ thể với thẻ tiêu đề trong CTA:
```tsx
<h3
  contentEditable={isVisualEditActive}
  suppressContentEditableWarning={isVisualEditActive}
  onBlur={(e) => handleTextChange('title', e.currentTarget.textContent ?? '')}
  className={cn(
    isVisualEditActive && 'outline-dashed outline-1 outline-blue-500 hover:bg-blue-50/50 cursor-text select-text'
  )}
>
  {displayTitle}
</h3>
```

---

# II. Audit Summary (Tóm tắt kiểm tra)

Sau khi kiểm tra mã nguồn hiện tại, chúng ta có các phát hiện sau:
- **Stats component** là mẫu chuẩn (Reference pattern). Nó đã được cài đặt hoàn tất các tính năng này và hoạt động ổn định.
- **Hero:** Gồm `HeroEditor` dùng chung cho Edit page, còn Create page viết trực tiếp. Cả hai đều render `HeroPreview`. Chúng ta cần cập nhật `HeroPreview` để hỗ trợ sửa trực quan cho các phần text nội dung slide (`heading`, `description`, `badge`, `primaryButtonText`, `secondaryButtonText`, `countdownText`).
- **CTA:** Sử dụng `CTAPreview` và `CTASectionShared`. Dữ liệu text chỉnh sửa sẽ cập nhật thông qua `onConfigChange` của `CTAPreview`.
- **About:** Tương tự CTA, sử dụng `AboutPreview` và `AboutSectionShared`. Dữ liệu sẽ đồng bộ thông qua `onConfigChange`. Các phần text gồm `subHeading`, `heading`, `highlightText`, `description`, `phone`, `buttonText` và tiêu đề của các `features`.
- **Contact:** Dùng `ContactPreview` và `ContactSectionShared`. Dữ liệu sẽ đồng bộ qua `onConfigChange`. Gồm các tiêu đề/mô tả của form, badge, tiêu đề liên hệ, nhãn và giá trị của các `contactItems`.
- **Marquee:** Dùng `MarqueePreview` và `MarqueeSectionShared`. Điểm đặc biệt: Khi đang sửa trực quan, ta cần dừng chuyển động chạy chữ (animation) và chỉ hiển thị danh sách các item một lần duy nhất để người dùng dễ click vào sửa mà không bị trượt mất focus.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*Tài liệu này hướng tới việc tích hợp tính năng mới, không phải sửa lỗi (bug).*
Quyết định thiết kế chính:
- Sử dụng callback đồng bộ cấu hình tổng quát như `onConfigChange` đối với các component dùng cấu hình phức tạp (CTA, About, Contact) thay vì viết quá nhiều callback riêng lẻ. Việc này giúp code ngắn gọn, giảm thiểu N+1 prop-drilling và dễ bảo trì (tuân thủ nguyên tắc YAGNI & KISS).

---

# IV. Proposal (Đề xuất)

1. **Truy vấn Convex Query trong các trang Create/Edit:**
   Query `getConfig` của `api.homeComponentSystemConfig` để lấy `isVisualEditAllowed`.
   Ví dụ trong `HeroCreatePage`:
   ```tsx
   const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
   const isVisualEditAllowed = systemConfig?.typeVisualEditOverrides?.['Hero']?.enabled ?? true;
   ```
2. **Thêm UI Bật/Tắt sửa trực quan trong Preview:**
   Trong tất cả 5 Preview component, thêm panel điều khiển sửa trực quan trên đầu giống hệt mẫu ở `StatsPreview.tsx`.
3. **Cập nhật các Preview / SectionShared components:**
   - Cung cấp props `isVisualEditAllowed`, `onConfigChange` (hoặc các callbacks tương ứng).
   - Thêm các thuộc tính `contentEditable`, `suppressContentEditableWarning`, `onBlur`, và CSS class viền xanh nét đứt cho các phần tử text.
   - Đặc biệt với `Marquee`: Khi `isVisualEditActive = true`, tắt animation chạy chữ và không lặp lại segments để hiển thị tĩnh danh sách items cho việc sửa đổi.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. Hero Banner Component
- **Sửa:** `app/admin/home-components/hero/[id]/edit/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` vào `HeroEditor`.
- **Sửa:** `app/admin/home-components/create/hero/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onContentChange` vào `HeroPreview`.
- **Sửa:** `app/admin/home-components/hero/_components/HeroEditor.tsx`
  - *Sửa:* Thêm prop `isVisualEditAllowed`, truyền xuống `HeroPreview` cùng callback `onContentChange={setHeroContent}`.
- **Sửa:** `app/admin/home-components/hero/_components/HeroPreview.tsx`
  - *Sửa:* Bổ sung nút bật/tắt sửa trực quan, áp dụng sửa trực quan cho các trường text trong slide.

### 2. CTA (Call To Action) Component
- **Sửa:** `app/admin/home-components/cta/[id]/edit/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onConfigChange={setCtaConfig}` vào `CTAPreview`.
- **Sửa:** `app/admin/home-components/create/cta/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onConfigChange={setCtaConfig}` vào `CTAPreview`.
- **Sửa:** `app/admin/home-components/cta/_components/CTAPreview.tsx`
  - *Sửa:* Nhận `isVisualEditAllowed`, `onConfigChange`, render panel bật tắt, truyền `isVisualEditActive` và `onConfigChange` vào `CTASectionShared`.
- **Sửa:** `app/admin/home-components/cta/_components/CTASectionShared.tsx`
  - *Sửa:* Triển khai `contentEditable` và cập nhật `onConfigChange` cho badge, title, description, buttons.

### 3. About (Về chúng tôi) Component
- **Sửa:** `app/admin/home-components/about/[id]/edit/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onConfigChange` vào `AboutPreview`.
- **Sửa:** `app/admin/home-components/create/about/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onConfigChange` vào `AboutPreview`.
- **Sửa:** `app/admin/home-components/about/_components/AboutPreview.tsx`
  - *Sửa:* Nhận `isVisualEditAllowed`, `onConfigChange`, hiển thị panel điều khiển, truyền xuống `AboutSectionShared`.
- **Sửa:** `app/admin/home-components/about/_components/AboutSectionShared.tsx`
  - *Sửa:* Triển khai `contentEditable` cho subHeading, heading, highlightText, description, phone, buttonText, features title, và stats.

### 4. Contact (Liên hệ) Component
- **Sửa:** `app/admin/home-components/contact/[id]/edit/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onConfigChange={setConfig}` vào `ContactPreview`.
- **Sửa:** `app/admin/home-components/create/contact/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onConfigChange={setConfig}` vào `ContactPreview`.
- **Sửa:** `app/admin/home-components/contact/_components/ContactPreview.tsx`
  - *Sửa:* Nhận `isVisualEditAllowed`, `onConfigChange`, hiển thị panel điều khiển, truyền xuống `ContactSectionShared`.
- **Sửa:** `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
  - *Sửa:* Triển khai `contentEditable` cho header, form texts, contact items labels/values.

### 5. Marquee (Chạy chữ) Component
- **Sửa:** `app/admin/home-components/marquee/[id]/edit/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onItemsChange` vào `MarqueePreview`.
- **Sửa:** `app/admin/home-components/create/marquee/page.tsx`
  - *Sửa:* Query Convex systemConfig, truyền `isVisualEditAllowed` và `onItemsChange` vào `MarqueePreview`.
- **Sửa:** `app/admin/home-components/marquee/_components/MarqueePreview.tsx`
  - *Sửa:* Nhận `isVisualEditAllowed`, `onItemsChange`, hiển thị panel điều khiển, truyền xuống `MarqueeSectionShared`.
- **Sửa:** `app/admin/home-components/marquee/_components/MarqueeSectionShared.tsx`
  - *Sửa:* Triển khai tĩnh hóa (pause animation + no repeats) và `contentEditable` cho từng item chạy chữ khi bật chế độ sửa trực quan.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa đổi các file của component **Hero** (Create, Edit, Editor, Preview).
2. Chạy `bunx tsc --noEmit` để verify TypeScript cho Hero.
3. Lặp lại tương tự cho **CTA**.
4. Lặp lại tương tự cho **About**.
5. Lặp lại tương tự cho **Contact**.
6. Lặp lại tương tự cho **Marquee**.
7. Chạy typecheck toàn dự án.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Type checking:** Chạy `bunx tsc --noEmit` sau mỗi bước thay đổi của từng component và sửa hết mọi lỗi kiểu dữ liệu.

---

# VIII. Todo

- [ ] Cập nhật Hero Component
- [ ] Cập nhật CTA Component
- [ ] Cập nhật About Component
- [ ] Cập nhật Contact Component
- [ ] Cập nhật Marquee Component
- [ ] Xác nhận biên dịch TypeScript thành công hoàn toàn

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Tất cả các component chỉnh sửa đều hiển thị panel bật/tắt sửa trực quan ở đầu Preview nếu hệ thống cho phép (`isVisualEditAllowed === true`).
- Khi bật sửa trực quan, các phần text có thể click vào gõ trực tiếp, viền xanh nét đứt hiển thị bao quanh.
- Khi gõ xong và click ra ngoài (Blur), thông tin được đồng bộ chính xác lên trang cha (thay đổi giá trị các ô input tương ứng trong Form và báo Unsaved Changes).
- Không có bất kỳ lỗi TypeScript nào trong các file bị thay đổi.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- *Rủi ro:* Mất trạng thái focus hoặc vị trí con trỏ chuột khi đang gõ.
- *Giải pháp:* Sử dụng `onBlur` thay vì `onChange` để đồng bộ dữ liệu. Việc này giữ cho component không bị render liên tục khi người dùng đang gõ phím, tránh mất con trỏ chuột.

---

# XI. Out of Scope (Ngoài phạm vi)

- Chỉnh sửa cơ sở dữ liệu Convex, cập nhật các mutation/query.
- Tự tạo thêm các layout hoặc thay đổi giao diện thiết kế gốc ngoài việc tích hợp visual edit.
