import { useAuth } from "@/context/AuthContext";
import { login as loginRequest } from "@/services/auth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { setUser, setToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await loginRequest({
        email: email.trim(),
        password,
      });

      // Lưu user info vào context
      setUser(response.user);
      setToken(response.token);

      router.replace("/(tab)/home");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.";
      Alert.alert("Đăng nhập thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLogins = [
    {
      key: "google",
      label: "Google",
      icon: <Ionicons name="logo-google" size={20} color="#B45309" />,
    },
    {
      key: "apple",
      label: "Apple",
      icon: <Ionicons name="logo-apple" size={20} color="#422006" />,
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: <Ionicons name="logo-facebook" size={20} color="#8A4B16" />,
    },
  ];

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
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons
              name="coffee-maker-outline"
              size={20}
              color="#8A4B16"
            />
            <Text style={styles.heroBadgeText}>3T Coffee</Text>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để đặt ngay ly nước yêu thích của bạn.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color="#A16207" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#A88B6A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#A16207" />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor="#A88B6A"
                value={password}
                onChangeText={setPassword}
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

            <TouchableOpacity 
              style={styles.forgotPasswordBtn}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, isSubmitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <Text style={styles.loginBtnText}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.orContinueText}>Hoặc tiếp tục với</Text>

            <View style={styles.socialRow}>
              {socialLogins.map((social) => (
                <TouchableOpacity key={social.key} style={styles.socialBtn}>
                  {social.icon}
                  <Text style={styles.socialText}>{social.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.createAccountText}>Chưa có tài khoản?</Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.signUpLink}>Tạo tài khoản</Text>
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
  forgotPasswordBtn: {
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    color: "#8A4B16",
    fontWeight: "600",
  },
  loginBtn: {
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
  loginBtnText: {
    color: "#FFF8EE",
    fontSize: 17,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  orContinueText: {
    color: "#8A4B16",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    backgroundColor: "#FFF4E6",
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBDAC3",
    gap: 6,
  },
  socialText: {
    color: "#8A4B16",
    fontSize: 12,
    fontWeight: "600",
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
