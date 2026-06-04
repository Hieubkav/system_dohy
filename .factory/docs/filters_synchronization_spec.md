# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Bộ lọc tài nguyên và bộ lọc khóa học có cấu trúc giống nhau nhưng hoạt động ở hai bảng dữ liệu khác nhau. Việc thiết kế đồng bộ hai chiều liên tục (Real-time Sync) rất dễ gây lỗi đúp, vòng lặp vô hạn và rủi ro vô tình xóa mất dữ liệu gán lọc của module còn lại.
* **Giải pháp**: Thay đổi thiết kế thành **Sao chép một lần và hoạt động độc lập (One-time Copy / Independent Mode)**:
  * **Khi tạo bộ lọc mới**: Có tùy chọn tạo thêm một bộ lọc giống hệt bên module kia. Sau khi tạo, hai bộ lọc này hoạt động hoàn toàn độc lập.
  * **Khi quản lý giá trị lọc (Filter Values)**: Có nút bấm chủ động `"Sao chép toàn bộ giá trị sang đối tác"` (hoặc checkbox tạo đồng thời lúc thêm value). Hệ thống chỉ thực hiện sao chép dữ liệu tĩnh tại thời điểm nhấn nút, không duy trì kết nối tự động.
* **Lợi ích**: Cực kỳ an toàn, loại bỏ hoàn toàn nguy cơ vòng lặp đệ quy, giữ cho code đơn giản (KISS) và admin vẫn chủ động kiểm soát được dữ liệu của từng bên.

## 2. Elaboration & Self-Explanation
Thay vì tạo ra một cơ chế phức tạp theo dõi thay đổi (Change Tracking) và đồng bộ thời gian thực hai chiều giữa `courseFilters` và `resourceFilters`, chúng ta chuyển sang mô hình **Tạo đúp tại chỗ (Double-write on action)** và **Sao chép thủ công chủ động (Active Copy-over)**.

* **Khi Tạo mới**: Giao diện cung cấp một checkbox `"Tạo bộ lọc tương tự cho [Khóa học/Tài nguyên]"`. Khi tích chọn, client sẽ gửi yêu cầu và backend Convex sẽ insert bản ghi vào cả hai bảng. Hai bản ghi này có ID độc lập.
* **Khi Chỉnh sửa / Quản lý giá trị**: 
  * Khi admin thêm một giá trị lọc (ví dụ: thêm `"Figma"`), admin có thể tích chọn `"Thêm giá trị này sang bộ lọc đối tác"`. Backend sẽ tìm bộ lọc cùng slug ở bên kia để insert thêm một bản ghi giá trị lọc tương ứng.
  * Thêm nút `"Đồng bộ giá trị sang đối tác"` (Copy values to partner) ở trang chi tiết bộ lọc. Khi nhấn nút này, hệ thống sẽ đọc toàn bộ danh sách giá trị lọc hiện tại của bộ lọc này, sau đó sao chép (hoặc cập nhật đè) sang bộ lọc có cùng slug ở bảng bên kia.
* **Khi Xóa**: Việc xóa bộ lọc hoặc giá trị lọc ở bên này sẽ **không bao giờ tự động xóa** bên kia. Điều này đảm bảo an toàn tuyệt đối cho các khóa học hoặc tài nguyên đã được gán các bộ lọc này từ trước.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  * Admin tạo bộ lọc `"Độ khó"` bên Tài nguyên và tích chọn `"Tạo bộ lọc tương tự cho Khóa học"`. Hệ thống tạo 1 bản ghi `"Độ khó"` bên `resourceFilters` và 1 bản ghi `"Độ khó"` bên `courseFilters`.
  * Sau đó, admin chỉnh sửa bộ lọc `"Độ khó"` bên Tài nguyên, thêm giá trị `"Cơ bản"`. Tại Dialog thêm, admin tích `"Thêm giá trị này sang bộ lọc Khóa học"`. Hệ thống insert `"Cơ bản"` cho cả hai bên.
  * Nếu admin xóa giá trị `"Cơ bản"` bên Tài nguyên, giá trị `"Cơ bản"` bên Khóa học **vẫn được giữ nguyên**, không bị ảnh hưởng.
* **Hình ảnh tương đồng**: Giống như việc bạn có hai quyển sổ tay ghi chép (sổ Khóa học và sổ Tài nguyên). Khi bạn viết một đề mục mới ở trang đầu quyển sổ này, bạn dùng giấy than để in đè đề mục đó sang quyển sổ kia. Tuy nhiên, sau đó hai quyển sổ hoạt động hoàn toàn độc lập: bạn có thể tẩy xóa hoặc ghi thêm chi tiết vào quyển sổ này mà không làm rách hay ảnh hưởng gì đến quyển sổ kia.

# II. Audit Summary (Tóm tắt kiểm tra)

