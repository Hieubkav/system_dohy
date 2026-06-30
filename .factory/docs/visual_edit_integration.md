# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Muốn người dùng có thể click chuột trực tiếp vào các phần chữ (tiêu đề, mô tả, nhãn nút...) trên màn hình Preview (Xem trước) để chỉnh sửa chữ ngay tại chỗ (inline WYSIWYG) thay vì phải tìm ô nhập liệu ở form bên trái.
*   **Giải pháp:** 
    1.  Lấy cấu hình hệ thống từ Convex xem tính năng sửa trực quan cho loại component đó có được bật không (`isVisualEditAllowed`).
    2.  Truyền cờ này và các hàm callback khi text thay đổi từ trang Edit/Create xuống Preview component.
    3.  Ở Preview component, hiển thị một thanh công cụ màu xanh để bật/tắt chế độ sửa trực quan.
    4.  Nếu đang bật chế độ sửa trực quan, cho phép các element text có thuộc tính `contentEditable` và gán viền đứt nét màu xanh dương. Khi click ra ngoài (`onBlur`), gọi callback để cập nhật lại state của form.

## 2. Elaboration & Self-Explanation
Chúng ta có 13 home components cần tích hợp sửa trực quan.
Để hoạt động mượt mà, ta phải đồng bộ hóa state giữa Preview và Form. Khi người dùng sửa text trực quan trên Preview, sự thay đổi này cần lập tức đồng bộ về state của Form (chẳng hạn như mảng items) và không làm mất tiêu điểm (focus) hay làm giật lag giao diện. Để tránh mất focus, khi cập nhật mảng items, ta cần đảm bảo giữ nguyên thuộc tính `id` (React key) của phần tử đó trong mảng state, thay vì tạo mới ngẫu nhiên hay để React render lại toàn bộ danh sách.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể:** Trong component FAQ, mảng FAQ items có các câu hỏi và câu trả lời.
    *   Form giữ state: `const [faqItems, setFaqItems] = useState([{ id: "faq-0", question: "Câu hỏi 1", answer: "Trả lời 1" }])`.
    *   Preview hiển thị các câu hỏi này. Khi bật chế độ sửa trực quan, người dùng click vào "Câu hỏi 1" và gõ "Câu hỏi 1 đã cập nhật".
    *   Sự kiện `onBlur` được kích hoạt, callback gửi text mới lên Form:
        ```typescript
        onItemsChange={(nextItems) => {
          setFaqItems(nextItems.map((item, idx) => ({
            id: faqItems[idx]?.id ?? `faq-${idx}`,
            question: item.question,
            answer: item.answer,
          })));
        }}
        ```
    *   Nhờ giữ nguyên `id: faqItems[idx]?.id`, React biết đây là phần tử cũ và chỉ cập nhật DOM text của node đó chứ không huỷ phần tử cũ đi tạo lại, giúp tránh giật lag hoặc mất focus.

---

# II. Audit Summary (Tóm tắt kiểm tra)
Hiện tại, Stats component đã được tích hợp sửa trực quan thành công và hoạt động ổn định. Các component còn lại chưa được cập nhật cấu hình hệ thống Convex và các thuộc tính tương ứng trên Preview/SectionShared.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc:** Tính năng sửa trực quan chưa được kết nối và triển khai trên 13 components còn lại.
*   **Giả thuyết đối chứng:** Nếu chỉ bật `contentEditable` ở Preview mà không đồng bộ callback hoặc không giữ React key (`id`), form sẽ không cập nhật được dữ liệu khi lưu hoặc UI sẽ bị giật lag/mất focus liên tục khi người dùng gõ.

---

# IV. Proposal (Đề xuất)
Tích hợp tính năng sửa trực quan cho từng component trong số 13 component:
1.  Đọc file Edit page, Create page, Preview, SectionShared.
2.  Bổ sung query Convex `homeComponentSystemConfig.getConfig` để lấy `isVisualEditAllowed`.
3.  Truyền `isVisualEditAllowed` cùng các callbacks (`onTitleChange`, `onSubtitleChange`, `onBadgeTextChange`, `onItemsChange`) xuống Preview.
4.  Tại Preview, khai báo state `visualEditEnabled`, đồng bộ nó với `isVisualEditAllowed`.
5.  Hiển thị thanh bật/tắt chế độ sửa trực quan ở đầu Preview wrapper.
6.  Nếu component Preview delegate phần hiển thị sang `SectionShared` component, truyền tiếp các cờ và callback xuống `SectionShared`.
7.  Thêm các thuộc tính `contentEditable={isVisualEditActive}`, `suppressContentEditableWarning`, `onBlur`, và class CSS viền đứt nét màu xanh dương vào các text element tương ứng.
8.  Vô hiệu hoá animation hoặc auto-scroll khi sửa trực quan để tránh giật lag.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
Dưới đây là danh sách các tệp dự kiến sẽ được chỉnh sửa (nhóm theo component):

### 1. Testimonials
*   `app/admin/home-components/create/testimonials/page.tsx`
*   `app/admin/home-components/testimonials/[id]/edit/page.tsx`
*   `app/admin/home-components/testimonials/_components/TestimonialsPreview.tsx`
*   `app/admin/home-components/testimonials/_components/TestimonialsSectionShared.tsx`

