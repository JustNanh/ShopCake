import { Product } from "@/data/products";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

function mapProduct(data: any): Product {
  // Chuẩn hóa category (chuyển về chữ thường để dễ so sánh)
  const categoryName = data.category?.categoryName?.toLowerCase().trim() ?? "pastry";
  
  // Phân loại category
  let mappedCategory = "pastry";
  if (categoryName.includes("bánh sinh nhật") || categoryName.includes("birthday")) {
    mappedCategory = "birthday";
  } else if (categoryName.includes("bánh mì") || categoryName.includes("bread")) {
    mappedCategory = "bread";
  }

  // Chuẩn hóa flavor (chuyển về chữ thường)
  const flavorStr = data.flavor?.toLowerCase().trim() ?? "cream";

  // Xử lý imageUrl - nếu rỗng hoặc không có thì dùng placeholder
  let imageUrl = data.imageUrl || data.image || "";
  
  let normalizedImage: string;
  
  if (!imageUrl || imageUrl.trim() === "") {
    // Nếu imageUrl trống, dùng placeholder
    normalizedImage = "https://via.placeholder.com/300x300?text=No+Image";
  } else if (imageUrl.startsWith("http")) {
    // Nếu là URL đầy đủ (http/https), dùng trực tiếp
    normalizedImage = imageUrl;
  } else {
    // Nếu là đường dẫn tương đối, thêm BASE_URL
    normalizedImage = `${BASE_URL}/${imageUrl.replace(/^\/+/, "")}`;
  }

  console.log(`🖼️ Product "${data.productName}": imageUrl="${imageUrl}" → normalized="${normalizedImage}"`);

  return {
    id: data.productId ?? data.id,
    name: data.productName ?? data.name ?? "Sản phẩm chưa có tên",
    price: Number(data.price ?? 0),
    image: normalizedImage,
    category: mappedCategory as Product["category"],
    flavor: flavorStr as Product["flavor"],
    rating: Number(data.rating ?? 4.5), // Giả lập rating nếu DB không có
    reviews: Number(data.reviews ?? 10), // Giả lập số lượt review nếu DB không có
    description: data.description ?? "Chưa có mô tả",
    ingredients: data.ingredients ?? "",
    storage: data.storage ?? "",
    bestSeller: Number(data.rating ?? 4.5) >= 4.5,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status} ${response.statusText}: ${text}`);
  }

  if (response.status === 204) return undefined as unknown as T;
  return (await response.json()) as T;
}

export async function getProducts(): Promise<Product[]> {
  const data = await request<any[]>("/api/products");
  
  // 👇 DÒNG QUAN TRỌNG: In dữ liệu ra màn hình F12 để kiểm tra
  console.log("📦 Dữ liệu gốc từ Database trả về:", data);
  
  const mappedData = data.map(mapProduct);
  console.log("✨ Dữ liệu sau khi Map cho Front-end:", mappedData);
  
  return mappedData;
}

export async function getProductById(id: number): Promise<Product> {
  const data = await request<any>(`/api/products/${id}`);
  return mapProduct(data);
}

export async function updateProduct(id: number, product: { categoryId?: number; productName: string; flavor?: string; description?: string; price: number; imageUrl?: string }): Promise<any> {
  return await request<any>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: number): Promise<any> {
  return await request<any>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export async function getOrders(): Promise<any[]> {
  return await request<any[]>('/api/orders');
}

export async function getMyOrders(): Promise<any[]> {
  return await request<any[]>('/api/orders/me');
}

export async function updateOrderStatus(orderId: number, status: string): Promise<any> {
  return await request<any>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createOrder(order: { customerId: number; items: Array<{ productId: number; quantity: number; priceAtPurchase: number; }>; }): Promise<any> {
  return await request<any>("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function login(email: string, password: string): Promise<any> {
  return await request<any>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload: { fullName: string; email: string; password: string; phone?: string; address?: string; gender?: string; }): Promise<any> {
  return await request<any>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Payment endpoints
export async function initPayment(orderId: number, paymentMethod: string): Promise<any> {
  return await request<any>("/api/payments/init", {
    method: "POST",
    body: JSON.stringify({ orderId, paymentMethod }),
  });
}

export async function getPaymentStatus(paymentId: number): Promise<any> {
  return await request<any>(`/api/payments/${paymentId}/status`);
}