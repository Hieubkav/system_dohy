# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Admin muốn chỉnh sửa trực tiếp (WYSIWYG) toàn bộ các component trên trang chủ cùng một lúc (giống như WordPress hay các hệ thống SaaS lớn) thay vì phải click vào trang sửa của từng component riêng lẻ.
*   **Giải pháp:** 
    1.  Tạo một chế độ "Biên tập trực quan" (Live Editor) ngay tại trang `/admin/home-components` dưới dạng một tab hoặc chế độ view mới.
    2.  Khi bật chế độ này, toàn bộ các home-component đang kích hoạt sẽ được render ghép lại với nhau theo đúng thứ tự (`order`) để tạo thành giao diện trang chủ hoàn chỉnh.
    3.  Sử dụng `LiveEditorContext` để ẩn các khung thiết bị (`PreviewWrapper`), khung trình duyệt (`BrowserFrame`) riêng lẻ của từng component con, tạo ra một giao diện trang chủ đồng nhất.
    4.  Bật sẵn chế độ WYSIWYG (`active=true`) cho toàn bộ các text element trên trang để admin click vào đâu là sửa được ngay. Khi sửa xong, bấm nút "Lưu thay đổi" nổi trên header để lưu tất cả vào database.

## 2. Elaboration & Self-Explanation
Hiện nay, mỗi home-component trong admin đều có màn hình Preview riêng được bọc bởi `PreviewWrapper` (bao gồm thanh đổi thiết bị, nút Dark mode, nút bật/tắt sửa trực quan riêng). Khi ghép các component này lại để tạo thành Live Editor, nếu giữ nguyên các wrapper riêng lẻ thì giao diện sẽ bị nát, lặp đi lặp lại các thanh công cụ và khung trình duyệt giả lập.
Do đó, giải pháp là định nghĩa một `LiveEditorContext` ở ngoài cùng. Component `PreviewWrapper` của từng component con khi nhận thấy context này đang kích hoạt (`isLiveEditor: true`) sẽ tự động ẩn đi các phần viền Card, CardHeader, BrowserFrame và tự động kích hoạt chế độ sửa trực quan (`active: true`).
Khi admin chỉnh sửa trực tiếp nội dung văn bản trên giao diện, các callback tương ứng (`onConfigChange`, `onContentChange`...) sẽ cập nhật state tạm thời của danh sách components ở Live Editor. Cuối cùng, khi admin click nút "Lưu thay đổi" ở Header của Live Editor, hệ thống sẽ thực hiện lưu hàng loạt vào cơ sở dữ liệu qua mutation của Convex.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể:** Khi admin truy cập `/admin/home-components` và bấm nút "Biên tập trực quan":
    *   Giao diện danh sách dạng bảng biến mất, thay vào đó là một trang Preview lớn ghép từ: Hero component, About component, FAQ component, Footer component xếp chồng lên nhau.
    *   Admin click vào tiêu đề "Chào mừng đến với chúng tôi" của Hero và gõ nội dung mới. Sau đó cuộn xuống click vào một câu hỏi FAQ để sửa câu trả lời.
    *   Một thanh Header dính ở đầu trang hiển thị "Có 2 thay đổi chưa lưu" và nút "Lưu thay đổi".
    *   Bấm "Lưu thay đổi", hệ thống gọi mutation cập nhật cấu hình của cả Hero và FAQ component trong 1 đợt, sau đó hiển thị thông báo thành công.
*   **Analogy:** Việc này giống như khi bạn trang trí một ngôi nhà. Thay vì phải đi vào từng phòng để sửa từng bức tranh (sửa đơn lẻ), bạn có thể đứng từ xa và dùng điều khiển từ xa để chỉnh sửa màu sắc, vị trí của tất cả các bức tranh trong toàn bộ ngôi nhà cùng một lúc và nhìn thấy sự phối hợp của chúng ngay lập tức.

---

