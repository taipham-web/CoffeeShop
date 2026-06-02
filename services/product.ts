import { buildApiUrl } from "./api";

export interface Product {
  _id: string;
  name: string;
  subtitle: string;
  category: string;
  price: number;
  rating: number;
  imageUrl: string;
  description: string;
  isAvailable: boolean;
  createdAt: string;
  sizes?: { name: string; price: number }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Lấy danh sách sản phẩm, lọc theo category nếu có */
export async function fetchProducts(category?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== "All") {
    params.append("category", category);
  }
  const url = buildApiUrl(`/products?${params.toString()}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: ApiResponse<Product[]> = await res.json();
  if (!json.success) throw new Error(json.message ?? "Unknown error");
  return json.data;
}

/** Lấy danh sách category duy nhất */
export async function fetchCategories(): Promise<string[]> {
  const url = buildApiUrl("/products/categories");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: ApiResponse<string[]> = await res.json();
  if (!json.success) throw new Error(json.message ?? "Unknown error");
  return json.data;
}

/** Lấy chi tiết một sản phẩm theo ID */
export async function fetchProductById(id: string): Promise<Product> {
  const url = buildApiUrl(`/products/${id}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: ApiResponse<Product> = await res.json();
  if (!json.success) throw new Error(json.message ?? "Unknown error");
  return json.data;
}

/** Seed dữ liệu mẫu (chỉ dùng khi dev) */
export async function seedProducts(): Promise<string> {
  const url = buildApiUrl("/products/seed");
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: ApiResponse<null> = await res.json();
  return json.message ?? "Done";
}
