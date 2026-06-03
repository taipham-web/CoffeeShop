import * as Device from "expo-device";
import { Platform } from "react-native";
import { buildApiUrl } from "./api";
import { getToken } from "./auth";

import Constants, { ExecutionEnvironment } from "expo-constants";

let Notifications: any;
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch (e) {
    console.warn("Expo notifications not supported on this platform.");
  }
}

// Define Notification structure
export interface NotificationData {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// Config notifications behavior when app is in foreground
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Register for Push Notifications and send token to backend
 */
export async function registerForPushNotificationsAsync() {
  if (!Notifications) return undefined;
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }
    
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // This will fall back to reading from app.json if projectId is not provided
    token = (
      await Notifications.getExpoPushTokenAsync({
        // projectId: "YOUR_PROJECT_ID", // Optional if configured in app.json
      })
    ).data;
    
    // Send the token to the backend
    try {
      const jwtToken = await getToken();
      if (jwtToken) {
        await fetch(buildApiUrl("/notifications/token"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ expoPushToken: token }),
        });
      }
    } catch (e) {
      console.error("Failed to sync push token", e);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

/**
 * Get user notifications list
 */
export async function getNotifications(): Promise<NotificationData[]> {
  const token = await getToken();
  if (!token) throw new Error("No token");

  const response = await fetch(buildApiUrl("/notifications"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  const data = await response.json();
  return data.notifications;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string) {
  const token = await getToken();
  if (!token) throw new Error("No token");

  const response = await fetch(buildApiUrl(`/notifications/${id}/read`), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to mark as read");
  }
}
