# I. Primer
## 1. TL;DR kiểu Feynman
- Form liên hệ trên trang `/contact` có các ô nhập liệu (inputs) bị sai lệch màu sắc (nền đen trong Light Mode hoặc nền trắng trong Dark Mode) khi người dùng đổi chế độ hiển thị qua nút Toggle ở Header.
- Nguyên nhân là do ô nhập liệu dùng phong cách inline styles dựa vào biến `isDark` tính toán thủ công trong `ContactInquiryForm`.
- Việc tính toán thủ công này chỉ đọc từ cơ sở dữ liệu cấu hình `siteDarkMode` chứ không nghe theo sự thay đổi theme thực tế trên trình duyệt (thực tế được quản lý bởi class `dark` của Tailwind ở thẻ `<html>`).
- Giải pháp: Sử dụng trực tiếp thuộc tính `isDark` được cung cấp từ hook `useSiteSettings()`, hook này đã lắng nghe sự kiện đổi theme thực tế (`site-theme-change`) và đồng bộ chính xác.
- Áp dụng sửa tương tự ở `CartDrawer` và `ErrorPageView` để tránh lỗi tương tự.

## 2. Elaboration & Self-Explanation
Trang web có một nút chuyển đổi giao diện sáng/tối (Theme Toggle) ở góc trên. Khi người dùng click nút này, giao diện sẽ thay đổi bằng cách thêm hoặc xóa class `dark` trên thẻ `html` (hoặc thông qua cơ chế dispatch event `site-theme-change`). Tuy nhiên, trong mã nguồn của form liên hệ `ContactInquiryForm`, giá trị giao diện sáng/tối (`isDark`) lại được tính toán trực tiếp từ cấu hình tĩnh lưu trong database (`siteDarkMode` có thể là `'dark'`, `'light'` hoặc `'system'`). 
- **Trường hợp 1**: Nếu cấu hình trong DB là tối (`dark`), nhưng người dùng đổi sang sáng trên trình duyệt, inputs vẫn giữ màu tối (nền đen).
- **Trường hợp 2**: Nếu cấu hình trong DB là sáng (`light`) ở trang cấu hình trải nghiệm (`/system/experiences`), nhưng người dùng đổi sang tối trên trình duyệt, inputs vẫn giữ màu sáng (nền trắng).
Dẫn đến việc các ô `input` và `textarea` bị lệch tông màu hoàn toàn so với phần container xung quanh (vốn thay đổi mượt mà theo class Tailwind).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Tại trang `/contact`, khi người dùng nhấn nút Toggle để chuyển sang giao diện tối (Dark Mode), toàn bộ trang web chuyển sang nền đen, nhưng các ô nhập liệu lại có nền trắng tinh với chữ nhạt, trông cực kỳ "lỏ" và mất thẩm mỹ.
- **Ẩn dụ**: Giống như việc bạn bật chế độ điều hòa trong phòng tự động theo lịch đặt sẵn từ điện thoại, nhưng khi có người trực tiếp nhấn nút điều khiển trên tường để tăng/giảm nhiệt độ, hệ thống lại bỏ qua và tiếp tục chạy theo lịch cũ, làm cho phòng quá nóng hoặc quá lạnh.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Ô nhập liệu của Contact Inquiry Form bị hiển thị lệch màu (nền đen trên nền sáng, hoặc nền trắng trên nền tối) khi đổi chế độ.
- Phát hiện: Cả 3 file `ContactInquiryForm.tsx`, `CartDrawer.tsx`, `ErrorPageView.tsx` đều tự re-compute giá trị `isDark` dựa vào `siteDarkMode` từ `useSiteSettings()` thay vì lấy thuộc tính `isDark` đã có sẵn và đã được cập nhật chuẩn xác từ `useSiteSettings()`.


# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause**:
  `ContactInquiryForm.tsx` tự tính toán `isDark` từ `siteDarkMode`:
  ```typescript
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  ```
  Nhưng `useSiteSettings()` đã trả về `isDark` thực tế dựa trên class `dark` của `documentElement` và lắng nghe sự kiện `site-theme-change`. Việc tự tính toán bỏ qua trạng thái động ở Client.
  
  Mức độ tin cậy nguyên nhân gốc: **High (Cao)** - Phân tích logic và mã nguồn chỉ ra sự bất đồng bộ giữa biến tĩnh (cấu hình DB) và lớp CSS hiển thị động (Tailwind class).

- **Counter-Hypothesis (Giả thuyết đối chứng)**:
  Nếu ta chuyển sang dùng `isDark` trực tiếp từ `useSiteSettings()`, form và các thành phần khác sẽ tự động cập nhật đúng màu sắc khi chuyển đổi theme ở Client nhờ lắng nghe sự kiện `site-theme-change` trong `useEffect` của `useSiteSettings`.

# IV. Proposal (Đề xuất)
- Đổi cách lấy `isDark` ở `ContactInquiryForm.tsx`, `CartDrawer.tsx`, `ErrorPageView.tsx` từ re-compute thủ công sang dùng trực tiếp giá trị `isDark` được trả về bởi `useSiteSettings()`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [ContactInquiryForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/contact/ContactInquiryForm.tsx) - Sửa logic gán `isDark` để lấy trực tiếp từ `useSiteSettings()`.
- **Sửa**: [CartDrawer.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/CartDrawer.tsx) - Sửa logic gán `isDark` để lấy trực tiếp từ `useSiteSettings()`.
- **Sửa**: [ErrorPageView.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/error/ErrorPageView.tsx) - Sửa logic gán `isDark` để lấy trực tiếp từ `useSiteSettings()`.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật `ContactInquiryForm.tsx` dòng 40-41 để lấy `isDark` trực tiếp từ `useSiteSettings()`.
2. Cập nhật `CartDrawer.tsx` dòng 29-30 để lấy `isDark` trực tiếp từ `useSiteSettings()`.
3. Cập nhật `ErrorPageView.tsx` dòng 41-42 để lấy `isDark` trực tiếp từ `useSiteSettings()`.
4. Chạy build/typecheck tĩnh (`bunx tsc --noEmit`) để xác minh tính đúng đắn.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy `bunx tsc --noEmit` thủ công để đảm bảo không lỗi kiểu dữ liệu.
- Người dùng kiểm tra trực quan trên trình duyệt khi chuyển đổi qua lại giữa Light/Dark mode, các ô nhập liệu của form liên hệ, cart drawer, và trang lỗi 404 hiển thị đồng bộ màu sắc.

# VIII. Todo
- [ ] Cập nhật `ContactInquiryForm.tsx`
- [ ] Cập nhật `CartDrawer.tsx`
- [ ] Cập nhật `ErrorPageView.tsx`
- [ ] Chạy type check tĩnh `bunx tsc --noEmit` để xác minh.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Form liên hệ hiển thị nền trắng, chữ đen, placeholder xám nhạt khi ở Light Mode.
- Form liên hệ hiển thị nền tối (`#1c1c1e`), chữ sáng (`#f5f5f7`), placeholder xám đậm khi ở Dark Mode.
- Các ô input phản ứng ngay lập tức khi thay đổi theme trên giao diện.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực thấp vì đây chỉ là thay đổi cách lấy biến trạng thái `isDark` vốn đã được tối ưu và lắng nghe event đúng đắn ở hook chung.

# XI. Out of Scope (Ngoài phạm vi)
- Không refactor cấu trúc dữ liệu database, không thay đổi flow gửi tin nhắn hay logic validate form.
