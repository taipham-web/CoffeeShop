import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestPasswordReset, resetPassword } from "../services/auth";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email.");
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset(email.trim());
      Alert.alert("Thành công", "Mã xác nhận (OTP) đã được gửi. Vui lòng kiểm tra email (hoặc console).");
      setStep(2);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể gửi mã xác nhận.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(email.trim(), otp.trim(), newPassword);
      Alert.alert("Thành công", "Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.");
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể đổi mật khẩu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientLayer}>
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#5C2F0B" />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="lock-reset" size={20} color="#8A4B16" />
            <Text style={styles.heroBadgeText}>Khôi phục mật khẩu</Text>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Quên mật khẩu?</Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? "Nhập email của bạn để nhận mã xác nhận đổi mật khẩu."
                : "Nhập mã OTP và mật khẩu mới của bạn."}
            </Text>
          </View>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color="#A16207" />
                  <TextInput
                    style={styles.input}
                    placeholder="Email của bạn"
                    placeholderTextColor="#A88B6A"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.buttonDisabled]}
                  onPress={handleRequestOtp}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? "Đang gửi..." : "Gửi mã xác nhận"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="keypad-outline" size={18} color="#A16207" />
                  <TextInput
                    style={styles.input}
                    placeholder="Mã OTP (6 chữ số)"
                    placeholderTextColor="#A88B6A"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#A16207" />
                  <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu mới"
                    placeholderTextColor="#A88B6A"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#A16207"
                    />
                  </Pressable>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#A16207" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#A88B6A"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.footerContainer}>
              <Text style={styles.createAccountText}>Nhớ mật khẩu rồi?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.signUpLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6EEDD",
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F6EEDD",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobTop: {
    width: 280,
    height: 280,
    backgroundColor: "#E6C7A5",
    top: -90,
    left: -40,
    opacity: 0.45,
  },
  blobBottom: {
    width: 280,
    height: 280,
    backgroundColor: "#DCA66A",
    bottom: -120,
    right: -70,
    opacity: 0.4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
    gap: 16,
    paddingVertical: 24,
  },
  backBtn: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  heroBadge: {
    alignSelf: "center",
    backgroundColor: "#FDF4E6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E8D2B3",
    marginTop: 20,
  },
  heroBadgeText: {
    color: "#8A4B16",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  headerContainer: {
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#5C2F0B",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#8F5F38",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 24,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#EBDAC3",
    shadowColor: "#8A4B16",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  inputContainer: {
    backgroundColor: "#FBEEDC",
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#EDD7BA",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#4A2A12",
  },
  submitBtn: {
    backgroundColor: "#7C3F15",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#7C3F15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: "#FFF8EE",
    fontSize: 17,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  footerContainer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  createAccountText: {
    color: "#8F5F38",
    fontSize: 14,
  },
  signUpLink: {
    color: "#6A320D",
    fontSize: 14,
    fontWeight: "700",
  },
});
