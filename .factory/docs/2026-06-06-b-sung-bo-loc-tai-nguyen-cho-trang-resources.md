# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn vào thư viện tài nguyên (ví dụ trang web tải sách, file mẫu thiết kế), bạn muốn tìm các tài nguyên làm bằng AutoCAD hay Blender. Hiện tại, nếu trang web hiển thị theo kiểu danh sách ngang (không có thanh bên), nút chọn phần mềm để lọc đã bị biến mất, mặc dù trong trang quản trị ta đã cài đặt đầy đủ các phần mềm này. Chúng ta cần đưa nút chọn này trở lại thanh ngang ở cả trang web thực tế và trang xem thử (preview) trong quản trị để người dùng dễ dàng bấm chọn và lọc tài nguyên.

## 2. Elaboration & Self-Explanation
Hiện tại, module Tài nguyên (Resources) hỗ trợ tính năng Bộ lọc động (Resource Filters - ví dụ lọc theo phần mềm Blender, AutoCAD...). Trên trang hiển thị thực tế:
- Khi cấu hình giao diện chọn bố cục là Thanh bên (Sidebar), các bộ lọc được vẽ dọc ở thanh bên này và hoạt động bình thường.
- Khi chọn bố cục là Lưới (Grid) hoặc Nổi bật (Masonry), các bộ lọc sẽ hiển thị trên một thanh ngang phía trên. Tuy nhiên, thanh ngang này hiện tại mới chỉ có ô tìm kiếm, dropdown chọn danh mục và dropdown sắp xếp, hoàn toàn thiếu dropdown để chọn bộ lọc tài nguyên.

Đồng thời, trang xem trước (preview) trong hệ thống quản trị giao diện (Experiences Editor) của tài nguyên cũng gặp lỗi lệch giao diện tương tự: nó chưa vẽ dropdown bộ lọc tài nguyên giả lập khi người dùng chuyển đổi qua lại giữa các kiểu bố cục, khiến người quản trị không thấy được bộ lọc trông như thế nào trước khi lưu.

Chúng ta sẽ sửa code ở cả trang hiển thị chính thức của khách hàng (`ResourcesPage.tsx`) và tệp vẽ preview trong quản trị (`ResourcePreview.tsx`) để hiển thị dropdown bộ lọc khi bố cục không phải là thanh bên.

## 3. Concrete Examples & Analogies
Tưởng tượng bạn đi siêu thị mua gia vị:
- Thiết kế kiểu **Sidebar (Thanh bên)** giống như việc siêu thị xếp một dãy kệ dọc riêng cho "Gia vị lẩu", "Gia vị nướng", "Gia vị nấu canh". Bạn đi dọc dãy kệ để lấy.
- Thiết kế kiểu **Grid/Masonry (Thanh ngang)** giống như việc siêu thị gom hết các gói gia vị lên một bàn tròn lớn ở giữa sảnh để tiết kiệm không gian. Trên bàn tròn đó có biển chỉ dẫn "Chọn danh mục" (ví dụ: Hãng Ajinomoto, Hãng Cholimex) nhưng lại quên không làm biển "Chọn loại món ăn" (lẩu, nướng...). Việc thiếu này khiến bạn không thể lọc nhanh được gói gia vị lẩu mình cần giữa hàng trăm gói khác nhau. Việc thêm dropdown bộ lọc ở thanh ngang chính là việc cắm thêm cái biển phân loại món ăn lên bàn tròn đó.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Trang hiển thị chính thức (`ResourcesPage.tsx`):**
  - Đã có đầy đủ query lấy trạng thái tính năng `resourceFiltersFeature`, danh sách bộ lọc hoạt động `activeFilters` và tất cả các giá trị bộ lọc `allFilterValues`.
  - Nhánh `config.layoutStyle === 'sidebar'` đã render thành công bộ lọc dạng danh sách nhóm.
  - Nhánh `else` (dòng 411 - 446) vẽ thanh ngang điều khiển nhưng hoàn toàn bỏ qua việc render dropdown lọc phần mềm/công cụ.
- **Trang Preview (`ResourcePreview.tsx`):**
  - Preview `ResourcesListPreview` giả lập thanh lọc ngang rất đơn sơ bằng cách render danh mục tĩnh `CATEGORIES` dạng tag inline, hoàn toàn không khớp với cấu trúc dropdown thực tế của `ResourcesPage.tsx`.
  - Chưa hề truy vấn trạng thái tính năng `resourceFiltersFeature` từ Convex để ẩn/hiện bộ lọc giả lập cho đúng logic nghiệp vụ.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc (Root Cause):**
  - Trong tệp `ResourcesPage.tsx`, lập trình viên trước đó chỉ triển khai khối render bộ lọc động ở nhánh `sidebar` mà quên viết khối render tương ứng bằng dropdown ở nhánh `else` (dành cho Grid và Masonry layout).
  - Trong tệp `ResourcePreview.tsx`, giao diện preview chưa được đồng bộ hóa với giao diện thật, thiếu dropdown giả lập bộ lọc tài nguyên giống như bên module Khóa học (`CoursePreview.tsx`).
- **Giả thuyết đối chứng (Counter-Hypothesis):**
  - Nếu chỉ sửa ở `ResourcesPage.tsx` mà không sửa ở `ResourcePreview.tsx`, người dùng ngoài trang chủ sẽ lọc được tài nguyên bình thường, nhưng admin khi vào cấu hình ở `system/experiences/resources-list` sẽ thấy màn hình preview bị lệch và không hiển thị bộ lọc, gây hoang mang và vi phạm tính nhất quán của hệ thống.

---

# IV. Proposal (Đề xuất)

