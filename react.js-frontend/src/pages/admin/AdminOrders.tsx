import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/data/products";
import { getOrders } from "@/lib/api";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Order = {
  id: string;
  customer: string;
  email: string;
  items: string;
  total: number;
  status: string;
  date: string;
};

const initialOrders: Order[] = [];

const statusColor: Record<string, string> = {
  "Đang xử lý": "bg-yellow-100 text-yellow-800",
  "Đang giao": "bg-blue-100 text-blue-800",
  "Đã giao": "bg-green-100 text-green-800",
  "Đã hủy": "bg-red-100 text-red-800",
};

const statuses = ["Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"];

const mapStatusToUI = (status: string) => {
  switch (status) {
    case "Processing": return "Đang xử lý";
    case "Delivered": return "Đã giao";
    case "Cancelled": return "Đã hủy";
    case "Pending":
    default:
      return "Đang xử lý";
  }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrders();
        const normalized = data.map((o: any) => ({
          id: String(o.orderId ?? o.id),
          customer: o.customer?.fullName ?? o.customer?.fullName ?? "Khách hàng",
          email: o.customer?.email ?? "",
          items: o.orderDetails?.map((d: any) => `${d.product?.productName ?? d.productId} x${d.quantity}`).join(", ") ?? "",
          total: Number(o.totalAmount ?? o.total ?? 0),
          status: mapStatusToUI(o.status ?? "Pending"),
          rawStatus: o.status ?? "Pending",
          date: new Date(o.orderDate ?? o.orderDate).toLocaleString("vi-VN"),
        }));
        setOrders(normalized);
      } catch (error) {
        console.error("Lấy đơn hàng thất bại", error);
        toast({ title: "Lấy đơn hàng thất bại", description: String(error), variant: "destructive" });
      }
    };

    loadOrders();
  }, [toast]);

  const filtered = orders.filter((o) => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = (id: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    toast({ title: `Đơn ${id} đã chuyển sang "${newStatus}"` });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-foreground">Quản lý đơn hàng</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc mã đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead className="hidden md:table-cell">Sản phẩm</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chưa có đơn hàng nào
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{o.customer}</p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{o.items}</TableCell>
                  <TableCell>{formatPrice(o.total)}</TableCell>
                  <TableCell className="text-sm">{o.date}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[o.status]}`}>
                      {o.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrders;
