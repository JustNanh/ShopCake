# 🎂 QLBN Backend - Quản Lý Bánh Ngọt

Hai backend API hoàn chỉnh cho hệ thống quản lý tiệm bánh, cùng kết nối SQL Server.

---

## 📁 Cấu trúc thư mục

```
/
├── nodejs-backend/          ← Node.js + Express + JWT + Swagger
│   ├── config/
│   │   ├── db.js            ← Kết nối SQL Server (mssql)
│   │   └── swagger.js       ← Cấu hình Swagger
│   ├── controllers/         ← Xử lý logic (auth, products, orders...)
│   ├── middleware/
│   │   └── auth.js          ← Middleware kiểm tra JWT
│   ├── routes/              ← Định nghĩa API + Swagger docs
│   ├── .env.example         ← Mẫu biến môi trường
│   ├── server.js            ← Entry point
│   └── package.json
│
└── aspnet-backend/          ← ASP.NET Core 8 + EF Core + JWT + Swagger
    ├── Controllers/         ← API Controllers
    ├── Data/
    │   └── AppDbContext.cs  ← EF Core DbContext
    ├── DTOs/DTOs.cs         ← Request/Response models
    ├── Models/Models.cs     ← Entity models
    ├── Program.cs           ← Entry point + DI setup
    ├── appsettings.json     ← Cấu hình DB + JWT
    ├── migration.sql        ← Thêm cột password_hash + dữ liệu mẫu
    └── QLBN.Api.csproj
```

---

## ⚙️ Yêu cầu

| Công cụ | Node.js Backend | ASP.NET Backend |
|---|---|---|
| SQL Server | ✅ | ✅ |
| Node.js v18+ | ✅ | ❌ |
| .NET SDK 8.0 | ❌ | ✅ |

---

## 🗃️ Chuẩn bị Database

**Bước 1:** Chạy file `QLBN.sql` gốc để tạo các bảng.

**Bước 2:** Chạy file `aspnet-backend/migration.sql` để thêm cột `password_hash` và dữ liệu mẫu.

```sql
-- Trong SQL Server Management Studio (SSMS), chạy:
USE QLBN;
-- Dán nội dung migration.sql vào đây và chạy
```

---

## 🚀 Chạy Node.js Backend (Port 5000)

```bash
cd nodejs-backend

# 1. Cài packages
npm install

# 2. Tạo file .env từ mẫu
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux

# 3. Mở .env và điền thông tin:
#    DB_SERVER=localhost
#    DB_DATABASE=QLBN
#    DB_USER=sa
#    DB_PASSWORD=mật_khẩu_của_bạn
#    JWT_SECRET=chuỗi_bí_mật_dài_32_ký_tự

# 4. Chạy server
npm run dev          # Development (auto-reload)
npm start            # Production
```

✅ API chạy tại: `http://localhost:5000`
📚 Swagger UI: `http://localhost:5000/api-docs`

---

## 🚀 Chạy ASP.NET Core Backend (Port 5001)

```bash
cd aspnet-backend

# 1. Mở appsettings.json và sửa:
#    "DefaultConnection": "Server=localhost;Database=QLBN;User Id=sa;Password=MẬT_KHẨU;..."
#    "Secret": "chuỗi_bí_mật_ít_nhất_32_ký_tự_..."

# 2. Restore packages
dotnet restore

# 3. Chạy server
dotnet run
```

✅ API chạy tại: `http://localhost:5001`
📚 Swagger UI: `http://localhost:5001/swagger`

---

## 🔐 Luồng xác thực (Authentication)

```
1. POST /api/auth/register  →  Tạo tài khoản
2. POST /api/auth/login     →  Nhận JWT token
3. Mọi request cần auth    →  Header: Authorization: Bearer <token>
```

---

## 📌 Danh sách API Endpoints

### 🔑 Auth
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký | ❌ |
| POST | `/api/auth/login` | Đăng nhập → nhận token | ❌ |

### 🎂 Products
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/products` | Danh sách sản phẩm | ❌ |
| GET | `/api/products/:id` | Chi tiết sản phẩm | ❌ |
| POST | `/api/products` | Thêm sản phẩm | ✅ |
| PUT | `/api/products/:id` | Sửa sản phẩm | ✅ |
| DELETE | `/api/products/:id` | Xóa sản phẩm | ✅ |

### 📋 Orders
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/orders` | Danh sách hóa đơn | ✅ |
| GET | `/api/orders/:id` | Chi tiết đơn + sản phẩm | ✅ |
| POST | `/api/orders` | Tạo đơn hàng mới | ✅ |
| PATCH | `/api/orders/:id/status` | Cập nhật trạng thái | ✅ |
| DELETE | `/api/orders/:id` | Xóa hóa đơn | ✅ |

### 📁 Categories / 👥 Customers / 💳 Payments / ⭐ Reviews
Xem đầy đủ tại Swagger UI sau khi chạy server.

---

## 📊 So sánh hai Backend

| Tiêu chí | Node.js + Express | ASP.NET Core |
|---|---|---|
| Ngôn ngữ | JavaScript | C# |
| ORM/DB | mssql (raw SQL) | Entity Framework Core |
| Tốc độ phát triển | Nhanh hơn | Cần setup nhiều hơn |
| Type safety | Không (JS thuần) | Có (C# strongly typed) |
| Performance | Tốt | Rất tốt |
| Phù hợp | Prototype, startup | Enterprise, team lớn |
| Port mặc định | 5000 | 5001 |

---

## 🛠️ Ví dụ gọi API (với curl)

```bash
# Đăng ký
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Nguyễn A","email":"a@test.com","password":"123456"}'

# Đăng nhập → copy token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"123456"}'

# Lấy sản phẩm (không cần token)
curl http://localhost:5000/api/products

# Tạo đơn hàng (cần token)
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer TOKEN_CỦA_BẠN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"items":[{"product_id":1,"quantity":2,"price_at_purchase":250000}]}'
```
