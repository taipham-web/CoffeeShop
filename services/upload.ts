import { buildApiUrl } from "./api";

/**
 * Upload ảnh avatar lên server (server sẽ đẩy lên Google Drive)
 * @param imageUri  URI ảnh từ expo-image-picker
 * @returns URL công khai của ảnh trên Google Drive
 */
export async function uploadAvatar(imageUri: string): Promise<string> {
  const formData = new FormData();

  // Xác định file extension
  const extension = imageUri.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
      ? "image/webp"
      : "image/jpeg";

  // React Native FormData nhận object với uri, name, type
  formData.append("avatar", {
    uri: imageUri,
    name: `avatar_${Date.now()}.${extension}`,
    type: mimeType,
  } as any);

  const url = buildApiUrl("/upload/avatar");
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    // Không set Content-Type header — để fetch tự thêm boundary
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "Upload thất bại");
  return json.url as string;
}
