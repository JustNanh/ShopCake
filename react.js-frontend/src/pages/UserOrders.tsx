import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/api";
import { formatPrice } from "@/data/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    const load = async () => {
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
    load();
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
              {orders.map((order) => (
                <div key={order.orderId} className="rounded-lg border p-4">
                  <div className="flex justify-between items-start flex-col md:flex-row gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Mã đơn: #{order.orderId}</div>
                      <div className="font-semibold">{new Date(order.orderDate).toLocaleString("vi-VN")}</div>
                      <div className="text-sm">Tổng: {formatPrice(Number(order.totalAmount))}</div>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    {order.orderDetails?.map((item: any) => (
                      <div key={item.detailId} className="flex justify-between gap-2">
                        <span>{item.product?.productName ?? item.productId} x{item.quantity}</span>
                        <span>{formatPrice(Number(item.priceAtPurchase) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOrders;
