import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ayiklamaAbone } from "@/lib/ayiklamaGunluk";

export function AyiklamaKatmani() {
  const [satirlar, setSatirlar] = useState<string[]>([]);

  useEffect(() => ayiklamaAbone(setSatirlar), []);

  if (satirlar.length === 0) return null;

  return (
    <View style={styles.kok} pointerEvents="none">
      <ScrollView style={styles.kaydir}>
        {satirlar.map((s, i) => (
          <Text key={i} style={styles.satir}>{s}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    position: "absolute",
    left: 6,
    right: 6,
    top: 60,
    maxHeight: 260,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 6,
    padding: 6,
    zIndex: 9999,
  },
  kaydir: { flexGrow: 0 },
  satir: { color: "#8f8", fontSize: 9, lineHeight: 12, fontFamily: "monospace" },
});