# II. Audit Summary (Tóm tắt kiểm tra)
*   Hệ thống đã hỗ trợ đầy đủ các Preview components cho 28+ loại home-components.
*   Trang `/admin/home-components/page.tsx` hiện hiển thị danh sách các components dạng bảng (Table) và hỗ trợ kéo thả sắp xếp thứ tự.
*   Các Preview component con tự quản lý local state `visualEditEnabled` và không tự động kế thừa trạng thái visual edit từ bên ngoài nếu không được click thủ công trên `PreviewWrapper` của chúng.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc:** Chưa có view/tab Live Editor toàn trang để ghép các preview components con và chưa có cơ chế global context để ghi đè (override) cờ `isVisualEditActive` cho toàn bộ các component con cùng một lúc.
*   **Giả thuyết đối chứng:** Nếu chỉ ghép các Preview component con lại mà không ẩn khung `PreviewWrapper` của từng cái, giao diện Live Editor sẽ bị chồng chéo nhiều thanh điều khiển thiết bị/Dark mode. Do đó, việc can thiệp vào `PreviewWrapper` thông qua `LiveEditorContext` để ẩn khung và tự động bật sửa text là giải pháp bắt buộc để đạt được trải nghiệm nhất quán.

---

# IV. Proposal (Đề xuất)

1.  **Cập nhật `PreviewWrapper.tsx`**:
    *   Định nghĩa và export `LiveEditorContext`:
        ```typescript
        export const LiveEditorContext = React.createContext<{ isLiveEditor: boolean }>({ isLiveEditor: false });
        ```
    *   Trong `PreviewWrapper`, lấy giá trị từ `LiveEditorContext`:
        ```typescript
        const liveEditor = React.useContext(LiveEditorContext);
        const isLiveMode = liveEditor?.isLiveEditor ?? false;
        ```
    *   Nếu `isLiveMode` là `true`, tự động ẩn CardHeader, Card, BrowserFrame và chỉ render children trực tiếp với `effectiveVisualEditActive = true`.
2.  **Viết script Node.js tự động cập nhật các file Preview**:
    *   Quét tất cả các file `*Preview.tsx` trong `app/admin/home-components/[name]/_components/`.
    *   Tự động chèn import `usePreviewVisualEdit`:
        ```typescript
        import { usePreviewVisualEdit } from '../../_shared/components/PreviewWrapper';
        ```
    *   Thay đổi dòng tính toán:
        ```typescript
        const isVisualEditActive = isVisualEditAllowed && visualEditEnabled;
        ```
        thành:
        ```typescript
        const visualEditContext = usePreviewVisualEdit();
        const isVisualEditActive = isVisualEditAllowed && (visualEditContext.active || visualEditEnabled);
        ```
3.  **Tạo Registry component `LiveComponentPreviewRenderer.tsx`**:
    *   Nhận `component` (dữ liệu component từ Convex) và render Preview component tương ứng.
    *   Nối các callback thay đổi dữ liệu (`onConfigChange`, `onTitleChange`...) để khi admin chỉnh sửa, nó sẽ gọi hàm callback cập nhật state tạm thời của Live Editor.
4.  **Cập nhật `app/admin/home-components/page.tsx`**:
    *   Thêm tab "Biên tập trực quan" (hoặc nút "Live Editor").
    *   Khi bật chế độ này:
        *   Render Toolbar chung ở đầu trang (chọn thiết bị Desktop/Tablet/Mobile, chọn Dark/Light mode, hiển thị trạng thái thay đổi, nút Lưu thay đổi, nút Quay lại).
        *   Render BrowserFrame chung cho toàn bộ trang chủ.
        *   Bọc toàn bộ danh sách components trong `<LiveEditorContext.Provider value={{ isLiveEditor: true }}>`.
        *   Duyệt qua danh sách components đang active và render chúng thông qua `LiveComponentPreviewRenderer`.
        *   Quản lý local state của danh sách components để cập nhật tức thì khi chỉnh sửa, và gọi mutation lưu hàng loạt khi click nút "Lưu thay đổi".

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. Shared Components
*   `[MODIFY] PreviewWrapper.tsx`(file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/_shared/components/PreviewWrapper.tsx): Định nghĩa `LiveEditorContext` và xử lý ẩn frame khi ở chế độ Live Editor.
*   `[NEW] LiveComponentPreviewRenderer.tsx`(file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/_shared/components/LiveComponentPreviewRenderer.tsx): Registry chứa mapping và logic render Preview cho toàn bộ 33+ loại component.

