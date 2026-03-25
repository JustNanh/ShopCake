import cakeBirthday from "@/assets/cake-birthday.jpg";
import bread from "@/assets/bread.jpg";
import pastry from "@/assets/pastry.jpg";
import cakeChocolate from "@/assets/cake-chocolate.jpg";
import cakeMatcha from "@/assets/cake-matcha.jpg";
import cakeStrawberry from "@/assets/cake-strawberry.jpg";
import cakeTiramisu from "@/assets/cake-tiramisu.jpg";

export type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: "birthday" | "bread" | "pastry";
  flavor: "chocolate" | "matcha" | "fruit" | "cream" | "coffee";
  rating: number;
  reviews: number;
  description: string;
  ingredients: string;
  storage: string;
  bestSeller?: boolean;
};

// Data products now được load runtime từ backend API.
export const products: Product[] = [];

export const categories = [
  { id: "birthday", name: "Bánh sinh nhật", image: cakeBirthday },
  { id: "bread", name: "Bánh mì", image: bread },
  { id: "pastry", name: "Pastry", image: pastry },
];

export const flavors = [
  { id: "chocolate", name: "Socola" },
  { id: "matcha", name: "Matcha" },
  { id: "fruit", name: "Trái cây" },
  { id: "cream", name: "Kem" },
  { id: "coffee", name: "Cà phê" },
];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
