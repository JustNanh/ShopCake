import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/data/products";
import { getOrders, updateOrderStatus, deleteOrder } from "@/lib/api";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Order = {
  id: string;
  customer: string;
  email: string;
  items: any[];
  itemsSummary: string;
  total: number;
  shippingFee: number;
  paymentMethod: string;
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

const paymentMethodColor: Record<string, string> = {
  "cod": "bg-purple-100 text-purple-800",
  "COD": "bg-purple-100 text-purple-800",
  "banking": "bg-indigo-100 text-indigo-800",
  "Banking": "bg-indigo-100 text-indigo-800",
  "vnpay": "bg-blue-100 text-blue-800",
  "VNPay": "bg-blue-100 text-blue-800",
  "momo": "bg-pink-100 text-pink-800",
  "Momo": "bg-pink-100 text-pink-800",
};

const statuses = ["Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"];

const shippingFeeForMethod = (method: string | null | undefined) => {
  if (!method) return 0;
  if (method.toLowerCase().includes("express")) return 10000;
  if (method.toLowerCase().includes("standard")) return 20000;
  return 20000;
};

const mapPaymentDisplay = (method: string | null | undefined) => {
  if (!method) return "Chưa xác định";
  if (method.toLowerCase().includes("cod")) return "COD (Thanh toán khi nhận)";
  if (method.toLowerCase().includes("banking")) return "Chuyển khoản ngân hàng";
  if (method.toLowerCase().includes("vnpay")) return "VNPay";
  if (method.toLowerCase().includes("momo")) return "Momo";
  if (method.toLowerCase().includes("zalopay")) return "ZaloPay";
  return method;
};

const mapStatusToUI = (status: string) => {
  switch (status) {
    case "Processing": return "Đang xử lý";
    case "Shipped": return "Đang giao";
    case "Delivered": return "Đã giao";
    case "Cancelled": return "Đã hủy";
    case "Pending":
    default:
      return "Đang xử lý";
  }
};

const mapStatusToAPI = (uiStatus: string) => {
  switch (uiStatus) {
    case "Đang xử lý": return "Processing";
    case "Đang giao": return "Shipped";
    case "Đã giao": return "Delivered";
    case "Đã hủy": return "Cancelled";
    default: return "Pending";
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
          items: o.orderDetails ?? [],
          itemsSummary: o.orderDetails?.map((d: any) => `${d.product?.productName ?? d.productId} x${d.quantity}`).join(", ") ?? "",
          total: Number(o.totalAmount ?? o.total ?? 0),
          shippingFee: shippingFeeForMethod(o.shippingMethod),
          paymentMethod: o.paymentMethod ?? "cod",
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
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()) || o.itemsSummary.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const apiStatus = mapStatusToAPI(newStatus);
      await updateOrderStatus(Number(id), apiStatus);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus, rawStatus: apiStatus } : o)));
      toast({ title: `Đơn ${id} đã chuyển sang "${newStatus}"` });
    } catch (error) {
      console.error("Cập nhật trạng thái thất bại", error);
      toast({ title: "Cập nhật thất bại", description: String(error), variant: "destructive" });
    }
  };

  const deleteOrderAdmin = async (id: string) => {
    if (!confirm(`Bạn có chắc muốn xóa đơn #${id}?`)) return;
    try {
      await deleteOrder(Number(id));
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast({ title: `Đã xóa đơn #${id}`, variant: "destructive" });
    } catch (error) {
      console.error("Xóa đơn thất bại", error);
      toast({ title: "Xóa thất bại", description: String(error), variant: "destructive" });
    }
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
              <TableHead className="hidden lg:table-cell">Sản phẩm</TableHead>
              <TableHead>Tiền hàng</TableHead>
              <TableHead className="hidden sm:table-cell">Phí giao</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead className="hidden md:table-cell">Ngày đặt</TableHead>
              <TableHead className="hidden sm:table-cell">Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Chưa có đơn hàng nào
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-primary">#{o.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{o.customer}</p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-2">
                      {o.items.length > 0 ? (
                        o.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex flex-col items-center">
                            {item.product?.image ? (
                              <img src={item.product.image} alt={item.product?.productName} className="h-12 w-12 rounded-md object-cover border" />
                            ) : (
                              <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center text-xs text-gray-600">No Img</div>
                            )}
                            <span className="text-xs font-medium mt-1 max-w-[50px] text-center truncate">{item.product?.productName ?? "Sản phẩm"}</span>
                            <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Chưa có sản phẩm</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatPrice(o.total)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{formatPrice(o.shippingFee)}</TableCell>
                  <TableCell className="font-bold text-primary">{formatPrice(o.total + o.shippingFee)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{o.date}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${paymentMethodColor[o.paymentMethod] || "bg-gray-100 text-gray-800"}`}>
                      {mapPaymentDisplay(o.paymentMethod)}
                    </span>
                  </TableCell>
                  <TableCell>
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteOrderAdmin(o.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
