import { buildApiUrl } from "@/services/api";

export interface Branch {
  _id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export const fetchBranches = async (): Promise<Branch[]> => {
  const response = await fetch(buildApiUrl("/branches"));
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Không thể tải danh sách chi nhánh");
  }
  return data.data;
};
