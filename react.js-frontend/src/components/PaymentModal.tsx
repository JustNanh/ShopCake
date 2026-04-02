import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, QrCode, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/data/products";

interface PaymentModalProps {
  orderId: number;
  totalAmount: number;
  paymentMethod: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal = ({ orderId, totalAmount, paymentMethod, onClose, onSuccess }: PaymentModalProps) => {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Lấy tên chủ tài khoản từ .env hoặc mặc định
  const ACCOUNT_NAME = import.meta.env.VITE_ACCOUNT_NAME || "Huỳnh Ngọc Anh";
  
  // Cấu hình VietQR động (Sử dụng link VietinBank của bạn)
  const transferContent = `DH${orderId}`;
  const vietQrUrl = `https://img.vietqr.io/image/970415-108875998588-compact.png?amount=${totalAmount}&addInfo=${transferContent}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

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
        body: JSON.stringify({ orderId, paymentMethod }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Khởi tạo thanh toán thất bại");
      }

      const data = await response.json();
      if (data.paymentId) setPaymentId(data.paymentId);
    } catch (error) {
      console.error("Payment error:", error);
      setInitError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentId) return;
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
            Thanh toán VietQR - Đơn hàng #{orderId}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang tạo mã QR...</p>
            </div>
          ) : initError ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
              <p className="font-semibold">⚠️ Lỗi: {initError}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <QrCode className="h-6 w-6" />
                  <span>Mở App Ngân Hàng Quét Mã</span>
                </div>
                
                <div className="bg-white p-3 rounded-2xl border-2 border-primary/20 shadow-sm relative group overflow-hidden">
                  <img
                    src={vietQrUrl}
                    alt="VietQR Code"
                    className="h-60 w-60 object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Số tiền thanh toán</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(totalAmount)}</p>
                </div>

                <div className="w-full bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">🏦 Thông tin chuyển khoản:</p>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Chủ tài khoản:</span>
                      <span className="font-bold">{ACCOUNT_NAME}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ngân hàng:</span>
                      <span className="font-bold">VietinBank (970415)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tài khoản:</span>
                      <span className="font-bold font-mono text-primary">108875998588</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nội dung CK:</span>
                      <span className="font-bold font-mono text-red-600">{transferContent}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading || confirming}>
              Hủy
            </Button>
            {!loading && !initError && (
              <Button 
                onClick={handleConfirmPayment} 
                disabled={confirming || !paymentId}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {confirming ? "Đang xác nhận..." : "Tôi đã thanh toán"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;