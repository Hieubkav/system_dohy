# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Hiện tại, các mini-game (Cờ caro, Cờ vua, Tetris...) đang được lưu trong bảng giao diện trang chủ (`homeComponents` có type `CustomHome`). Nếu người dùng tắt hoặc xóa các home component này thì trang chơi mini-game (`http://localhost:3000/mini-game`) sẽ bị mất game và báo lỗi.
* **Giải pháp cập nhật**:
  1. Tạo bảng cơ sở dữ liệu riêng cho mini-game (`miniGames` và `miniGameStats` trong Convex) để lưu trữ code HTML cố định độc lập.
  2. Viết công cụ di chuyển (migration) để tự động copy code HTML cố định của 12 game hiện có từ `homeComponents` sang bảng `miniGames` mới.
  3. Giao diện Admin cho mini-game sẽ **chỉ cho phép Bật/Tắt (Toggle) game** và **sắp xếp thứ tự (Reorder)**, không cho phép sửa code HTML hay thêm mới vì code HTML đã cố định.
  4. Cập nhật trang Portal chơi game `/mini-game` đọc dữ liệu từ bảng mới.

## 2. Elaboration & Self-Explanation
Chúng ta tách biệt hoàn toàn phần dữ liệu game ra khỏi cấu trúc trang chủ.
* **Giao diện trang chủ (`homeComponents`)**: Chỉ phục vụ hiển thị trang chủ.
* **Trò chơi (`miniGames`)**: Có bảng lưu trữ riêng với các trường chuyên biệt (`title`, `slug`, `category`, `desc`, `image`, `config` chứa mã nguồn game cố định).
* **Quản trị (`Admin UI`)**: Admin **chỉ cần bật/tắt (Toggle)** và **sắp xếp thứ tự hiển thị** của các game có sẵn. Không hiển thị form chỉnh sửa code HTML hay cấu hình phức tạp vì code HTML là cố định.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Game "Cờ Caro AI" có mã nguồn HTML cố định được di chuyển sang bảng `miniGames`. Trong Admin, người dùng chỉ thấy danh sách 12 game kèm theo một nút Switch (Bật/Tắt). Khi tắt Switch, game "Cờ Caro AI" sẽ không hiển thị trên sảnh game nữa.
* **Analogy (Ví dụ đời thường)**: Giống như các máy chơi game thùng (arcade machines) được đặt vào một căn phòng riêng. Admin chỉ có nhiệm vụ cắm điện hoặc rút điện từng máy (Bật/Tắt) và di chuyển vị trí các máy (Sắp xếp), chứ không cần mở ruột máy ra để sửa mạch hay lập trình lại trò chơi (Code HTML cố định).

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra cấu trúc schema hiện tại: bảng `homeComponents` chứa trường `config` (kiểu `any`) lưu code HTML của game.
* Cấu hình Mini App `mini-game` hiện tại đang trỏ `gameSource.type` về `"CustomHome"`.
* Code HTML của 12 game là cố định, độc lập và chạy hoàn toàn trong iframe cát-hộp (sandbox).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Thiết kế kết nối trực tiếp trang `/mini-game` với bảng `homeComponents` có type `CustomHome`.
* **Độ tin cậy nguyên nhân gốc**: High.

# IV. Proposal (Đề xuất)
1. **Database Schema**:
   * Thêm bảng `miniGames` và bảng counter `miniGameStats`.
2. **Convex API (`convex/miniGames.ts`)**:
   * Viết các query/mutation CRUD đơn giản: `listActive` (cho site), `listAll` (cho admin), `toggle` (bật/tắt), `reorder` (sắp xếp).
   * Viết mutation `migrateFromHomeComponents` để tự động copy 12 game từ `homeComponents` sang `miniGames` một lần duy nhất.
3. **Frontend**:
   * Cập nhật `MiniGameMiniApp.tsx`:
     * Đọc danh sách game từ `api.miniGames.listActive` (cho site) và `api.miniGames.listAll` (cho admin).
     * Khi ở chế độ admin (`editable === true`), bổ sung tab "Quản lý Game" với giao diện tối giản: Danh sách game kèm switch **Bật/Tắt** trạng thái hoạt động (`active`) và kéo thả/nút bấm để **Sắp xếp thứ tự** (`order`). Không có form sửa code HTML.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [convex/schema.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/convex/schema.ts): Thêm định nghĩa bảng `miniGames` và `miniGameStats`.
* **Thêm**: [convex/miniGames.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/convex/miniGames.ts): Chức năng CRUD backend tối giản (chỉ gồm list, toggle, reorder) và script di cư dữ liệu.
* **Sửa**: [features/mini-apps/mini-game/MiniGameMiniApp.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/features/mini-apps/mini-game/MiniGameMiniApp.tsx): Cập nhật query dữ liệu từ bảng mới và xây dựng giao diện Admin tối giản chỉ có Toggle và Reorder.

# VI. Execution Preview (Xem trước thực thi)
1. Sửa `convex/schema.ts` để cập nhật cấu trúc database.
2. Tạo file `convex/miniGames.ts` chứa logic backend.
3. Sửa `features/mini-apps/mini-game/MiniGameMiniApp.tsx` để đổi nguồn dữ liệu và code UI admin (chỉ bật/tắt và sắp xếp).
4. Chạy mutation migrate để sao chép dữ liệu game thật.
5. Verify hoạt động chơi game và giao diện admin.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Chạy thủ công**:
  1. Vào trang Admin: `http://localhost:3000/admin/mini-apps/mini-game`.
  2. Hệ thống tự động di cư hoặc bấm nút "Đồng bộ" để copy 12 game cũ sang bảng mới.
  3. Kiểm tra xem 12 game xuất hiện đầy đủ trong danh sách quản lý dạng bảng tối giản.
  4. Thử bật/tắt một game bằng switch, xem sảnh game cập nhật lập tức.
  5. Thử thay đổi thứ tự và kiểm tra kết quả hiển thị.
  6. Xóa hoặc tắt thử một Home Component dạng CustomHome ở trang chủ và xác nhận trang chơi game `/mini-game` vẫn chạy ổn định.

# VIII. Todo
- [ ] Cập nhật file `convex/schema.ts` thêm bảng `miniGames` và `miniGameStats`.
- [ ] Tạo file `convex/miniGames.ts` với các APIs list, toggle, reorder và mutation di cư dữ liệu.
- [ ] Chỉnh sửa `features/mini-apps/mini-game/MiniGameMiniApp.tsx` để tích hợp giao diện Admin tối giản (chỉ Toggle + Reorder) và đọc dữ liệu từ bảng mới.
- [ ] Thực thi script di cư dữ liệu qua Convex CLI hoặc chạy mutation.
- [ ] Kiểm tra tổng thể hoạt động.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Trang chơi game `/mini-game` hiển thị đầy đủ 12 game từ bảng `miniGames`.
* Trang admin chỉ cho phép bật/tắt game và đổi thứ tự hiển thị, không cho sửa code HTML.
* Trang chơi game không bị ảnh hưởng khi thay đổi hoặc xóa `homeComponents` trang chủ.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* Không có rủi ro mất dữ liệu vì dữ liệu gốc ở `homeComponents` không bị ảnh hưởng.
* Hoàn tác dễ dàng bằng cách phục hồi các file git đã sửa.
