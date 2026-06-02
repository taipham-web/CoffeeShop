import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientLayer}>
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons
            name="coffee-maker-check-outline"
            size={20}
            color="#8A4B16"
          />
          <Text style={styles.heroBadgeText}>Uống cà phê đến 3T</Text>
        </View>

        <View style={styles.card}>
          <Image
            source={require("../assets/images/welcome_illustration.png")}
            style={styles.illustration}
            resizeMode="contain"
          />

          <View style={styles.textContainer}>
            <Text style={styles.title}>Muốn uống cà phê đến với 3T</Text>
            <Text style={styles.subtitle}>
              Khám phá cà phê đặc trưng.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginText}>Đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.registerText}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.caption}>
            Đăng nhập để trải nghiệm ngay.
          </Text>
        </View>

        <View style={styles.stampRow}>
          <View style={styles.stamp}>
            <MaterialCommunityIcons
              name="clock-time-four-outline"
              size={16}
              color="#7C3F15"
            />
            <Text style={styles.stampText}>Có ngay trong 10 phút</Text>
          </View>
          <View style={styles.stamp}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={16}
              color="#7C3F15"
            />
            <Text style={styles.stampText}>Ưu đãi thành viên</Text>
          </View>
        </View>
      </View>
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
    width: 300,
    height: 300,
    backgroundColor: "#E6C7A5",
    top: -110,
    left: -50,
    opacity: 0.45,
  },
  blobBottom: {
    width: 280,
    height: 280,
    backgroundColor: "#DCA66A",
    bottom: -120,
    right: -70,
    opacity: 0.42,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    gap: 14,
  },
  heroBadge: {
    alignSelf: "center",
    backgroundColor: "#FDF4E6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E8D2B3",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroBadgeText: {
    color: "#8A4B16",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EFE6DA",
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 18,
    shadowColor: "#8A4B16",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  illustration: {
    width: width * 0.76,
    height: width * 0.76 * 0.7,
    alignSelf: "center",
  },
  textContainer: {
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#5C2F0B",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#8F5F38",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: "#7C3F15",
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3F15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  loginText: {
    color: "#FFF8EE",
    fontSize: 16,
    fontWeight: "800",
  },
  registerBtn: {
    flex: 1,
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBEEDC",
    borderWidth: 1,
    borderColor: "#E3C6A2",
  },
  registerText: {
    color: "#6A320D",
    fontSize: 16,
    fontWeight: "700",
  },
  caption: {
    textAlign: "center",
    fontSize: 13,
    color: "#9B6A45",
    marginTop: 2,
  },
  stampRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  stamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E7D2B6",
    backgroundColor: "#FEF8EE",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stampText: {
    fontSize: 12,
    color: "#7C3F15",
    fontWeight: "600",
  },

});
