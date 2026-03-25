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
  const navigate = useNavigate();
  const { toast } = useToast();

  // Đổi thành async function để gọi API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        // Gọi API Đăng nhập
        const response = await login(email, password);
        
        // SỬA: Lưu token và thông tin user (Bao gồm cả role từ API trả về)
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify({
          id: response.customerId,
          name: response.fullName,
          email: response.email,
          role: response.role // Lấy role
        }));

        toast({
          title: "Đăng nhập thành công!",
          description: `Chào mừng ${response.fullName} quay lại 🍰`,
        });
        
        // Dispatch auth-change event để cập nhật Header và các component khác
        window.dispatchEvent(new Event("auth-change"));
        
        // SỬA: Kiểm tra role để chuyển hướng cho đúng
        if (response.role === "Admin") {
          navigate("/admin"); // Chuyển sang trang Admin
        } else {
          navigate("/"); // Chuyển sang trang Chủ
        }
        
      } else {
        // Gọi API Đăng ký
        await register({
          fullName: name,
          email: email,
          password: password,
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

  const handleGoogle = () => {
    toast({
      title: "Đăng nhập với Google",
      description: "Tính năng này cần kích hoạt Lovable Cloud",
    });
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
          <Button
            variant="outline"
            className="w-full gap-3 h-11 text-sm font-medium"
            onClick={handleGoogle}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Tiếp tục với Google
          </Button>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">hoặc</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
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