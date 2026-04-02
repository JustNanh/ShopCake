import { create } from "zustand";
import { Product } from "@/data/products";

export type CartItem = {
  product: Product;
  quantity: number;
  message?: string;
};

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number, message?: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  totalItems: () => number;
  totalPrice: () => number;
};

const getUserKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user && user.id != null) {
      return `cart_${user.id}`;
    }
  } catch (error) {
    console.warn("Không lấy được user từ localStorage:", error);
  }
  return "cart_guest";
};

const loadCart = (): CartItem[] => {
  try {
    const key = getUserKey();
    const value = localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    console.warn("Không tải được giỏ hàng từ localStorage:", error);
  }
  return [];
};

const saveCart = (items: CartItem[]) => {
  try {
    const key = getUserKey();
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.warn("Không lưu được giỏ hàng vào localStorage:", error);
  }
};

export const useCartStore = create<CartStore>((set, get) => {
  const initialItems = loadCart();

  const setItems = (items: CartItem[]) => {
    set({ items });
    saveCart(items);
  };

  window.addEventListener("auth-change", () => {
    const newItems = loadCart();
    set({ items: newItems });
  });

  return {
    items: initialItems,
    isOpen: false,
    addItem: (product, quantity = 1, message) => {
      set((state) => {
        const existing = state.items.find((i) => i.product.id === product.id);
        const nextItems = existing
          ? state.items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity, message: message || i.message }
                : i
            )
          : [...state.items, { product, quantity, message }];
        saveCart(nextItems);
        return { items: nextItems };
      });
    },
    removeItem: (productId) =>
      set((state) => {
        const nextItems = state.items.filter((i) => i.product.id !== productId);
        saveCart(nextItems);
        return { items: nextItems };
      }),
    updateQuantity: (productId, quantity) =>
      set((state) => {
        const nextItems =
          quantity <= 0
            ? state.items.filter((i) => i.product.id !== productId)
            : state.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
        saveCart(nextItems);
        return { items: nextItems };
      }),
    clearCart: () => {
      setItems([]);
    },
    toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    setCartOpen: (open) => set({ isOpen: open }),
    totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  };
});
