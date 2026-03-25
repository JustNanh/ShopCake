-- ============================================================
-- MIGRATION: Thêm cột password_hash vào bảng Customers
-- Chạy script này SAU KHI đã chạy file QLBN.sql gốc
-- ============================================================

-- Thêm cột password_hash (nếu chưa có)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'password_hash'
)
BEGIN
    ALTER TABLE Customers ADD password_hash NVARCHAR(255) NULL;
    PRINT '✅ Đã thêm cột password_hash vào bảng Customers';
END
ELSE
    PRINT 'ℹ️ Cột password_hash đã tồn tại, bỏ qua.';

-- Thêm cột role vào bảng Customers
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'role'
)
BEGIN
    ALTER TABLE Customers ADD role NVARCHAR(20) DEFAULT 'Customer' NOT NULL;
    PRINT '✅ Đã thêm cột role vào bảng Customers';
END
ELSE
    PRINT 'ℹ️ Cột role đã tồn tại, bỏ qua.';

-- Set quyền Admin cho một tài khoản cụ thể (Ví dụ)
-- UPDATE Customers SET role = 'Admin' WHERE email = 'admin@shopcake.com';

-- ============================================================
-- DỮ LIỆU MẪU (tùy chọn) - ĐÃ LOẠI BỎ
-- ============================================================

-- Danh mục bánh (có thể giữ lại nếu cần khởi tạo danh mục):
INSERT INTO Categories (category_name) VALUES
(N'Bánh kem'), (N'Bánh mì'), (N'Bánh ngọt'), (N'Bánh cupcake');

-- Sản phẩm mẫu đã được loại bỏ theo yêu cầu
-- (Không chèn dữ liệu mẫu vào bảng Products ở migration này)
-- PRINT '✅ Đã thêm dữ liệu mẫu';
