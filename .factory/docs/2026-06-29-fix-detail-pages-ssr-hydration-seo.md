# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng hoặc bot tìm kiếm truy cập các trang chi tiết sản phẩm/bài viết, HTML gốc (view-source) chỉ chứa khung xương xám (Skeleton) và kèm theo lỗi "Bail out to client-side rendering" do việc dùng `next/dynamic` cho Toaster. Để sửa, chúng ta sẽ:
1. Loại bỏ `next/dynamic` khỏi Toaster bằng cách import trực tiếp và dùng state của React để mount Toaster ở Client.
2. Truyền dữ liệu bài viết/sản phẩm đã fetch sẵn ở Server (RSC) xuống các trang chi tiết (Client Components), giúp hiển thị nội dung thật ngay từ đầu thay vì Skeleton.

## 2. Elaboration & Self-Explanation
Hiện tượng này do hai nguyên nhân chính:
1. **Bailout to CSR**: File root layout `SiteProviders.tsx` chứa `CustomToaster` được import qua `next/dynamic` với tùy chọn `{ ssr: false }`. Khi server render, Next.js bắt buộc phải ném lỗi bailout để chuyển hướng render sang client cho component này, vô tình gây ra cảnh báo/lỗi render trên server và chèn thẻ template bailout vào HTML.
2. **Skeleton rendering**: Các trang chi tiết (như `ProductDetailPage`, `PostDetailPage`) tự truy vấn dữ liệu bằng hook `useQuery` của Convex. Do `useQuery` luôn trả về `undefined` trên server, trang web buộc phải render Skeleton trong HTML ban đầu.
Giải pháp triệt để:
- Chuyển `CustomToaster` sang import tĩnh và render có điều kiện dựa trên state `mounted` (chỉ chạy ở client sau khi mount). Không còn dynamic import ở server => Không còn lỗi bailout.
- Khai báo thêm prop `initialData` ở 6 component chi tiết và truyền dữ liệu đã fetch ở server (`UnifiedCatchAllPage`) xuống. Ở client component, sử dụng: `const data = useQuery(...) ?? initialData;`. Việc này đảm bảo SSR hiển thị đầy đủ thông tin, đồng thời client vẫn giữ được tính realtime của Convex và tránh được lỗi Hydration Mismatch.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Khi truy cập trang sản phẩm `/cham-soc-da/ruou-vang-phap-chateau-timberlay-rouge`, Server Component đã tải sẵn thông tin chai rượu từ Convex để render thẻ `<title>Rượu Vang Pháp Chateau Timberlay Rouge</title>`. Nhưng nó lại render `<ProductDetailPage params={...} />` (không truyền data). Client Component này chạy `useQuery` và nhận về `undefined` ở server, dẫn đến việc HTML gửi về trình duyệt chỉ chứa bộ xương Skeleton. Googlebot chỉ nhìn thấy Skeleton này.
* **Hình ảnh tương tự**: Giống như việc bạn gửi thư mời dự tiệc. Bạn đã chuẩn bị sẵn thực đơn (Fetch data ở server), nhưng trong thư mời bạn lại để trống phần thực đơn (Skeleton) và bảo khách mời đến bữa tiệc mới được xem thực đơn. Googlebot là vị khách chỉ đọc thư mời rồi quyết định có đi hay không, khi thấy thư mời trống trơn (Skeleton), bot sẽ đánh giá thấp bữa tiệc.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng**: View-source trang chi tiết có Skeleton, kèm lỗi `Bail out to client-side rendering: next/dynamic` ở chân trang.
* **Nguyên nhân**: Dùng `next/dynamic` với `ssr: false` ở cấp root và Client Components tự fetch data từ đầu mà không kế thừa dữ liệu từ Server.
* **Phạm vi**: Toàn bộ hệ thống client-facing site.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc)**: Lạm dụng `next/dynamic` với `ssr: false` ở các component dùng chung ở root và thiếu cơ chế truyền dữ liệu hydration từ RSC xuống Client Components.
* **Counter-Hypothesis (Giả thuyết đối chứng)**: Việc loại bỏ `next/dynamic` cho Toaster bằng client-mount state và truyền dữ liệu prop ban đầu sẽ dập tắt hoàn toàn lỗi bailout và giúp SSR render nội dung thật 100%.

# IV. Proposal (Đề xuất)
1. Trong [SiteProviders.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/SiteProviders.tsx):
   * Thay dynamic import `CustomToaster` bằng import trực tiếp.
   * Quản lý trạng thái mount: `{mounted && <CustomToaster />}`.
2. Thêm prop `initialData` cho 6 trang chi tiết (`Post`, `Product`, `Service`, `Course`, `Resource`, `Project`) và thay đổi gán biến `const data = useQuery(...) ?? initialData;`.
3. Truyền dữ liệu tương ứng từ [page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/(site)/[...slugs]/page.tsx) xuống các component con.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [SiteProviders.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/SiteProviders.tsx) - Thay đổi cách import và mount CustomToaster.
* **Sửa**: [page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/(site)/[...slugs]/page.tsx) - Nối dữ liệu đã fetch từ server xuống các Client Components.
* **Sửa**: 6 file detail components để nhận và sử dụng dữ liệu ban đầu.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh sửa [SiteProviders.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/SiteProviders.tsx).
2. Chỉnh sửa 6 file detail pages.
3. Chỉnh sửa [page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/(site)/[...slugs]/page.tsx).
4. Kiểm tra kiểu tĩnh TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Tự động**: `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

# VIII. Todo
- [ ] Cập nhật [SiteProviders.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/SiteProviders.tsx)
- [ ] Cập nhật [page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/(site)/[...slugs]/page.tsx)
- [ ] Cập nhật các component chi tiết:
  - [ ] `PostDetailPage.tsx`
  - [ ] `ProductDetailPage.tsx`
  - [ ] `ServiceDetailPage.tsx`
  - [ ] `CourseDetailPage.tsx`
  - [ ] `ResourceDetailPage.tsx`
  - [ ] `ProjectDetailPage.tsx` (trong app/site/projects/[slug]/page.tsx)
- [ ] Kiểm tra build tĩnh

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Hết hoàn toàn lỗi `Bail out to client-side rendering: next/dynamic` từ Toaster trong view-source.
* Nội dung chi tiết bài viết/sản phẩm được hiển thị đầy đủ trong view-source ngay từ server.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi Hydration Mismatch nếu dữ liệu render server khác dữ liệu client.
* **Giảm thiểu**: Dữ liệu lấy từ cùng Convex schema và cùng API endpoint nên đảm bảo khớp nhau. Hoàn tác bằng `git checkout .`.

# XI. Out of Scope (Ngoài phạm vi)
* Các trang danh sách và trang tĩnh khác.
