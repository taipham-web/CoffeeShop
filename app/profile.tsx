import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { uploadAvatar } from "../services/upload";

// ── Types for Custom Modal ──
export type ModalConfig = {
  visible: boolean;
  title: string;
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons: {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive" | "primary";
  }[];
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, saveProfileToDB, isSyncing } = useProfile();
  const { logout } = useAuth();

  // Modal state
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showModal = (config: Omit<ModalConfig, "visible">) => {
    setModalConfig({ ...config, visible: true });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleLogout = async () => {
    showModal({
      title: "Đăng xuất",
      message: "Bạn có chắc chắn muốn đăng xuất?",
      iconName: "log-out-outline",
      iconColor: "#D32F2F",
      buttons: [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            hideModal();
            await logout();
            router.replace("/");
          },
        },
      ],
    });
  };

  // Local state để edit
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [email, setEmail] = useState(profile.email);
  const [avatarUri, setAvatarUri] = useState(profile.avatarUrl);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync khi profile context thay đổi (lần đầu load từ DB)
  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone);
    setAddress(profile.address);
    setEmail(profile.email);
    setAvatarUri(profile.avatarUrl);
  }, [
    profile.name,
    profile.phone,
    profile.address,
    profile.email,
    profile.avatarUrl,
  ]);

  const markDirty = () => setDirty(true);

  // ── Chọn ảnh từ thư viện ──
  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showModal({
        title: "Cần quyền truy cập",
        message: "Vui lòng cho phép truy cập thư viện ảnh trong Cài đặt.",
        iconName: "warning-outline",
        iconColor: "#F57C00",
        buttons: [{ text: "Đóng", style: "cancel" }],
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri); // Hiển thị preview ngay
    setDirty(true);

    // Upload lên Cloudinary
    setUploading(true);
    try {
      const remoteUrl = await uploadAvatar(localUri);
      setAvatarUri(remoteUrl);
      // Lưu avatarUrl lên DB ngay lập tức
      await saveProfileToDB({ avatarUrl: remoteUrl });
      showModal({
        title: "Thành công",
        message: "Ảnh đại diện đã được cập nhật!",
        iconName: "checkmark-circle",
        iconColor: "#4CAF50",
        buttons: [{ text: "OK", style: "primary" }],
      });
    } catch (err: any) {
      showModal({
        title: "Lỗi upload",
        message: err.message?.includes("Cloudinary")
          ? "Chưa cấu hình Cloudinary. Ảnh chỉ lưu trên máy tạm thời."
          : err.message ?? "Không thể upload ảnh",
        iconName: "close-circle-outline",
        iconColor: "#D32F2F",
        buttons: [{ text: "Đóng", style: "cancel" }],
      });
      // Giữ ảnh local nếu upload thất bại
      updateProfile({ avatarUrl: localUri });
    } finally {
      setUploading(false);
    }
  };

  // ── Chụp ảnh bằng camera ──
  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showModal({
        title: "Cần quyền truy cập",
        message: "Vui lòng cho phép truy cập camera trong Cài đặt.",
        iconName: "warning-outline",
        iconColor: "#F57C00",
        buttons: [{ text: "Đóng", style: "cancel" }],
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri);
    setDirty(true);
    setUploading(true);

    try {
      const remoteUrl = await uploadAvatar(localUri);
      setAvatarUri(remoteUrl);
      await saveProfileToDB({ avatarUrl: remoteUrl });
    } catch {
      updateProfile({ avatarUrl: localUri });
    } finally {
      setUploading(false);
    }
  };

  // ── Chọn nguồn ảnh ──
  const handleAvatarPress = () => {
    showModal({
      title: "Thay đổi ảnh đại diện",
      message: "Bạn muốn chọn ảnh từ nguồn nào?",
      iconName: "camera-outline",
      iconColor: "#C67C4E",
      buttons: [
        {
          text: "Chụp ảnh mới",
          style: "primary",
          onPress: () => {
            hideModal();
            setTimeout(handleCamera, 300);
          },
        },
        {
          text: "Chọn từ thư viện",
          style: "primary",
          onPress: () => {
            hideModal();
            setTimeout(handlePickAvatar, 300);
          },
        },
        { text: "Hủy", style: "cancel" },
      ],
    });
  };

  // ── Lưu thông tin lên DB ──
  const handleSave = async () => {
    if (!name.trim()) {
      showModal({
        title: "Thiếu thông tin",
        message: "Vui lòng nhập tên của bạn.",
        iconName: "information-circle-outline",
        iconColor: "#F57C00",
        buttons: [{ text: "Đã hiểu", style: "primary" }],
      });
      return;
    }

    setSaving(true);
    try {
      const fields = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatarUrl: avatarUri,
      };
      await saveProfileToDB(fields); // ← Lưu lên MongoDB
      setDirty(false);
      showModal({
        title: "Đã lưu",
        message: "Thông tin của bạn đã được cập nhật thành công!",
        iconName: "checkmark-circle",
        iconColor: "#4CAF50",
        buttons: [{ text: "OK", style: "primary" }],
      });
    } catch (err: any) {
      showModal({
        title: "Lỗi",
        message: err.message ?? "Không thể lưu thông tin. Vui lòng thử lại.",
        iconName: "close-circle-outline",
        iconColor: "#D32F2F",
        buttons: [{ text: "Đóng", style: "cancel" }],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Custom Modal */}
      <CustomModal
        config={modalConfig}
        onClose={hideModal}
      />

      {/* ── Nav Bar ── */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#1C1C1C" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Hồ sơ của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar Section ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={handleAvatarPress}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#C67C4E" />
              </View>
            )}

            {/* Uploading overlay */}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}


          </TouchableOpacity>

          <Text style={styles.avatarHint}>
            {uploading ? "Đang upload lên Cloudinary…" : "Nhấn để thay đổi ảnh"}
          </Text>
          {uploading && (
            <View style={styles.driveTag}>
              <Ionicons name="cloud-upload-outline" size={14} color="#C67C4E" />
              <Text style={styles.driveTagText}>Cloudinary</Text>
            </View>
          )}
          {isSyncing && !uploading && (
            <View style={styles.driveTag}>
              <ActivityIndicator size="small" color="#C67C4E" />
              <Text style={styles.driveTagText}>Đang đồng bộ…</Text>
            </View>
          )}
        </View>

        {/* ── Form ── */}
        <View style={styles.formCard}>
          <Text style={styles.formSection}>Thông tin cá nhân</Text>

          <Field
            label="Họ và tên"
            icon="person-outline"
            value={name}
            onChangeText={(v) => {
              setName(v);
              markDirty();
            }}
            placeholder="Nguyễn Văn A"
          />
          <Field
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              markDirty();
            }}
            placeholder="example@email.com"
            keyboardType="email-address"
          />

          <Text style={[styles.formSection, { marginTop: 24 }]}>
            Thông tin giao hàng
          </Text>

          <Field
            label="Số điện thoại"
            icon="call-outline"
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              markDirty();
            }}
            placeholder="0901 234 567"
            keyboardType="phone-pad"
          />
          <Field
            label="Địa chỉ giao hàng"
            icon="location-outline"
            value={address}
            onChangeText={(v) => {
              setAddress(v);
              markDirty();
            }}
            placeholder="123 Đường ABC, Quận X, TP HCM"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!dirty || saving || uploading) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!dirty || saving || uploading}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFF"
              />
              <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Custom Modal Component ──
