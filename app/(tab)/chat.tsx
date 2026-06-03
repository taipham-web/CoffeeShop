import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";
import { useFocusEffect } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { API_BASE_URL, buildApiUrl } from "../../services/api";
import { getStoredUser, getToken } from "../../services/auth";

interface ChatMessage {
  _id: string;
  user: string;
  sender: "user" | "admin";
  message: string;
  createdAt: string;
  read: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  const tabBarHeight = useBottomTabBarHeight();

  const initChat = async () => {
    try {
      const user = await getStoredUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const token = await getToken();

      // Fetch history
      const response = await fetch(buildApiUrl(`/chat/${user.id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }

      // Mark as read
      await fetch(buildApiUrl(`/chat/read/${user.id}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      // Connect Socket
      if (!socketRef.current) {
        // Remove trailing slash if any
        const baseUrl = API_BASE_URL.replace(/\/+$/, "");
        socketRef.current = io(baseUrl);
        
        socketRef.current.emit("join", user.id);

        socketRef.current.on("receiveMessage", (newMessage: ChatMessage) => {
          setMessages((prev) => [...prev, newMessage]);
          // If from admin, mark read
          if (newMessage.sender === "admin") {
            fetch(buildApiUrl(`/chat/read/${user.id}`), {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        });
      }
    } catch (error) {
      console.error("Chat initialization error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      initChat();
      return () => {
        // Disconnect socket when leaving screen or unmounting
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }, [])
  );

  const sendMessage = () => {
    if (!inputText.trim() || !userId || !socketRef.current) return;

    const messageData = {
      user: userId,
      sender: "user",
      message: inputText.trim()
    };

    socketRef.current.emit("sendMessage", messageData);
    setInputText("");
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === "user";
    return (
      <View style={[styles.messageBubble, isUser ? styles.messageUser : styles.messageAdmin]}>
        <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAdmin]}>
          {item.message}
        </Text>
        <Text style={[styles.timeText, isUser ? styles.timeTextUser : styles.timeTextAdmin]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerFull}>
        <ActivityIndicator size="large" color="#C67C4E" />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.centerFull}>
        <Ionicons name="chatbubbles-outline" size={80} color="#DEDEDE" />
        <Text style={{ marginTop: 16, color: "#9B9B9B" }}>Vui lòng đăng nhập để sử dụng chat</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hỗ trợ trực tuyến</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#9B9B9B"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  container: {
    flex: 1,
  },
  centerFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
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
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  messageUser: {
    alignSelf: "flex-end",
    backgroundColor: "#C67C4E",
    borderBottomRightRadius: 4,
  },
  messageAdmin: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: "#FFFFFF",
  },
  messageTextAdmin: {
    color: "#1C1C1C",
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
  },
  timeTextUser: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  timeTextAdmin: {
    color: "#9B9B9B",
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
  },
  input: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: "#1C1C1C",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#C67C4E",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#DEDEDE",
  }
});
