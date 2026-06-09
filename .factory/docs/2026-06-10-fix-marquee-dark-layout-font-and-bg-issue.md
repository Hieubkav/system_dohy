# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Khi xem ở trang quản trị (admin preview), chữ chạy (Marquee) hiển thị rất đẹp với nền đen chữ trắng và đúng font chữ đã chọn. Nhưng khi ra trang web thực tế (site thực), chữ chạy lại hiển thị sai font và nền không có màu đen.
- **Nguyên nhân**: 
  1. Font chữ bị sai vì site thực tế không truyền biến CSS font và class font trực tiếp vào component chữ chạy, khiến trình duyệt sử dụng font mặc định do các CSS rule khác đè lên.
  2. Nền không đen có thể do cấu hình giao diện `style` của component ở site thực tế nhận giá trị khác hoặc bị lỗi cấu hình khi render ở client.
- **Giải pháp**:
  1. Sửa code render để truyền đầy đủ font và class font trực tiếp vào component chữ chạy ở site thực tế.
  2. Thêm log kiểm tra cấu hình thực tế của component Marquee nhận được ở site thực tế để xác định tại sao màu nền không chuyển sang đen slate, từ đó xử lý triệt để.

## 2. Elaboration & Self-Explanation
Giao diện site thực tế hiển thị các khối (home components) bằng cách nạp danh sách từ database và render qua `ComponentRenderer.tsx`. Đối với component Marquee (chữ chạy), trang preview trong admin truyền trực tiếp class `font-active` và style chứa biến font `--font-active` vào component `MarqueeSectionShared`. Điều này giúp text và toàn bộ section nhận diện đúng font chữ tùy chỉnh.

Tuy nhiên, ở site thực tế (`ComponentRenderer.tsx`), component `MarqueeSection` được bọc bên ngoài bởi một thẻ `div` chứa font, nhưng bản thân thẻ `<section>` bên trong lại không nhận được class và style trực tiếp này. Khi CSS global hoặc các class Tailwind đè font-family lên các phần tử con, cơ chế kế thừa từ `div` bên ngoài bị mất tác dụng.

Đối với lỗi nền không đen, khi cấu hình `style` là `'dark'`, component sẽ render `DarkLayout` với style inline `backgroundColor: tokens.darkBg` (màu `#0f172a`). Nếu nền không đen, có khả năng `config.style` thực tế nhận được ở trang chủ bị sai lệch hoặc rỗng dẫn đến rơi vào layout mặc định (`RibbonLayout` - nền màu brand). Chúng ta sẽ thêm log để theo dõi chính xác cấu hình đầu vào ở site thực tế.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Khi ta chọn font Montserrat và layout Dark cho Marquee:
  - Ở Admin: Render `<section class="font-active" style="--font-active: var(--font-montserrat)">` trực tiếp -> Chữ hiển thị đúng font Montserrat và nền đen.
  - Ở Site thực tế: Render `<div class="font-active" style="--font-active: var(--font-montserrat)"><section class="undefined" style="undefined">` -> Thẻ `<section>` không có class font trực tiếp, các thẻ `span` bên trong bị CSS của website đè font mặc định Be Vietnam Pro.
