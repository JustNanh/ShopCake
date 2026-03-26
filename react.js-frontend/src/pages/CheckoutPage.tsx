import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { useAuthContext } from "@/contexts/AuthContext";
import LoginPromptDialog from "@/components/LoginPromptDialog";
import PaymentModal from "@/components/PaymentModal";
import { formatPrice } from "@/data/products";
import { createOrder } from "@/lib/api";
import { toast } from "sonner";

const shippingFee = 2000;

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", address: "", city: "", district: "",
    shipping: "standard", payment: "cod",
  });

  const handleChange = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra xem user đã đăng nhập chưa
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!form.name || !form.phone || !form.address) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setIsLoading(true);

      // Tạo payload order để gửi lên API
      const orderPayload = {
        customerId: user.id,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
        })),
        recipientName: form.name,
        recipientPhone: form.phone,
        shippingAddress: form.address,
        city: form.city,
        district: form.district,
        shippingMethod: form.shipping,
        paymentMethod: form.payment,
      };

      // Gọi API để lưu order vào SQL Server
      const response = await createOrder(orderPayload);

      toast.success(`Đặt hàng thành công! Mã đơn hàng: ${response.orderId} 🎉`);
      
      // Nếu thanh toán online (không phải COD), hiển thị PaymentModal
      if (form.payment === "banking" || form.payment === "vnpay" || form.payment === "momo" || form.payment === "zalopay") {
        setOrderId(response.orderId);
        setShowPaymentModal(true);
      } else {
        // COD - clear cart và navigate về trang chủ
        clearCart();
        navigate("/");
      }
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "Lỗi khi đặt hàng, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">Giỏ hàng trống</p>
        <Button variant="link" onClick={() => navigate("/menu")}>Quay lại thực đơn</Button>
      </div>
    );
  }

  const total = totalPrice() + shippingFee;

  return (
    <>
      <LoginPromptDialog 
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
      <div className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Thanh toán</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-8">
        {/* Left - Form */}
        <div className="md:col-span-3 space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Thông tin người nhận</h2>
            <input
              placeholder="Họ và tên *"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              placeholder="Số điện thoại *"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              placeholder="Địa chỉ chi tiết *"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
              >
                <option value="">Tỉnh/Thành phố</option>
                <option>TP. Hồ Chí Minh</option>
                <option>Hà Nội</option>
                <option>Đà Nẵng</option>
              </select>
              <select
                value={form.district}
                onChange={(e) => handleChange("district", e.target.value)}
                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
              >
                <option value="">Quận/Huyện</option>
                <option>Quận 1</option>
                <option>Quận 3</option>
                <option>Quận 7</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Phương thức giao hàng</h2>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="shipping" value="standard" checked={form.shipping === "standard"} onChange={() => handleChange("shipping", "standard")} />
              <div><p className="text-sm font-medium">Giao tiêu chuẩn</p><p className="text-xs text-muted-foreground">2-3 ngày • {formatPrice(shippingFee)}</p></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="shipping" value="express" checked={form.shipping === "express"} onChange={() => handleChange("shipping", "express")} />
              <div><p className="text-sm font-medium">Giao nhanh</p><p className="text-xs text-muted-foreground">1-2 giờ • {formatPrice(1000)}</p></div>
            </label>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Phương thức thanh toán</h2>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="payment" value="cod" checked={form.payment === "cod"} onChange={() => handleChange("payment", "cod")} />
              <p className="text-sm font-medium">Thanh toán khi nhận hàng (COD)</p>
            </label>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="payment" value="banking" checked={form.payment === "banking"} onChange={() => handleChange("payment", "banking")} />
              <p className="text-sm font-medium">Chuyển khoản ngân hàng</p>
            </label>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="payment" value="vnpay" checked={form.payment === "vnpay"} onChange={() => handleChange("payment", "vnpay")} />
              <p className="text-sm font-medium">🏦 VNPay - Thanh toán online</p>
            </label>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="payment" value="momo" checked={form.payment === "momo"} onChange={() => handleChange("payment", "momo")} />
              <p className="text-sm font-medium">📱 Momo - Ví điện tử</p>
            </label>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="payment" value="zalopay" checked={form.payment === "zalopay"} onChange={() => handleChange("payment", "zalopay")} />
              <p className="text-sm font-medium">🛒 Zalopay - Thanh toán</p>
            </label>
          </div>
        </div>

        {/* Right - Summary */}
        <div className="md:col-span-2">
          <div className="sticky top-24 rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <img src={item.product.image} alt={item.product.name} className="h-14 w-14 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isLoading ? "Đang xử lý..." : item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                placeholder="Mã giảm giá"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm outline-none"
              />
              <Button variant="outline" size="sm">Áp dụng</Button>
            </div>

            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatPrice(totalPrice())}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phí giao hàng</span><span>{formatPrice(shippingFee)}</span></div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">Đặt hàng</Button>
          </div>
        </div>
      </form>

      {/* Payment Modal */}
      {showPaymentModal && orderId && (
        <PaymentModal
          orderId={orderId}
          totalAmount={total}
          onClose={() => {
            setShowPaymentModal(false);
            clearCart();
            navigate("/");
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            clearCart();
            navigate("/");
          }}
        />
      )}
    </div>
    </>
  );
};

export default CheckoutPage;
