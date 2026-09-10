import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { oynatilabilirAdresMi } from "@/oda/platform";
import { usePartiKuyruk } from "@/parti/kuyruk";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";
import { Zemin } from "@/theme/Zemin";

const ORNEKLER = [
  "https://sunucum.com/film.mp4",
  "https://sunucum.com/yayin.m3u8",
  "https://sunucum.com/video.mpd",
];

export default function PartiDogrudan() {
  const router = useRouter();
  const { secim } = useLocalSearchParams<{ secim?: string }>();
  const sec = usePartiKuyruk((s) => s.sec);
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);
  const [adres, setAdres] = useState("");

  const temiz = adres.trim();
  const gecerli = oynatilabilirAdresMi(temiz);

  const baslat = useCallback(() => {
    if (!gecerli) return;
    haptic.select();
    if (secim) {
      sec({
        anahtar: String(Date.now()),
        platform: "dogrudan",
        adres: temiz,
        baslik: null,
        secen: userName,
        secenFoto: userPhoto ?? undefined,
      });
      router.back();
      return;
    }
    router.replace({ pathname: "/parti-oda", params: { platform: "dogrudan", adres: temiz } });
  }, [gecerli, secim, sec, temiz, userName, userPhoto, router]);

  return (
    <View style={styles.root}>
      <Zemin />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.baslik}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">Doğrudan bağlantı</Txt>
          <View style={{ width: 30 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.govde}>
            <Txt size={13} color={C.dim} lh={1.5}>
              Video adresini yapıştır. Oda sahibi durdurup sardığında herkeste aynı anda uygulanır.
            </Txt>

            <TextInput
              value={adres}
              onChangeText={setAdres}
              placeholder="https://..."
              placeholderTextColor={C.dim2}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
              style={styles.giris}
            />

            {temiz.length > 0 && !gecerli && (
              <Txt size={12} color={C.red}>
                Adres doğrudan bir video dosyası ya da akış olmalı: mp4, m3u8, mpd, webm, mkv, mov.
              </Txt>
            )}

            <Pressable
              onPress={baslat}
              disabled={!gecerli}
              style={[styles.dugme, !gecerli && styles.dugmePasif]}
            >
              <Txt weight="extrabold" size={14} color={gecerli ? "#08080C" : C.dim2}>
                {secim ? "Bu bağlantıya geç" : "Partiyi başlat"}
              </Txt>
            </Pressable>

            <View style={styles.ornekKutu}>
              <Txt size={11} color={C.dim2}>Örnek biçimler</Txt>
              {ORNEKLER.map((o) => (
                <Txt key={o} size={11} color={C.dim} style={{ marginTop: 4 }}>{o}</Txt>
              ))}
            </View>

            <Txt size={11} color={C.dim2} lh={1.5} style={{ marginTop: 4 }}>
              Netflix, Prime gibi servislerin bağlantıları burada çalışmaz; onların akışları
              kendi uygulamalarının kimlik doğrulamasına bağlı.
            </Txt>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  baslik: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 20, gap: 14 },
  giris: {
    minHeight: 84, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: C.line,
    color: "#fff", fontSize: 13, textAlignVertical: "top",
  },
  dugme: {
    height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: C.gold2,
  },
  dugmePasif: { backgroundColor: "rgba(255,255,255,.07)" },
  ornekKutu: {
    padding: 12, borderRadius: 12, marginTop: 4,
    backgroundColor: "rgba(255,255,255,.03)", borderWidth: 1, borderColor: C.line,
  },
});
