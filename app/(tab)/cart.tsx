import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchCart, updateCartItem, removeCartItem, Cart } from "../../services/cart";

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadCart = async () => {
    try {
      // Don't set loading to true here if we are just refreshing via useFocusEffect
      // to avoid screen flicker. Just use it for initial load.
      const data = await fetchCart();
      setCart(data);
    } catch (err: any) {
      console.log("Cart load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const handleUpdateQuantity = async (productId: string, currentQty: number, change: number, size: string = "") => {
    const newQty = currentQty + change;
    if (newQty < 1) return; // Use remove instead
    
    try {
      setUpdating(`${productId}-${size}`);
      const updatedCart = await updateCartItem(productId, newQty, size);
      setCart(updatedCart);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể cập nhật số lượng");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (productId: string, size: string = "") => {
    try {
      setUpdating(`${productId}-${size}`);
      const updatedCart = await removeCartItem(productId, size);
      setCart(updatedCart);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể xoá sản phẩm");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerFull}>
        <ActivityIndicator size="large" color="#C67C4E" />
        <Text style={{ marginTop: 12, color: "#9B9B9B" }}>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  const items = (cart?.items || []).filter(item => item.product != null);
  const isEmpty = items.length === 0;

  const subTotal = items.reduce((sum, item) => {
    const price = item.price ?? item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#DEDEDE" />
          <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.push("/(tab)/home")}>
            <Text style={styles.shopNowText}>Khám phá ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {items.map((item) => {
              const product = item.product;
              if (!product) return null; // Protective check
              const isUpdating = updating === product._id;

              return (
                <View key={`${product._id}-${item.size}`} style={styles.cartItem}>
                  <Image
                    source={
                      product.imageUrl
                        ? { uri: product.imageUrl }
                        : require("../../assets/images/3T-bia.jpg")
                    }
                    style={styles.itemImage}
                  />
                  
                  <View style={styles.itemInfo}>
                    <View style={styles.itemHeaderTitle}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemove(product._id, item.size)} disabled={isUpdating}>
                        <Ionicons name="trash-outline" size={20} color="#E05353" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemSubtitle}>{item.size ? `Size: ${item.size} • ` : ''}{product.subtitle}</Text>
                    
                    <View style={styles.priceRow}>
                      <Text style={styles.itemPrice}>{((item.price ?? product.price) * item.quantity).toLocaleString('vi-VN')} VNĐ</Text>
                      
                      {/* Controls */}
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleUpdateQuantity(product._id, item.quantity, -1, item.size)}
                          disabled={isUpdating || item.quantity <= 1}
                        >
                          <Ionicons name="remove" size={16} color={item.quantity <= 1 ? "#DEDEDE" : "#1C1C1C"} />
                        </TouchableOpacity>
                        
                        {isUpdating ? (
                           <ActivityIndicator size="small" color="#C67C4E" style={{ width: 24 }}/>
                        ) : (
                           <Text style={styles.qtyValue}>{item.quantity}</Text>
                        )}
                        
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleUpdateQuantity(product._id, item.quantity, 1, item.size)}
                          disabled={isUpdating}
                        >
                          <Ionicons name="add" size={16} color="#1C1C1C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Tổng cộng:</Text>
              <Text style={styles.footerTotal}>{subTotal.toLocaleString('vi-VN')} VNĐ</Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutBtn} 
              activeOpacity={0.85}
              onPress={() => router.push("/order")}
            >
              <Text style={styles.checkoutBtnText}>Tiến hành đặt hàng</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 56,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C1C1C",
  },
  
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#9B9B9B",
    marginTop: 16,
    marginBottom: 24,
  },
  shopNowBtn: {
    backgroundColor: "#C67C4E",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  shopNowText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // List
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  cartItem: {
    flexDirection: "row",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    alignItems: "center",
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemHeaderTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1C",
    flex: 1,
    marginRight: 8,
  },
  itemSubtitle: {
    fontSize: 13,
    color: "#9B9B9B",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#C67C4E",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1C",
    width: 24,
    textAlign: "center",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  footerLabel: {
    fontSize: 15,
    color: "#9B9B9B",
  },
  footerTotal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C1C1C",
  },
  checkoutBtn: {
    backgroundColor: "#C67C4E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#C67C4E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
