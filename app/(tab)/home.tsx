import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useProfile } from "../../context/ProfileContext";
import { useWishlist } from "../../context/WishlistContext";
import { Banner, fetchBanners } from "../../services/banner";
import { addToCart } from "../../services/cart";
import {
  fetchCategories,
  fetchProducts,
  Product,
} from "../../services/product";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 12) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // --------------- Toast State ---------------
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };



  // --------------- Fetch categories ---------------
  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(["Tất cả", ...data]);
    } catch {
      // Nếu chưa có data, đặt categories mặc định
      setCategories(["Tất cả", "Cappuccino", "Machiato", "Latte", "Americano", "Espresso"]);
    }
  }, []);

  // --------------- Fetch products ---------------
  const loadProducts = useCallback(async (category: string) => {
    try {
      setError(null);
      const data = await fetchProducts(category === "Tất cả" ? undefined : category);
      setProducts(data);
    } catch (e: any) {
      setError(e.message ?? "Không thể tải dữ liệu");
    }
  }, []);

  // --------------- Initial load ---------------
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [fetchedBanners] = await Promise.all([fetchBanners(), loadCategories(), loadProducts(activeCategory)]);
      setBanners(fetchedBanners);
      setLoading(false);
    })();
  }, []);

  // --------------- Category change ---------------
  useEffect(() => {
    loadProducts(activeCategory);
  }, [activeCategory]);

  // --------------- Pull-to-refresh ---------------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const [fetchedBanners] = await Promise.all([fetchBanners(), loadCategories(), loadProducts(activeCategory)]);
    setBanners(fetchedBanners);
    setRefreshing(false);
  }, [activeCategory]);

  // --------------- Filter by search ---------------
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = async (product: Product) => {
    try {
      const selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0].name : "";
      const currentPrice = product.sizes && product.sizes.length > 0 ? product.sizes[0].price : product.price;
      await addToCart(product._id, 1, selectedSize, currentPrice);
      showToast("Đã thêm vào giỏ hàng!");
    } catch (err: any) {
      alert(err.message || "Không thể thêm vào giỏ hàng");
    }
  };

  // ============================================================
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* Dark Header */}
      <View style={styles.darkHeader}>
        <View style={styles.headerRow}>
          {/* Left: Avatar & Greeting */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity style={styles.avatarWrap} onPress={() => router.push("/profile")}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { justifyContent: "center", alignItems: "center", backgroundColor: "#333" }]}>
                  <Ionicons name="person" size={20} color="#C67C4E" />
                </View>
              )}
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 13, color: "#A0A0A0" }}>Xin chào,</Text>
              <Text style={{ fontSize: 16, color: "#FFFFFF", fontWeight: "600" }}>{profile.name || "Khách hàng"}</Text>
            </View>
          </View>

          {/* Right: Notifications */}
          <TouchableOpacity 
            style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E", borderRadius: 14 }}
            onPress={() => router.push("/(tab)/notice")}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9B9B9B" style={{ marginLeft: 16 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm cà phê..."
            placeholderTextColor="#9B9B9B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C67C4E" />
        }
      >
        {/* Promo Banner */}
        {banners.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled style={{ marginBottom: 24, borderRadius: 20 }}>
            {banners.map(banner => (
              <View key={banner._id} style={[styles.promoBannerWrap, { width: width - 48, marginBottom: 0 }]}>
                <ImageBackground
                  source={{ uri: banner.imageUrl }}
                  style={styles.promoBanner}
                  imageStyle={styles.promoBannerImage}
                >
                  <View style={styles.promoOverlay} />
                  <View style={styles.promoContent}>
                    <Text style={styles.promoTitle}>{banner.title}</Text>
                  </View>
                </ImageBackground>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.promoBannerWrap}>
            <ImageBackground
              source={require("../../assets/images/3T-bia.jpg")}
              style={styles.promoBanner}
              imageStyle={styles.promoBannerImage}
            >
              <View style={styles.promoOverlay} />
              <View style={styles.promoContent}>
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>Khuyến mãi</Text>
                </View>
                <Text style={styles.promoTitle}>Mua 1 tặng{"\n"}1 miễn phí</Text>
              </View>
            </ImageBackground>
          </View>
        )}

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#C67C4E" />
            <Text style={styles.loadingText}>Đang tải sản phẩm…</Text>
          </View>
        )}

        {/* Error state */}
        {!loading && error && (
          <View style={styles.centerBox}>
            <Ionicons name="wifi-outline" size={48} color="#C67C4E" />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>Kéo xuống để thử lại</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && filteredProducts.length === 0 && (
          <View style={styles.centerBox}>
            <Ionicons name="cafe-outline" size={48} color="#C67C4E" style={{ opacity: 0.5 }} />
            <Text style={styles.errorText}>Chưa có sản phẩm nào</Text>
          </View>
        )}

        {/* Product Grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <View style={styles.grid}>
            {filteredProducts.map((product) => (
              <TouchableOpacity
              key={product._id}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => router.push(`/product/${product._id}`)}
            >
                {/* Card Image */}
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
                  {/* Heart Button */}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={isWishlisted(product._id) ? "heart" : "heart-outline"}
                      size={18}
                      color={isWishlisted(product._id) ? "#E05353" : "#FFF"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{product.subtitle}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>{product.price.toLocaleString('vi-VN')} VNĐ</Text>
                    <TouchableOpacity 
                      style={styles.addBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Toast Message */}
      {toastMessage && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },

  /* ── Dark Header ── */
  darkHeader: {
    backgroundColor: "#111111",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 56,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#333333",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  /* ── Search ── */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    height: 52,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    marginLeft: 10,
    marginRight: 8,
  },
  filterBtn: {
    backgroundColor: "#C67C4E",
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },

  /* ── Scroll ── */
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 24,
  },

  /* ── Promo Banner ── */
  promoBannerWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    height: 160,
  },
  promoBanner: {
    flex: 1,
    justifyContent: "flex-end",
  },
  promoBannerImage: {
    resizeMode: "cover",
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  promoContent: {
    padding: 18,
  },
  promoBadge: {
    backgroundColor: "#ED5151",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  promoBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  promoTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },

  /* ── Categories ── */
  categoriesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    paddingRight: 8,
  },
  catBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: "#EBEBEB",
  },
  catBtnActive: {
    backgroundColor: "#C67C4E",
  },
  catText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
  },
  catTextActive: {
    color: "#FFFFFF",
  },

  /* ── States ── */
  centerBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
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
  errorHint: {
    fontSize: 13,
    color: "#9B9B9B",
    textAlign: "center",
  },

  /* ── Product Grid ── */
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
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    width: 32,
    height: 32,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
  },
  
  /* ── Toast ── */
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 1000,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
