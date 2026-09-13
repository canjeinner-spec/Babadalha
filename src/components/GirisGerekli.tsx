import { Pressable, StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
import { PlatformSimge } from "@/components/PlatformSimge";
import { Icon } from "@/icons/Icon";
import { type Platform } from "@/oda/platform";

const YOL_GIRIS = "M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7";

function acikRenkMi(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

export function GirisGerekli({ platform, onGiris }: {
  platform: Platform;
  onGiris: () => void;
}) {
  const yazi = acikRenkMi(platform.vurgu) ? "#0A0910" : "#fff";
  return (
    <View style={styles.kok} pointerEvents="auto">
      <PlatformSimge platform={platform} boyut={44} style={styles.logo} />
      <Txt weight="displayBold" size={18} color="#fff" style={{ marginTop: 10 }}>Giriş gerekli</Txt>
      <Txt size={13} color="rgba(255,255,255,.72)" align="center" style={{ marginTop: 4, paddingHorizontal: 24 }}>
        Bu videoyu izlemek için {platform.ad} hesabında oturum aç
      </Txt>
      <Pressable onPress={onGiris} style={[styles.dugme, { backgroundColor: platform.vurgu }]}>
        <Icon path={YOL_GIRIS} size={20} sw={2.2} color={yazi} />
        <Txt weight="extrabold" size={15} color={yazi}>Giriş Yap</Txt>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(6,5,10,.82)",
  },
  logo: { width: 150, height: 44 },
  dugme: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18,
    paddingVertical: 12, paddingHorizontal: 26, borderRadius: 999,
  },
});
