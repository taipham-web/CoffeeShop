import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
  ScrollView,
  Alert
} from "react-native";
import { fetchMyOrders, Order, cancelOrder } from "../../services/order";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Chờ xác nhận", color: "#E4A128", bg: "#FFF9E6" },
  processing: { label: "Đang chuẩn bị", color: "#3B82F6", bg: "#EFF6FF" },
  delivering: { label: "Đang giao", color: "#F97316", bg: "#FFF7ED" },
  completed: { label: "Hoàn thành", color: "#10B981", bg: "#ECFDF5" },
  cancelled: { label: "Đã hủy", color: "#EF4444", bg: "#FEF2F2" },
};

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = async () => {
    try {
      setError(null);
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      "Xác nhận hủy đơn",
      "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true);
              await cancelOrder(orderId);
              Alert.alert("Thành công", "Đơn hàng đã được hủy.");
              setSelectedOrder(null);
              loadOrders();
            } catch (err: any) {
              Alert.alert("Lỗi", err.message || "Không thể hủy đơn hàng");
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusInfo = STATUS_MAP[item.status] || {
      label: item.status,
      color: "#9B9B9B",
      bg: "#F5F5F5",
    };

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => setSelectedOrder(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId} numberOfLines={1}>
            Mã ĐH: {item._id.slice(-8).toUpperCase()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.dateText}>
            Ngày đặt: {new Date(item.createdAt).toLocaleString("vi-VN")}
          </Text>
          <Text style={styles.itemCount}>
            Sản phẩm: {item.items.reduce((sum, i) => sum + i.quantity, 0)} món
          </Text>
          
          <View style={styles.itemList}>
            {item.items.slice(0, 2).map((prod, idx) => (
              <Text key={idx} style={styles.itemRow} numberOfLines={1}>
                {prod.quantity}x {prod.name} {prod.size ? `(${prod.size})` : ""}
              </Text>
            ))}
            {item.items.length > 2 && (
              <Text style={styles.moreItems}>... và {item.items.length - 2} món khác</Text>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Tổng tiền:</Text>
          <Text style={styles.totalAmount}>{item.totalPayment.toLocaleString('vi-VN')} VNĐ</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;
    const statusInfo = STATUS_MAP[selectedOrder.status];

    return (
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#1C1C1C" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Status Section */}
            <View style={[styles.modalSection, { alignItems: 'center', backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.modalStatusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
              <Text style={styles.modalOrderId}>Mã ĐH: {selectedOrder._id.slice(-8).toUpperCase()}</Text>
              <Text style={styles.modalOrderDate}>Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</Text>
            </View>

            {/* Delivery Info */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#C67C4E" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.infoTitle}>{selectedOrder.deliveryAddress.title}</Text>
                  <Text style={styles.infoSubtitle}>{selectedOrder.deliveryAddress.detail}</Text>
                </View>
              </View>
              {selectedOrder.deliveryAddress.note ? (
                <View style={styles.infoRow}>
                  <Ionicons name="document-text-outline" size={20} color="#C67C4E" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.infoSubtitle}>Ghi chú: {selectedOrder.deliveryAddress.note}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Order Items */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
              {selectedOrder.items.map((item, idx) => (
                <View key={idx} style={styles.orderItem}>
                  <Image source={{ uri: item.imageUrl }} style={styles.orderItemImage} />
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    {item.size && <Text style={styles.orderItemSize}>Size: {item.size}</Text>}
                    <View style={styles.orderItemPriceRow}>
                      <Text style={styles.orderItemPrice}>{item.price.toLocaleString("vi-VN")}đ</Text>
                      <Text style={styles.orderItemQty}>x{item.quantity}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Payment Summary */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={styles.summaryValue}>{selectedOrder.subTotal.toLocaleString("vi-VN")}đ</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí giao hàng</Text>
                <Text style={styles.summaryValue}>{selectedOrder.deliveryFee.toLocaleString("vi-VN")}đ</Text>
              </View>

              {selectedOrder.subTotal + selectedOrder.deliveryFee - selectedOrder.totalPayment > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Khuyến mãi</Text>
                  <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                    -{(selectedOrder.subTotal + selectedOrder.deliveryFee - selectedOrder.totalPayment).toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              )}

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalSummaryLabel}>Tổng cộng</Text>
                <Text style={styles.totalSummaryValue}>{selectedOrder.totalPayment.toLocaleString("vi-VN")}đ</Text>
              </View>

              <View style={[styles.summaryRow, { marginTop: 12 }]}>
                <Text style={styles.summaryLabel}>Phương thức</Text>
                <Text style={styles.summaryValue}>
                  {selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt' : selectedOrder.paymentMethod}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            {selectedOrder.status === 'pending' && (
              <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => handleCancelOrder(selectedOrder._id)}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator color="#EF4444" />
                  ) : (
                    <Text style={styles.cancelBtnText}>Hủy đơn hàng</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.cancelHint}>Chỉ có thể hủy khi đơn hàng đang chờ xác nhận.</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng đã đặt</Text>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#C67C4E" />
          <Text style={styles.loadingText}>Đang tải đơn hàng…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color="#C67C4E" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadOrders}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="receipt-outline" size={64} color="#C67C4E" style={{ opacity: 0.5 }} />
          <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
          <Text style={styles.emptySubtitle}>Bạn chưa đặt đơn hàng nào gần đây.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.push("/(tab)/home")}>
            <Text style={styles.retryBtnText}>Đặt hàng ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C67C4E" />
          }
        />
      )}

      {renderOrderDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  header: {
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
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1C",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9B9B9B",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#C67C4E",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
  },
  retryBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  listContent: {
    padding: 24,
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1C",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardBody: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
    paddingBottom: 12,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    color: "#9B9B9B",
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  itemList: {
    gap: 4,
  },
  itemRow: {
    fontSize: 13,
    color: "#555",
  },
  moreItems: {
    fontSize: 13,
    color: "#9B9B9B",
    fontStyle: "italic",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#C67C4E",
  },

  // Modal styles
  modalRoot: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1C",
  },
  modalContent: {
    flex: 1,
  },
  modalSection: {
    backgroundColor: "#FFF",
    padding: 20,
    marginBottom: 8,
  },
  modalStatusText: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalOrderId: {
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
    marginBottom: 4,
  },
  modalOrderDate: {
    fontSize: 13,
    color: "#9B9B9B",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1C",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1C",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  orderItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  orderItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1C",
    marginBottom: 4,
  },
  orderItemSize: {
    fontSize: 13,
    color: "#9B9B9B",
    marginBottom: 4,
  },
  orderItemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderItemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C67C4E",
  },
  orderItemQty: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#555",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1C",
  },
  totalRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    marginBottom: 0,
  },
  totalSummaryLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1C",
  },
  totalSummaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#C67C4E",
  },
  actionContainer: {
    padding: 24,
    alignItems: "center",
  },
  cancelBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelHint: {
    fontSize: 13,
    color: "#9B9B9B",
    marginTop: 12,
    textAlign: "center",
  }
});
