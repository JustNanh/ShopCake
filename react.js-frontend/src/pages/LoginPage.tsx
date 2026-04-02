import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Import các hàm API
import { login, register } from "@/lib/api";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Đổi thành async function để gọi API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        // Gọi API Đăng nhập
        const response = await login(email, password);
        
        // Lưu token và thông tin user (Bao gồm cả role từ API trả về)
        localStorage.setItem("token", response.token);
        const userData = {
          id: response.customerId,
          name: response.fullName,
          email: response.email,
          role: response.role
        };
        localStorage.setItem("user", JSON.stringify(userData));

        toast({
          title: "Đăng nhập thành công!",
          description: `Chào mừng ${response.fullName} quay lại 🍰`,
        });
        
        // Dispatch auth-change event để cập nhật Header ngay lập tức
        // Phải dispatch trước navigate để AuthContext kịp cập nhật
        window.dispatchEvent(new Event("auth-change"));
        
        // Wait a bit to ensure state is updated in all listeners before navigation
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Kiểm tra role để chuyển hướng cho đúng
        if (response.role === "Admin") {
          navigate("/admin", { replace: true }); // Chuyển sang trang Admin
        } else {
          navigate("/", { replace: true }); // Chuyển sang trang Chủ
        }
        
      } else {
        // Gọi API Đăng ký
        await register({
          fullName: name,
          email: email,
          password: password,
          phone: phone,
          address: address || null,
          gender: gender || null,
        });

        toast({
          title: "Đăng ký thành công!",
          description: "Vui lòng đăng nhập với tài khoản vừa tạo 🍰",
        });
        
        // Đăng ký xong tự động chuyển về form đăng nhập
        setIsLogin(true);
      }
    } catch (error: any) {
      // Hiển thị lỗi nếu sai mật khẩu hoặc tài khoản đã tồn tại
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra, vui lòng thử lại.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-4xl">🍰</span>
            <span className="font-display text-2xl font-bold text-primary">Sweet Bakery</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? "Đăng nhập để tiếp tục mua sắm" : "Tạo tài khoản mới"}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-lg">

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required={!isLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0971234567"
                    required={!isLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    required={!isLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Giới tính</Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="pr-10"
                  required
                />
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                {isLogin && (
                  <button type="button" className="text-xs text-primary hover:underline">
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Bằng việc tiếp tục, bạn đồng ý với{" "}
          <span className="underline cursor-pointer">Điều khoản dịch vụ</span> và{" "}
          <span className="underline cursor-pointer">Chính sách bảo mật</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;