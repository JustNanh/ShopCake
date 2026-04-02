# ShopCake
## 📂 Cấu trúc thư mục (Folder Structure)

Dự án được chia thành 2 phần chính: Backend (ASP.NET) và Frontend (React.js).

```text
ShopCake/
├── aspnet-backend/              # ⚙️ Mã nguồn Backend (C# .NET 8 Web API)
│   ├── Controllers/             # Xử lý các HTTP requests (Auth, Orders, Products, Payment...)
│   ├── Data/                    # Cấu hình AppDbContext để tương tác với SQL Server
│   ├── DTOs/                    # Data Transfer Objects dùng để trao đổi dữ liệu
│   ├── Migrations/              # File cập nhật schema cơ sở dữ liệu của Entity Framework
│   ├── Models/                  # Khai báo các Entities (Products, Users, Orders...)
│   ├── appsettings.json         # File cấu hình (Connection string, JWT secret...)
│   └── Program.cs               # Điểm khởi chạy và cấu hình các Services/Middlewares
│
├── react.js-frontend/           # 🎨 Mã nguồn Frontend (React.js + Vite + TypeScript)
│   ├── public/                  # Các file tĩnh không qua build (hình ảnh bánh, mã QR, favicon...)
│   ├── src/                     # Source code chính
│   │   ├── assets/              # Tài nguyên nội bộ (hình ảnh, global css...)
│   │   ├── components/          # Component dùng chung (Header, Footer, CartDrawer, UI Shadcn...)
│   │   ├── contexts/            # Quản lý State bằng Context API (AuthContext...)
│   │   ├── hooks/               # Các custom hooks (use-auth, use-toast, use-mobile...)
│   │   ├── lib/                 # Các tiện ích và cấu hình kết nối API (api.ts)
│   │   ├── pages/               # Các trang giao diện (Menu, Checkout, AdminDashboard, AdminOrders...)
│   │   ├── store/               # Quản lý trạng thái toàn cục (như Giỏ hàng - cartStore.ts)
│   │   ├── App.tsx              # Component gốc chứa định tuyến (Routing)
│   │   └── main.tsx             # Entry point khởi chạy ứng dụng React
│   ├── package.json             # Khai báo thư viện (dependencies) và các script chạy dự án
│   ├── tailwind.config.ts       # Cấu hình style cho Tailwind CSS
│   └── vite.config.ts           # Cấu hình server và build của Vite
│
└── README.md                    # Tài liệu giới thiệu dự án
# 🍰 ShopCake - Hệ thống quản lý Website Bán Bánh Ngọt

ShopCake là một hệ thống website thương mại điện tử chuyên biệt dành cho cửa hàng bán bánh ngọt. Dự án giúp chủ cửa hàng tự chủ trong việc kinh doanh, quản lý danh mục sản phẩm, thông tin khách hàng, giỏ hàng, đơn đặt hàng và trạng thái thanh toán một cách dễ dàng và hiệu quả.

## 🚀 Công nghệ sử dụng (Tech Stack)

Dự án được phát triển dựa trên mô hình Client-Server phân lớp rõ ràng:

**Frontend:**
* [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/) - Xây dựng giao diện người dùng (SPA)
* [Tailwind CSS](https://tailwindcss.com/) - Xây dựng UI nhanh chóng, Responsive
* [Shadcn UI](https://ui.shadcn.com/) - Các component giao diện hiện đại

**Backend:**
* [C# & .NET 8](https://dotnet.microsoft.com/) - Ngôn ngữ và nền tảng lõi
* [ASP.NET Core Web API](https://learn.microsoft.com/en-us/aspnet/core/web-api) - Xây dựng các dịch vụ RESTful API
* [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/) - ORM tương tác với cơ sở dữ liệu
* JWT (JSON Web Token) - Xác thực và phân quyền người dùng

**Database:**
* SQL Server - Hệ quản trị Cơ sở dữ liệu quan hệ lưu trữ thông tin hệ thống

## ✨ Chức năng nổi bật

### Dành cho Khách hàng (User)
* 🔐 Đăng nhập / Đăng ký tài khoản.
* 🍰 Xem danh sách, chi tiết thực đơn các loại bánh ngọt.
* 🛒 Thêm sản phẩm vào giỏ hàng, tùy chỉnh số lượng.
* 💳 Đặt hàng và tiến hành thanh toán (Tích hợp thanh toán qua mã QR như MoMo).
* 📦 Theo dõi lịch sử và trạng thái đơn đặt hàng.

### Dành cho Quản trị viên (Admin)
* 📊 Trang tổng quan (Dashboard) quản lý toàn bộ hệ thống.
* 🏷️ Quản lý danh mục và Sản phẩm (Thêm, Sửa, Xóa, Cập nhật trạng thái còn/hết bánh).
* 📝 Quản lý Đơn hàng (Tiếp nhận đơn, Cập nhật trạng thái: Đang xử lý, Đang giao, Đã hoàn thành).
* 👥 Quản lý thông tin khách hàng.

## 🛠️ Hướng dẫn cài đặt và chạy dự án (Getting Started)

### Yêu cầu hệ thống:
* [Node.js](https://nodejs.org/) (Dành cho Frontend)
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (Dành cho Backend)
* SQL Server (Hoặc SQL Server Express)

### 1. Cài đặt Backend (ASP.NET Core Web API)
```bash
# Di chuyển vào thư mục backend
cd aspnet-backend

# Cấu hình chuỗi kết nối (Connection String) trong file appsettings.json 
# trỏ tới SQL Server của bạn.

# Cập nhật cơ sở dữ liệu (Áp dụng Migrations)
dotnet ef database update

# Chạy dự án Backend
dotnet run

### 2. Cài đặt frontend (React.js)
# Di chuyển vào thư mục frontend
cd react.js-frontend

# Cài đặt các gói thư viện phụ thuộc (Sử dụng npm, yarn hoặc bun)
npm install
# hoặc bun install

# Chạy server phát triển (Development Server)
npm run dev
# hoặc bun run dev