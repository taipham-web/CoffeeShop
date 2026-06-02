import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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
import { Product } from "../../services/product";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 12) / 2;

export default function WishlistScreen() {
  const router = useRouter();
  const { wishlist, toggleWishlist, clearWishlist } = useWishlist();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        {wishlist.length > 0 && (
          <TouchableOpacity onPress={clearWishlist} style={styles.clearBtn}>
            <Text style={styles.clearText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {wishlist.length === 0 && (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={64} color="#C67C4E" style={{ opacity: 0.5 }} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
          <Text style={styles.emptySubtitle}>
            Nhấn vào biểu tượng trái tim trên bất kỳ sản phẩm nào để lưu vào đây
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push("/(tab)/home")}
          >
            <Text style={styles.browseBtnText}>Khám phá ngay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Wishlist Grid */}
      {wishlist.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Counter */}
          <Text style={styles.counter}>
            {wishlist.length} sản phẩm
          </Text>

          <View style={styles.grid}>
            {wishlist.map((product: Product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => router.push(`/product/${product._id}`)}
              >
                {/* Image */}
                <View style={styles.cardImageWrap}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.cardImage}
                      defaultSource={require("../../assets/images/3T-bia.jpg")}
                    />
                  ) : (
                    <Image
                      source={require("../../assets/images/3T-bia.jpg")}
                      style={styles.cardImage}
                    />
                  )}

                  {/* Heart remove button */}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="heart" size={18} color="#E05353" />
                  </TouchableOpacity>
                </View>

                {/* Body */}
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {product.subtitle}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>{product.price.toLocaleString('vi-VN')} VNĐ</Text>
                    <TouchableOpacity style={styles.addBtn}>
                      <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },

  /* ── Header ── */
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
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "#E05353",
  },
  clearText: {
    color: "#E05353",
    fontSize: 13,
    fontWeight: "600",
  },

  /* ── Empty ── */
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF3EA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1C",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9B9B9B",
    textAlign: "center",
    lineHeight: 22,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: "#C67C4E",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
  },
  browseBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },

  /* ── List ── */
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  counter: {
    fontSize: 14,
    color: "#9B9B9B",
    fontWeight: "500",
    marginBottom: 16,
  },

  /* ── Grid ── */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImageWrap: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  ratingText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    width: 32,
    height: 32,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: {
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1C",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#9B9B9B",
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1C1C1C",
  },
  addBtn: {
    backgroundColor: "#C67C4E",
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
