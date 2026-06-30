# I. Primer

## 1. TL;DR kiểu Feynman
- Khi một trang web React vẽ ra một danh sách các phần tử, nó cần một cái nhãn dán duy nhất (gọi là `key`) cho mỗi phần tử để biết phần tử nào thay đổi, thêm hoặc xóa. Nếu nhãn dán bị trống hoặc giống nhau, React sẽ bị bối rối và cảnh báo lỗi. Ở đây, một số logo đối tác bị gán nhãn dán rỗng `""` vì link hay id của chúng trống.
- Ngoài ra, khi trang web cố gắng đếm số lượng chữ chạy bằng cách đo độ dài danh sách (`items.length`), nhưng danh sách đó chưa được tạo ra (`undefined`), nó sẽ bị crash lập tức. Giải pháp là gán sẵn một danh sách trống `[]` nếu không tìm thấy dữ liệu.

## 2. Elaboration & Self-Explanation
- Lỗi 1 xảy ra ở `PartnersGlassLogoCloudShared.tsx`. Đoạn mã dùng `const key = item.id ?? item.link ?? item.url ?? index;` để gán key. Nếu `item.id` là `""` (chuỗi rỗng), toán tử `??` (nullish coalescing) sẽ chấp nhận `""` vì nó không phải là `null` hay `undefined`. Do đó React nhận được nhiều phần tử có `key=""`, gây ra cảnh báo trùng lặp key rỗng.
- Lỗi 2 xảy ra ở `MarqueePreview.tsx` khi truy cập `items.length` mà `items` lại không được truyền hoặc truyền vào giá trị `undefined`. Điều này trực tiếp gây ra lỗi crash runtime `TypeError`.
- Ta sẽ khắc phục bằng cách:
  - Kiểm tra xem `item.id` có thực sự hợp lệ (không rỗng, không undefined/null) trước khi làm key. Nếu không, ta kiểm tra tiếp `item.link` và `item.url` (sử dụng toán tử OR `||` để tự động bỏ qua chuỗi rỗng `""`). Nếu tất cả đều không có giá trị, ta dùng `index` làm fallback cuối cùng.
  - Sử dụng giá trị mặc định `items = []` khi khai báo prop của `MarqueePreview` và `MarqueeSectionShared` để đảm bảo `items` luôn là một mảng, từ đó gọi `.length` an toàn.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể (Key trùng):** Nếu một danh sách đối tác gồm:
  - Đối tác A: `{ id: "", link: "", url: "logoA.png" }`
  - Đối tác B: `{ id: "", link: "", url: "logoB.png" }`
  Với code cũ: `key` của Đối tác A sẽ lấy `item.id` (vì nó không phải null/undefined), tức là `""`. Tương tự, `key` của Đối tác B cũng là `""`. Kết quả là React nhận hai phần tử có cùng `key=""`.
  Với code mới: `item.id` là `""` (bị coi là không hợp lệ), code sẽ chuyển sang xem `item.link` (cũng `""` nên bỏ qua), rồi xem `item.url` (lấy `"logoA.png"` cho đối tác A và `"logoB.png"` cho đối tác B). Nhờ đó key trở nên độc bản.
- **Ví dụ đời thường (Crash do Undefined):** Nó giống như việc bạn bảo thư đếm số sách trong một chiếc hộp (`items.length`), nhưng thực tế bạn thậm chí còn chưa đưa cho thư thủ chiếc hộp nào (`items` là `undefined`). Thủ thư sẽ đứng hình và không biết làm thế nào (crash). Nếu chúng ta luôn đưa cho thủ thư ít nhất một chiếc hộp rỗng (`items = []`), thủ thư sẽ đếm được là 0 quyển sách và tiếp tục làm việc bình thường.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Console báo lỗi trùng key `""` trong Partners component; trang HomeComponentsPage bị crash trắng khi mở tab Marquee do lỗi `Cannot read properties of undefined (reading 'length')`.
- Tệp liên quan:
  - `app/admin/home-components/partners/_components/PartnersGlassLogoCloudShared.tsx`
  - `app/admin/home-components/marquee/_components/MarqueePreview.tsx`
  - `app/admin/home-components/marquee/_components/MarqueeSectionShared.tsx`

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc (Root Cause):**
  - Logic xác định `key` trong `PartnersGlassLogoCloudShared` sử dụng toán tử `??` không lọc bỏ trường hợp chuỗi rỗng `""`, dẫn tới key bị trùng lặp khi nhiều item có thuộc tính trống.
  - `items` trong `MarqueePreview` không được khởi tạo mặc định là `[]` trong khi code gọi `items.length` trực tiếp.
- **Giả thuyết đối chứng (Counter-Hypothesis):**
  - Liệu có phải do dữ liệu trả về từ database bị lỗi cấu trúc? Dù dữ liệu thế nào, phía frontend component hiển thị (UI components) luôn phải có cơ chế phòng thủ tốt (defense-in-depth) để không crash cả trang khi dữ liệu thiếu hoặc không đúng chuẩn.

# IV. Proposal (Đề xuất)
- Cập nhật logic tạo key trong `PartnersGlassLogoCloudShared.tsx`.
- Gán giá trị mặc định cho `items` trong `MarqueePreview.tsx` và `MarqueeSectionShared.tsx`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [PartnersGlassLogoCloudShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_components/PartnersGlassLogoCloudShared.tsx): Thay đổi logic sinh key từ dùng `??` sang kiểm tra chuỗi rỗng chặt chẽ hơn.
- `Sửa:` [MarqueePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/marquee/_components/MarqueePreview.tsx): Khai báo giá trị mặc định `items = []` và sử dụng safe navigation.
- `Sửa:` [MarqueeSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/marquee/_components/MarqueeSectionShared.tsx): Khai báo giá trị mặc định `items = []` ở destructuring để tránh crash khi gọi `.length` bên trong component.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật `PartnersGlassLogoCloudShared.tsx` tại vị trí gán `key`.
2. Cập nhật `MarqueePreview.tsx` để gán `items = []` mặc định.
3. Cập nhật `MarqueeSectionShared.tsx` tương tự.
4. Kiểm tra tĩnh bằng compiler (`tsc --noEmit`).

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra biên dịch TypeScript: chạy lệnh `bunx tsc --noEmit` để đảm bảo không lỗi cú pháp hay kiểu dữ liệu.
- Kiểm tra thủ công:
  - Tải lại trang Admin Components.
  - Kiểm tra tab Partners xem còn lỗi key trùng trong console không.
  - Kiểm tra tab Marquee xem đã hiển thị bình thường mà không bị crash hay không.

# VIII. Todo
- [ ] Sửa file `PartnersGlassLogoCloudShared.tsx`
- [ ] Sửa file `MarqueePreview.tsx`
- [ ] Sửa file `MarqueeSectionShared.tsx`
- [ ] Kiểm tra lỗi biên dịch TypeScript

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- 100% không còn lỗi crash runtime tại `MarqueePreview` do `items` bị `undefined`.
- 100% không còn console warning về việc trùng lặp key React trong `PartnersGlassLogoCloudShared`.
- Biên dịch TypeScript thành công không có lỗi mới.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực kỳ thấp vì thay đổi nhỏ và chỉ mang tính chất phòng thủ dữ liệu đầu vào.
- Hoàn tác đơn giản bằng lệnh `git checkout` các file đã chỉnh sửa.

# XI. Out of Scope (Ngoài phạm vi)
- Không refactor các phần logic khác của Marquee hay Partners không liên quan đến lỗi.
