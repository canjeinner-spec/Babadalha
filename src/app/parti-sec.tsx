import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PartiOynatici, type OynaticiKolu } from "@/components/PartiOynatici";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { platformBul } from "@/oda/platform";
import { type OynaticiOlayi } from "@/parti/kopru";
import { usePartiKuyruk } from "@/parti/kuyruk";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

const BEKLEME_MS = 700;

export default function PartiSec() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { platform: kod } = useLocalSearchParams<{ platform?: string }>();
  const platform = platformBul(kod);
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);
  const sec = usePartiKuyruk((s) => s.sec);
  const oynatici = useRef<OynaticiKolu>(null);
  const [sonBilgi, setSonBilgi] = useState<{ adres: string; baslik: string | null } | null>(null);
  const [secimAni, setSecimAni] = useState(0);

  const olayGeldi = useCallback((o: OynaticiOlayi) => {
    if (o.tur === "bilgi") setSonBilgi({ adres: o.adres, baslik: o.baslik });
    else if (o.tur === "oynat" && o.izleme) {
      oynatici.current?.duraklat();
      setSecimAni((a) => a || Date.now());
    }
  }, []);

  useEffect(() => {
    if (!secimAni || !platform) return;
    const t = setTimeout(() => {
      sec({
        anahtar: String(secimAni),
        platform: platform.kod,
        adres: sonBilgi?.adres ?? platform.adres,
        baslik: sonBilgi?.baslik ?? null,
        secen: userName,
        secenFoto: userPhoto ?? undefined,
      });
      router.back();
    }, BEKLEME_MS);
    return () => clearTimeout(t);
  }, [secimAni, sonBilgi, platform, sec, userName, userPhoto, router]);

  if (!platform) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <Txt color={C.dim}>Platform bulunamadı</Txt>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.baslik, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="x" size={26} sw={2.4} color="#fff" />
        </Pressable>
        <Txt weight="displayBold" size={17} color="#fff">{platform.ad}</Txt>
        <View style={{ width: 26 }} />
      </View>
      <PartiOynatici
        ref={oynatici}
        adres={platform.adres}
        platform={platform.kod}
        tamEkran
        onOlay={olayGeldi}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  baslik: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 10, backgroundColor: "#000",
  },
});