* Hai bảng dữ liệu `courseFilters` và `resourceFilters` có cấu trúc hoàn toàn trùng khớp và độc lập về mặt vật lý.
* Các mutation trong Convex hiện tại (`convex/courseFilters.ts` và `convex/resourceFilters.ts`) đã hỗ trợ tốt các thao tác CRUD cơ bản và đã có sẵn các API `copyCourseFiltersToResources` để phục vụ việc sao chép thủ công hàng loạt.
* Hệ thống pre-commit và tsc hoạt động tốt, đảm bảo chất lượng code.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Vấn đề của thiết kế cũ (Real-time Sync)**:
  * Rủi ro vòng lặp đệ quy lớn (A gọi B, B gọi ngược lại A).
  * Việc xóa một bộ lọc ở bên này có thể kéo theo việc xóa bộ lọc bên kia, gây mất liên kết dữ liệu hàng loạt của các Khóa học đang chạy trên production.
* **Giải pháp thay thế (One-time Copy / Independent Mode)**:
  * Khắc phục triệt để các rủi ro trên.
  * Đảm bảo tính đơn giản trong mã nguồn (KISS), dễ bảo trì và dễ hiểu đối với các lập trình viên khác tham gia dự án.

# IV. Proposal (Đề xuất)

## 1. Tầng Database & API (Convex)
a) **Cập nhật mutation Tạo bộ lọc (`create`)**:
   * Nhận thêm tham số `copyToPartner?: boolean`.
   * Nếu `true`, backend sẽ thực hiện insert bản ghi vào bảng hiện tại, đồng thời insert một bản ghi tương tự (cùng name, slug, active, description, v.v.) vào bảng đối tác. Hai bản ghi hoạt động độc lập và không liên kết ID với nhau.

b) **Cập nhật mutation Tạo giá trị lọc (`createValue`)**:
   * Nhận thêm tham số `copyToPartner?: boolean`.
   * Nếu `true`, backend sẽ insert giá trị lọc hiện tại. Đồng thời, tìm kiếm bộ lọc có cùng slug với filter cha ở bảng đối tác. Nếu tìm thấy, backend sẽ insert một giá trị lọc tương tự (cùng name, slug, active, order) vào bộ lọc đối tác đó.

c) **Thêm mutation Sao chép toàn bộ giá trị lọc (`copyValuesToPartner`)**:
   * Nhận vào `filterId` của bộ lọc hiện tại.
   * Tìm bộ lọc đối tác có cùng slug ở bảng đối diện.
   * Lấy toàn bộ danh sách các giá trị lọc hiện có của bộ lọc hiện tại.
   * Thực hiện đồng bộ (ghi đè hoặc bổ sung nếu chưa có) các giá trị lọc này sang bộ lọc đối tác để đảm bảo danh sách giá trị của hai bên trùng khớp hoàn toàn tại thời điểm bấm nút.

## 2. Giao diện Admin (UI)
a) **Trang tạo mới bộ lọc (`create/page.tsx`)**:
   * Thêm Checkbox: `"Tạo thêm một bộ lọc tương tự cho [Khóa học / Tài nguyên]"`.
   * Khi submit, gửi kèm tham số `copyToPartner: true` lên API.

b) **Trang chỉnh sửa bộ lọc (`[id]/edit/page.tsx`)**:
   * **Phần Thông tin chung bộ lọc**: Không cần tự động đồng bộ khi sửa đổi thông tin chung (để hai bên độc lập).
   * **Phần danh sách giá trị lọc (Filter Values)**:
     * Cạnh nút "Thêm giá trị", bổ sung một nút bấm phụ: `"Sao chép giá trị sang [Khóa học / Tài nguyên]"`.
     * Khi click nút này, hệ thống sẽ gọi mutation `copyValuesToPartner` để sao chép nhanh toàn bộ cấu trúc giá trị lọc hiện tại sang bộ lọc đối tác có cùng slug.
     * Khi click "Thêm giá trị" (mở Dialog), bổ sung checkbox `"Thêm giá trị này sang bộ lọc đối tác (nếu có)"`. Mặc định bật.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. Nhóm Backend & API (Convex)
* `Sửa:` [convex/resourceFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resourceFilters.ts): Cập nhật `create`, `createValue` và bổ sung mutation `copyValuesToPartner` để hỗ trợ sao chép dữ liệu sang `courseFilters`.
* `Sửa:` [convex/courseFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courseFilters.ts): Cập nhật tương tự để hỗ trợ sao chép dữ liệu sang `resourceFilters`.