function CustomModal({
  config,
  onClose,
}: {
  config: ModalConfig;
  onClose: () => void;
}) {
  return (
    <Modal
      transparent
      visible={config.visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={modalStyles.card}>
              {config.iconName && (
                <View style={modalStyles.iconContainer}>
                  <Ionicons
                    name={config.iconName}
                    size={48}
                    color={config.iconColor || "#C67C4E"}
                  />
                </View>
              )}
              <Text style={modalStyles.title}>{config.title}</Text>
              <Text style={modalStyles.message}>{config.message}</Text>

              <View style={modalStyles.buttonContainer}>
                {config.buttons.map((btn, index) => {
                  const isPrimary = btn.style === "primary";
                  const isDestructive = btn.style === "destructive";
                  const isCancel = btn.style === "cancel";

                  let btnStyle = modalStyles.btnDefault;
                  let txtStyle = modalStyles.txtDefault;

                  if (isPrimary) {
                    btnStyle = modalStyles.btnPrimary;
                    txtStyle = modalStyles.txtPrimary;
                  } else if (isDestructive) {
                    btnStyle = modalStyles.btnDestructive;
                    txtStyle = modalStyles.txtDestructive;
                  } else if (isCancel) {
                    btnStyle = modalStyles.btnCancel;
                    txtStyle = modalStyles.txtCancel;
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[modalStyles.button, btnStyle]}
                      onPress={() => {
                        if (btn.onPress) {
                          btn.onPress();
                        } else {
                          onClose();
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[modalStyles.buttonText, txtStyle]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ── Reusable Field Component ──
function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
}: {
  label: string;
  icon: any;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={field.wrap}>
      <Text style={field.label}>{label}</Text>
      <View
        style={[
          field.inputRow,
          multiline && { alignItems: "flex-start", paddingTop: 12 },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color="#C67C4E"
          style={{ marginTop: multiline ? 2 : 0 }}
        />
        <TextInput
          style={[
            field.input,
            multiline && { height: 72, textAlignVertical: "top" },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BDBDBD"
          keyboardType={keyboardType ?? "default"}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

const field = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#EFEFEF",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1C1C1C",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: "#FEF8EE",
    padding: 16,
    borderRadius: 99,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1C",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#757575",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  btnPrimary: {
    backgroundColor: "#C67C4E",
  },
  txtPrimary: {
    color: "#FFFFFF",
  },
  btnDestructive: {
    backgroundColor: "#FEEBEE",
  },
  txtDestructive: {
    color: "#D32F2F",
  },
  btnCancel: {
    backgroundColor: "#F5F5F5",
  },
  txtCancel: {
    color: "#757575",
  },
  btnDefault: {
    backgroundColor: "#F5F5F5",
  },
  txtDefault: {
    color: "#1C1C1C",
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },

  /* ── Nav ── */
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 10 : 56,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1C",
  },

  /* ── Scroll ── */
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  /* ── Avatar ── */
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#FFF3EA",
    borderWidth: 3,
    borderColor: "#C67C4E",
    shadowColor: "#C67C4E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#C67C4E",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 13,
    color: "#9B9B9B",
  },
  driveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    backgroundColor: "#FFF3EA",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  driveTagText: {
    fontSize: 12,
    color: "#C67C4E",
    fontWeight: "600",
  },

  /* ── Form Card ── */
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  formSection: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C1C1C",
    marginBottom: 14,
  },

  /* ── Save Button ── */
  saveBtn: {
    backgroundColor: "#C67C4E",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#C67C4E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  saveBtnDisabled: {
    backgroundColor: "#E0C4B0",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },

  /* ── Logout Button ── */
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  logoutBtnText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "700",
  },
});
