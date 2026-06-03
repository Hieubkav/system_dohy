# I. Primer

## 1. TL;DR kiểu Feynman
- Khi người dùng muốn kích hoạt tài khoản cũ (tài khoản mua hàng vãng lai trước đó), bình thường hệ thống cần gửi một mã OTP qua email để xác minh.
- Tuy nhiên, nếu hệ thống chưa bật hoặc chưa cấu hình email gửi đi (SMTP/Resend), người dùng sẽ không nhận được OTP.
- Giải pháp: Khi phát hiện hệ thống chưa cấu hình email gửi đi, hệ thống sẽ tự động chuyển sang luồng **kích hoạt trực tiếp qua Web**. Giao diện sẽ ẩn ô nhập mã OTP đi, và người dùng chỉ cần thiết lập mật khẩu mới là có thể kích hoạt tài khoản thành công ngay lập tức.

## 2. Elaboration & Self-Explanation
Hệ thống cho phép khách hàng đã từng mua hàng vãng lai kích hoạt tài khoản bằng cách nhập email/số điện thoại, nhận OTP qua email và tạo mật khẩu mới.
Nếu email chưa được cấu hình tại trang `/admin/settings/advanced` (tab Cấu hình email), việc gửi OTP qua email là không khả thi. Thay vì báo lỗi chặn người dùng hoặc giả vờ gửi OTP thành công rồi bắt người dùng đợi mã vô ích, chúng ta sẽ chuyển đổi linh hoạt:
- **Trường hợp đã bật email**: Đi theo luồng chuẩn, gửi OTP qua email và bắt buộc nhập OTP ở giao diện.
- **Trường hợp chưa bật email**: Đi theo luồng Web-only. Mutation `requestCustomerPasswordSetup` sẽ trả về `otpRequired: false`. Giao diện storefront sẽ ẩn ô nhập mã OTP, chỉ hiển thị ô nhập mật khẩu mới. Khi người dùng thiết lập mật khẩu mới, backend sẽ bỏ qua bước khớp mã OTP để kích hoạt tài khoản dễ dàng.

## 3. Concrete Examples & Analogies
- **Ví dụ thực tế**: Khách hàng truy cập đường dẫn kích hoạt: `http://localhost:3000/account/login?mode=claim&identifier=test@gmail.com`.
  - *Nếu email đã cấu hình*: Khách hàng thấy ô nhập mã OTP và ô mật khẩu mới. Một email chứa mã OTP được gửi tới hòm thư của họ.
  - *Nếu email chưa cấu hình*: Khách hàng chỉ thấy ô "Thiết lập Mật khẩu mới". Họ nhập mật khẩu mới, click "Kích hoạt & Đăng nhập" là tài khoản được kích hoạt thành công ngay lập tức mà không cần điền OTP.
- **Phép ẩn dụ**: Giống như việc bạn đến ngân hàng rút tiền. Bình thường nếu hệ thống bảo mật tự động hoạt động tốt, ngân hàng sẽ gửi mã xác thực OTP về điện thoại của bạn. Nhưng hôm đó trạm phát sóng viễn thông của khu vực bị hỏng. Thay vì từ chối giao dịch làm bạn mất công, giao dịch viên bưu điện (đã biết bạn là khách quen qua giấy tờ tùy thân hợp lệ) sẽ cho phép bạn ký xác nhận trực tiếp trên giấy và hoàn tất giao dịch rút tiền ngay tại quầy mà không bắt bạn đợi mã OTP tin nhắn.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Khi hệ thống chưa được cấu hình SMTP/Resend gửi mail, luồng kích hoạt tài khoản cũ vẫn thực hiện gửi OTP và bắt buộc người dùng nhập OTP ở storefront mặc dù không có email nào được gửi ra.
- Phạm vi ảnh hưởng: Khách hàng storefront thực hiện kích hoạt tài khoản cũ (luồng claim account qua URL hoặc qua form đăng nhập).
- Tính tái hiện: Tái hiện 100% khi cấu hình email trống (driver = 'unknown').
- File liên quan:
  1. [auth.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/auth.ts): Mutations `requestCustomerPasswordSetup` và `completeCustomerPasswordSetup`.
  2. [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/account/login/page.tsx): Trang đăng nhập xử lý hiển thị và submit form kích hoạt.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Hệ thống luôn bắt buộc kiểm tra mã OTP bất kể trạng thái cấu hình của dịch vụ email.
- **Giả thuyết đối chứng**: Có thể bỏ hẳn bước gửi OTP qua email cho mọi trường hợp. Tuy nhiên, điều này làm giảm tính bảo mật khi hệ thống thực sự đã bật email. Giải pháp tự động phát hiện trạng thái cấu hình email để quyết định bật/tắt yêu cầu OTP là tối ưu và linh hoạt nhất.

