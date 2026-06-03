import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  getNotifications,
  markNotificationAsRead,
  NotificationData,
} from "../../services/notifications";

export default function NoticeScreen() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handlePress = async (item: NotificationData) => {
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item._id);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      } catch (error) {
        console.error("Error marking as read", error);
      }
    }

    // Navigate based on type
    if (item.type === "order") {
      router.push("/(tab)/orders");
    } else if (item.type === "voucher") {
      // maybe navigate to home or voucher page
      router.push("/(tab)/home");
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Ionicons name="receipt" size={24} color="#C67C4E" />;
      case "voucher":
        return <MaterialCommunityIcons name="ticket-percent" size={24} color="#E53935" />;
      default:
        return <Ionicons name="notifications" size={24} color="#BDBDBD" />;
    }
  };

  const renderItem = ({ item }: { item: NotificationData }) => {
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadItem,
        ]}
        onPress={() => handlePress(item)}
      >
        <View style={styles.iconContainer}>{renderIcon(item.type)}</View>
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.title,
              !item.isRead && styles.unreadText,
            ]}
          >
            {item.title}
          </Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleString("vi-VN")}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#BDBDBD" />
            <Text style={styles.emptyText}>Bạn chưa có thông báo nào</Text>
          </View>
        }
      />
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: "#FFF3E0", // Highlight for unread
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: "bold",
    color: "#C67C4E",
  },
  body: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53935",
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
