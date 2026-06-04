# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề:** Hiện tại khi tải ảnh logo của đối tác lên hệ thống, công cụ cắt ảnh bắt buộc người dùng cắt theo hình vuông (tỷ lệ 1:1). Tuy nhiên, hầu hết logo của các công ty là hình chữ nhật nằm ngang. Khi bị ép vào hình vuông, logo sẽ bị mất hai bên đầu hoặc bị thu nhỏ lại kèm khoảng trống trên dưới rất lớn, khiến nó trông cực kỳ bé và không vừa khít khi hiển thị trong các layout nằm ngang như `Badge` và `Logo Cloud`.
- **Giải pháp:** Chuyển tỷ lệ cắt ảnh từ hình vuông (1:1) sang hình chữ nhật rộng (16:9 - `wide169`) cho tất cả các style hiển thị của Partners. Điều này giúp khung cắt ảnh khớp với ô hiển thị thumbnail (cũng là 16:9) và giúp logo nằm ngang hiển thị to rõ, vừa vặn nhất.
- **Cách làm:**
  - Định nghĩa tỷ lệ crop theo style trong `constants.ts` là `wide169`.
  - Truyền style hiện tại từ trang Edit/Create vào `PartnersForm`.
  - Cập nhật component `PartnersForm` sử dụng tỷ lệ crop động dựa theo style đang chọn.

## 2. Elaboration & Self-Explanation
Khi các doanh nghiệp thiết kế logo thương hiệu, họ thường thiết kế theo dạng chữ nhật ngang (Landscape) để dễ đọc tên công ty và biểu tượng đi kèm (ví dụ: Google, Microsoft, tpled, TPGCONS).
Trong code hiện tại, giao diện chỉnh sửa logo (`PartnersForm`) sử dụng `MultiImageUploader` cấu hình hiển thị ảnh xem trước dưới dạng video (16:9 - `aspectRatio="video"`) nhưng lại cấu hình khung cắt ảnh là hình vuông (1:1 - `cropAspectRatio="square"`). Điều này tạo ra hai mâu thuẫn lớn:
- **Trải nghiệm nhập liệu tệ:** Người dùng thấy ô chứa ảnh nằm ngang nhưng khi bấm "Cắt" thì khung cắt lại là hình vuông. Họ không thể chọn toàn bộ logo nằm ngang dài mà bắt buộc phải bỏ bớt chữ hoặc ký hiệu ở hai bên.
- **Trải nghiệm hiển thị xấu:** Khi ảnh bị cắt thành hình vuông 1:1, khi đưa vào các layout có thiết kế nằm ngang rộng như `Badge` (thanh trượt ngang các badge) và `Logo Cloud` (carousel các logo đối tác), logo sẽ phải co lại theo chiều cao tối đa của khung (chỉ từ 40px đến 80px). Vì ảnh là hình vuông, chiều rộng hiển thị cũng chỉ bằng chiều cao (40px-80px), để lại hai khoảng trống rất lớn ở hai bên và làm logo đối tác bé tí teo, mất mỹ quan nghiêm trọng.
Bằng việc chuyển đổi `cropAspectRatio` sang `wide169` (tỷ lệ 16:9), ảnh logo được cắt sẽ giữ nguyên hình dạng nằm ngang tự nhiên của nó. Khi hiển thị trong Badge hay Logo Cloud, nó sẽ tận dụng tối đa chiều rộng khả dụng của box chứa, giúp logo to rõ, vừa khít và thẩm mỹ hơn.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Logo `tpled` trong ảnh chụp màn hình có tỷ lệ khoảng 3:1 (chiều rộng gấp 3 lần chiều cao). Nếu bắt buộc crop 1:1, người dùng chỉ có thể chọn chữ `tp` hoặc chữ `led`, hoặc phải chèn thêm viền trắng cực dày ở trên và dưới để logo thành hình vuông. Khi hiển thị trên thanh trượt `Badge` (chiều cao 48px), logo vuông này chỉ rộng 48px (trong đó logo thực tế chỉ chiếm một phần rất nhỏ ở giữa), làm chữ thương hiệu biến thành các dấu chấm không thể đọc được. Nếu crop 16:9, ảnh crop sẽ ôm sát logo thương hiệu, giúp chiều rộng hiển thị đạt tới 85px trên thanh trượt, tăng gấp đôi kích thước hiển thị của logo.
- **Trực giác đời thường:** Nó giống như việc bạn cố nhét một chiếc tivi màn hình phẳng siêu rộng vào trong một chiếc hộp hình vuông. Bạn chỉ có hai lựa chọn: hoặc là cắt bỏ hai đầu của tivi (mất hình ảnh), hoặc là dùng một chiếc hộp vuông khổng lồ rồi chèn xốp cực dày ở trên và dưới (tivi trông sẽ rất nhỏ bé ở giữa căn phòng). Thay vào đó, ta chỉ cần đổi chiếc hộp thành hình chữ nhật vừa vặn với tivi là xong.

