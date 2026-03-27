import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
// Đã xóa import Settings
import { User, LogOut, FileText } from "lucide-react"; 
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

const UserMenu = () => {
  const { user, logout, isLoading } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Xử lý đóng menu khi người dùng click ra bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return <Button variant="ghost" size="icon" disabled />;
  }

  // Nếu chưa đăng nhập
  if (!user) {
    return (
      <Link to="/login">
        <Button variant="ghost" size="icon" title="Đăng nhập">
          <User className="h-5 w-5" />
        </Button>
      </Link>
    );
  }

  // Nếu đã đăng nhập - hiển thị dropdown
  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        title={user.name}
        className="relative"
      >
        <User className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          <div className="py-2">
            {/* Nút chuyển đến Lịch sử đơn hàng / Hóa đơn */}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/orders"); // Thay "/orders" bằng route trỏ tới trang UserOrders.tsx
              }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Đơn hàng của tôi
            </button>

            <div className="my-1 border-t border-border"></div>

            {/* Nút đăng xuất */}
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
                navigate("/login");
              }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2 text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;