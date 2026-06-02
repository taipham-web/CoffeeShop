import { buildApiUrl } from "@/services/api";
import { getToken } from "./auth";

export interface OrderItem {
  product: string; // ObjectId
  name: string;
  subtitle: string;
  imageUrl: string;
  price: number;
  quantity: number;
  size?: string;
}

export interface OrderData {
  items: OrderItem[];
  orderType: "delivery" | "pickup";
  deliveryAddress: {
    title: string;
    detail: string;
    note?: string;
  };
  discountApplied?: string;
  subTotal: number;
  deliveryFee: number;
  totalPayment: number;
  paymentMethod: string;
  voucherIds?: string[];
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  orderType: string;
  deliveryAddress: {
    title: string;
    detail: string;
    note: string;
  };
  discountApplied: string;
  subTotal: number;
  deliveryFee: number;
  totalPayment: number;
  paymentMethod: string;
  status: "pending" | "processing" | "delivering" | "completed" | "cancelled";
  createdAt: string;
}

export const createOrder = async (orderData: OrderData) => {
  const token = await getToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");

  const response = await fetch(buildApiUrl("/orders"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Không thể tạo đơn hàng");
  }

  return data;
};

export const fetchMyOrders = async (): Promise<Order[]> => {
  const token = await getToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");

  const response = await fetch(buildApiUrl("/orders/my-orders"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Không thể tải danh sách đơn hàng");
  }

  return data;
};

export const cancelOrder = async (orderId: string) => {
  const token = await getToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");

  const response = await fetch(buildApiUrl(`/orders/${orderId}/cancel`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Không thể hủy đơn hàng");
  }

  return data;
};
