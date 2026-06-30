# Kế hoạch chuyển đổi Toggle Theme sang Client-Side LocalStorage

Tài liệu này mô tả chi tiết phương án kỹ thuật để đưa cơ chế bật/tắt giao diện Sáng/Tối (Dark/Light Mode) ở public site về hoạt động hoàn toàn ở phía client (localStorage) thay vì ghi thẳng vào Database toàn cục của website.

## User Review Required

> [!IMPORTANT]
> Cần lưu ý rằng khi áp dụng cơ chế này, hành động toggle theme của một khách truy cập vãng lai sẽ không bao giờ gọi mutation lên Convex DB nữa, từ đó bảo vệ cấu hình mặc định của site.
> Khi Admin thay đổi theme mặc định trong trang quản trị, hệ thống sẽ sử dụng logic so sánh `site_theme_last_default` để tự động reset `localStorage` của người dùng, đảm bảo họ vẫn thấy sự thay đổi mặc định nếu chưa từng cố ý thiết lập theme riêng.

## Proposed Changes

### Core Site Components

---

#### [MODIFY] [layout.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/layout.tsx)
- Bổ sung inline script chống flash (chớp màn hình) ở `<head>` để đọc và áp dụng `site_theme_override` từ `localStorage` trước khi React render giao diện.

```html
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    try {
      var override = localStorage.getItem('site_theme_override');
      if (override === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (override === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {}
  })();
` }} />
```

---

#### [MODIFY] [layout.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/(site)/layout.tsx)
- Loại bỏ thuộc tính `data-theme` và `style={{ colorScheme }}` tĩnh được render từ Server Component ở thẻ `div` wrapper của layout. Điều này đảm bảo tất cả các trang con kế thừa toàn vẹn và động cấu hình theme từ thẻ `<html>` thông qua class `dark`.

---

#### [MODIFY] [Header.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/Header.tsx)
- Sửa hàm `toggleTheme` ở nút chuyển đổi theme:
  - Loại bỏ cuộc gọi mutation `setSetting` cập nhật `site_dark_mode` lên database.
  - Thay thế bằng việc ghi giá trị vào `localStorage`: `localStorage.setItem('site_theme_override', nextValue)`.
  - Dispatch event `site-theme-change` để đồng bộ theme tức thì cho các component client-side khác.

---

#### [MODIFY] [SiteProviders.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/SiteProviders.tsx)
- Cập nhật hàm `applyTheme` trong hook `useEffect` xử lý theme:
  - Đọc `site_theme_override` từ `localStorage` trước. Nếu có giá trị (`'dark'` hoặc `'light'`), áp dụng theme tương ứng.
  - Nếu không có override, fall back về cấu hình mặc định từ DB (`siteDarkMode`).
  - Thêm logic phát hiện Admin thay đổi cài đặt mặc định:
    ```typescript
    const lastDefault = localStorage.getItem('site_theme_last_default');
    if (lastDefault && lastDefault !== siteDarkMode) {
      localStorage.removeItem('site_theme_override');
    }
    localStorage.setItem('site_theme_last_default', siteDarkMode);
    ```

## Verification Plan

### Manual Verification
1. Mở trang chủ ở 2 cửa sổ ẩn danh khác nhau (Khách A và Khách B).
2. Khách A bấm đổi theme thành Tối. Xác nhận giao diện Khách A chuyển tối và không có request/mutation Convex nào được gửi lên DB.
3. Xác nhận Khách B vẫn ở giao diện Sáng.
4. Reload cả hai trang, xác nhận Khách A giữ nguyên tối và Khách B giữ nguyên sáng.
5. Vào trang Admin quản trị `/system/experiences`, cập nhật theme mặc định thành tối rồi Lưu.
6. Xác nhận Khách B (không có override) tự động chuyển sang giao diện tối sau khi reload/truy cập lại.
