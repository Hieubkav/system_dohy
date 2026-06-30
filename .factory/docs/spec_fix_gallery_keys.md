# I. Primer

## 1. TL;DR kiểu Feynman
- Khi React vẽ ra một danh sách các bức ảnh, nó cần dán một cái nhãn tên duy nhất cho mỗi bức ảnh (thường gọi là `key`). Nếu cái nhãn này bị trống `""` hoặc giống nhau, React sẽ bối rối và cảnh báo lỗi.
- Hiện tại, một số bức ảnh không có `id` (hoặc `id` trống), dẫn đến React Key bị trống hoặc trùng lặp.
- Cách giải quyết: Nếu `id` trống, ta lấy địa chỉ ảnh (`url`) hoặc vị trí số thứ tự của ảnh (`idx`) làm nhãn. Vì mỗi bức ảnh chỉ nằm ở một vị trí duy nhất trong danh sách, số thứ tự sẽ đảm bảo nhãn dán không bao giờ bị trùng lặp.

## 2. Elaboration & Self-Explanation
- Trong component `GalleryPreview.tsx`, có 7 vị trí sử dụng `key={photo.id}` khi lặp qua danh sách ảnh bằng `.map()`.
- Khi dữ liệu đầu vào chứa các `photo` có thuộc tính `id` bị bỏ trống `""` (chuỗi rỗng) hoặc bị trùng, React sẽ báo lỗi: `Each child in a list should have a unique "key" prop` hoặc cảnh báo trùng lặp key rỗng.
- Để xử lý triệt để, ta đổi toàn bộ `key={photo.id}` thành `key={photo.id || photo.url || idx}` (với `idx` là chỉ số index của vòng lặp `.map()`).
- Toán tử `||` (logical OR) sẽ lọc bỏ được trường hợp `photo.id` là chuỗi rỗng `""` (vì chuỗi rỗng là falsy), giúp React tự động fallback về `photo.url` hoặc index `idx` của mảng, đảm bảo tính độc bản (uniqueness).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Giả sử ta có danh sách ảnh:
  - Ảnh A: `{ id: "", url: "/photo1.jpg" }`
  - Ảnh B: `{ id: "", url: "/photo2.jpg" }`
  Với code cũ, `key={photo.id}` sẽ cho ra `key=""` cho cả hai ảnh A và B.
  Với code mới, `photo.id` rỗng sẽ fallback sang `photo.url`, tức là `key="/photo1.jpg"` cho Ảnh A và `key="/photo2.jpg"` cho Ảnh B. Nếu cả URL cũng rỗng, nó sẽ lấy index, tức `key=0` và `key=1`. Độc bản được đảm bảo.
- **Ví dụ đời thường:** Giống như một lớp học có học sinh tên trùng nhau và không có mã số học sinh. Nếu gọi tên, giáo viên sẽ nhầm lẫn. Cách giải quyết là gọi tên kèm số thứ tự trong sổ điểm (ví dụ: "Nguyễn Văn A số 1", "Nguyễn Văn A số 2").

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Console báo lỗi `Each child in a list should have a unique "key" prop` tại GalleryPreview.tsx dòng 488.
- Tệp liên quan:
  - `app/admin/home-components/gallery/_components/GalleryPreview.tsx`

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc (Root Cause):**
  - Component `GalleryPreview` dùng `photo.id` làm React key trong các vòng lặp `.map()`. Khi `photo.id` bị trống hoặc không tồn tại (undefined), key bị trùng lặp.
- **Giả thuyết đối chứng (Counter-Hypothesis):**
  - Có thể giải quyết bằng cách tự sinh ID ở backend? Có thể, nhưng frontend component hiển thị vẫn cần phải có cơ chế phòng thủ tốt đề phòng dữ liệu rác hoặc cấu hình preview tạm thời ở admin chưa được lưu ID vào DB.

# IV. Proposal (Đề xuất)
- Đổi toàn bộ 7 vị trí gán `key={photo.id}` sang sử dụng `key={photo.id || photo.url || idx}` trong file `GalleryPreview.tsx`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [GalleryPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/gallery/_components/GalleryPreview.tsx): Sửa đổi 7 vị trí gán React key trong các style hiển thị gallery khác nhau.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `GalleryPreview.tsx`.
2. Kiểm tra biên dịch TypeScript bằng `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra biên dịch: chạy `bunx tsc --noEmit` để đảm bảo không có lỗi cú pháp/kiểu dữ liệu.
- Kiểm tra thủ công:
  - Mở trang Admin Gallery Preview.
  - Kiểm tra xem console còn cảnh báo key trùng hay không.

# VIII. Todo
- [ ] Sửa file `GalleryPreview.tsx`
- [ ] Chạy `bunx tsc --noEmit` để xác nhận thành công
- [ ] Tạo walkthrough báo cáo kết quả
- [ ] Commit thay đổi vào Git

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- 100% hết cảnh báo key trùng/rỗng trong console khi chuyển đổi qua lại giữa các style của GalleryPreview.
- Biên dịch dự án thành công.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực thấp vì đây là thay đổi nhỏ, mang tính phòng thủ hiển thị React.
- Hoàn tác đơn giản bằng `git checkout`.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa hay refactor bất kỳ tính năng gallery nào khác ngoài sửa lỗi key.
