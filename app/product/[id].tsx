import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useWishlist } from "../../context/WishlistContext";
import { fetchProductById, Product } from "../../services/product";
import { addToCart } from "../../services/cart";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = width * 0.72;

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0].name);
        }
      } catch (e: any) {
        setError(e.message ?? "Không thể tải sản phẩm");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAddingToCart(true);
      const currentPrice = product.sizes?.find(s => s.name === selectedSize)?.price ?? product.price;
      await addToCart(product._id, 1, selectedSize, currentPrice);
      router.push("/(tab)/cart");
    } catch (err: any) {
      alert(err.message || "Không thể thêm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.centerFull}>
        <ActivityIndicator size="large" color="#C67C4E" />
        <Text style={styles.loadingText}>Đang tải…</Text>
      </View>
    );
  }

  // ── Error ──
  if (error || !product) {
    return (
      <View style={styles.centerFull}>
        <Ionicons name="alert-circle-outline" size={56} color="#C67C4E" />
        <Text style={styles.errorText}>{error ?? "Không tìm thấy sản phẩm"}</Text>
        <TouchableOpacity style={styles.backBtnSmall} onPress={() => router.back()}>
          <Text style={styles.backBtnSmallText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const description = product.description || "Không có mô tả cho sản phẩm này.";
  const shortDesc = description.length > 100 ? description.slice(0, 100) + "..." : description;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Nav Bar ── */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navIconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1C1C1C" />
        </TouchableOpacity>

        <Text style={styles.navTitle}>Chi tiết</Text>

        <TouchableOpacity style={styles.navIconBtn} onPress={() => product && toggleWishlist(product)}>
          <Ionicons
            name={product && isWishlisted(product._id) ? "heart" : "heart-outline"}
            size={22}
            color={product && isWishlisted(product._id) ? "#E05353" : "#1C1C1C"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Product Image ── */}
        <View style={styles.imageWrap}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              defaultSource={require("../../assets/images/3T-bia.jpg")}
            />
          ) : (
            <Image
              source={require("../../assets/images/3T-bia.jpg")}
              style={styles.productImage}
            />
          )}
        </View>

        {/* ── Info Section ── */}
        <View style={styles.infoSection}>
          {/* Name + Action Icons */}
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productSubtitle}>{product.subtitle}</Text>
            </View>

          </View>

          {/* Description */}
          <Text style={styles.sectionLabel}>Mô tả</Text>
          <Text style={styles.descText}>
            {expanded ? description : shortDesc}
            {description.length > 100 && !expanded && (
              <Text style={styles.readMore} onPress={() => setExpanded(true)}>
                {" "}
                Xem thêm
              </Text>
            )}
            {expanded && (
              <Text style={styles.readMore} onPress={() => setExpanded(false)}>
                {" "}
                Thu gọn
              </Text>
            )}
          </Text>

          {/* Size */}
          {product.sizes && product.sizes.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Kích thước</Text>
              <View style={styles.sizeRow}>
                {product.sizes.map((s) => (
                  <TouchableOpacity
                    key={s.name}
                    style={[styles.sizeBtn, selectedSize === s.name && styles.sizeBtnActive]}
                    onPress={() => setSelectedSize(s.name)}
                  >
                    <Text style={[styles.sizeBtnText, selectedSize === s.name && styles.sizeBtnTextActive]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom Bar (Price + Buy Now) ── */}
      <View style={styles.bottomBar}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Giá tiền</Text>
          <Text style={styles.priceValue}>
            {(product.sizes?.find(s => s.name === selectedSize)?.price ?? product.price).toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.buyBtn} 
          activeOpacity={0.85}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buyBtnText}>Thêm vào giỏ hàng</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /* ── Full-screen states ── */
  centerFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    gap: 16,
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: "#9B9B9B",
  },
  errorText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },
  backBtnSmall: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#C67C4E",
    borderRadius: 99,
  },
  backBtnSmallText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },

  /* ── Nav Bar ── */
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 10 : 56,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
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

  /* ── Image ── */
  imageWrap: {
    width: "100%",
    height: IMAGE_HEIGHT,
    borderRadius: 0,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  /* ── Scroll ── */
  scrollContent: {
    paddingBottom: 120,
  },

  /* ── Info Section ── */
  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  nameBlock: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1C1C1C",
    marginBottom: 4,
  },
  productSubtitle: {
    fontSize: 14,
    color: "#9B9B9B",
    fontWeight: "400",
  },
  actionIcons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF3EA",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Rating ── */
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1C",
  },
  ratingCount: {
    fontSize: 14,
    color: "#9B9B9B",
  },

  divider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginBottom: 20,
  },

  /* ── Description ── */
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1C",
    marginBottom: 10,
  },
  descText: {
    fontSize: 14,
    color: "#808080",
    lineHeight: 22,
  },
  readMore: {
    color: "#C67C4E",
    fontWeight: "700",
  },

  /* ── Size ── */
  sizeRow: {
    flexDirection: "row",
    gap: 12,
  },
  sizeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  sizeBtnActive: {
    borderColor: "#C67C4E",
    backgroundColor: "#FFF3EA",
  },
  sizeBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  sizeBtnTextActive: {
    color: "#C67C4E",
    fontWeight: "800",
  },

  /* ── Bottom Bar ── */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    gap: 20,
  },
  priceBlock: {
    flex: 1.2,
  },
  priceLabel: {
    fontSize: 13,
    color: "#9B9B9B",
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#C67C4E",
  },
  buyBtn: {
    flex: 1.5,
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
  buyBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
