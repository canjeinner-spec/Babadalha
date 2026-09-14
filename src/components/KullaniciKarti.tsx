import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CenterModal } from "@/components/CenterModal";
import { OzelIdGosterim } from "@/components/OzelId";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { getPublicProfileById, type PublicProfile } from "@/data/remote/profileRepo";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { haptic } from "@/lib/haptics";
import { atabilirMi, rolAdi, rolVerebilirMi, yetkiVar, type PartiRol } from "@/parti/yetki";
import { C } from "@/theme/colors";

export type KartKisisi = {
  anahtar: string;
  ad: string;
  kullaniciAdi?: string | null;
  foto?: string;
  dbId?: number | null;
  rol?: PartiRol;
  sahip?: boolean;
  mikrofonIzni?: boolean;
  ozelId?: string | null;
  ozelIdTip?: "premium" | "kapsul" | null;
  ozelIdTema?: string | null;
};

export type KartYetkileri = {
  benimAnahtar: string;
  benimRol: PartiRol;
  onYetki: (kisi: KartKisisi, rol: PartiRol) => void;
  onMikrofon: (kisi: KartKisisi, acik: boolean) => void;
  onAt: (kisi: KartKisisi) => void;
};

function Eylem({ etiket, renk, onBas }: { etiket: string; renk?: string; onBas: () => void }) {
  return (
    <Pressable style={styles.eylem} onPress={onBas}>
      <Txt weight="extrabold" size={13.5} color={renk ?? "#fff"}>{etiket}</Txt>
    </Pressable>
  );
}

export function KullaniciKarti({ kisi, yetkiler, onKapat }: {
  kisi: KartKisisi | null;
  yetkiler?: KartYetkileri;
  onKapat: () => void;
}) {
  const t = useCeviri();
  const [profil, setProfil] = useState<PublicProfile | null>(null);

  const dbId = kisi?.dbId ?? null;
  const [sonId, setSonId] = useState<number | null>(null);
  if (dbId !== sonId) {
    setSonId(dbId);
    if (profil) setProfil(null);
  }

  useEffect(() => {
    if (!dbId) return;
    let acik = true;
    getPublicProfileById(dbId)
      .then((p) => { if (acik) setProfil(p); })
      .catch(() => {});
    return () => { acik = false; };
  }, [dbId]);

  if (!kisi) return <CenterModal visible={false} onClose={onKapat}><View /></CenterModal>;

  const rol: PartiRol = kisi.rol ?? (kisi.sahip ? "sahip" : "uye");
  const kendim = !!yetkiler && kisi.anahtar === yetkiler.benimAnahtar;
  const ozelId = kisi.ozelId ?? profil?.ozel_id ?? null;
  const tip = kisi.ozelIdTip ?? profil?.ozel_id_tip ?? null;
  const tema = kisi.ozelIdTema ?? profil?.ozel_id_tema ?? null;
  const kullaniciAdi = (kisi.kullaniciAdi ?? profil?.kullanici_adi ?? "").trim();
  const konum = [profil?.sehir, profil?.ulke].filter(Boolean).join(", ");

  const rolVerilir = !!yetkiler && !kendim && rolVerebilirMi(yetkiler.benimRol, rol);
  const atilir = !!yetkiler && !kendim && atabilirMi(yetkiler.benimRol, rol);
  const mikVar = !!yetkiler && !kendim && yetkiVar(yetkiler.benimRol, "mikrofonAyar");

  const sec = (isi: () => void) => () => { haptic.select(); isi(); onKapat(); };

  return (
    <CenterModal visible onClose={onKapat}>
      <View style={styles.kart}>
        <View style={styles.tepe}>
          <Portrait name={kisi.ad} size={78} photo={kisi.foto ?? profil?.profil_resmi ?? undefined} halkasiz />
          {(kisi.sahip || rol === "sahip") && (
            <View style={styles.tac}>
              <Icon name="crown" size={16} color={C.gold2} fill={C.gold2} />
            </View>
          )}
        </View>

        <View style={{ alignItems: "center", marginTop: 12, gap: 5 }}>
          <RenkliAd ad={kisi.ad} tip={tip} tema={tema} size={19} weight="displayBold" renk="#fff" />
          {!!kullaniciAdi && <Txt size={12.5} color={C.dim}>@{kullaniciAdi}</Txt>}
          {!!ozelId && (
            <View style={{ marginTop: 3 }}>
              <OzelIdGosterim id={ozelId} tip={tip} tema={tema} punto={16} kapsulSize={12.5} />
            </View>
          )}
        </View>

        <View style={styles.rozetler}>
          <View style={styles.rozet}>
            <Txt weight="extrabold" size={11.5} color={C.gold2}>{rolAdi(rol)}</Txt>
          </View>
          {profil?.seviye_id != null && (
            <View style={styles.rozet}>
              <Txt weight="extrabold" size={11.5} color="rgba(255,255,255,.78)">
                {t("kart.seviye", profil.seviye_id)}
              </Txt>
            </View>
          )}
          {!!konum && (
            <View style={styles.rozet}>
              <Txt weight="extrabold" size={11.5} color="rgba(255,255,255,.78)">{konum}</Txt>
            </View>
          )}
        </View>

        {!!profil && (
          <Txt size={13} color={profil.biyografi ? C.dim : C.dim2} align="center" lh={1.5} style={styles.biyografi}>
            {profil.biyografi || t("kart.biyografiYok")}
          </Txt>
        )}

        {(rolVerilir || atilir || mikVar) && (
          <View style={styles.eylemler}>
            {rolVerilir && rol !== "yardimci" && (
              <Eylem etiket={t("panel.yardimciYap")} onBas={sec(() => yetkiler!.onYetki(kisi, "yardimci"))} />
            )}
            {rolVerilir && rol === "yardimci" && (
              <Eylem etiket={t("panel.yardimciAl")} onBas={sec(() => yetkiler!.onYetki(kisi, "uye"))} />
            )}
            {mikVar && (
              <Eylem
                etiket={kisi.mikrofonIzni ? t("panel.mikKapat") : t("panel.mikAc")}
                onBas={sec(() => yetkiler!.onMikrofon(kisi, !kisi.mikrofonIzni))}
              />
            )}
            {atilir && (
              <Eylem etiket={t("panel.odadanAt")} renk={C.red} onBas={sec(() => yetkiler!.onAt(kisi))} />
            )}
          </View>
        )}

        <Pressable style={styles.kapat} onPress={onKapat}>
          <Txt weight="extrabold" size={13.5} color="#fff">{t("kart.kapat")}</Txt>
        </Pressable>
      </View>
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  kart: {
    backgroundColor: C.card, borderRadius: 22, paddingVertical: 22, paddingHorizontal: 20,
    borderWidth: 1, borderColor: C.line, alignItems: "stretch",
  },
  tepe: { alignItems: "center" },
  tac: { position: "absolute", top: -6, right: "30%", transform: [{ rotate: "18deg" }] },
  rozetler: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 7, marginTop: 14 },
  rozet: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  biyografi: { marginTop: 14, paddingHorizontal: 4 },
  eylemler: { marginTop: 18, gap: 8 },
  eylem: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 13,
    backgroundColor: C.kontrol, borderWidth: 1, borderColor: C.line,
  },
  kapat: {
    marginTop: 16, alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 13, backgroundColor: "rgba(255,255,255,.06)",
  },
});
