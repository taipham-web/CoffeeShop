import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <WishlistProvider>
        <ProfileProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />

              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
              <Stack.Screen
                name="product/[id]"
                options={{ headerShown: false, animation: "slide_from_right" }}
              />
              <Stack.Screen
                name="profile"
                options={{ headerShown: false, animation: "slide_from_right" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ProfileProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
