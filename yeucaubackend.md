## Yêu cầu Backend cho Quản lý Dự án và Phân quyền

Mục tiêu: chuẩn hóa API phục vụ Admin Panel (Projects/Tasks/Users) với phân quyền rõ ràng, hỗ trợ UI hiện tại và mở rộng sau này.

### Xác thực & Phân quyền
- JWT trong header `Authorization: Bearer <token>`.
- Thuộc tính người dùng tối thiểu: `id`, `email`, `username`, `role` (`viewer` | `editor` | `admin`).
- Quy tắc quyền (gợi ý):
  - `viewer`: chỉ đọc projects/tasks; không thấy nút Cài đặt dự án.
  - `editor`: tạo/sửa dự án, thay đổi cover, thành viên; không xoá dự án.
  - `admin`: toàn quyền, bao gồm xoá dự án.

### Projects API
- GET `/projects`
  - Query: `q` (search), `sort` (name_asc|name_desc), `page`, `pageSize`.
  - Response: `{ list: Project[], total: number }`.
- POST `/projects`
  - Body: `{ name: string, description?: string, participants?: string[], cover?: string }`.
  - Role: `editor`+.
- GET `/projects/:id`
  - Response: `Project` chi tiết.
- PUT `/projects/:id`
  - Body: phần giao cắt `{ name?, description?, participants?, cover? }`.
  - Role: `editor`+.
- DELETE `/projects/:id`
  - Role: `admin`.

Project shape (gợi ý):
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "participants": ["user1", "user2"],
  "cover": "https://...",
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

### Project Board (Kanban)
- GET `/projects/:id/board` → trả về mảng cột: `[{ id, title, color, tasks: [{ id, title, description, ... }] }]`.
- PUT `/projects/:id/board` → lưu toàn bộ board (optimistic overwrite) hoặc chấp nhận patch.
  - Role: `editor`+.
- POST `/projects/:id/board/reset` → reset về mặc định.
  - Role: `editor`+.

### Logs & Audit
- Ghi log khi: tạo/sửa/xoá project; thay đổi cover; cập nhật board; thêm/xoá participants.
- Cung cấp endpoint tra cứu log theo project: GET `/projects/:id/logs?page&pageSize&type`.

### Lỗi & Chuẩn hoá
- Sử dụng dạng `{ message, code, details? }` cho lỗi.
- 403 khi không đủ quyền; 404 khi không tìm thấy; 400 khi payload sai.

### Bảo mật
- Rate limit theo IP/user cho thao tác xoá.
- Soft delete cho projects (tuỳ chọn), thêm endpoint phục hồi.

### Ghi chú UI liên quan
- Nút “Cài đặt” chỉ hiển thị cho `editor`/`admin` (UI đã mock theo `user.role`).
- UI hiện lưu localStorage cho board; khi có API board, sẽ chuyển sang gọi `/projects/:id/board` để đồng bộ.

