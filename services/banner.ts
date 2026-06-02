import { buildApiUrl } from "./api";

export interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
}

export async function fetchBanners(): Promise<Banner[]> {
  try {
    const response = await fetch(buildApiUrl('/banners'));
    const json = await response.json();
    if (json.success) {
      return json.data;
    }
    throw new Error(json.message);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}
