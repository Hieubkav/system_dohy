# Spec: Tích Hợp Tab Tối Ưu Ảnh WebP Lossless (100% Không Tổn Hao)

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Người dùng muốn tối ưu hóa dung lượng ảnh nhưng bắt buộc phải giữ lại 100% chất lượng pixel gốc (Lossless không tổn hao) để logo sắc nét tuyệt đối. Tính năng này cần được đặt ở một Tab riêng để giao diện trực quan và dễ sử dụng.
* **Giải pháp**:
  * Tạo thêm một Tab riêng mang tên **"Tối ưu ảnh"** trong trình chỉnh sửa ảnh.
  * Sử dụng bộ mã hóa WebP Lossless native của trình duyệt thông qua **Canvas API** bằng cách gọi `canvas.toBlob(..., 'image/webp', 1.0)`.
  * Trong tab này, hiển thị nút **"Nén WebP (Lossless)"** để chuyển đổi định dạng và nén ảnh hiện tại mà không làm mất chi tiết pixel nào, kèm theo hiển thị so sánh dung lượng thực tế trước và sau khi nén.
* **Lợi ích**: Giao diện các tab chức năng được phân định rõ ràng. Logo được nén thành WebP siêu nét, giữ nguyên độ trong suốt, dung lượng giảm 30-50% giúp website tải nhanh hơn.

## 2. Elaboration & Self-Explanation
Việc bổ sung một tab riêng `'compress'` giúp người dùng phân biệt rõ ràng giữa các hành động: Cắt ảnh (Crop), Xóa nền (Remove Background), Thêm nền (Add Background), và Tối ưu ảnh (Compress/Convert to WebP).
Chúng tôi sẽ sử dụng chung state lưu trữ kết quả tạm thời `removedBgBlob` và `removedBgUrl` cho cả tab Xóa nền và tab Tối ưu ảnh. Thiết kế này giúp người dùng có thể thực hiện chuỗi hành động kết hợp một cách tự nhiên (ví dụ: Xóa nền xong, chuyển sang tab Tối ưu ảnh để nén tiếp file đó sang WebP Lossless, rồi mới lưu lại).

Thuật toán nén WebP Lossless qua Canvas native hoạt động bằng cách vẽ ảnh lên canvas ở kích thước gốc và xuất blob:
```javascript
canvas.toBlob((blob) => { ... }, 'image/webp', 1.0);
```
Giá trị chất lượng `1.0` truyền vào kiểu `image/webp` kích hoạt chế độ nén lossless trong các trình duyệt hiện đại.

## 3. Concrete Examples & Analogies
* **Quy trình hoạt động kết hợp**:
  1. Admin mở Dialog, ảnh gốc có dung lượng **1.2 MB** dạng **JPG**.
  2. Admin chọn tab **Xóa nền**, bấm nút **Xóa nền**. Kết quả nhận được ảnh PNG không nền dung lượng **350 KB**.
  3. Admin chuyển sang tab **Tối ưu ảnh**, bấm nút **Nén WebP (Lossless)**. Ảnh tách nền PNG lập tức được nén thành ảnh WebP Lossless trong suốt. Dung lượng cập nhật hiển thị giảm còn **180 KB** (giảm 48%), định dạng hiển thị cập nhật là `WEBP`.
  4. Admin bấm **Áp dụng tối ưu**, file được lưu lên server dưới dạng WebP sắc nét 100%.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Tình trạng file hiện tại**:
  * [ImageEditorDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/ImageEditorDialog.tsx) định nghĩa kiểu `EditorTab = 'crop' | 'removebg' | 'addbg'`.
  * State `removedBgBlob` lưu trữ blob kết quả đã chỉnh sửa của tab Xóa nền.
  * Footer dialog có các nút áp dụng tương ứng với `activeTab`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Phân tích thiết kế**:
  * Việc tích hợp tính năng nén thành tab riêng giúp luồng trải nghiệm (UX) rõ ràng hơn, không làm rối tab Xóa nền vốn đã có nhiều thao tác xử lý tiến trình AI phức tạp.
  * Sử dụng chung state kết quả giúp tối giản lượng code, tối ưu hóa bộ nhớ và tăng cường tính đồng bộ giữa các tab chỉnh sửa.

# IV. Proposal (Đề xuất)

