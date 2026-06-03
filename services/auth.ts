import { buildApiUrl } from "@/services/api";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type AuthPayload = {
  email: string;
  password: string;
};

type AuthResponse = {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    role: "user";
  };
};

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

function saveToWebStorage(token: string, userJson: string) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, userJson);
}

async function saveAuthSession(token: string, user: AuthResponse["user"]) {
  const userJson = JSON.stringify(user);

  if (Platform.OS === "web") {
    saveToWebStorage(token, userJson);
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.setItemAsync(AUTH_USER_KEY, userJson);
}

async function postAuth(
  path: "/auth/register" | "/auth/login",
  payload: AuthPayload,
) {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error: any) {
    throw new Error(
      `Cannot reach auth server. Check server is running and EXPO_PUBLIC_API_URL points to your machine IP. \nOriginal error: ${error?.message || JSON.stringify(error)}`,
    );
  }

  let data: (Partial<AuthResponse> & { message?: string }) | null = null;

  try {
    data = (await response.json()) as Partial<AuthResponse> & {
      message?: string;
    };
  } catch {
    data = null;
  }

  if (!response.ok || !data?.token || !data.user) {
    throw new Error(data?.message || "Authentication failed.");
  }

  await saveAuthSession(data.token, data.user);

  return {
    message: data.message || "Success",
    token: data.token,
    user: data.user,
  } as AuthResponse;
}

export async function login(payload: AuthPayload) {
  return postAuth("/auth/login", payload);
}

export async function register(payload: AuthPayload) {
  return postAuth("/auth/register", payload);
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(buildApiUrl("/auth/forgot-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to send OTP");
  return data;
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const response = await fetch(buildApiUrl("/auth/reset-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to reset password");
  return data;
}


/** Lấy JWT token đã lưu */
export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_KEY)
      : null;
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

/** Lấy thông tin user đã đăng nhập */
export async function getStoredUser(): Promise<{
  id: string;
  email: string;
  role: "user";
} | null> {
  let raw: string | null = null;
  if (Platform.OS === "web") {
    raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(AUTH_USER_KEY)
        : null;
  } else {
    raw = await SecureStore.getItemAsync(AUTH_USER_KEY);
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearAuthSession() {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
}