### 2. Admin Pages
*   `[MODIFY] page.tsx`(file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/page.tsx): Tích hợp nút "Live Editor" và xây dựng giao diện Live Editor WYSIWYG toàn trang.

### 3. Scratch Scripts (Tạm thời)
*   `[NEW] scratch/update-previews.js`(file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/scratch/update-previews.js): Script Node.js tự động cập nhật các file Preview để hỗ trợ lắng nghe Context. Sẽ được xóa sau khi thực thi.

---

# VI. Execution Preview (Xem trước thực thi)
1.  Tạo script `scratch/update-previews.js` và thực thi để cập nhật tất cả file Preview.
2.  Chỉnh sửa `PreviewWrapper.tsx` để tích hợp `LiveEditorContext`.
3.  Tạo file `LiveComponentPreviewRenderer.tsx` chứa registry mapping các Preview component.
4.  Cập nhật `app/admin/home-components/page.tsx` để render giao diện Live Editor toàn trang.
5.  Xóa file script tạm thời `scratch/update-previews.js`.
6.  Chạy `bunx tsc --noEmit` để kiểm tra compile TypeScript.
7.  Phát ra âm thanh báo hoàn thành task.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
*   **Compile check**: Chạy `bunx tsc --noEmit` để đảm bảo dự án không gặp lỗi TypeScript.
*   **Manual verification**: Admin truy cập `http://localhost:3000/admin/home-components`, click nút "Live Editor" và xác thực giao diện trang chủ ghép mượt mà, đổi thiết bị hoạt động tốt, sửa chữ trực tiếp cập nhật dữ liệu và lưu thành công.

---

# VIII. Todo
*   [ ] Tạo script `scratch/update-previews.js` để tự động hóa cập nhật các file Preview.
*   [ ] Chạy script và xác nhận các file Preview đã được sửa thành công.
*   [ ] Chỉnh sửa `PreviewWrapper.tsx` hỗ trợ `LiveEditorContext`.
*   [ ] Tạo `LiveComponentPreviewRenderer.tsx` để kết nối tất cả các Preview component con.
*   [ ] Chỉnh sửa `app/admin/home-components/page.tsx` tích hợp giao diện Live Editor.
*   [ ] Dọn dẹp: Xóa file script trong thư mục `scratch/`.
*   [ ] Chạy `bunx tsc --noEmit` để verify toàn bộ mã nguồn.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   Có nút "Biên tập trực quan" trên trang `/admin/home-components`.
*   Click nút sẽ hiển thị toàn bộ trang chủ ghép từ các component đang active theo đúng thứ tự.
*   Toàn bộ trang chủ có chung một khung trình duyệt duy nhất và các nút chuyển đổi thiết bị/Dark mode dùng chung ở thanh Toolbar đầu trang.
*   Tất cả các phần text của các component đều có viền đứt nét màu xanh dương và có thể chỉnh sửa trực tiếp. Khi blur, thay đổi được ghi nhận và hiển thị nút "Lưu thay đổi".
*   Lưu thay đổi thành công cập nhật cơ sở dữ liệu Convex và hiển thị toast thông báo.
*   Không có lỗi compile TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   **Rủi ro:** Script Node.js có thể sửa đổi nhầm hoặc làm hỏng cú pháp của một số file Preview đặc biệt.
*   **Hoàn tác:** Sử dụng lệnh `git checkout -- app/admin/home-components/` để khôi phục toàn bộ các thay đổi nếu xảy ra lỗi nghiêm trọng.

---

# XI. Out of Scope (Ngoài phạm vi)
*   Không sửa đổi schema DB hoặc các Convex mutations hiện tại.
*   Không tối ưu hiệu năng hoặc sửa đổi giao diện bên phía site người dùng cuối.
