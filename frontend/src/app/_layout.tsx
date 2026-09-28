import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="competition/[id]" />
          <Stack.Screen name="login" options={{ headerShown: true, title: "Log in" }} />
          <Stack.Screen name="results/[id]" options={{ headerShown: true, title: "Results" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
