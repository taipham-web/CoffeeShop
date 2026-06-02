import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveExpoHostApiUrl(): string | null {
  const expoConfigHostUri = (
    Constants.expoConfig as { hostUri?: string } | null
  )?.hostUri;
  const manifestHostUri = (
    Constants as unknown as {
      manifest?: { debuggerHost?: string };
      manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    }
  ).manifest2?.extra?.expoGo?.debuggerHost;
  const debuggerHostUri =
    expoConfigHostUri ||
    manifestHostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (!debuggerHostUri) {
    return null;
  }

  const host = debuggerHostUri.split(":")[0];

  if (!host) {
    return null;
  }

  return `http://${host}:5001`;
}

const fallbackApiUrl = Platform.select({
  android: "http://103.72.99.67:5001",
  ios: resolveExpoHostApiUrl() || "http://103.72.99.67:5001",
  web: "http://103.72.99.67:5001",
  default: "http://103.72.99.67:5001",
});

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  fallbackApiUrl ||
  "http://103.72.99.67:5001";

export function buildApiUrl(path: string): string {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