- **Analogy**: Giống như việc bạn mặc một chiếc áo khoác chống nước rất tốt (div wrapper bên ngoài) nhưng bên trong bạn mặc một chiếc áo thun thấm nước (section không có class). Khi trời mưa (CSS đè), nước vẫn thấm vào áo thun của bạn vì nó không được phủ lớp chống nước trực tiếp.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra cơ chế render font của `ComponentRenderer.tsx` and `MarqueeSectionShared.tsx`.
- Phát hiện sự không đồng bộ: Preview admin truyền trực tiếp `fontStyle` và `fontClassName` xuống `MarqueeSectionSharedProps`, trong khi site thực tế (`ComponentRenderer.tsx`) chỉ dùng `wrapWithFont` bọc ngoài mà không truyền trực tiếp.
- Đã query dữ liệu thật từ Convex DB: Component Marquee có ID `mx75t4kxmaz560fb6rmv8yzx45881z45` thực sự đang lưu cấu hình `"style": "dark"`. Do đó, trên site thực tế lý thuyết phải nhận `'dark'`, nhưng thực tế hiển thị lại không đen. Ta cần đặt log kiểm tra cấu hình runtime ở site thực tế.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause (Nguyên nhân gốc)**:
  1. **Lỗi Font**: Thẻ `<section>` của `MarqueeSectionShared` không nhận được `fontClassName` và `fontStyle` ở site thực tế, khiến nó không áp dụng class `font-active` trực tiếp lên element cha của Marquee, dẫn đến các class Tailwind khác đè font-family.
  2. **Lỗi Nền không đen**:
     - *Giả thuyết A*: `config.style` bị rỗng hoặc lỗi phân giải ở client-side khiến nó fallback về `RibbonLayout` (nền màu thương hiệu).
     - *Giả thuyết B*: Do hydration mismatch hoặc cache client giữ config cũ nên site thực tế chưa nhận được cấu hình `dark` mới nhất.
- **Counter-Hypothesis (Giả thuyết đối chứng)**: Nếu chúng ta truyền đúng font trực tiếp và đảm bảo style phân giải chính xác thành `'dark'`, giao diện sẽ hiển thị chuẩn xác như preview.

---

# IV. Proposal (Đề xuất)
1. Cập nhật `ComponentRenderer.tsx` để truyền trực tiếp `fontStyle` và `fontClassName="font-active"` vào component `MarqueeSection`.
2. Sửa signature của `MarqueeSection` trong `ComponentRenderer.tsx` để nhận `fontStyle` và `fontClassName` rồi truyền tiếp xuống `MarqueeSectionShared`.
3. Thêm log tạm thời trong `MarqueeSection` ở site thực tế để ghi nhận giá trị `config.style` và `tokens` nhằm xác minh giả thuyết về màu nền.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa`: [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/ComponentRenderer.tsx)
  - Cập nhật cách gọi `MarqueeSection` ở switch case `Marquee`.
  - Cập nhật định nghĩa component `MarqueeSection` để nhận và truyền tiếp `fontStyle`, `fontClassName`.
  - Thêm log tạm thời debug cấu hình.

---

# VI. Execution Preview (Xem trước thực thi)
1. Sửa đổi file `components/site/ComponentRenderer.tsx` theo đề xuất.
2. Theo dõi log console ở trình duyệt trên site thực tế để kiểm tra dữ liệu của component Marquee.
3. Sửa chữa dứt điểm dựa trên thông tin log thu được (nếu cần thiết).
4. Dọn dẹp log debug trước khi bàn giao.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Yêu cầu người dùng (hoặc kiểm tra ở local) tải lại site thực tế `http://localhost:3000/`.
- Kiểm tra xem component Marquee đã nhận đúng font chữ Montserrat (hoặc font đã chọn) và nền màu đen slate `#0f172a` chưa.
- Kiểm tra console log xem giá trị config nhận được là gì.

---

# VIII. Todo
- [ ] Cập nhật file `components/site/ComponentRenderer.tsx` để truyền font props trực tiếp.
- [ ] Thêm console log debug trong `MarqueeSection` để kiểm tra config thực tế ở site.
- [ ] Kiểm tra hiển thị trên trình duyệt ở localhost.
- [ ] Gỡ bỏ console log debug sau khi xác minh.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Component Marquee hiển thị đúng font chữ đã cấu hình ở site thực tế.
- Component Marquee hiển thị đúng màu nền đen slate (`#0f172a`) ở layout Dark trên site thực tế.
- Không phát sinh lỗi TypeScript hay lỗi biên dịch.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực thấp vì đây chỉ là thay đổi nhỏ về prop truyền nhận và style hiển thị của component Marquee.
- Rollback dễ dàng bằng git checkout.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa các phần logic lưu trữ hoặc schema database.
- Không sửa đổi các layout của các component khác ngoài Marquee.
