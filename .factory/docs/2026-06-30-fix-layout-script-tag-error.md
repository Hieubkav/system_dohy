# I. Primer

## 1. TL;DR kiểu Feynman
Khi ta dùng Next.js mới (React 19), React không cho phép viết trực tiếp thẻ `<script>` thông thường vào trong các component nữa vì lo ngại bảo mật và lỗi không đồng bộ ở phía trình duyệt (client). Để giải quyết, ta chỉ cần thay thẻ `<script>` tự chế đó bằng component `Script` của chính Next.js cung cấp (`next/script`), giúp Next.js quản lý và chạy script này một cách an toàn và đúng thời điểm.

## 2. Elaboration & Self-Explanation
Trong các phiên bản Next.js và React mới, cơ chế render tài nguyên (Resource Loading) được thắt chặt. Khi React hydrate trên client, nếu gặp một thẻ `<script>` Javascript inline thông thường không có các thuộc tính khai báo resource (như `async`, `defer`), React sẽ từ chối thực thi và đưa ra cảnh báo/lỗi vì script tag thô này có thể dẫn tới sự không đồng nhất giữa HTML render từ server và client.
Để giải quyết việc này mà vẫn giữ được tính năng kiểm tra theme trong `localStorage` trước khi trang web hiển thị (nhằm tránh hiện tượng chớp màn hình - flicker), Next.js cung cấp component `Script` (`next/script`) với thuộc tính `strategy="beforeInteractive"` và một `id` duy nhất để quản lý vòng đời của script này.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Thay vì viết `<script dangerouslySetInnerHTML={{ __html: '...' }} />` trực tiếp, ta chuyển thành `<Script id="theme-initializer" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: '...' }} />`.
* **Ẩn dụ đời thường:** Giống như việc bạn mang một thiết bị điện tự chế không nhãn mác cắm vào ổ điện thông minh của tòa nhà (React 19), hệ thống sẽ ngắt điện cảnh báo để phòng chống cháy nổ. Thay vào đó, bạn phải cắm thiết bị đó qua một adapter chính hãng được chứng nhận (Next.js `Script`) để tòa nhà kiểm soát dòng điện an toàn.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng quan sát được (#1):** Console báo lỗi `Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client... at RootLayout (app\layout.tsx:164:9)`.
* **Tái hiện (#3):** Lỗi xảy ra liên tục ở môi trường development khi Next.js render hoặc thực hiện Fast Refresh lại layout.
* **Mốc thay đổi gần nhất (#4):** Nâng cấp dự án lên Next.js 15+/16+ dùng React 19.
* **Giả thuyết đối chứng (#6):** Sử dụng `Script` của Next.js thay thế cho thẻ `<script>` HTML thông thường là giải pháp chuẩn xác và tối ưu nhất để tránh lỗi hydration và đảm bảo script chạy chặn (blocking) đúng lúc.
* **Tiêu chí pass/fail sau khi sửa (#8):** 
  * Pass: Không còn lỗi console về script tag. Dark/Light mode hoạt động trơn tru không bị giật/chớp trắng khi reload trang.
  * Fail: Vẫn xuất hiện lỗi console hoặc mất chức năng tự động apply theme từ localStorage lúc tải trang.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc (Root Cause):** React 19 / Next.js 15+ cấm render thẻ `<script>` inline Javascript thô trong component tree khi hydrate/render ở client-side để đảm bảo an toàn và nhất quán. Thẻ `<script>` tại `app/layout.tsx:164` vi phạm quy tắc này.
* **Giả thuyết đối chứng (Counter-Hypothesis):** Nếu ta đổi sang dùng `next/script` nhưng không định nghĩa `id` hoặc dùng sai `strategy`, Next.js sẽ báo lỗi thiếu `id` hoặc script bị trì hoãn chạy quá muộn (after hydration) gây chớp màn hình (flicker). Do đó, bắt buộc phải import `Script` từ `next/script`, thiết lập `id="theme-initializer"` và `strategy="beforeInteractive"`.

# IV. Proposal (Đề xuất)
* **Giải pháp:**
  1. Sử dụng hook `useServerInsertedHTML` từ `next/navigation` bên trong Client Component `BrandColorProvider` (`components/providers/BrandColorProvider.tsx`).
  2. Loại bỏ hoàn toàn thẻ `<head>` và script tự chế khỏi Root Layout ([layout.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/layout.tsx)) để Next.js tự động quản lý tài liệu HTML sạch sẽ.
  3. Hook `useServerInsertedHTML` chỉ chạy ở server-side render, tự động chèn thẻ `<script>` vào `<head>` của tài liệu HTML ban đầu để apply theme ngay lập tức (tránh flicker). Ở client-side render, hook này không chạy và component trả về `null`, giúp tránh hoàn toàn lỗi `Encountered a script tag...` của React 19.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [layout.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/layout.tsx)
  * Vai trò hiện tại: Layout gốc của ứng dụng.
  * Thay đổi: Loại bỏ hoàn toàn thẻ `<head>` và `<script>` thô để Root Layout sạch sẽ và Next.js tự quản lý.
* **Sửa:** [BrandColorProvider.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/providers/BrandColorProvider.tsx)
  * Vai trò hiện tại: Client Provider thiết lập biến màu thương hiệu ban đầu.
  * Thay đổi: Tích hợp `useServerInsertedHTML` để chèn script tự động apply theme từ localStorage lúc ban đầu render ở server.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ file `app/layout.tsx` (đã thực hiện).
2. Tạo bản cập nhật sửa đổi: Import `Script` và thay thế thẻ script.
3. Kiểm tra tĩnh lỗi syntax và cấu trúc code.

# VII. Verification Plan (Kế hoạch kiểm chứng)
1. **Kiểm tra tĩnh:** Kiểm tra xem file `app/layout.tsx` có lỗi import hay thiếu thẻ đóng không.
2. **Kiểm tra runtime (Tester/User thực hiện):** Chạy dev server, reload trang, mở F12 Console xem còn lỗi đỏ nữa không. Kiểm tra xem theme (Dark/Light) lưu trong localStorage có được khôi phục chính xác ngay khi load trang hay không.

# VIII. Todo
- [ ] Import `Script` từ `next/script` trong [layout.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/layout.tsx).
- [ ] Thay thế `<script>` bằng `<Script id="theme-initializer" strategy="beforeInteractive">` trong [layout.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/layout.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Trang web tải thành công, không xuất hiện lỗi `Encountered a script tag while rendering React component` trong console.
* Logic theme override từ `localStorage` vẫn hoạt động tốt, không gây flicker màn hình khi chuyển trang hoặc reload.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Script chạy muộn hơn so với trước đây nếu `beforeInteractive` không được tối ưu hoá tốt bởi Next.js Turbopack.
* **Hoàn tác:** Khôi phục lại trạng thái cũ của file `app/layout.tsx` bằng Git.

# XI. Out of Scope (Ngoài phạm vi)
* Không can thiệp vào các logic theme khác hoặc refactor phần cấu hình font, metadata trong layout.
