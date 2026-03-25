import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const UserMenu = () => {
  const { user, logout, isLoading } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

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
    <div className="relative">
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
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <div className="py-2">
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