# IV. Proposal (Đề xuất)
1. **Ở Backend (`convex/auth.ts`)**:
   - Import `EMAIL_CONFIG_SETTING_KEYS` và `getEmailConfigurationStatus` từ `../lib/email-config-status`.
   - Viết hàm helper `checkEmailConfigured(ctx)` để truy vấn bảng `settings` và xác định trạng thái cấu hình email.
   - Trong `requestCustomerPasswordSetup`:
     - Kiểm tra trạng thái email. Nếu đã cấu hình, tạo mã OTP ngẫu nhiên, lập lịch gửi email qua `internal.email.sendOtpEmail` và trả về `otpRequired: true`.
     - Nếu chưa cấu hình, tạo challenge với mã OTP mặc định là `"BYPASS"`, không chạy scheduler gửi thư và trả về `otpRequired: false`.
     - Cập nhật validator trả về của mutation để hỗ trợ thêm trường `otpRequired: v.optional(v.boolean())`.
   - Trong `completeCustomerPasswordSetup`:
     - Kiểm tra trạng thái email.
     - Nếu email chưa cấu hình, cho phép bỏ qua kiểm tra khớp mã OTP (chỉ cần challenge tồn tại, chưa dùng, chưa hết hạn).
     - Nếu email đã cấu hình, thực hiện kiểm tra `challenge.code === args.code.trim()` bình thường.

2. **Ở Frontend (`app/(site)/account/login/page.tsx`)**:
   - Thêm state `otpRequired` (mặc định là `true`).
   - Cập nhật hàm `requestPasswordSetup` và `useEffect` auto-claim để gán `otpRequired` nhận được từ API.
   - Ẩn trường nhập OTP trên giao diện nếu `otpRequired` là `false`.
   - Khi submit mật khẩu mới, nếu `otpRequired` là `false` thì truyền mã OTP mặc định là `"BYPASS"` lên backend.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa`: [auth.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/auth.ts)
  - Vai trò hiện tại: Quản lý các mutation và query xác thực hệ thống, admin và khách hàng.
  - Thay đổi: Tích hợp logic check email configuration, phân nhánh hành vi yêu cầu OTP tùy thuộc cấu hình email trong `requestCustomerPasswordSetup` và `completeCustomerPasswordSetup`.
- `Sửa`: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/account/login/page.tsx)
  - Vai trò hiện tại: Trang đăng nhập của khách hàng ở storefront.
  - Thay đổi: Ẩn/hiện trường nhập OTP và điều chỉnh tham số gửi lên API dựa vào thuộc tính `otpRequired` nhận được từ backend.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật [auth.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/auth.ts) để thêm imports, helper check config và cập nhật 2 mutations liên quan.
2. Cập nhật [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/account/login/page.tsx) để lưu trữ `otpRequired` và ẩn/hiện trường nhập OTP tương ứng.
3. Chạy build/typecheck để xác nhận tính nhất quán của code.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra biên dịch dự án để đảm bảo không lỗi TypeScript.
- Kiểm tra thủ công:
  - Khi email chưa cấu hình:
    - Click vào link claim tài khoản.
    - Mong đợi: Màn hình kích hoạt hiển thị, ẩn hoàn toàn ô nhập mã OTP, chỉ hiển thị ô nhập mật khẩu mới. Thiết lập mật khẩu mới thành công và đăng nhập được luôn.
  - Khi email đã cấu hình:
    - Mong đợi: Ô nhập mã OTP xuất hiện bình thường và bắt buộc nhập OTP nhận từ email mới kích hoạt được.

# VIII. Todo
- [ ] Import `EMAIL_CONFIG_SETTING_KEYS` và `getEmailConfigurationStatus` vào [auth.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/auth.ts).
- [ ] Tạo hàm helper `checkEmailConfigured` để đọc settings cấu hình email trong [auth.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/auth.ts).
- [ ] Cập nhật `requestCustomerPasswordSetup` để phân biệt luồng email bật/tắt và trả về `otpRequired`.
- [ ] Cập nhật `completeCustomerPasswordSetup` để bỏ qua khớp mã OTP khi email tắt.
- [ ] Thêm state `otpRequired` vào [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/account/login/page.tsx).
- [ ] Cập nhật logic `useEffect` và `handleIdentify` để cập nhật state `otpRequired`.
- [ ] Điều chỉnh JSX hiển thị ô OTP và nút gửi lại mã dựa trên `otpRequired`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi email chưa được cấu hình, khách hàng điền mật khẩu mới là kích hoạt và đăng nhập được luôn từ web, không cần mã OTP.
- Khi email đã được cấu hình, khách hàng bắt buộc phải nhập đúng mã OTP gửi qua email.
- Đảm bảo không xảy ra lỗi build hoặc typecheck của TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: Thấp, chỉ tác động lên luồng thiết lập mật khẩu của khách hàng cũ.
- Rollback: Khôi phục lại phiên bản cũ của `convex/auth.ts` và `app/(site)/account/login/page.tsx` thông qua Git.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào các phương thức gửi email thật (SMTP/Resend).
- Không thay đổi luồng đăng ký tài khoản mới bình thường.
