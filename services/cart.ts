import { buildApiUrl } from "@/services/api";
import { getToken } from "./auth";
import { Product } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  price?: number;
}

export interface Cart {
  user: string;
  items: CartItem[];
}

export const fetchCart = async (): Promise<Cart> => {
  const token = await getToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");

  const response = await fetch(buildApiUrl("/cart"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể tải giỏ hàng");
  return data;
};

export const addToCart = async (productId: string, quantity: number = 1, size: string = "", price?: number): Promise<Cart> => {
  const token = await getToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");

  const response = await fetch(buildApiUrl("/cart/add"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity, size, price }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể thêm vào giỏ hàng");
  return data;
};

export const updateCartItem = async (productId: string, quantity: number, size: string = ""): Promise<Cart> => {
  const token = await getToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");

  const response = await fetch(buildApiUrl("/cart/update"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity, size }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể cập nhật giỏ hàng");
  return data;
};

export const removeCartItem = async (productId: string, size: string = ""): Promise<Cart> => {
  const token = await getToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");

  // URL encode size because it might be empty or contain special characters
  const url = size ? `/cart/remove/${productId}/${encodeURIComponent(size)}` : `/cart/remove/${productId}`;
  const response = await fetch(buildApiUrl(url), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể xoá sản phẩm khỏi giỏ hàng");
  return data;
};

export const clearCart = async (): Promise<void> => {
  const token = await getToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");

  const response = await fetch(buildApiUrl("/cart/clear"), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể xoá giỏ hàng");
};
