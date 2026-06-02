import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import { createOrder, OrderData, OrderItem } from "../services/order";
import { fetchCart, clearCart, Cart } from "../services/cart";
import { fetchBranches, Branch } from "../services/branch";
import { fetchActiveVouchers, validateVouchers, Voucher } from "../services/voucher";
import { useProfile } from "../context/ProfileContext";
import { Modal, TextInput } from "react-native";

export default function OrderScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<Voucher[]>([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cartData = await fetchCart();
        if (!cartData.items || cartData.items.length === 0) {
          Alert.alert("Giỏ hàng trống", "Vui lòng thêm sản phẩm vào giỏ hàng trước.");
          router.back();
          return;
        }
        setCart(cartData);
        
        const branchesData = await fetchBranches();
        setBranches(branchesData);
        if (branchesData.length > 0) {
          setSelectedBranchId(branchesData[0]._id);
        }
        
        try {
          const vouchersData = await fetchActiveVouchers();
          setVouchers(vouchersData);
        } catch (vErr) {
          console.error("Error fetching vouchers", vErr);
        }
      } catch (err: any) {
        Alert.alert("Lỗi", "Không thể tải dữ liệu.");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = cart?.items || [];
  const validItems = items.filter(item => item.product != null);
  const subTotal = validItems.reduce((sum, item) => sum + ((item.price ?? item.product.price) * item.quantity), 0);
  const deliveryFee = orderType === "delivery" ? 15000 : 0;
  const originalDeliveryFee = 30000;

  let actualDiscountAmount = 0;
  let remainingDeliveryFee = deliveryFee;
  for (const v of selectedVouchers) {
      let d = 0;
      if (v.discountType === 'fixed') {
        d = v.discountValue;
      } else if (v.discountType === 'percent') {
        d = (subTotal * v.discountValue) / 100;
        if (v.maxDiscount !== null && d > v.maxDiscount) d = v.maxDiscount;
      } else if (v.discountType === 'freeship') {
        d = remainingDeliveryFee;
        if (v.maxDiscount !== null && d > v.maxDiscount) d = v.maxDiscount;
        remainingDeliveryFee = Math.max(0, remainingDeliveryFee - d);
      }
      actualDiscountAmount += d;
  }
  actualDiscountAmount = Math.min(actualDiscountAmount, subTotal + deliveryFee);

  const totalPayment = Math.max(0, subTotal + deliveryFee - actualDiscountAmount);

  const handleOrder = async () => {
    if (!cart) return;

    try {
      setOrdering(true);
      
      const orderItems: OrderItem[] = validItems.map(item => ({
        product: item.product._id,
        name: item.product.name,
        subtitle: item.product.subtitle,
        imageUrl: item.product.imageUrl || "",
        price: item.price ?? item.product.price,
        quantity: item.quantity,
        size: item.size,
      }));

      let addressTitle = "Địa chỉ nhận hàng";
      let addressDetail = profile.address || "Chưa có địa chỉ";
      
      if (orderType === "pickup") {
        const branch = branches.find(b => b._id === selectedBranchId);
        if (!branch) {
          Alert.alert("Lỗi", "Vui lòng chọn chi nhánh để nhận hàng");
          setOrdering(false);
          return;
        }
        addressTitle = branch.name;
        addressDetail = branch.address;
      }

      const orderPayload: OrderData = {
        items: orderItems,
        orderType,
        deliveryAddress: {
          title: addressTitle,
          detail: addressDetail,
          note: note,
        },
        discountApplied: selectedVouchers.map(v => v.code).join(", "),
        subTotal,
        deliveryFee,
        totalPayment,
        paymentMethod: "Cash",
        voucherIds: selectedVouchers.map(v => v._id),
      };

      await createOrder(orderPayload);
      await clearCart(); // clear cart upon successful order
      
      Alert.alert("Thành công", "Đơn hàng của bạn đã được đặt thành công!");
      router.push("/(tab)/home");
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể đặt hàng. Vui lòng thử lại.");
    } finally {
      setOrdering(false);
    }
  };

  const handleApplyVoucher = async (voucher: Voucher) => {
    if (selectedVouchers.find(v => v._id === voucher._id)) {
      return; // already selected
    }
    if (selectedVouchers.length >= 3) {
      Alert.alert("Giới hạn", "Chỉ được áp dụng tối đa 3 mã giảm giá.");
      return;
    }

    try {
      const newSelected = [...selectedVouchers, voucher];
      const codes = newSelected.map(v => v.code);
      const result = await validateVouchers(codes, subTotal, deliveryFee);
      if (result.valid) {
        setSelectedVouchers(result.vouchers);
        Alert.alert("Thành công", `Đã áp dụng mã ${voucher.code}. Tổng giảm ${result.totalDiscount.toLocaleString('vi-VN')} VNĐ`);
      }
    } catch (err: any) {
      Alert.alert("Không thể áp dụng mã", err.message);
    }
  };

  const handleRemoveVoucher = (voucherId: string) => {
    setSelectedVouchers(prev => prev.filter(v => v._id !== voucherId));
  };

  if (loading) {
     return (
       <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
         <ActivityIndicator size="large" color="#C67C4E" />
         <Text style={{ marginTop: 12, color: "#9B9B9B" }}>Đang chuẩn bị đơn hàng...</Text>
       </View>
     )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === "delivery" && styles.toggleBtnActive]}
            onPress={() => setOrderType("delivery")}
          >
            <Text style={[styles.toggleText, orderType === "delivery" && styles.toggleTextActive]}>Giao hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === "pickup" && styles.toggleBtnActive]}
            onPress={() => setOrderType("pickup")}
          >
            <Text style={[styles.toggleText, orderType === "pickup" && styles.toggleTextActive]}>Nhận tại quán</Text>
          </TouchableOpacity>
        </View>

        {orderType === "delivery" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <Text style={styles.addressTitle}>Địa chỉ của bạn</Text>
            <Text style={styles.addressDetail}>{profile.address || "Vui lòng cập nhật địa chỉ trong trang Profile"}</Text>
            {note ? (
              <Text style={{ fontSize: 13, color: "#C67C4E", marginTop: 4 }}>Ghi chú: {note}</Text>
            ) : null}
            
            <View style={styles.addressActionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/profile")}>
                <Ionicons name="create-outline" size={16} color="#1C1C1C" />
                <Text style={styles.actionBtnText}>Sửa địa chỉ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowNoteModal(true)}>
                <Ionicons name="document-text-outline" size={16} color="#1C1C1C" />
                <Text style={styles.actionBtnText}>Ghi chú</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Địa điểm nhận hàng</Text>
            {branches.length === 0 ? (
              <Text style={styles.addressDetail}>Chưa có chi nhánh nào hoạt động.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {branches.map(branch => (
                  <TouchableOpacity 
                    key={branch._id} 
                    style={[styles.branchCard, selectedBranchId === branch._id && styles.branchCardActive]}
                    onPress={() => setSelectedBranchId(branch._id)}
                  >
                    <Text style={[styles.addressTitle, selectedBranchId === branch._id && { color: '#C67C4E' }]} numberOfLines={1}>{branch.name}</Text>
                    <Text style={[styles.addressDetail, { marginBottom: 0 }]} numberOfLines={2}>{branch.address}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {validItems.map((item, index) => (
          <View key={item.product._id} style={styles.itemCard}>
            <Image 
               source={item.product.imageUrl ? { uri: item.product.imageUrl } : require("../assets/images/3T-bia.jpg")} 
               style={styles.itemImage} 
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemSubtitle}>{item.size ? `Size: ${item.size} • ` : ''}{item.product.subtitle}</Text>
            </View>
            
            <View style={styles.quantityControls}>
              <Text style={styles.qtyText}>x {item.quantity}</Text>
            </View>
          </View>
        ))}

        <View style={styles.blankDivider} />

        <View style={styles.discountContainer}>
          <TouchableOpacity style={styles.discountCard} activeOpacity={0.7} onPress={() => setShowVoucherModal(true)}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={24} color="#C67C4E" />
            <Text style={styles.discountText}>
              {selectedVouchers.length > 0 ? `Đã áp dụng ${selectedVouchers.length} mã giảm giá` : 'Chọn mã giảm giá'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#1C1C1C" />
          </TouchableOpacity>
          
          {selectedVouchers.map((v, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, marginTop: 8, justifyContent: 'space-between' }}>
              <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>Mã: {v.code}</Text>
              <TouchableOpacity onPress={() => handleRemoveVoucher(v._id)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.paymentSummary}>
          <Text style={styles.summaryTitle}>Tóm tắt thanh toán</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{subTotal.toLocaleString('vi-VN')} VNĐ</Text>
          </View>
          
          {orderType === "delivery" && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng</Text>
              <View style={styles.deliveryFeeContainer}>
                <Text style={styles.originalFee}>{originalDeliveryFee.toLocaleString('vi-VN')} VNĐ</Text>
                <Text style={styles.summaryValue}>{deliveryFee.toLocaleString('vi-VN')} VNĐ</Text>
              </View>
            </View>
          )}

          {actualDiscountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Khuyến mãi</Text>
              <Text style={[styles.summaryValue, { color: "#EF4444" }]}>-{actualDiscountAmount.toLocaleString("vi-VN")}đ</Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng cộng</Text>
            <Text style={styles.summaryValue}>{totalPayment.toLocaleString('vi-VN')} VNĐ</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInfoRow}>
          <MaterialCommunityIcons name="wallet-outline" size={24} color="#C67C4E" />
          <View style={styles.cashBadge}>
            <Text style={styles.cashText}>Tiền mặt</Text>
          </View>
          <Text style={styles.footerTotal}>{totalPayment.toLocaleString('vi-VN')} VNĐ</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.moreOptionsBtn}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.orderBtn} 
          activeOpacity={0.85} 
          onPress={handleOrder}
          disabled={ordering}
        >
          {ordering ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.orderBtnText}>Đặt hàng</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showNoteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm ghi chú</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="VD: Nhờ shipper gọi điện trước khi giao..."
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowNoteModal(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={() => setShowNoteModal(false)}>
                <Text style={styles.modalSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showVoucherModal} transparent animationType="slide">
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Mã giảm giá</Text>
              <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1C" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.voucherList}>
              {vouchers.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>Hiện không có mã giảm giá nào.</Text>
              ) : (
                vouchers.map(voucher => (
                  <TouchableOpacity 
                    key={voucher._id} 
                    style={styles.voucherItem}
                    onPress={() => handleApplyVoucher(voucher)}
                  >
                    <View style={styles.voucherIcon}>
                      <MaterialCommunityIcons name="ticket-percent" size={24} color="#FFF" />
                    </View>
                    <View style={styles.voucherInfo}>
                      <Text style={styles.voucherCode}>{voucher.code}</Text>
                      <Text style={styles.voucherDesc}>
                        {voucher.discountType === 'freeship' ? 'Miễn phí vận chuyển' : 
                         `Giảm ${voucher.discountType === 'percent' ? `${voucher.discountValue}%` : `${voucher.discountValue.toLocaleString('vi-VN')}đ`}`}
                        {voucher.minOrderValue > 0 ? ` cho đơn từ ${voucher.minOrderValue.toLocaleString('vi-VN')}đ` : ''}
                      </Text>
                    </View>
                    {selectedVouchers.find(v => v._id === voucher._id) ? (
                      <TouchableOpacity 
                        style={[styles.applyBtn, { backgroundColor: '#F3F4F6' }]}
                        onPress={() => handleRemoveVoucher(voucher._id)}
                      >
                        <Text style={[styles.applyBtnText, { color: '#EF4444' }]}>Bỏ</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.applyBtn}
                        onPress={() => handleApplyVoucher(voucher)}
                      >
                        <Text style={styles.applyBtnText}>Dùng</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 15 : 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1C",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 150,
  },
  
  // Toggle
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#C67C4E",
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1C",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },

  // Section & Address
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1C",
    marginBottom: 16,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1C",
    marginBottom: 6,
  },
  addressDetail: {
    fontSize: 13,
    color: "#9B9B9B",
    marginBottom: 14,
  },
  addressActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    color: "#1C1C1C",
  },
  branchCard: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 16,
    width: 240,
    backgroundColor: "#FDFDFD",
  },
  branchCardActive: {
    borderColor: "#C67C4E",
    backgroundColor: "#FFF9F6",
  },

  divider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginVertical: 20,
  },
  blankDivider: {
    height: 4,
    backgroundColor: "#F9F9F9",
    marginVertical: 20,
    marginHorizontal: -24,
  },

  // Item Card
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1C",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: "#9B9B9B",
  },
  quantityControls: {
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1C",
  },

  // Discount
  discountContainer: {
    marginBottom: 24,
  },
  discountCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 16,
  },
  discountText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1C",
    marginLeft: 12,
  },

  // Payment Summary
  paymentSummary: {},
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1C",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#1C1C1C",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1C",
  },
  deliveryFeeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalFee: {
    fontSize: 15,
    color: "#1C1C1C",
    textDecorationLine: "line-through",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginVertical: 12,
  },

  // Footer (Bottom Sheet)
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FDFDFD",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  footerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cashBadge: {
    backgroundColor: "#C67C4E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
    marginRight: 8,
  },
  cashText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  footerTotal: {
    fontSize: 15,
    color: "#1C1C1C",
    fontWeight: "600",
  },
  moreOptionsBtn: {
    backgroundColor: "#C67C4E",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: "top",
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  modalCancelText: {
    fontWeight: "600",
    color: "#666",
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#C67C4E",
  },
  modalSaveText: {
    fontWeight: "600",
    color: "#FFF",
  },
  orderBtn: {
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
  orderBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  voucherList: {
    maxHeight: 400,
  },
  voucherItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  voucherIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#C67C4E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1C",
  },
  voucherDesc: {
    fontSize: 13,
    color: "#9B9B9B",
    marginTop: 4,
  },
  applyBtn: {
    backgroundColor: "#FDF4EE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  applyBtnText: {
    color: "#C67C4E",
    fontWeight: "700",
    fontSize: 13,
  },
});