## 2. Nhóm Giao diện (UI Admin)
* `Sửa:` [app/admin/resources/filters/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/filters/create/page.tsx): Thêm Checkbox tạo đúp bộ lọc tài nguyên.
* `Sửa:` [app/admin/resources/filters/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/filters/%5Bid%5D/edit/page.tsx): Thêm nút "Sao chép giá trị sang Khóa học", thêm checkbox tạo đúp trong Dialog thêm giá trị lọc.
* `Sửa:` [app/admin/courses/filters/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/filters/create/page.tsx): Thêm Checkbox tạo đúp bộ lọc khóa học.
* `Sửa:` [app/admin/courses/filters/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/filters/%5Bid%5D/edit/page.tsx): Thêm nút "Sao chép giá trị sang Tài nguyên", thêm checkbox tạo đúp trong Dialog thêm giá trị lọc.

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Cập nhật Convex API (`resourceFilters.ts` và `courseFilters.ts`) hỗ trợ tham số `copyToPartner` và bổ sung mutation `copyValuesToPartner`.
2. **Bước 2**: Chỉnh sửa màn hình tạo bộ lọc (`create/page.tsx`) ở cả hai module để thêm checkbox tạo đúp bộ lọc.
3. **Bước 3**: Chỉnh sửa màn hình edit bộ lọc (`edit/page.tsx`) ở cả hai module để thêm nút "Sao chép giá trị sang đối tác" và checkbox trong Dialog thêm giá trị.
4. **Bước 4**: Kiểm thử biên dịch TypeScript bằng `tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy lệnh `bunx tsc --noEmit` để đảm bảo toàn bộ mã TypeScript không bị lỗi kiểu dữ liệu.

### Manual Verification
1. **Tạo bộ lọc**:
   * Tạo bộ lọc `"Kỹ năng"` bên Tài nguyên, tích `"Tạo bộ lọc tương tự cho Khóa học"`.
   * Xác nhận bộ lọc `"Kỹ năng"` xuất hiện ở cả hai danh sách.
   * Thử sửa tên bộ lọc bên Tài nguyên thành `"Kỹ năng chuyên môn"`. Xác nhận bên Khóa học **không bị đổi theo** (hai bên độc lập).
2. **Thêm giá trị lọc**:
   * Vào sửa bộ lọc `"Kỹ năng"` bên Tài nguyên, thêm giá trị `"Figma"`, tích `"Thêm giá trị này sang bộ lọc đối tác"`.
   * Xác nhận bên Khóa học cũng tự động nhận giá trị `"Figma"`.
3. **Sao chép hàng loạt giá trị lọc**:
   * Thêm tiếp các giá trị `"Sketch"`, `"Adobe XD"` bên Tài nguyên nhưng **không** chọn thêm sang đối tác.
   * Nhấn nút `"Sao chép giá trị sang Khóa học"`.
   * Kiểm tra bên Khóa học, xác nhận toàn bộ danh sách giá trị lọc hiện tại đã được đồng bộ trùng khớp với bên Tài nguyên.
4. **Xóa dữ liệu**:
   * Xóa giá trị `"Sketch"` bên Tài nguyên. Xác nhận bên Khóa học **vẫn giữ nguyên** giá trị `"Sketch"` (độc lập, không bị xóa theo).

# VIII. Todo

- [ ] Cập nhật API Convex `convex/resourceFilters.ts` để hỗ trợ sao chép dữ liệu sang `courseFilters`.
- [ ] Cập nhật API Convex `convex/courseFilters.ts` để hỗ trợ sao chép dữ liệu sang `resourceFilters`.
- [ ] Chỉnh sửa giao diện tạo bộ lọc tài nguyên `app/admin/resources/filters/create/page.tsx` bổ sung Checkbox tùy chọn sao chép.
- [ ] Chỉnh sửa giao diện chi tiết bộ lọc tài nguyên `app/admin/resources/filters/[id]/edit/page.tsx` bổ sung nút "Sao chép giá trị" và checkbox Dialog.
- [ ] Chỉnh sửa giao diện tạo bộ lọc khóa học `app/admin/courses/filters/create/page.tsx` bổ sung Checkbox tùy chọn sao chép.
- [ ] Chỉnh sửa giao diện chi tiết bộ lọc khóa học `app/admin/courses/filters/[id]/edit/page.tsx` bổ sung nút "Sao chép giá trị" và checkbox Dialog.
- [ ] Chạy lệnh `bunx tsc --noEmit` kiểm tra lỗi kiểu dữ liệu.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Tính năng sao chép hoạt động tốt tại thời điểm tương tác (Tạo mới bộ lọc / Tạo mới giá trị / Nhấn nút sao chép toàn bộ).
* Không có cơ chế đồng bộ tự động ngầm hai chiều (sửa/xóa một bên không ảnh hưởng bên kia sau khi đã sao chép).
* Không xảy ra lỗi đệ quy hay lỗi hệ thống ở Convex backend.
* Không có lỗi TypeScript (`tsc --noEmit` hoàn thành không lỗi).

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro trùng lặp khóa chính**: Khi sao chép giá trị lọc sang đối tác, cần kiểm tra xem giá trị lọc có slug trùng đã tồn tại chưa để tránh lỗi ghi đúp khóa chính.
  * *Giải pháp*: Trong API `copyValuesToPartner`, thực hiện kiểm tra và chỉ insert những giá trị có slug chưa tồn tại, hoặc patch cập nhật đè thay vì insert mới.
* **Hoàn tác**: Sử dụng `git checkout` để khôi phục các tệp tin nếu xảy ra lỗi.

# XI. Out of Scope (Ngoài phạm vi)

* Đồng bộ hóa dữ liệu lịch sử (các khóa học/tài nguyên đã gán bộ lọc từ trước sẽ không được tự động gán lại).