# II. Audit Summary (Tóm tắt kiểm tra)

- **Triệu chứng quan sát:**
  - Ảnh logo đối tác bị ép cắt theo tỷ lệ `square` (1:1).
  - Logo hiển thị trong layout `Badge` và `Logo Cloud` bị co nhỏ quá mức hoặc bị mất chi tiết hai bên.
  - Ô thumbnail uploader hiển thị tỉ lệ `video` (16:9) lệch với khung cắt `1:1`.
- **Phạm vi ảnh hưởng:** Trang tạo mới đối tác (`/admin/home-components/create/partners`), trang chỉnh sửa đối tác (`/admin/home-components/partners/[id]/edit`) và trang quản lý snapshot tương ứng.
- **Khả năng tái hiện:** 100% khi upload/cắt ảnh trong module đối tác.
- **Tiêu chí Pass/Fail:**
  - *Pass:* Khung cắt ảnh hiển thị tỷ lệ 16:9. Ảnh sau khi cắt hiển thị to rõ, cân đối trong các layout preview (Badge, Logo Cloud).
  - *Fail:* Khung cắt ảnh vẫn là hình vuông 1:1, hoặc việc thay đổi làm lỗi typecheck dự án.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc:** Thuộc tính `cropAspectRatio` trong component `PartnersForm.tsx` đang được hardcode là `"square"`.
- **Giả thuyết đối chứng:**
  - *Nếu chỉnh sửa CSS ở client để kéo giãn ảnh vuông:* Ảnh sẽ bị méo hình (stretch), vi phạm nghiêm trọng tính nhận diện thương hiệu của logo đối tác.
  - *Nếu đổi logo sang dạng background-cover:* Logo sẽ bị mất góc, mất chữ.
  - *Kết luận:* Thay đổi tỷ lệ cắt ảnh (`cropAspectRatio`) ở uploader là giải pháp chính xác và bền vững nhất.

# IV. Proposal (Đề xuất)

- **Giải pháp kỹ thuật:**
  1. Khai báo hằng số mapping tỷ lệ crop theo style trong `app/admin/home-components/partners/_lib/constants.ts`:
     ```typescript
     export const PARTNERS_CROP_ASPECT_RATIO_BY_STYLE: Record<PartnersStyle, ImageAspectRatioInput> = {
       grid: 'wide169',
       marquee: 'wide169',
       badge: 'wide169',
       carousel: 'wide169',
       logoCloud: 'wide169',
       clean: 'wide169',
       divider: 'wide169',
     };
     ```
  2. Cập nhật interface `PartnersFormProps` trong `PartnersForm.tsx` nhận thêm prop `selectedStyle?: PartnersStyle`.
  3. Sử dụng `selectedStyle` để lấy tỷ lệ crop tương ứng từ `PARTNERS_CROP_ASPECT_RATIO_BY_STYLE` (fallback về `'wide169'` nếu không truyền). Truyền tỷ lệ này vào prop `cropAspectRatio` của `MultiImageUploader`.
  4. Truyền `selectedStyle={partnersStyle}` (hoặc tương tự) từ các trang cha:
     - `app/admin/home-components/partners/[id]/edit/page.tsx`
     - `app/admin/home-components/create/partners/page.tsx`
     - `app/admin/home-components/snapshots/_components/SnapshotRouterMain.tsx`

# V. Files Impacted (Tệp bị ảnh hưởng)

- `Sửa:` [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_lib/constants.ts)
  - Vai trò: Khai báo các hằng số dùng chung của module Partners.
  - Thay đổi: Thêm hằng số `PARTNERS_CROP_ASPECT_RATIO_BY_STYLE` ánh xạ từng style hiển thị của đối tác sang tỷ lệ cắt ảnh 16:9 (`wide169`).
