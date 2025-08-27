# Work Log (Nhật ký công việc)

Ghi chép các thay đổi, lý do và gợi ý triển khai tiếp theo để người sau nắm nhanh.

## 2025-08-27

### Tổng hợp thay đổi gần đây
- Loại bỏ mục Boards:
  - Gỡ mục “Boards” khỏi sidebar và xoá route `"/boards"` trong `src/App.jsx`.
  - Cập nhật `TODO.md`: đánh dấu Boards là không dùng nữa.

- Projects – nâng cấp UI/UX danh sách dự án (`src/pages/ProjectsList.jsx`):
  - Thêm toolbar chuyên nghiệp: ô tìm kiếm có icon, sắp xếp theo tên (A→Z/Z→A), chuyển đổi Card/List; lưu `localStorage` (`projects-view`, `projects-sort`).
  - Nút “+ Thêm” mở modal tạo dự án, sau khi tạo điều hướng sang chi tiết.
  - Card dự án có cover: dùng gradient theo id; nếu có `project.cover` (URL) thì ưu tiên ảnh.
  - Card: gỡ hết nút, click 1 lần vào card để mở chi tiết (trước đây dùng double‑click).
  - Ở dạng bảng: giữ hàng click đúp mở chi tiết; gỡ xoá bên ngoài, chỉ còn mở chi tiết.

- Project Detail – bố cục và tính năng (`src/pages/ProjectDetail.jsx`):
  - Header có nút “Thuộc tính” và “⚙️ Cài đặt”. Cả hai mở side drawer bên phải (ẩn mặc định, bấm mới bung ra). Drawer có backdrop + nút đóng.
  - Panel Thuộc tính: hiển thị ID, số thành viên, số cột Kanban, tổng task, trạng thái cover, kích thước dữ liệu board trong localStorage.
  - Panel Cài đặt: đặt URL cover (xem trước), Reset Kanban của dự án, Xoá dự án (xác nhận) rồi quay lại danh sách.
  - Deep link: `#properties` mở Thuộc tính, `#settings` mở Cài đặt.
  - Phân quyền mock: đọc `user.role` từ auth; chỉ `editor`/`admin` mới thấy nút “⚙️ Cài đặt”; `viewer` chỉ thấy “Thuộc tính”.

- Store dự án (`src/projects/store.js`):
  - Hỗ trợ trường `cover` khi tạo/cập nhật dự án.

- Tài liệu backend: thêm `yeucaubackend.md` mô tả endpoints và phân quyền Projects/Board.

### Lý do thay đổi
- Đơn giản hoá điều hướng (gỡ Boards), tập trung vào Projects/Tasks.
- Nâng trải nghiệm quản lý dự án: xem Card/List, tìm kiếm/sắp xếp, thao tác gọn trong chi tiết.
- Chuẩn bị cho phân quyền thật: UI đã ẩn Cài đặt với role `viewer` để sẵn sàng nối backend RBAC.

### Cách kiểm tra nhanh
1) `npm run dev` và mở `/projects`:
   - Dùng toggle Card/List; thử tìm kiếm và sắp xếp.
   - Click card mở chi tiết (không có nút trên card).
2) Mở một dự án:
   - Bấm “Thuộc tính” → drawer hiển thị stats.
   - Bấm “⚙️ Cài đặt” (nếu role là `editor`/`admin`) → đặt cover URL, reset board, xoá dự án.
   - Thử deep link: truy cập `#/projects/:id#settings` hoặc `#properties` để mở đúng panel.

### Gợi ý triển khai tiếp theo
- Phân quyền thật: thêm guard component hoặc hook `useCan(action, resource)`; ẩn/disable UI theo quyền chi tiết.
- Đồng bộ Kanban với backend: thay localStorage bằng GET/PUT `/projects/:id/board`.
- Thêm Tasks page với DataTable, Drawer chi tiết, toast/confirm.
- Thêm chỉnh sửa nhanh tên/cover ngay từ card (menu …), nếu được phân quyền.
- A11y/Responsive: tối ưu keyboard nav, focus ring, và mobile layout.

### Liên quan
- `TODO.md`: cập nhật các hạng mục đã hoàn thành và việc tiếp theo.
- `yeucaubackend.md`: yêu cầu API cho team backend.

