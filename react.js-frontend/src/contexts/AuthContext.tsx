import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function để cập nhật user từ localStorage
  const updateUserFromStorage = useCallback(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        setIsAdmin(parsedUser.role === "Admin");
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        setUser(null);
        setIsAdmin(false);
      }
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  // Lấy dữ liệu từ localStorage khi component mount
  useEffect(() => {
    updateUserFromStorage();
    setIsLoading(false);
  }, [updateUserFromStorage]);

  // Listen for auth-change events
  useEffect(() => {
    const handleAuthChange = () => {
      console.log("Auth change event detected");
      updateUserFromStorage();
    };

    window.addEventListener("auth-change", handleAuthChange);
    
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [updateUserFromStorage]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAdmin(false);
    window.dispatchEvent(new Event("auth-change"));
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
