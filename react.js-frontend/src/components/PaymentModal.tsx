import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, QrCode, CreditCard } from "lucide-react";
import { formatPrice } from "@/data/products";

type PaymentMethod = "VNPay" | "Momo" | "Zalopay";

interface PaymentModalProps {
  orderId: number;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal = ({ orderId, totalAmount, onClose, onSuccess }: PaymentModalProps) => {
  const [method, setMethod] = useState<PaymentMethod>("VNPay");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handleInitPayment = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payments/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          orderId,
          paymentMethod: method,
        }),
      });

      if (!response.ok) throw new Error("Khởi tạo thanh toán thất bại");

      const data = await response.json();
      setQrCode(data.qrCode);
      setPaymentUrl(data.paymentUrl);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Lỗi: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: "VNPay", name: "VNPay", icon: "🏦", desc: "Thanh toán qua VNPay" },
    { id: "Momo", name: "Momo", icon: "📱", desc: "Thanh toán qua Ví Momo" },
    { id: "Zalopay", name: "Zalopay", icon: "🛒", desc: "Thanh toán qua Zalopay" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Chọn phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hiển thị QR Code nếu đã khởi tạo */}
          {qrCode && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center gap-3">
                <QrCode className="h-8 w-8 text-primary" />
                <h3 className="font-semibold text-center">Quét mã QR để thanh toán</h3>
                <div className="bg-white p-3 rounded border-2 border-gray-200">
                  {/* Hiển thị QR (base64) */}
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code"
                    className="h-40 w-40"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Số tiền: <strong>{formatPrice(totalAmount)}</strong>
                </p>
              </div>

              {/* Link thanh toán online */}
              {paymentUrl && (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-2">
                    <CreditCard className="h-4 w-4" />
                    Thanh toán online ({method})
                  </Button>
                </a>
              )}
            </div>
          )}

          {/* Chọn phương thức nếu chưa khởi tạo */}
          {!qrCode && (
            <>
              <RadioGroup value={method} onValueChange={(val) => setMethod(val as PaymentMethod)}>
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value={pm.id} id={pm.id} />
                      <Label htmlFor={pm.id} className="flex-1 cursor-pointer">
                        <div className="font-semibold">{pm.icon} {pm.name}</div>
                        <div className="text-sm text-gray-600">{pm.desc}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                ℹ️ Hỗ trợ cả quét mã QR và thanh toán online
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Hủy
                </Button>
                <Button onClick={handleInitPayment} disabled={loading} className="flex-1 gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Tiếp tục
                </Button>
              </div>
            </>
          )}

          {/* Nút quay lại sau khi hiển thị QR */}
          {qrCode && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Đóng
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;
