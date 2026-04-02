import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");

  return (
    <footer className="border-t bg-secondary/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🍰</span>
              <span className="font-display text-lg font-bold text-primary">Sweet Bakery</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Mang đến những chiếc bánh thơm ngon, được làm từ nguyên liệu tươi mới mỗi ngày.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4">Liên kết</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">Trang chủ</Link>
              <Link to="/menu" className="hover:text-primary">Thực đơn</Link>
              <Link to="/about" className="hover:text-primary">Về chúng tôi</Link>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4">Liên hệ</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 123 Nguyễn Huệ, Q.1, TP.HCM</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> 0909 123 456</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@sweetbakery.vn</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="icon"><Facebook className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon"><Instagram className="h-4 w-4" /></Button>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4">Đăng ký nhận tin</h4>
            <p className="text-sm text-muted-foreground mb-3">Nhận ưu đãi và thông tin mới nhất!</p>
            <form onSubmit={(e) => { e.preventDefault(); setEmail(""); }} className="flex gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button size="sm">Đăng ký</Button>
            </form>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © 2026 Sweet Bakery. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
