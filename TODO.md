# Kế hoạch Admin Panel (Kanban)

## Phase 0 – Hiện trạng (đã có)
- [x] Scaffold dự án React (Vite)
- [x] Kanban cơ bản: 3 cột, kéo-thả
- [x] Lưu dữ liệu vào localStorage
- [x] Styles cơ bản (theme tối)

## Phase 1 – Nền tảng giao diện sáng
- [x] Chuyển palette sang sáng (CSS variables: bg/panel/text/border/primary)
- [x] Chuẩn hoá components nền tảng: Button, Input, Card, Badge
- [x] Tạo layout: Sidebar, Topbar, Content, Footer nhẹ
- [x] Thêm routing với `react-router-dom` (Dashboard, Boards, Tasks, Users, Settings)
- [x] Dashboard: 3–4 StatCard + Recent Activity

## Phase 2 – Tính năng cốt lõi
- [ ] (ĐÃ LOẠI BỎ) Boards: Không sử dụng nữa – đã gỡ khỏi sidebar và route
- [ ] Tasks: Bảng (DataTable) với lọc, sắp xếp, phân trang
- [ ] Drawer chi tiết Task: xem/sửa tiêu đề, mô tả, assignee, priority, due date, tags
- [ ] Toast/Confirm Dialog cho xoá/undo, thông báo hành động

## Phase 3 – Người dùng & Cài đặt
- [ ] Users: Danh sách + form tạo/sửa (mock data)
- [ ] Roles/Permissions: guard route/action theo vai trò (viewer/editor/admin)
- [ ] Settings: Tuỳ chọn theme, thông báo cơ bản

## Bổ sung – Xác thực
- [x] Login page: form login/password + TOTP optional
- [x] Auth client: `/auth/login`, `/auth/me`, lưu JWT localStorage
- [x] AuthProvider + RequireAuth: bảo vệ route, redirect `/login`

## Bổ sung – Profile & Logs
- [x] Trang Users hiển thị My Profile (`GET /profiles/me`)
- [x] Bảng nhật ký hoạt động có phân trang (`GET /profiles/me/logs`)

## Phase 4 – Đánh bóng & Tối ưu
- [ ] A11y: focus ring, tab order, ARIA labels
- [ ] Responsive: Sidebar co giãn, bảng và Kanban trên mobile
- [ ] Hiệu năng: lazy-load routes, tách bundle
- [ ] Cleanup: refactor nhỏ + tài liệu sử dụng ngắn

## Bổ sung – Projects UI/UX
- [x] Projects: View toggle (Card/List) và lưu `localStorage`
- [x] Projects: Nút “+ Thêm” mở modal tạo dự án
- [x] Projects: Cover gradient cho card + nhấp đúp mở chi tiết
- [x] Projects: Toolbar chuyên nghiệp (tìm kiếm có icon + sắp xếp A→Z/Z→A)
- [x] Projects: Tắt nút xoá ngoài danh sách; chuyển xoá vào chi tiết dự án
- [x] Project Detail: Thêm mục Cài đặt (cover URL, reset board, xoá dự án)
- [x] Projects Card: Gỡ hết nút trên card, click mở chi tiết (thay double-click)
- [x] Project Detail: Thêm bảng Thuộc tính (Properties) bên phải, nút Cài đặt để bật/tắt bảng cài đặt
 - [x] Project Detail: Thuộc tính/Cài đặt dạng side drawer ẩn; chỉ hiển thị khi bấm
 - [x] Phân quyền mock: ẩn nút Cài đặt khi role là `viewer`

## Backend
- [x] Tạo `yeucaubackend.md` mô tả endpoints Projects + Board và phân quyền

## Tuỳ chọn (nâng cao)
- [ ] Kéo-thả sắp xếp vị trí trong cùng cột (reorder)
- [ ] Tag/Label & Priority cho thẻ, lọc theo tag/priority
- [ ] Tìm kiếm toàn cục ở Topbar (Boards/Tasks/Users)
