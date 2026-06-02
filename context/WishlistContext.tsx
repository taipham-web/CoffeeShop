import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import { Product } from "../services/product";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../services/wishlist";
import { useAuth } from "./AuthContext";

interface WishlistContextType {
  wishlist: Product[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  isWishlisted: () => false,
  toggleWishlist: () => {},
  clearWishlist: () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const { user } = useAuth();

  // Load from DB when user logs in
  useEffect(() => {
    if (user) {
      getWishlist().then((data) => setWishlist(data));
    } else {
      setWishlist([]); // Clear if logged out
    }
  }, [user]);

  const isWishlisted = useCallback(
    (id: string) => wishlist.some((p) => p._id === id),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!user) {
        Alert.alert(
          "Yêu cầu đăng nhập",
          "Vui lòng đăng nhập để lưu sản phẩm yêu thích."
        );
        return;
      }

      const exists = wishlist.some((p) => p._id === product._id);

      // Optimistic update
      setWishlist((prev) =>
        exists
          ? prev.filter((p) => p._id !== product._id)
          : [product, ...prev]
      );

      try {
        if (exists) {
          await removeFromWishlist(product._id);
        } else {
          await addToWishlist(product._id);
        }
      } catch (error) {
        // Revert on error
        Alert.alert(
          "Lỗi",
          "Không thể cập nhật danh sách yêu thích. Vui lòng thử lại sau."
        );
        setWishlist((prev) =>
          exists
            ? [product, ...prev]
            : prev.filter((p) => p._id !== product._id)
        );
      }
    },
    [user, wishlist]
  );

  const clearWishlist = useCallback(() => setWishlist([]), []);

  return (
    <WishlistContext.Provider
      value={{ wishlist, isWishlisted, toggleWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
