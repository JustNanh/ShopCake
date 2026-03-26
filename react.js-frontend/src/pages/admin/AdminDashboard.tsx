import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/data/products";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getProducts, getOrders } from "@/lib/api";
import { Product } from "@/data/products";

const statusColor: Record<string, string> = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "Processing": "bg-blue-100 text-blue-800",
  "Shipped": "bg-green-100 text-green-800",
  "Delivered": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  "Pending": "Đang xử lý",
  "Processing": "Đang xử lý",
  "Shipped": "Đang giao",
  "Delivered": "Đã giao",
  "Cancelled": "Đã hủy",
};

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, ordersData] = await Promise.all([getProducts(), getOrders()]);
        setProducts(productsData);
        setOrders(ordersData);
        setError(null);
      } catch (ex: any) {
        setError(ex.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Tính toán stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyOrders = orders.filter(o => {
    const orderDate = new Date(o.orderDate);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });
  const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    { label: "Doanh thu tháng", value: formatPrice(monthlyRevenue), icon: DollarSign, change: "" },
    { label: "Đơn hàng", value: orders.length.toString(), icon: ShoppingCart, change: "" },
    { label: "Sản phẩm", value: products.length.toString(), icon: Package, change: "" },
    { label: "Tăng trưởng", value: "0%", icon: TrendingUp, change: "" },
  ];

  // Tính revenueData theo tháng
  const revenueData = orders.reduce((acc, order) => {
    const date = new Date(order.orderDate);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    const existing = acc.find(d => d.month === month);
    if (existing) {
      existing.revenue += order.totalAmount;
    } else {
      acc.push({ month, revenue: order.totalAmount });
    }
    return acc;
  }, [] as { month: string; revenue: number }[]).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Recent orders
  const recentOrders = orders.slice(0, 5).map(order => ({
    id: order.orderId.toString(),
    customer: order.customer?.fullName || "Unknown",
    total: order.totalAmount,
    status: statusLabel[order.status] || order.status,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-foreground">Tổng quan</h1>

      {loading ? (
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                  {s.change && <p className="text-xs text-muted-foreground mt-1">{s.change}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Doanh thu theo tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} className="text-xs" />
                    <Tooltip formatter={(v: number) => formatPrice(v)} />
                    <Bar dataKey="revenue" fill="hsl(25, 65%, 42%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Đơn hàng gần đây</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Chưa có đơn hàng</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-muted-foreground text-xs">{order.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(order.total)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
