import { buildApiUrl } from "./api";
import { getToken } from "./auth";

export interface Voucher {
  _id: string;
  code: string;
  discountType: 'percent' | 'fixed' | 'freeship';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
}

export const fetchActiveVouchers = async (): Promise<Voucher[]> => {
  try {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(buildApiUrl('/vouchers/active'), { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    throw error;
  }
};

export const validateVouchers = async (codes: string[], cartSubtotal: number, deliveryFee: number = 0) => {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl('/vouchers/validate'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ codes, cartSubtotal, deliveryFee }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Lỗi áp dụng mã giảm giá");
  }
  
  return data;
};
