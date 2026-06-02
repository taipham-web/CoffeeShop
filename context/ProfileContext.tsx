import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getToken } from "../services/auth";
import { buildApiUrl } from "../services/api";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "@coffeeshop_profile";

export interface UserProfile {
  name: string;
  phone: string;
  address: string;
  avatarUrl: string;
  email: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  phone: "",
  address: "",
  avatarUrl: "",
  email: "",
};

interface ProfileContextType {
  profile: UserProfile;
  isLoaded: boolean;
  isSyncing: boolean;
  updateProfile: (fields: Partial<UserProfile>) => void;
  saveProfileToDB: (fields: Partial<UserProfile>) => Promise<void>;
  fetchProfileFromDB: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: DEFAULT_PROFILE,
  isLoaded: false,
  isSyncing: false,
  updateProfile: () => {},
  saveProfileToDB: async () => {},
  fetchProfileFromDB: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { token, user } = useAuth();

  // ── Load từ AsyncStorage khi khởi động ──
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) }); }
        catch { /* ignore */ }
      }
      setIsLoaded(true);
    });
  }, []);

  // ── Lưu vào AsyncStorage khi profile thay đổi ──
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile, isLoaded]);

  // ── Cập nhật local state ──
  const updateProfile = useCallback((fields: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...fields }));
  }, []);

  // ── Lấy profile từ DB ──
  const fetchProfileFromDB = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return; // Chưa đăng nhập
      setIsSyncing(true);
      const res = await fetch(buildApiUrl("/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setProfile({
          ...DEFAULT_PROFILE,
          ...json.data,
        });
      }
    } catch {
      // Lỗi mạng → bỏ qua, dùng cache local
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ── Lưu profile lên DB ──
  const saveProfileToDB = useCallback(async (fields: Partial<UserProfile>) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Chưa đăng nhập");
      setIsSyncing(true);

      const res = await fetch(buildApiUrl("/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Lỗi server");

      // Cập nhật local state với dữ liệu mới nhất từ DB
      if (json.success && json.data) {
        setProfile((prev) => ({ ...prev, ...json.data }));
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ── Xoá Profile khi logout hoặc load lại profile khi user thay đổi ──
  useEffect(() => {
    if (isLoaded) {
      if (!token || !user) {
        setProfile(DEFAULT_PROFILE);
        AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        fetchProfileFromDB();
      }
    }
  }, [token, user?.id, isLoaded]);

  return (
    <ProfileContext.Provider
      value={{ profile, isLoaded, isSyncing, updateProfile, saveProfileToDB, fetchProfileFromDB }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
