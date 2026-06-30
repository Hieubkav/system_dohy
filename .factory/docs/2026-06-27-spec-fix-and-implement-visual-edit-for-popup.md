# I. Primer

## 1. TL;DR kiểu Feynman
Popup trong hệ thống admin hiện tại đang gặp 2 vấn đề lớn:
1. Khi admin bấm đóng Popup (hoặc click ra ngoài vùng Popup), state hiển thị của nó bị đặt về `false` và Popup biến mất vĩnh viễn trong màn hình preview. Muốn hiện lại, admin phải reload trang hoặc thay đổi một trường thông tin bất kỳ để buộc reload. Ta cần có một nút "Hiện lại Popup" trong chế độ preview.
2. Popup chưa được tích hợp tính năng sửa trực quan (Visual Edit) như các component khác. Ta cần thêm cờ cấu hình từ Convex backend, nối các callback cập nhật dữ liệu và bọc các trường văn bản của Popup trong component `EditableText` để admin có thể gõ trực tiếp lên giao diện Preview để sửa đổi.

## 2. Elaboration & Self-Explanation
Popup là một component đặc thù vì nó thường che phủ toàn bộ màn hình (overlay) hoặc chiếm các vị trí cố định. Ở môi trường preview, việc đóng popup không nên làm mất giao diện xem trước mãi mãi mà cần cung cấp phương thức để khôi phục (nút "Hiện lại Popup Preview"). Đồng thời, để mang lại trải nghiệm WYSIWYG đồng bộ trên toàn bộ 28+ home-components, Popup cần hỗ trợ `isVisualEditActive` và `isVisualEditAllowed` để cho phép bật/tắt chế độ sửa trực quan ngay tại chỗ.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Khi admin chỉnh sửa popup tại link `http://localhost:3000/admin/home-components/create/popup`, nếu admin click nút đóng popup (X), popup sẽ ẩn đi. Ở chế độ preview, thay vì biến mất và để lại một khoảng trắng, một hộp thoại mờ sẽ hiện lên với nút "Hiện lại Popup Preview". Khi click nút này, popup sẽ mở lại giúp admin có thể tiếp tục xem và chỉnh sửa mà không cần refresh.
- **Analogy:** Việc này giống như khi bạn thử đồ trong phòng thử đồ. Khi bạn cởi đồ ra, phòng thử đồ vẫn ở đó và có một chiếc móc treo để bạn dễ dàng treo quần áo lên thử lại, chứ phòng thử đồ không tự biến mất.

# II. Audit Summary (Tóm tắt kiểm tra)
- File `PopupSectionShared.tsx` quản lý vòng đời hiển thị của popup thông qua state `visible`. Ở chế độ `context === 'preview'`, state `visible` được khởi tạo bằng `true`. Nhưng khi đóng, state này chuyển thành `false` và return `null`, che giấu toàn bộ component preview.
- Các file `PopupPreview.tsx`, `PopupSectionShared.tsx`, `create/popup/page.tsx` và `[id]/edit/page.tsx` chưa nhận prop và xử lý cập nhật dữ liệu qua visual edit.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:**
  1. Thiếu nút khôi phục hiển thị cho preview khi `visible === false`.
  2. Bỏ sót tích hợp WYSIWYG cho Popup trong Batch 4 (thiếu wireup cờ cấu hình và callbacks).
- **Giả thuyết đối chứng:** Nếu ta reset `visible = true` mỗi khi config thay đổi thì popup cũng hiện lại, nhưng nếu người dùng không thay đổi config (chỉ muốn xem lại) thì không có cách nào kích hoạt. Do đó, giải pháp hiển thị nút "Hiện lại Popup Preview" trực tiếp trên UI mock là tối ưu và trực quan nhất.

