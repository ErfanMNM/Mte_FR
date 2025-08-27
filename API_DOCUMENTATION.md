# MTE Backend API Documentation

## Overview
MTE Backend là một REST API được xây dựng bằng Node.js/Express với các tính năng:
- Xác thực JWT
- 2FA (Two-Factor Authentication)
- Quản lý vai trò (Role-based)
- Nhật ký bảo mật
- Quản lý người dùng (Admin)

**Base URL**: `http://localhost:3000/api/v1`

## Authentication
Tất cả API được bảo vệ đều yêu cầu JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. Đăng ký tài khoản
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username"
  }
}
```

### 2. Đăng nhập
**POST** `/auth/login`

**Request Body:**
```json
{
  "login": "user@example.com", // email hoặc username
  "password": "Password123!",
  "totp_code": "123456" // optional, nếu có 2FA
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "role": "user",
    "has_2fa": false
  }
}
```

### 3. Thông tin người dùng hiện tại
**GET** `/auth/me`

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "role": "user",
    "is_active": true,
    "email_verified": false,
    "last_login": "2023-10-27T10:00:00Z",
    "has_2fa": false,
    "profile": {
      "first_name": null,
      "last_name": null,
      "avatar_url": null,
      "bio": null
    }
  }
}
```

### 4. Đổi mật khẩu
**POST** `/auth/change-password`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

---

## 🔒 Two-Factor Authentication (2FA)

### 1. Thiết lập 2FA
**POST** `/auth/2fa/setup`

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "backup_codes": [
    "abc123def456",
    "ghi789jkl012"
  ],
  "manual_entry_key": "JBSWY3DPEHPK3PXP"
}
```

### 2. Xác nhận và kích hoạt 2FA
**POST** `/auth/2fa/verify`

**Request Body:**
```json
{
  "totp_code": "123456"
}
```

### 3. Kiểm tra trạng thái 2FA
**GET** `/auth/2fa/status`

**Response:**
```json
{
  "is_enabled": true,
  "enabled_at": "2023-10-27T10:00:00Z",
  "has_backup_codes": true
}
```

### 4. Tắt 2FA
**POST** `/auth/2fa/disable`

**Request Body:**
```json
{
  "password": "Password123!"
}
```

### 5. Lấy mã dự phòng
**GET** `/auth/2fa/backup-codes`

**Response:**
```json
{
  "backup_codes": [
    "abc123def456",
    "ghi789jkl012"
  ],
  "message": "Store these backup codes in a safe place..."
}
```

---

## 👤 Profile Management

### 1. Lấy thông tin profile
**GET** `/profiles/me`

**Response:**
```json
{
  "profile": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+84123456789",
    "date_of_birth": "1990-01-01",
    "bio": "Developer",
    "avatar_url": "/uploads/avatars/avatar.jpg",
    "country": "Vietnam",
    "city": "Hanoi",
    "timezone": "Asia/Ho_Chi_Minh",
    "language": "vi"
  }
}
```

### 2. Cập nhật profile
**PUT** `/profiles/me`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+84123456789",
  "bio": "Full Stack Developer",
  "country": "Vietnam",
  "city": "Hanoi"
}
```

### 3. Upload avatar
**POST** `/profiles/avatar`

**Content-Type:** `multipart/form-data`
**Body:** File field `avatar`

### 4. Xóa avatar
**DELETE** `/profiles/avatar`

### 5. 🆕 Nhật ký bảo mật
**GET** `/profiles/me/logs?page=1&pageSize=10&type=login`

**Query Parameters:**
- `page`: Số trang (default: 1)
- `pageSize`: Số item/trang (default: 10, max: 100)
- `type`: Lọc theo loại hoạt động (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "1",
        "summary": "Đăng nhập thành công",
        "ip": "118.70.123.45",
        "address": "Hanoi, Vietnam",
        "system": "Windows 10",
        "browser": "Chrome 108",
        "operatingTime": "2023-10-27T10:00:00Z"
      },
      {
        "id": "2",
        "summary": "Đổi mật khẩu",
        "ip": "118.70.123.46",
        "address": "Hanoi, Vietnam",
        "system": "macOS Ventura",
        "browser": "Safari 16",
        "operatingTime": "2023-10-26T15:30:00Z"
      }
    ],
    "total": 50,
    "pageSize": 10,
    "currentPage": 1
  }
}
```

---

## 👥 Admin - User Management

### 1. 🆕 Tạo người dùng mới
**POST** `/users` *(Admin only)*

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "Password123!",
  "role_id": 2,
  "is_active": true
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "username": "newuser",
    "role_id": 2,
    "is_active": true
  }
}
```

