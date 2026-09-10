import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";
import { fontMap } from "@/theme/fonts";
import { TemaSaglayici } from "@/theme/tema";

SplashScreen.preventAutoHideAsync().catch(() => {});

if (!__DEV__) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

export default function KokYerlesim() {
  const [yazilarHazir] = useFonts(fontMap);
  const initAuth = useApp((s) => s.initAuth);
  const bootstrapped = useApp((s) => s.bootstrapped);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (yazilarHazir && bootstrapped) SplashScreen.hideAsync().catch(() => {});
  }, [yazilarHazir, bootstrapped]);

  if (!yazilarHazir || !bootstrapped) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <TemaSaglayici>
          <StatusBar style="light" />
          <View style={{ flex: 1, backgroundColor: C.bg }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: C.bg },
                animation: "slide_from_right",
                gestureEnabled: Platform.OS === "ios",
                fullScreenGestureEnabled: Platform.OS === "ios",
              }}
            />
          </View>
        </TemaSaglayici>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