# IV. Proposal (Đề xuất)
1. **Định nghĩa `EditableText`** trong `PopupSectionShared.tsx` để hỗ trợ inline edit các trường text của popup: `eyebrow`, `heading`, `description`, `note`, `primaryButtonText`, `secondaryButtonText`.
2. **Cập nhật `PopupRuntime`** để nhận prop `isVisualEditActive` và `onConfigChange`. Nếu `visible` bằng `false` ở preview mode, render một nút "Hiện lại Popup Preview" thay vì return `null`.
3. **Cập nhật `PopupPreview`** để nhận và truyền các prop `isVisualEditActive` và `onConfigChange` xuống `PopupSectionShared`.
4. **Cập nhật trang Create/Edit của Popup** để:
   - Query config hệ thống để lấy cờ `isVisualEditAllowed`.
   - Khai báo state `visualEditActive` và truyền xuống `PopupPreview`.
   - Thêm thanh điều khiển visual edit panel.
   - Truyền state và callback cập nhật dữ liệu xuống `PopupPreview`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [PopupSectionShared.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/popup/_components/PopupSectionShared.tsx):
  - Định nghĩa component `EditableText`.
  - Tích hợp `EditableText` vào `PopupText` và `PopupActions`.
  - Thêm xử lý trả về nút khôi phục preview khi `!visible` và `context === 'preview'`.
- **Sửa:** [PopupPreview.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/popup/_components/PopupPreview.tsx):
  - Nhận thêm các props `isVisualEditActive`, `onConfigChange` và chuyển tiếp chúng xuống `PopupSectionShared`.
- **Sửa:** [page.tsx (Create)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/create/popup/page.tsx):
  - Fetch `getConfig` của hệ thống để lấy `isVisualEditAllowed`.
  - Khai báo state `visualEditActive` and truyền xuống `PopupPreview`.
  - Thêm thanh điều khiển visual edit panel.
- **Sửa:** [page.tsx (Edit)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/popup/[id]/edit/page.tsx):
  - Fetch `getConfig` của hệ thống để lấy `isVisualEditAllowed`.
  - Khai báo state `visualEditActive` and truyền xuống `PopupPreview`.
  - Thêm thanh điều khiển visual edit panel.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm `EditableText` vào `PopupSectionShared.tsx`.
2. Sửa logic render khi `!visible` trong `PopupRuntime`.
3. Thay thế các phần text tĩnh bằng `EditableText` trong các child component của Popup.
4. Cập nhật `PopupPreview.tsx` nhận các prop mới.
5. Cập nhật `create/popup/page.tsx` và `popup/[id]/edit/page.tsx` kết nối visual edit.
6. Chạy `bunx tsc --noEmit` để xác thực toàn dự án sạch lỗi build.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Truy cập `http://localhost:3000/admin/home-components/create/popup` hoặc trang Edit.
- Bấm nút đóng (X) hoặc click bên ngoài để đóng Popup. Xác nhận nút "Hiện lại Popup Preview" hiển thị và hoạt động đúng.
- Bật cờ visual edit, xác nhận các viền dashed xanh xuất hiện bao quanh text. Click sửa text trực tiếp và xác thực text trong form bên trái tự động đồng bộ.

# VIII. Todo
- [ ] Implement `EditableText` in `PopupSectionShared.tsx`
- [ ] Add preview toggle button in `PopupRuntime` when `!visible`
- [ ] Replace text elements with `EditableText` in `PopupSectionShared.tsx`
- [ ] Update `PopupPreview.tsx` interface and implementation
- [ ] Wire up `isVisualEditAllowed` and `visualEditActive` in `create/popup/page.tsx`
- [ ] Wire up `isVisualEditAllowed` and `visualEditActive` in `popup/[id]/edit/page.tsx`
- [ ] Run typescript diagnostics compiler check
- [ ] Commit all changes to Git

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Popup hiển thị ổn định, không bị mất giao diện vĩnh viễn ở chế độ preview admin khi bấm đóng.
- Tính năng sửa trực quan hoạt động trơn tru trên Popup.
- Không phát sinh lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Không có rủi ro nghiêm trọng do thay đổi chỉ tác động đến UI preview của admin và không canfh thiệp vào hành vi chạy thực tế của Popup ở client site (`context === 'site'`).
- **Hoàn tác:** `git checkout -- app/admin/home-components/popup/`

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi schema hoặc dữ liệu DB của Convex.
- Không tối ưu hóa hoặc chỉnh sửa logic hoạt động của Popup tại site của người dùng cuối.
