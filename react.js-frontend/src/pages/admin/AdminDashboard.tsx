import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { products, formatPrice } from "@/data/products";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueData: { month: string; revenue: number }[] = [];

const recentOrders: { id: string; customer: string; total: number; status: string }[] = [];

const stats = [
  { label: "Doanh thu tháng", value: formatPrice(0), icon: DollarSign, change: "" },
  { label: "Đơn hàng", value: "0", icon: ShoppingCart, change: "" },
  { label: "Sản phẩm", value: products.length.toString(), icon: Package, change: "" },
  { label: "Tăng trưởng", value: "0%", icon: TrendingUp, change: "" },
];

const statusColor: Record<string, string> = {
  "Đang xử lý": "bg-yellow-100 text-yellow-800",
  "Đang giao": "bg-blue-100 text-blue-800",
  "Đã giao": "bg-green-100 text-green-800",
  "Đã hủy": "bg-red-100 text-red-800",
};

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-foreground">Tổng quan</h1>

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
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
