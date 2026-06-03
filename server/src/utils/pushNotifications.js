// Polyfill for Node 18 undici crash (ReferenceError: File is not defined)
if (typeof File === 'undefined') {
  global.File = require('buffer').File;
}

const Notification = require("../models/Notification");
const User = require("../models/User");

// Create a new Expo SDK client dynamically
let Expo;
let expo;

async function initExpo() {
  if (!Expo) {
    const sdk = await import("expo-server-sdk");
    Expo = sdk.Expo;
    expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  }
}

/**
 * Send a push notification to a specific user and save to database
 */
const sendPushNotification = async (userId, title, body, type = "system") => {
  try {
    // 1. Save notification to DB
    await Notification.create({
      userId,
      title,
      body,
      type,
    });

    await initExpo();

    // 2. Find user to get push token
    if (!userId) return; // Cannot push to a specific token if no userId is provided (unless broadcast)
    
    const user = await User.findById(userId);
    if (!user || !user.expoPushToken) {
      console.log(`User ${userId} does not have a push token.`);
      return;
    }

    // 3. Check if token is valid Expo push token
    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      console.error(`Push token ${user.expoPushToken} is not a valid Expo push token`);
      return;
    }

    // 4. Construct message
    const messages = [{
      to: user.expoPushToken,
      sound: "default",
      title,
      body,
      data: { type },
    }];

    // 5. Send message
    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("Push ticket:", ticketChunk);
      } catch (error) {
        console.error("Error sending push chunk:", error);
      }
    }
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
  }
};

/**
 * Send a broadcast push notification to all users and save a global notification to database
 */
const sendBroadcastPushNotification = async (title, body, type = "system") => {
  try {
    // 1. Save global notification to DB (userId: null)
    await Notification.create({
      userId: null,
      title,
      body,
      type,
    });

    await initExpo();

    // 2. Get all users with push tokens
    const users = await User.find({ expoPushToken: { $ne: "", $exists: true } });
    if (users.length === 0) return;

    // 3. Construct messages
    const messages = [];
    for (let user of users) {
      if (!Expo.isExpoPushToken(user.expoPushToken)) {
        continue;
      }
      messages.push({
        to: user.expoPushToken,
        sound: "default",
        title,
        body,
        data: { type },
      });
    }

    // 4. Send messages in chunks
    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("Broadcast Push ticket:", ticketChunk);
      } catch (error) {
        console.error("Error sending broadcast push chunk:", error);
      }
    }
  } catch (error) {
    console.error("Error in sendBroadcastPushNotification:", error);
  }
};

module.exports = {
  sendPushNotification,
  sendBroadcastPushNotification,
};
