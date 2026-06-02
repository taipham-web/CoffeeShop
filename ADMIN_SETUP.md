# Admin Account Setup & JWT Authentication

## Thiết lập môi trường (Backend)

Thêm các biến environment vào `.env` file tại thư mục `server/`:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Admin Setup Secret (để tạo admin account)
ADMIN_SECRET_KEY=your_admin_secret_key_here
```

## Tạo Admin Account Đầu Tiên

### Option 1: Sử dụng API Endpoint (Recommended)

Chạy lệnh curl để tạo admin account đầu tiên:

```bash
curl -X POST http://localhost:5001/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123",
    "secretKey": "your_admin_secret_key_here"
  }'
```

### Option 2: Sử dụng MongoDB Compass hoặc mongosh

```javascript
db.users.insertOne({
  email: "admin@example.com",
  password: "$2a$10$...", // bcrypt hashed password
  role: "admin",
  name: "",
  phone: "",
  address: "",
  avatarUrl: "",
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

## API Endpoints

### User Registration (Role: user)

```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Register successful.",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### User Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Admin Login

```
POST /auth/admin-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword123"
}

Response:
{
  "message": "Admin login successful.",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Create Admin Account (First Time Only)

```
POST /auth/create-admin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword123",
  "secretKey": "your_admin_secret_key_here"
}
```

## Protected Product Routes

Tất cả các endpoint dưới đây yêu cầu JWT token với role="admin":

### Create Product (Admin Only)

```
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Cappuccino",
  "category": "Espresso",
  "subtitle": "Classic",
  "price": 4.50,
  "description": "Classic Italian cappuccino with perfect foam.",
  "imageUrl": "https://images.unsplash.com/..."
}
```

### Update Product (Admin Only)

```
PUT /products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 5.00
}
```

### Delete Product (Admin Only)

```
DELETE /products/:id
Authorization: Bearer <admin_token>
```

### Get Products (Public)

```
GET /products
GET /products?category=Cappuccino
GET /products/:id
```

## Frontend Usage

### 1. Admin Login

Truy cập trang `/admin/login` và đăng nhập với tài khoản admin.

### 2. Quản Lý Sản Phẩm

Sau khi đăng nhập, truy cập `/admin/product` để:

- Thêm sản phẩm mới (Create)
- Chỉnh sửa sản phẩm (Update)
- Xoá sản phẩm (Delete)
- Xem danh sách sản phẩm (Read)

### 3. Đăng Xuất

Click nút "Đăng xuất" ở trang quản lý sản phẩm.

## JWT Token Cấu Trúc

```javascript
// Payload
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1334567890
}

// Header
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Bảo Mật

1. **JWT_SECRET**: Giữ bí mật, tối thiểu 32 ký tự
2. **ADMIN_SECRET_KEY**: Chỉ dùng lần đầu tiên để tạo admin account, sau đó tắt endpoint này hoặc yêu cầu verification
3. **Token Expiration**: Mặc định 7 ngày, có thể thay đổi qua JWT_EXPIRES_IN
4. **HTTPS Only**: Trong production, luôn sử dụng HTTPS

## Troubleshooting

### "Admin access required"

- Đảm bảo JWT token có role="admin"
- Kiểm tra token chưa hết hạn

### "No token provided"

- Kiểm tra header Authorization: `Bearer <token>`

### "Invalid or expired token"

- Đăng nhập lại để lấy token mới
- Kiểm tra JWT_SECRET match với server

## Testing

Sử dụng Postman hoặc Thunder Client:

1. Import collection hoặc tạo requests cho các endpoints
2. Sao chép token từ login response vào Authorization header
3. Test các CRUD operations