### 2. Pricing
*   `app/admin/home-components/create/pricing/page.tsx`
*   `app/admin/home-components/pricing/[id]/edit/page.tsx`
*   `app/admin/home-components/pricing/_components/PricingPreview.tsx`
*   `app/admin/home-components/pricing/_components/PricingSectionShared.tsx`

### 3. Process
*   `app/admin/home-components/create/process/page.tsx`
*   `app/admin/home-components/process/[id]/edit/page.tsx`
*   `app/admin/home-components/process/_components/ProcessPreview.tsx`
*   `app/admin/home-components/process/_components/ProcessSectionShared.tsx`

### 4. FAQ
*   `app/admin/home-components/create/faq/page.tsx`
*   `app/admin/home-components/faq/[id]/edit/page.tsx`
*   `app/admin/home-components/faq/_components/FaqPreview.tsx`
*   `app/admin/home-components/faq/_components/FaqSectionShared.tsx`

### 5. Team
*   `app/admin/home-components/create/team/page.tsx`
*   `app/admin/home-components/team/[id]/edit/page.tsx`
*   `app/admin/home-components/team/_components/TeamPreview.tsx`
*   `app/admin/home-components/team/_components/TeamSectionShared.tsx`

### 6. Gallery
*   `app/admin/home-components/create/gallery/page.tsx`
*   `app/admin/home-components/gallery/[id]/edit/page.tsx`
*   `app/admin/home-components/gallery/_components/GalleryPreview.tsx`

### 7. Countdown
*   `app/admin/home-components/create/countdown/page.tsx`
*   `app/admin/home-components/countdown/[id]/edit/page.tsx`
*   `app/admin/home-components/countdown/_components/CountdownPreview.tsx`
*   `app/admin/home-components/countdown/_components/CountdownSectionShared.tsx`

### 8. VoucherPromotions
*   `app/admin/home-components/create/voucher-promotions/page.tsx`
*   `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx`
*   `app/admin/home-components/voucher-promotions/_components/VoucherPromotionsPreview.tsx`
*   `app/admin/home-components/voucher-promotions/_components/VoucherPromotionsSectionShared.tsx`

### 9. Popup
*   `app/admin/home-components/create/popup/page.tsx`
*   `app/admin/home-components/popup/[id]/edit/page.tsx`
*   `app/admin/home-components/popup/_components/PopupPreview.tsx`
*   `app/admin/home-components/popup/_components/PopupSectionShared.tsx`

### 10. Video
*   `app/admin/home-components/create/video/page.tsx`
*   `app/admin/home-components/video/[id]/edit/page.tsx`
*   `app/admin/home-components/video/_components/VideoPreview.tsx`
*   `app/admin/home-components/video/_components/VideoSectionShared.tsx`

### 11. Career
*   `app/admin/home-components/create/career/page.tsx`
*   `app/admin/home-components/career/[id]/edit/page.tsx`
*   `app/admin/home-components/career/_components/CareerPreview.tsx`
*   `app/admin/home-components/career/_components/CareerSectionShared.tsx`

### 12. Footer
*   `app/admin/home-components/create/footer/page.tsx`
*   `app/admin/home-components/footer/[id]/edit/page.tsx`
*   `app/admin/home-components/footer/_components/FooterPreview.tsx`

### 13. SpeedDial
*   `app/admin/home-components/create/speed-dial/page.tsx`
*   `app/admin/home-components/speed-dial/[id]/edit/page.tsx`
*   `app/admin/home-components/speed-dial/_components/SpeedDialPreview.tsx`
*   `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`

---

# VI. Execution Preview (Xem trước thực thi)
1.  **Chỉnh sửa Testimonials** -> edit page, create page, Preview, SectionShared -> Run `bunx tsc --noEmit`.
2.  **Chỉnh sửa Pricing** -> edit page, create page, Preview, SectionShared -> Run `bunx tsc --noEmit`.
3.  ... Thực hiện tuần tự cho đến hết 13 components.
4.  Phát ra âm thanh thông báo hoàn thành task: `powershell -c "(New-Object -ComObject SAPI.SpVoice).Speak('Done, Sir.')"`.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
Sau khi chỉnh sửa xong mỗi component, chạy kiểm tra kiểu dữ liệu TypeScript bằng:
`bunx tsc --noEmit`
Đảm bảo dự án không gặp bất kỳ lỗi compile nào.

---

# VIII. Todo
*   [ ] Testimonials
*   [ ] Pricing
*   [ ] Process
*   [ ] FAQ
*   [ ] Team
*   [ ] Gallery
*   [ ] Countdown
*   [ ] VoucherPromotions
*   [ ] Popup
*   [ ] Video
*   [ ] Career
*   [ ] Footer
*   [ ] SpeedDial

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   Tất cả các component chỉnh sửa đều compile thành công.
*   Chế độ sửa trực quan (visual edit) hoạt động đúng logic, không bị mất React key khi cập nhật mảng.
*   Hiển thị đúng panel hướng dẫn/nút bật tắt sửa trực quan tại Preview.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   **Rủi ro:** Sửa nhầm kiểu dữ liệu hoặc làm sai cú pháp JSX gây lỗi render.
*   **Hoàn tác:** Sử dụng Git để checkout hoặc revert các thay đổi của component gặp lỗi.

---

# XI. Out of Scope (Ngoài phạm vi)
*   Thay đổi cơ chế lưu trữ của Convex hoặc thay đổi schema DB.
*   Tạo mới hoàn toàn các UI hoặc component khác ngoài 13 component trên.