### 2. Danh sách người dùng
**GET** `/users?page=1&limit=10` *(Admin only)*

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "role": "admin",
      "is_active": true,
      "email_verified": true,
      "last_login": "2023-10-27T10:00:00Z",
      "created_at": "2023-10-01T10:00:00Z",
      "profile": {
        "first_name": "John",
        "last_name": "Doe",
        "avatar_url": "/uploads/avatars/avatar.jpg"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_users": 50,
    "has_next": true,
    "has_prev": false
  }
}
```

### 3. Chi tiết người dùng
**GET** `/users/:id` *(Admin only)*

### 4. 🆕 Cập nhật thông tin người dùng
**PUT** `/users/:id` *(Admin only)*

**Request Body:**
```json
{
  "email": "updated@example.com",
  "username": "updateduser",
  "first_name": "Updated",
  "last_name": "User",
  "bio": "Updated bio",
  "is_active": true
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "updated_fields": ["email", "first_name", "bio"]
}
```

### 5. 🆕 Đặt lại mật khẩu người dùng
**PUT** `/users/:id/reset-password` *(Admin only)*

**Request Body:**
```json
{
  "new_password": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully",
  "note": "User should be notified of the password change through email or other means"
}
```

### 6. Cập nhật vai trò
**PUT** `/users/:id/role` *(Admin only)*

**Request Body:**
```json
{
  "role_id": 2
}
```

### 7. Cập nhật trạng thái
**PUT** `/users/:id/status` *(Admin only)*

**Request Body:**
```json
{
  "is_active": false
}
```

### 8. Xóa người dùng
**DELETE** `/users/:id` *(Admin only)*

### 9. 🆕 Xóa hàng loạt người dùng
**DELETE** `/users` *(Admin only)*

**Request Body:**
```json
{
  "ids": [2, 3, 4, 5]
}
```

**Response:**
```json
{
  "message": "Successfully deleted 3 user(s)",
  "deleted_users": [
    {
      "id": 2,
      "username": "user2",
      "email": "user2@example.com"
    },
    {
      "id": 3,
      "username": "user3",
      "email": "user3@example.com"
    }
  ],
  "skipped_ids": [4, 5]
}
```

### 10. Danh sách vai trò
**GET** `/users/roles`

**Response:**
```json
{
  "roles": [
    {
      "id": 1,
      "name": "admin",
      "description": "Administrator"
    },
    {
      "id": 2,
      "name": "user",
      "description": "Regular User"
    }
  ]
}
```

---

## 📝 Activity Log Types

Các loại hoạt động được ghi log tự động:

| Type | Description | Vietnamese |
|------|-------------|------------|
| `login` | Successful login | Đăng nhập thành công |
| `login_failed` | Failed login attempt | Đăng nhập thất bại |
| `password_change` | Password changed | Đổi mật khẩu |
| `2fa_enable` | 2FA enabled | Kích hoạt xác thực 2 yếu tố |
| `2fa_disable` | 2FA disabled | Tắt xác thực 2 yếu tố |
| `2fa_backup_code_used` | Backup code used | Sử dụng mã dự phòng 2FA |
| `profile_update` | Profile updated | Cập nhật thông tin cá nhân |
| `admin_create_user` | Admin created user | Admin tạo tài khoản |
| `admin_update_user` | Admin updated user | Admin cập nhật người dùng |
| `admin_reset_password` | Admin reset password | Admin đặt lại mật khẩu |
| `admin_bulk_delete_users` | Admin bulk deleted users | Admin xóa hàng loạt người dùng |

---

## 🔧 Error Responses

### Validation Errors (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "msg": "Password must be at least 8 characters",
      "param": "password",
      "location": "body"
    }
  ]
}
```

### Authentication Errors (401)
```json
{
  "error": "Invalid token"
}
```

### Authorization Errors (403)
```json
{
  "error": "Insufficient permissions"
}
```

### Not Found Errors (404)
```json
{
  "error": "User not found"
}
```

### Server Errors (500)
```json
{
  "error": "Internal server error"
}
```

---

## 🔒 Security Features

1. **Password Requirements:**
   - Tối thiểu 8 ký tự
   - Chứa chữ hoa, chữ thường, số và ký tự đặc biệt

2. **JWT Token:**
   - Expires trong 7 ngày (default)
   - Chứa userId và email

3. **2FA Support:**
   - TOTP (Time-based One-Time Password)
   - Backup codes
   - QR code generation

4. **Activity Logging:**
   - Tự động ghi log tất cả hoạt động quan trọng
   - Thông tin IP, địa chỉ, trình duyệt, hệ điều hành
   - GeoIP lookup cho vị trí địa lý

5. **Role-based Access:**
   - Admin permissions: `users.create`, `users.read`, `users.update`, `users.delete`
   - Profile permissions: `profiles.read`

---

## 🚀 Server Info

- **URL**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api-docs
- **Hot Reload**: Enabled với nodemon
- **Database**: PostgreSQL với Knex.js migrations

---

## 📋 Validation Rules

### Password Validation
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$
```

### Username Validation
```regex
^[a-zA-Z0-9_]+$
```
- 3-30 ký tự
- Chỉ chữ, số và dấu gạch dưới

### Email Validation
- RFC compliant email format
- Normalized (lowercase)

---

*Documentation generated: 2023-10-23*
*Server running on: http://localhost:3000*
*API Version: v1*