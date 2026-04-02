import { useState, useEffect, useCallback } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAuth = useCallback(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        setIsAdmin(parsedUser.role === "Admin");
      } catch {
        setUser(null);
        setIsAdmin(false);
      }
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    // Kiểm tra ban đầu
    checkAuth();

    // Listen to custom auth-change event
    window.addEventListener("auth-change", checkAuth);

    // Listen to storage changes từ các tab khác
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, [checkAuth]);

  return { user, isAdmin };
};

export default useAuth;
