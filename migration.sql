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

-- ============================================================
-- DỮ LIỆU MẪU (tùy chọn)
-- ============================================================

-- Danh mục bánh
INSERT INTO Categories (category_name) VALUES
(N'Bánh kem'), (N'Bánh mì'), (N'Bánh ngọt'), (N'Bánh cupcake');

-- Sản phẩm mẫu
INSERT INTO Products (category_id, product_name, flavor, price) VALUES
(1, N'Bánh kem dâu tây', N'Dâu tây', 250000),
(1, N'Bánh kem socola', N'Socola', 280000),
(2, N'Bánh mì bơ tỏi', N'Bơ tỏi', 35000),
(4, N'Cupcake vanilla', N'Vanilla', 45000);

PRINT '✅ Đã thêm dữ liệu mẫu';
