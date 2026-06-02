import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Ẩn chữ theo đúng thiết kế
        tabBarActiveTintColor: "#C18259", // Màu nâu cam caramel (Active)
        tabBarInactiveTintColor: "#BDBDBD", // Màu xám bạc (Inactive)
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* 1. Tab Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Tab Heart (Tim) - Vẫn đang trỏ về file offers.tsx của bạn */}
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Tab Bag (Túi mua sắm) - Trỏ về file cart.tsx */}
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bag-handle" : "bag-handle-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* 4. Tab Orders (Đơn hàng) */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 5. Tab Bell (Chuông thông báo) */}
      <Tabs.Screen
        name="notice"
        options={{
          title: "Thông báo",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "bell" : "bell-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF", // Nền trắng đặc
    // Điều chỉnh chiều cao cho phù hợp với dải vuốt dưới đáy màn hình của iOS
    height: Platform.OS === "ios" ? 90 : 70,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 10,

    borderTopWidth: 0, // Xóa vạch kẻ ngang mặc định ở mép trên

    // Đổ bóng ngược lên trên một chút để tách biệt với nền (Shadow)
    elevation: 10, // Dành cho Android
    shadowColor: "#000", // Dành cho iOS
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10, // Giữ shadow mỏng và tinh tế
  },
});