- `Sửa:` [PartnersForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_components/PartnersForm.tsx)
  - Vai trò: Form chỉnh sửa cấu hình hiển thị và upload danh sách logo đối tác.
  - Thay đổi: Nhận prop `selectedStyle?: PartnersStyle`, tính toán `cropAspectRatio` động theo style và truyền vào `MultiImageUploader`.
- `Sửa:` [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/%5Bid%5D/edit/page.tsx)
  - Vai trò: Trang chỉnh sửa live component Partners.
  - Thay đổi: Truyền `selectedStyle={partnersStyle}` vào `<PartnersForm`.
- `Sửa:` [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/create/partners/page.tsx)
  - Vai trò: Trang tạo mới component Partners.
  - Thay đổi: Truyền `selectedStyle={partnersStyle}` vào `<PartnersForm`.
- `Sửa:` [SnapshotRouterMain.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/snapshots/_components/SnapshotRouterMain.tsx)
  - Vai trò: Quản lý biểu mẫu chỉnh sửa các snapshot của component.
  - Thay đổi: Truyền `selectedStyle={state.style}` vào `<PartnersForm` trong adapter `partnersSnapshotAdapter`.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và chỉnh sửa [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_lib/constants.ts) để thêm mapping tỷ lệ crop.
2. Đọc và chỉnh sửa [PartnersForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_components/PartnersForm.tsx) để hỗ trợ prop `selectedStyle` và áp dụng tỷ lệ crop động.
3. Đọc và chỉnh sửa các trang cha sử dụng `<PartnersForm` để truyền đúng prop `selectedStyle`.
4. Thực hiện typecheck dự án bằng `bunx tsc --noEmit` để đảm bảo không phát sinh lỗi biên dịch.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh `bunx tsc --noEmit` thủ công trong workspace để đảm bảo toàn bộ dự án không bị lỗi TypeScript sau khi sửa đổi API của component.

### Manual Verification
- Người dùng truy cập trang chỉnh sửa/tạo mới đối tác, chuyển qua lại các layout (Grid, Marquee, Badge, Carousel, Logo Cloud, Clean, Divider).
- Bấm nút "Cắt" hoặc tải lên ảnh mới, kiểm tra xem tỷ lệ khung crop hiển thị có phải là hình chữ nhật ngang 16:9 (`Cắt Rộng (16:9)`) thay vì hình vuông 1:1 như trước hay không.
- Kiểm tra xem ảnh logo sau khi crop hiển thị vừa vặn, cân đối trong các khung Preview của layout `Badge` và `Logo Cloud`.

# VIII. Todo

- [ ] Thêm `PARTNERS_CROP_ASPECT_RATIO_BY_STYLE` vào `constants.ts`.
- [ ] Chỉnh sửa `PartnersForm.tsx` nhận prop `selectedStyle` và truyền cho `MultiImageUploader`.
- [ ] Truyền `selectedStyle` ở `app/admin/home-components/partners/[id]/edit/page.tsx`.
- [ ] Truyền `selectedStyle` ở `app/admin/home-components/create/partners/page.tsx`.
- [ ] Truyền `selectedStyle` ở `app/admin/home-components/snapshots/_components/SnapshotRouterMain.tsx`.
- [ ] Chạy kiểm tra TypeScript (`bunx tsc --noEmit`).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Khung cắt ảnh trong uploader của module Partners hiển thị tỷ lệ chữ nhật ngang 16:9 thay vì 1:1.
- Không phát sinh bất kỳ lỗi TypeScript nào trong các file liên quan.
- Logo của đối tác hiển thị đầy đủ, to rõ và không bị thu nhỏ quá mức trong layout preview của `Badge` và `Logo Cloud`.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Một số logo có hình dáng đặc biệt đứng dọc hoặc quá vuông sẽ có khoảng trống trắng hai bên khi crop 16:9. Tuy nhiên, điều này vẫn tốt hơn việc logo ngang bị cắt cụt hai bên, và uploader đã dùng `imageFit="contain"` nên ảnh logo vuông vẫn hiển thị trọn vẹn ở giữa khung mà không bị bóp méo.
- **Hoàn tác:** Khôi phục các tệp tin đã sửa đổi về trạng thái commit gần nhất bằng `git checkout`.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào CSS layout cốt lõi của các component render ở trang chủ của user (site render) nếu không cần thiết.
- Không thay đổi các thuộc tính dữ liệu lưu trữ trong database (Convex schema).
