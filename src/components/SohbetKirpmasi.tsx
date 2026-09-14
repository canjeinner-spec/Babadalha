import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { Gradient } from "@/theme/Gradient";

const KIRPMA_AVATAR = 34;

function MarkaSeridi() {
  const [hata, setHata] = useState(false);
  if (hata) {
    return <Txt weight="displayBold" size={12} color="rgba(255,255,255,.9)">Aron Parti</Txt>;
  }
  return (
    <Image
      source={require("@/assets/marka/aron-marka.webp")}
      style={{ width: 66, height: 16 }}
      contentFit="contain"
      transition={0}
      onError={() => setHata(true)}
    />
  );
}

export function SohbetKirpmasi({ ad, tema, mesaj, ad2, mesaj2, kisiSayisi = 4 }: {
  ad: string;
  tema?: string | null;
  mesaj: string;
  ad2: string;
  mesaj2: string;
  kisiSayisi?: number;
}) {
  return (
    <View style={styles.kirpma}>
      <View style={styles.kirpmaBaslik}>
        <MarkaSeridi />
        <View style={{ flex: 1 }} />
        <Icon name="users" size={13} sw={2.2} color="rgba(255,255,255,.45)" />
        <Txt weight="extrabold" size={10.5} color="rgba(255,255,255,.45)">{kisiSayisi}</Txt>
      </View>

      <View style={styles.kirpmaIc}>
        <View style={styles.kirpmaSatir}>
          <Portrait name={ad2} size={KIRPMA_AVATAR} halkasiz />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Txt weight="extrabold" size={12.5} color="rgba(255,255,255,.72)">{ad2}</Txt>
            <Txt size={12.5} color="rgba(255,255,255,.9)" lh={1.3}>{mesaj2}</Txt>
          </View>
        </View>

        <View style={styles.kirpmaSatirSag}>
          <View style={{ flexShrink: 1, alignItems: "flex-end", gap: 2 }}>
            <RenkliAd ad={ad} tip="premium" tema={tema} size={12.5} weight="extrabold" renk="#fff" />
            <View style={styles.kirpmaBaloncuk}>
              <Txt size={12.5} color="#fff" lh={1.3} style={{ textAlign: "right" }}>{mesaj}</Txt>
            </View>
          </View>
          <Portrait name={ad} size={KIRPMA_AVATAR} halkasiz />
        </View>
      </View>

      <Gradient
        colors={["rgba(18,14,8,0)", "rgba(18,14,8,.9)"]}
        deg={180}
        style={styles.kirpmaSolma}
        pointerEvents="none"
      />
    </View>
  );
}


const styles = StyleSheet.create({
  kirpma: {
    marginTop: 11, borderRadius: 13, overflow: "hidden",
    backgroundColor: "rgba(18,14,8,.9)",
    borderWidth: 1, borderColor: "rgba(255,255,255,.1)",
  },
  kirpmaBaslik: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.07)",
    backgroundColor: "rgba(255,255,255,.03)",
  },
  kirpmaIc: { paddingHorizontal: 11, paddingTop: 11, paddingBottom: 14, gap: 11 },
  kirpmaSatir: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  kirpmaSatirSag: { flexDirection: "row", alignItems: "flex-start", justifyContent: "flex-end", gap: 9 },
  kirpmaBaloncuk: {
    alignSelf: "flex-end", borderRadius: 12, borderTopRightRadius: 4,
    paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1,
    backgroundColor: "rgba(232,179,65,.14)", borderColor: "rgba(232,179,65,.3)",
  },
  kirpmaSolma: { position: "absolute", left: 0, right: 0, bottom: 0, height: 16 },
});