- **Sửa 1: Cập nhật `ResourcesPage.tsx` (Trang thực tế)**
  - Chèn một `CustomDropdown` cho bộ lọc tài nguyên vào thanh điều khiển ngang (nhánh `else` của layout style).
  - Options của dropdown này sẽ gồm: dòng đầu tiên là "Tất cả [tên bộ lọc đầu tiên]" (ví dụ: "Tất cả phần mềm") hoặc "Tất cả bộ lọc" nếu không xác định được tên bộ lọc; các dòng tiếp theo là danh sách các giá trị bộ lọc hoạt động từ `allFilterValues`.
  - Khi người dùng chọn một giá trị, sẽ gọi hàm `handleFilterChange(value || null)` có sẵn để thực hiện lọc dữ liệu trên DB.
- **Sửa 2: Cập nhật `ResourcePreview.tsx` (Trang preview)**
  - Định nghĩa component `CustomDropdown` helper nội bộ (tương tự như bên `CoursePreview.tsx`).
  - Lấy trạng thái feature `resourceFiltersFeature` bằng `useQuery`.
  - Đồng bộ hóa thanh lọc của `ResourcesListPreview` khi `layoutStyle !== 'sidebar'`: sử dụng dropdown cho danh mục, bộ lọc phần mềm giả lập, và sắp xếp thay vì vẽ inline các tag danh mục tĩnh như cũ.
  - Khi ở `layoutStyle === 'sidebar'`, hiển thị khối bộ lọc giả lập bên thanh bên aside giống thiết kế thật.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa:** [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx)
  - *Vai trò hiện tại:* Trang hiển thị danh sách tài nguyên phía ngoài client cho khách hàng truy cập.
  - *Thay đổi:* Bổ sung dropdown bộ lọc tài nguyên động vào thanh lọc ngang (khi layoutStyle không phải sidebar).
- **Sửa:** [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx)
  - *Vai trò hiện tại:* Vẽ giao diện xem trước (preview) của danh sách tài nguyên trong trang quản trị cấu hình.
  - *Thay đổi:* Thêm component dropdown nội bộ, truy vấn module feature `enableResourceFilters`, vẽ các dropdown lọc danh mục và phần mềm giả lập tương ứng để đồng bộ 100% với giao diện thực tế.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và chỉnh sửa `ResourcesPage.tsx`:**
   - Xác định vị trí chèn dropdown bộ lọc: đặt giữa dropdown Danh mục (`CustomDropdown` của `activeCategoryId`) và dropdown Sắp xếp (`CustomDropdown` của `sortBy`).
   - Sử dụng các biến `resourceFiltersFeature`, `activeFilters`, `allFilterValues`, `activeFilterSlugs` và hàm `handleFilterChange` đã có sẵn.
2. **Đọc và chỉnh sửa `ResourcePreview.tsx`:**
   - Import `useQuery` từ `convex/react` và `api` từ `@/convex/_generated/api`.
   - Copy định nghĩa `CustomDropdown` từ `CoursePreview.tsx` qua để có dropdown xem thử gọn đẹp.
   - Thêm mock filter values: `['Blender', 'Adobe After Effects', 'PR', 'AutoCAD 2D']` để khớp với screenshot dữ liệu của user.
   - Cấu trúc lại hàm render của `ResourcesListPreview` để render dropdowns thay vì tag inline khi layout khác `sidebar`.
3. **Kiểm tra tĩnh:** Rà soát kiểu dữ liệu TypeScript, import đầy đủ, không thừa biến không dùng.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Dự án có hệ thống Git Hook tự động chạy Oxlint và TypeScript compiler (`tsc --noEmit`) khi commit, nên chúng ta sẽ kiểm tra xem code có compile thành công mà không có lỗi TypeScript hay không.

### Manual Verification
- Phía khách hàng: Truy cập `http://localhost:3000/resources` ở các bố cục khác nhau (Grid, Masonry) và xác nhận dropdown Bộ lọc xuất hiện đầy đủ, khi chọn một phần mềm (ví dụ AutoCAD 2D), danh sách tài nguyên được lọc chính xác.
- Phía quản trị: Truy cập `http://localhost:3000/system/experiences/resources-list`, thay đổi các bố cục khác nhau và xem phần Preview xem dropdowns bộ lọc giả lập có hiển thị và thay đổi giao diện mượt mà hay không.

---

# VIII. Todo

- [ ] Sửa file [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx) để thêm dropdown bộ lọc động ở layout ngang.
- [ ] Sửa file [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx) để bổ sung dropdown giả lập và đồng bộ hóa giao diện preview.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Trang `http://localhost:3000/resources` hiển thị dropdown bộ lọc tài nguyên khi cấu hình module ở chế độ `Grid` hoặc `Masonry`.
- Lọc tài nguyên bằng dropdown hoạt động chính xác (URL cập nhật query param `filter=...` và danh sách tải lại đúng các tài nguyên có gán bộ lọc đó).
- Trang `http://localhost:3000/system/experiences/resources-list` hiển thị đúng dropdown bộ lọc giả lập trong phần Preview trình duyệt ảo khi đổi các kiểu Layout.
- Không có lỗi biên dịch TypeScript (`tsc --noEmit`) hay lỗi cú pháp.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Lỗi import `useQuery` trong `ResourcePreview.tsx` nếu môi trường chạy preview bị giới hạn context.
- **Hoàn tác:** Dùng lệnh `git checkout` để khôi phục trạng thái file cũ nếu xảy ra lỗi nghiêm trọng.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không chỉnh sửa database schema hay dữ liệu thật trong Convex.
- Không thay đổi logic phân trang hoặc tìm kiếm từ khóa.
- Không sửa giao diện chi tiết tài nguyên (`ResourceDetailPage.tsx`).
