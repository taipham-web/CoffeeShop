import { buildApiUrl } from "./api";
import { getToken } from "./auth";
import { Product } from "./product";

async function authenticatedFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  if (!token) {
    throw new Error("Vui lòng đăng nhập để sử dụng tính năng này.");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error(`[Wishlist API] Server returned non-JSON response from ${path} (Status ${response.status}):`, text.slice(0, 500));
    throw new Error(`Server returned HTML instead of JSON (Status ${response.status}).`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function getWishlist(): Promise<Product[]> {
  try {
    const res = await authenticatedFetch("/wishlist");
    return res.data || [];
  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
    return [];
  }
}

export async function addToWishlist(productId: string): Promise<Product[]> {
  const res = await authenticatedFetch(`/wishlist/${productId}`, {
    method: "POST",
  });
  return res.data || [];
}

export async function removeFromWishlist(productId: string): Promise<Product[]> {
  const res = await authenticatedFetch(`/wishlist/${productId}`, {
    method: "DELETE",
  });
  return res.data || [];
}
