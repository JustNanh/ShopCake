import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/api";
import { formatPrice } from "@/data/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PaymentModal from "@/components/PaymentModal"; // Import thêm PaymentModal

const statusColor: Record<string, string> = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "Processing": "bg-blue-100 text-blue-800",
  "Shipped": "bg-blue-100 text-blue-800",
  "Delivered": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800",
};

const UserOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // State để quản lý việc hiển thị modal thanh toán lại
  const [payingOrder, setPayingOrder] = useState<any | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders();
      setOrders(data);
      setError(null);
    } catch (ex: any) {
      console.error("Lấy đơn hàng thất bại", ex);
      setError(ex.message || "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="container py-10">
      <div className="flex mb-6 items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
        <Button variant="outline" onClick={() => navigate("/menu")}>Tiếp tục mua</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Đang tải đơn hàng...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : orders.length === 0 ? (
            <p>Chưa có đơn hàng.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                // Kiểm tra xem đơn hàng có phải thanh toán online và đang chờ xử lý không
                const isUnpaidOnline = order.status === "Pending" && order.paymentMethod && order.paymentMethod !== "cod";

                return (
                  <div key={order.orderId} className="rounded-lg border p-4">
                    <div className="flex justify-between items-start flex-col md:flex-row gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Mã đơn: #{order.orderId} {order.paymentMethod && `- ${order.paymentMethod.toUpperCase()}`}
                        </div>
                        <div className="font-semibold">{new Date(order.orderDate).toLocaleString("vi-VN")}</div>
                        <div className="text-sm">Tổng: {formatPrice(Number(order.totalAmount))}</div>
                      </div>
                      <div className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[order.status] || "bg-gray-100 text-gray-700"}`}>
                        {order.status}
                      </div>
                    </div>

                    {/* Hiển thị cảnh báo chưa thanh toán và nút Thanh toán lại */}
                    {isUnpaidOnline && (
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50 p-3 rounded-md border border-red-200">
                        <span className="text-sm text-red-600 font-medium">⚠️ Đơn hàng chưa được thanh toán hoàn tất</span>
                        <Button size="sm" variant="destructive" onClick={() => setPayingOrder(order)}>
                          Thanh toán lại
                        </Button>
                      </div>
                    )}

                    <div className="mt-3 text-sm text-muted-foreground">
                      {order.orderDetails?.map((item: any) => (
                        <div key={item.detailId} className="flex justify-between gap-2">
                          <span>{item.product?.productName ?? item.productId} x{item.quantity}</span>
                          <span>{formatPrice(Number(item.priceAtPurchase) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Render PaymentModal khi người dùng bấm Thanh toán lại */}
      {payingOrder && (
        <PaymentModal
          orderId={payingOrder.orderId}
          totalAmount={Number(payingOrder.totalAmount)}
          paymentMethod={payingOrder.paymentMethod || "banking"}
          onClose={() => setPayingOrder(null)}
          onSuccess={() => {
            setPayingOrder(null);
            loadOrders(); // Tải lại danh sách đơn hàng để cập nhật trạng thái mới nhất
          }}
        />
      )}
    </div>
  );
};

export default UserOrders;