## Option 1 (Recommend) — Confidence 98%
Thiết lập tab "Tối ưu ảnh" riêng biệt và triển khai nén WebP Lossless.
* **a) Mở rộng EditorTab**:
  * Thêm `'compress'` vào kiểu `EditorTab`.
  * Bổ sung mục tab vào mảng `tabs` hiển thị trên UI.
* **b) Thiết kế giao diện Tab Tối ưu ảnh**:
  * Hướng dẫn sử dụng: "Tối ưu hóa dung lượng ảnh bằng cách chuyển đổi sang định dạng WebP Lossless (không tổn hao). Ảnh giữ nguyên 100% chất lượng gốc và độ trong suốt."
  * Hiển thị ảnh xem trước tương ứng (dùng `removedBgUrl` nếu có, ngược lại dùng `imageUrl`).
  * Hiển thị dòng thông số ảnh hiện tại (size và type).
  * Hiển thị nút bấm: **[Nén WebP (Lossless)]** (khi chưa nén hoặc muốn nén lại) và nút **[Hoàn tác]** (để quay lại ảnh gốc).
* **c) Cập nhật Footer**:
  * Khi `activeTab === 'compress'`, nút áp dụng hiển thị nhãn "Áp dụng tối ưu" và gọi `handleApplyRemovedBg`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [ImageEditorDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/ImageEditorDialog.tsx)
  * Vai trò: Giao diện hộp thoại sửa ảnh.
  * Thay đổi:
    * Thêm tab `compress` vào kiểu và mảng tabs.
    * Định nghĩa helper `compressImageToWebP`.
    * Định nghĩa handler `handleCompressToWebP`.
    * Render nội dung tab `compress`.
    * Cập nhật footer để hỗ trợ tab `compress` áp dụng lưu ảnh.

# VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Cập nhật kiểu `EditorTab` và thêm tab `Tối ưu ảnh` vào mảng `tabs`.
2. **Bước 2**: Viết hàm helper `compressImageToWebP` và tích hợp logic nén WebP Lossless.
3. **Bước 3**: Render nội dung chi tiết cho tab `compress` (preview, hướng dẫn, nút nén WebP, nút hoàn tác).
4. **Bước 4**: Thêm nút "Áp dụng tối ưu" ở Footer khi tab hiện tại là `compress`.
5. **Bước 5**: Kiểm tra kiểu dữ liệu TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra biên dịch**: Chạy `tsc --noEmit` để xác nhận không lỗi compile.
* **Kiểm tra thủ công**:
  * Mở dialog sửa logo tại `/admin/settings/general`.
  * Xác nhận có tab thứ 4 mang tên **"Tối ưu ảnh"**.
  * Chuyển sang tab "Tối ưu ảnh", bấm **Nén WebP (Lossless)**. Kiểm tra định dạng đổi thành WEBP và dung lượng giảm.
  * Bấm Hoàn tác để khôi phục ảnh gốc.
  * Thử xóa nền ở tab "Xóa nền", sau đó chuyển sang tab "Tối ưu ảnh". Bấm **Nén WebP (Lossless)** để nén ảnh không nền. Bấm áp dụng ở Footer và verify file tải lên Convex là WebP trong suốt.

# VIII. Todo
* [x] Cập nhật spec dự án.
* [ ] Sửa đổi kiểu `EditorTab` và mảng `tabs` trong `ImageEditorDialog.tsx`.
* [ ] Thêm helper `compressImageToWebP` và logic `handleCompressToWebP`.
* [ ] Render nội dung tab `compress`.
* [ ] Cập nhật Footer nút bấm áp dụng cho tab `compress`.
* [ ] Chạy kiểm tra TypeScript và commit.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Có tab "Tối ưu ảnh" riêng biệt trong dialog chỉnh sửa ảnh.
* Tab này chứa nút "Nén WebP (Lossless)" hoạt động tốt cho cả ảnh gốc và ảnh đã xóa nền.
* Chất lượng ảnh WebP đầu ra đạt 100% không tổn hao.
* Kích thước và định dạng cập nhật chính xác trên giao diện.
* File kết quả gửi về callback `onApply` có type là `image/webp` và tên file có đuôi `.webp` khi áp dụng ảnh đã nén.
* Không có lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có rủi ro lớn vì Canvas API được hỗ trợ native ở tất cả các trình duyệt hiện đại.
* **Hoàn tác**: Sử dụng `git checkout` để khôi phục lại trạng thái file trước khi sửa đổi.
