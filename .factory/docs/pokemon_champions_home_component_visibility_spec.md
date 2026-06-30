# I. Primer

## 1. TL;DR kiểu Feynman
* **Mục tiêu:** Ẩn component "Pokemon Champions" ở trang tạo Home Component mới khi mini app này hoặc tích hợp Home Component của nó bị tắt trong cấu hình hệ thống.
* **Vấn đề:** Dù Pokemon Champions đã được tắt ở trang quản trị hệ thống, thẻ chọn tạo mới component này vẫn hiển thị ở `/admin/home-components/create`.
* **Giải pháp:** Sử dụng Convex query `api.miniApps.listAll` để lấy trạng thái cấu hình của mini app Pokemon Champions ở trang `/admin/home-components/create/page.tsx` và thực hiện lọc bỏ component này khỏi danh sách nếu mini app hoặc tích hợp của nó bị tắt.

## 2. Elaboration & Self-Explanation
* Hiện tại, trang chọn loại Home Component để tạo mới (`/admin/home-components/create`) chỉ lấy danh sách tĩnh từ file định nghĩa hệ thống `HOME_COMPONENT_BASE_TYPES` và lọc theo cấu hình `hiddenTypes` trong `systemConfig`.
* Trang này chưa thực hiện kiểm tra trạng thái hoạt động của mini app Pokémon Champions trong bảng `miniApps` ở Convex database.
* Do đó, chúng ta cần query trạng thái của các mini-app trong database Convex, tìm mini app `pokemon-champions` và kiểm tra xem trường `enabled` của nó và trường `config.homeComponent.enabled` có bằng `true` hay không. Nếu không, ta ẩn tùy chọn tạo component này khỏi giao diện để tránh việc admin tạo component khi tính năng đang bị vô hiệu hóa.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Khi Admin truy cập `/system/mini-apps` và tắt tùy chọn "Bật mini app" hoặc "Hiện ở Home Components" của Pokémon Champions, khi quay lại trang tạo mới Home Component `/admin/home-components/create`, thẻ "Pokemon Champions" sẽ không còn xuất hiện trong danh sách "Các component còn lại" hay "Gợi ý". Khi bật lại, thẻ này sẽ hiển thị bình thường.
* **Ví dụ đời thường:** Giống như một nhà hàng tạm thời đóng cửa món "Lẩu cá" trong thực đơn điện tử của hệ thống quản lý. Khi khách hàng mở trang gọi món mới, món "Lẩu cá" sẽ biến mất khỏi danh sách các món có thể chọn đặt, tránh việc khách chọn món đã hết.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Các file liên quan:**
  * [page.tsx (create home-component)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/create/page.tsx): Trang hiển thị các thẻ chọn để tạo mới Home Component.
* **Trạng thái dữ liệu:**
  * Bảng `miniApps` chứa cấu hình hoạt động của các mini app. Bản ghi của Pokémon Champions có `key === 'pokemon-champions'`.
  * Các trường cần kiểm tra: `enabled` (Trạng thái bật/tắt mini app) và `config.homeComponent.enabled` (Trạng thái tích hợp Home Component).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Độ tin cậy nguyên nhân gốc:** High.
* **Câu hỏi Root Cause Protocol:**
  1. *Triệu chứng quan sát được là gì (expected vs actual)?*
     * Expected: Khi Pokemon Champions mini app đã tắt hoặc tích hợp home component đã tắt, thẻ tạo mới component tương ứng tại `/admin/home-components/create` phải ẩn đi.
     * Actual: Thẻ này vẫn hiển thị và cho phép admin click vào để tạo.
  3. *Có tái hiện ổn định không? điều kiện tái hiện tối thiểu?*
     * Có, tái hiện 100%. Tắt mini app Pokémon Champions ở `/system/mini-apps` rồi vào `/admin/home-components/create` vẫn thấy thẻ.
  6. *Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?*
     * Không, vì code UI trong [page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/create/page.tsx) hoàn toàn không có logic query bảng `miniApps` để filter danh sách.
  8. *Tiêu chí pass/fail sau khi sửa?*
     * Pass: Thẻ biến mất khi tắt cấu hình và xuất hiện lại khi bật cấu hình.

# IV. Proposal (Đề xuất)
* **Thêm Convex query `api.miniApps.listAll`:**
  * Gọi query này trong component `HomeComponentCreatePage`.
* **Cập nhật logic lọc `visibleTypes`:**
  * Khi duyệt qua các loại component, nếu loại đó là `PokemonChampions`, ta kiểm tra xem bản ghi mini app tương ứng có `key === 'pokemon-champions'` có tồn tại, có `enabled === true` và `config.homeComponent.enabled === true` hay không.
  * Nếu không thỏa mãn các điều kiện trên, loại bỏ `PokemonChampions` khỏi danh sách hiển thị.
  * Mặc định ẩn `PokemonChampions` khi danh sách `miniApps` đang được load (`undefined`) để tránh hiện tượng giật giũ giao diện (layout shift).

# V. Files Impacted (Tệp bị ảnh hưởng)
* `Sửa:` [page.tsx (create home-component)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/create/page.tsx)
  * Thêm import query `api.miniApps.listAll`.
  * Thay đổi logic `useMemo` của `visibleTypes` để thực hiện lọc dựa trên trạng thái của mini app Pokemon Champions từ database Convex.

# VI. Execution Preview (Xem trước thực thi)
1. Mở file [page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/create/page.tsx).
2. Thêm query `miniApps` và cập nhật logic lọc `visibleTypes`.
3. Lưu file và tiến hành kiểm tra trên môi trường local.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm chứng thủ công:**
  1. Bật Pokemon Champions ở `/system/mini-apps` (bao gồm cả "Bật mini app" và "Hiện ở Home Components"), nhấn "Lưu cấu hình".
  2. Mở `/admin/home-components/create`, kiểm tra xem thẻ "Pokemon Champions" có xuất hiện dưới phần "Các component còn lại" không.
  3. Tắt "Hiện ở Home Components" của Pokemon Champions ở `/system/mini-apps`, nhấn "Lưu cấu hình".
  4. Mở `/admin/home-components/create`, kiểm tra xem thẻ "Pokemon Champions" có biến mất hay không.
  5. Tắt "Bật mini app" của Pokemon Champions ở `/system/mini-apps`, nhấn "Lưu cấu hình".
  6. Mở `/admin/home-components/create`, kiểm tra xem thẻ "Pokemon Champions" vẫn biến mất.

# VIII. Todo
- [ ] Thêm query `api.miniApps.listAll` vào [page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/create/page.tsx).
- [ ] Cập nhật logic lọc `visibleTypes` trong `useMemo` để ẩn component `PokemonChampions` nếu mini app bị tắt.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Thẻ "Pokemon Champions" ẩn/hiện chính xác theo cấu hình của mini app trong trang System Mini Apps.
* Không làm ảnh hưởng đến việc tạo và hoạt động của các loại component khác.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Cực kỳ thấp, không ảnh hưởng đến database schema hay cấu trúc dữ liệu.
* **Hoàn tác:** `git checkout -- app/admin/home-components/create/page.tsx`
