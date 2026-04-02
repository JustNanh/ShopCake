# Hướng Dẫn Lấy API Credentials Cho Thanh Toán

## Tổng Quan
Để tích hợp thanh toán thực tế, bạn cần lấy credentials từ các nhà cung cấp dịch vụ thanh toán Việt Nam. Đây là hướng dẫn chi tiết cho từng dịch vụ.

## 1. VNPay

### Bước Đăng Ký:
1. Truy cập: https://sandbox.vnpayment.vn/
2. Đăng ký tài khoản merchant
3. Xác minh thông tin doanh nghiệp
4. Đăng ký sử dụng cổng thanh toán

### Credentials Cần Thiết:
- **TmnCode**: Mã merchant (VD: `ABC12345`)
- **HashSecret**: Chuỗi bí mật để tạo hash (VD: `XYZ7890123456789`)

### Cách Lấy:
1. Đăng nhập vào tài khoản merchant
2. Vào phần "Quản lý Merchant" > "Thông tin Merchant"
3. Copy TmnCode và HashSecret

### URL Sandbox:
- Payment URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- Query Drills: `https://sandbox.vnpayment.vn/merchantv2/`

## 2. MoMo

### Bước Đăng Ký:
1. Truy cập: https://business.momo.vn/
2. Đăng ký tài khoản doanh nghiệp
3. Xác minh thông tin và giấy phép kinh doanh
4. Đăng ký tích hợp API thanh toán

### Credentials Cần Thiết:
- **PartnerCode**: Mã đối tác (VD: `MOMO123456789`)
- **AccessKey**: Khóa truy cập (VD: `ABCDEF1234567890`)
- **SecretKey**: Khóa bí mật (VD: `HIJKLMN1234567890`)

### Cách Lấy:
1. Đăng nhập vào Developer Portal
2. Vào phần "Apps" > "Thông tin ứng dụng"
3. Tạo app mới hoặc xem app hiện có
4. Copy các credentials

### URL Sandbox:
- Payment URL: `https://test-payment.momo.vn/gw_payment/transactionProcessor`

## 3. ZaloPay

### Bước Đăng Ký:
1. Truy cập: https://developers.zalopay.vn/
2. Đăng ký tài khoản developer
3. Tạo ứng dụng mới
4. Cấu hình thông tin thanh toán

### Credentials Cần Thiết:
- **AppId**: ID ứng dụng (VD: `123456789`)
- **Key1**: Khóa công khai (VD: `ABC123XYZ456`)
- **Key2**: Khóa bí mật (VD: `DEF789UVW012`)

### Cách Lấy:
1. Đăng nhập vào Developer Console
2. Vào phần "Ứng dụng" > "Chi tiết ứng dụng"
3. Xem phần "Thông tin xác thực"
4. Copy AppId, Key1, Key2

### URL Sandbox:
- API URL: `https://sandbox.zalopay.com.vn/v001/tpe/createorder`

## 4. Cấu Hình Trong Code

### appsettings.json
```json
{
  "Payment": {
    "VNPay": {
      "TmnCode": "YOUR_VNPAY_MERCHANT_CODE",
      "HashSecret": "YOUR_VNPAY_HASH_SECRET",
      "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      "ReturnUrl": "http://localhost:3000/checkout/vnpay-return"
    },
    "Momo": {
      "PartnerCode": "YOUR_MOMO_PARTNER_CODE",
      "AccessKey": "YOUR_MOMO_ACCESS_KEY",
      "SecretKey": "YOUR_MOMO_SECRET_KEY",
      "Url": "https://test-payment.momo.vn/gw_payment/transactionProcessor",
      "ReturnUrl": "http://localhost:3000/checkout/momo-return"
    },
    "ZaloPay": {
      "AppId": "YOUR_ZALOPAY_APP_ID",
      "Key1": "YOUR_ZALOPAY_KEY1",
      "Key2": "YOUR_ZALOPAY_KEY2",
      "Url": "https://sandbox.zalopay.com.vn/v001/tpe/createorder",
      "CallbackUrl": "http://localhost:5001/api/payments/zalopay/callback"
    }
  }
}
```

## 5. Lưu Ý Quan Trọng

### Bảo Mật Credentials:
- **KHÔNG** commit credentials vào Git
- Sử dụng environment variables cho production
- Rotate credentials định kỳ

### Production vs Sandbox:
- **Sandbox**: Dùng để test, tiền ảo
- **Production**: Tiền thật, cần xác minh đầy đủ

### Quy Trình Đăng Ký Production:
1. Hoàn thành tích hợp sandbox
2. Test kỹ lưỡng
3. Nộp hồ sơ production
4. Chờ phê duyệt (có thể mất 1-2 tuần)
5. Nhận credentials production

### Phí Dịch Vụ:
- VNPay: 1.8-2.5% mỗi giao dịch
- MoMo: 1.5-2.0% mỗi giao dịch
- ZaloPay: 1.0-1.8% mỗi giao dịch

### Hỗ Trợ:
- VNPay: support@vnpay.vn
- MoMo: business@momo.vn
- ZaloPay: developers@zalopay.vn

## 6. Test Credentials

Sau khi có credentials, test với các URL callback:
- VNPay Return: `/checkout/vnpay-return`
- MoMo Return: `/checkout/momo-return`
- ZaloPay Callback: `/api/payments/zalopay/callback`