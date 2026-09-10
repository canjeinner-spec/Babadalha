import { type ReactNode } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

export function ModalKok({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={styles.kok}>
      {children}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ kok: { flex: 1 } });
