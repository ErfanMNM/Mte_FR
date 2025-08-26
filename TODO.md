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
- [ ] Boards: Trang danh sách (grid) + chi tiết (nhúng Kanban đã có)
- [ ] Tasks: Bảng (DataTable) với lọc, sắp xếp, phân trang
- [ ] Drawer chi tiết Task: xem/sửa tiêu đề, mô tả, assignee, priority, due date, tags
- [ ] Toast/Confirm Dialog cho xoá/undo, thông báo hành động

## Phase 3 – Người dùng & Cài đặt
- [ ] Users: Danh sách + form tạo/sửa (mock data)
- [ ] Roles/Permissions: guard route/action theo vai trò (viewer/editor/admin)
- [ ] Settings: Tuỳ chọn theme, thông báo cơ bản

## Phase 4 – Đánh bóng & Tối ưu
- [ ] A11y: focus ring, tab order, ARIA labels
- [ ] Responsive: Sidebar co giãn, bảng và Kanban trên mobile
- [ ] Hiệu năng: lazy-load routes, tách bundle
- [ ] Cleanup: refactor nhỏ + tài liệu sử dụng ngắn

## Tuỳ chọn (nâng cao)
- [ ] Kéo-thả sắp xếp vị trí trong cùng cột (reorder)
- [ ] Tag/Label & Priority cho thẻ, lọc theo tag/priority
- [ ] Tìm kiếm toàn cục ở Topbar (Boards/Tasks/Users)
