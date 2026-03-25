import { LayoutDashboard, Package, ShoppingCart, ArrowLeft, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Tổng quan", url: "/admin", icon: LayoutDashboard },
  { title: "Sản phẩm", url: "/admin/products", icon: Package },
  { title: "Đơn hàng", url: "/admin/orders", icon: ShoppingCart },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState("");

  // Update nama tùy theo user object từ useAuth hook
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user]);

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Dispatch auth-change event để cập nhật Header
    window.dispatchEvent(new Event("auth-change"));
    
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <div>
              <span className="font-display text-lg font-bold text-sidebar-primary">🍰 Admin</span>
              {userName && (
                <p className="text-xs text-sidebar-foreground/60 mt-1">{userName}</p>
              )}
            </div>
            <Link to="/" className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/admin"} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer com botão de logout */}
      <div className="p-4 border-t">
        <Button 
          variant="destructive" 
          size="sm" 
          className="w-full gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Đăng xuất</span>}
        </Button>
      </div>
    </Sidebar>
  );
}
