import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, QrCode, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/data/products";

interface PaymentModalProps {
  orderId: number;
  totalAmount: number;
  paymentMethod: string; // Nhận từ CheckoutPage: "banking", "vnpay", "momo", "zalopay"
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal = ({ orderId, totalAmount, paymentMethod, onClose, onSuccess }: PaymentModalProps) => {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Lấy thông tin từ .env
  const ACCOUNT_NAME = import.meta.env.VITE_ACCOUNT_NAME || "HNA";
  const MOMO_ACCOUNT = import.meta.env.VITE_MOMO_ACCOUNT || "0902837825";
  const QR_IMAGE_PATH = "/QR/momo.jpg";

  useEffect(() => {
    handleInitPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInitPayment = async () => {
    try {
      setLoading(true);
      setInitError(null);

      const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
      
      const response = await fetch(`${baseUrl}/api/payments/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          orderId,
          paymentMethod: paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Khởi tạo thanh toán thất bại");
      }

      const data = await response.json();
      
      // Lưu payment ID để confirm thanh toán sau
      if (data.paymentId) {
        setPaymentId(data.paymentId);
      }
      console.log("Payment ID:", data.paymentId);

      // Preload ảnh QR để kiểm tra ảnh có tồn tại không
      const qrImageResponse = await fetch(QR_IMAGE_PATH);
      if (!qrImageResponse.ok) {
        throw new Error(
          `❌ Không tìm thấy ảnh QR tại: ${QR_IMAGE_PATH}\n` +
          `📁 Vui lòng lưu file momo.jpg vào thư mục: public/QR/momo.jpg`
        );
      }

      console.log("✅ Ảnh QR đã load thành công!");
    } catch (error) {
      console.error("Payment error:", error);
      setInitError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isBanking = paymentMethod === "banking" || paymentMethod === "banktransfer";
  const isMomo = paymentMethod === "momo";
  const showStaticQr = isBanking || isMomo;

  const handleConfirmPayment = async () => {
    if (!paymentId) {
      setInitError("Không tìm thấy ID giao dịch");
      return;
    }

    try {
      setConfirming(true);
      const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

      const response = await fetch(`${baseUrl}/api/payments/${paymentId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Xác nhận thanh toán thất bại");
      }

      const data = await response.json();
      console.log("Payment confirmed:", data);
      
      // Gọi callback để reload danh sách đơn hàng
      onSuccess();
    } catch (error) {
      console.error("Confirm payment error:", error);
      setInitError((error as Error).message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-center font-display text-xl">
            Thanh toán đơn hàng #{orderId}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Đang tạo giao dịch an toàn...</p>
            </div>
          ) : initError ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center space-y-3">
              <p className="font-semibold">⚠️ Có lỗi xảy ra!</p>
              <p className="text-sm whitespace-pre-wrap">{initError}</p>
              {initError.includes("Không tìm thấy ảnh QR") && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800 mt-3">
                  <p className="font-semibold mb-2">🔧 Cách khắc phục:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Tạo thư mục: <code className="bg-white px-2 py-1 rounded">react.js-frontend/public/QR</code></li>
                    <li>Lưu ảnh momo QR vào: <code className="bg-white px-2 py-1 rounded">momo.jpg</code></li>
                    <li>Refresh trang và thử lại</li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hiển thị QR Code cho Chuyển khoản ngân hàng / Momo */}
              {showStaticQr && (
                <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <QrCode className="h-6 w-6" />
                    <span>{isMomo ? "Mở App Momo Quét Mã" : "Mở App Ngân Hàng Quét Mã"}</span>
                  </div>
                  
                  <div className="bg-white p-3 rounded-2xl border-2 border-primary/20 shadow-sm relative group overflow-hidden">
                    <img
                      src={QR_IMAGE_PATH}
                      alt="QR Code Thanh Toán"
                      className="h-60 w-60 object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error("Không tìm thấy ảnh QR:", QR_IMAGE_PATH);
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">Tổng số tiền cần thanh toán</p>
                    <p className="text-2xl font-bold text-primary">{formatPrice(totalAmount)}</p>
                  </div>

                  {/* Hiển thị thông tin tài khoản */}
                  <div className="w-full bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg border border-pink-200 space-y-2">
                    <p className="text-sm font-semibold text-gray-800">📱 Thông tin nhận tiền:</p>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chủ tài khoản:</span>
                        <span className="font-semibold">{ACCOUNT_NAME}</span>
                      </div>
                      {isMomo && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số Momo:</span>
                          <span className="font-semibold font-mono">{MOMO_ACCOUNT}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2 text-left w-full">
                    <span>ℹ️</span>
                    <span>{isMomo ? "Quét mã QR bằng ứng dụng Momo để thanh toán." : "Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự động xác nhận đơn hàng cho bạn."}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading || confirming}>
              Hủy / Đóng
            </Button>
            {(!loading && !initError && showStaticQr) && (
              <Button 
                onClick={handleConfirmPayment} 
                disabled={confirming || !paymentId}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xác nhận...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Đã thanh toán
                  </>
                )}
              </Button>
            )}
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;