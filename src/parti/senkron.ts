import { type RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { type PlatformKodu } from "@/oda/platform";
import { type OdaAyari, type PartiRol } from "@/parti/yetki";

export type OzelIdTip = "premium" | "kapsul" | null;

export type PartiKisi = {
  anahtar: string;
  ad: string;
  foto?: string;
  sahip: boolean;
  rol: PartiRol;
  dbId?: number | null;
  mikrofonIzni?: boolean;
  yayinda?: boolean;
  ozelIdTip?: OzelIdTip;
  ozelIdTema?: string | null;
};

export type OynatimDurumu = {
  platform: PlatformKodu;
  adres: string;
  baslik: string | null;
  kapak: string | null;
  konum: number;
  oynuyor: boolean;
  an: number;
  sira?: number;
  kaynak?: string;
};

export type PaketKimligi = { kaynak: string; sira: number };

export type SohbetMesaji = {
  anahtar: string;
  kisi: string;
  metin: string;
  foto?: string;
  ozelIdTip?: OzelIdTip;
  ozelIdTema?: string | null;
  an: number;
};

export type SenkronOlay =
  | { tur: "kisiler"; kisiler: PartiKisi[] }
  | { tur: "katildi"; kisi: PartiKisi }
  | { tur: "ayrildi"; kisi: PartiKisi }
  | { tur: "oynatim"; durum: OynatimDurumu }
  | { tur: "sohbet"; mesaj: SohbetMesaji }
  | { tur: "durumSor" }
  | { tur: "yetki"; anahtar: string; rol: PartiRol }
  | { tur: "atildi"; anahtar: string }
  | { tur: "odaAyari"; ayar: OdaAyari }
  | { tur: "mikrofonIzin"; anahtar: string; acik: boolean }
  | { tur: "devir"; eskiSahip: string; yeniSahip: string }
  | { tur: "saatIstek"; soran: string; t0: number }
  | { tur: "saatYanit"; t0: number; t1: number }
  | { tur: "baglanti"; acik: boolean };

export type PartiKanali = {
  kapat: () => void;
  oynatimYayinla: (durum: OynatimDurumu) => void;
  sohbetYolla: (mesaj: SohbetMesaji) => void;
  durumIste: () => void;
  yetkiYayinla: (anahtar: string, rol: PartiRol) => void;
  atmaYayinla: (anahtar: string) => void;
  odaAyariYayinla: (ayar: OdaAyari) => void;
  mikrofonIzniYayinla: (anahtar: string, acik: boolean) => void;
  devirYayinla: (eskiSahip: string, yeniSahip: string) => void;
  saatIsteYolla: (soran: string, t0: number) => void;
  saatYanitYolla: (soran: string, t0: number, t1: number) => void;
  kendiniGuncelle: (kisi: PartiKisi) => void;
};

export const SAPMA_ESIGI = 1;

export const UZAK_UYGULAMA_SOGUMA = 750;

export function beklenenKonum(d: OynatimDurumu, simdi = Date.now(), sapma = 0): number {
  if (!d.oynuyor) return d.konum;
  return d.konum + Math.max(0, (simdi + sapma - d.an) / 1000);
}

export function yankiPenceresinde(bitis: number, simdi = Date.now()): boolean {
  return simdi < bitis;
}

export function eskiPaketMi(onceki: PaketKimligi | null, yeni: OynatimDurumu): boolean {
  if (!onceki) return false;
  if (!yeni.kaynak || !Number.isFinite(yeni.sira)) return false;
  if (onceki.kaynak !== yeni.kaynak) return false;
  return (yeni.sira as number) <= onceki.sira;
}

export function paketKimligi(d: OynatimDurumu): PaketKimligi | null {
  if (!d.kaynak || !Number.isFinite(d.sira)) return null;
  return { kaynak: d.kaynak, sira: d.sira as number };
}

type Acilis = {
  odaId: string;
  ben: PartiKisi;
  onOlay: (o: SenkronOlay) => void;
};

function kisiCoz(ham: unknown): PartiKisi | null {
  if (!ham || typeof ham !== "object") return null;
  const k = ham as Partial<PartiKisi>;
  if (!k.anahtar || !k.ad) return null;
  return {
    anahtar: String(k.anahtar),
    ad: String(k.ad),
    foto: k.foto ? String(k.foto) : undefined,
    sahip: !!k.sahip,
    rol: (k.rol === "sahip" || k.rol === "yardimci" ? k.rol : k.sahip ? "sahip" : "uye") as PartiRol,
    dbId: typeof k.dbId === "number" ? k.dbId : null,
    mikrofonIzni: !!k.mikrofonIzni,
    yayinda: !!k.yayinda,
    ozelIdTip: (k.ozelIdTip ?? null) as OzelIdTip,
    ozelIdTema: k.ozelIdTema ?? null,
  };
}

export function partiKanaliAc({ odaId, ben, onOlay }: Acilis): PartiKanali {
  const sb = supabase;
  if (!sb) {
    return {
      kapat: () => {},
      oynatimYayinla: () => {},
      sohbetYolla: () => {},
      durumIste: () => {},
      yetkiYayinla: () => {},
      atmaYayinla: () => {},
      odaAyariYayinla: () => {},
      mikrofonIzniYayinla: () => {},
      devirYayinla: () => {},
      saatIsteYolla: () => {},
      saatYanitYolla: () => {},
      kendiniGuncelle: () => {},
    };
  }

  let kapandi = false;
  const konu = `parti-oda-${odaId}`;
  for (const eskiKanal of sb.getChannels()) {
    if (eskiKanal.topic === konu || eskiKanal.topic === `realtime:${konu}`) sb.removeChannel(eskiKanal);
  }
  const kanal: RealtimeChannel = sb.channel(konu, {
    config: { presence: { key: ben.anahtar }, broadcast: { self: false } },
  });

  const listeCikar = (): PartiKisi[] => {
    const durum = kanal.presenceState<Record<string, unknown>>();
    const cikti: PartiKisi[] = [];
    for (const girisler of Object.values(durum)) {
      for (const g of girisler as unknown[]) {
        const k = kisiCoz(g);
        if (k && !cikti.some((x) => x.anahtar === k.anahtar)) cikti.push(k);
      }
    }
    return cikti.sort((a, b) => Number(b.sahip) - Number(a.sahip) || a.ad.localeCompare(b.ad, "tr"));
  };

  kanal
    .on("presence", { event: "sync" }, () => {
      if (!kapandi) onOlay({ tur: "kisiler", kisiler: listeCikar() });
    })
    .on("presence", { event: "join" }, ({ newPresences }) => {
      if (kapandi) return;
      for (const p of newPresences ?? []) {
        const k = kisiCoz(p);
        if (k && k.anahtar !== ben.anahtar) onOlay({ tur: "katildi", kisi: k });
      }
    })
    .on("presence", { event: "leave" }, ({ leftPresences }) => {
      if (kapandi) return;
      for (const p of leftPresences ?? []) {
        const k = kisiCoz(p);
        if (k && k.anahtar !== ben.anahtar) onOlay({ tur: "ayrildi", kisi: k });
      }
    })
    .on("broadcast", { event: "oynatim" }, ({ payload }) => {
      if (!kapandi && payload) onOlay({ tur: "oynatim", durum: payload as OynatimDurumu });
    })
    .on("broadcast", { event: "sohbet" }, ({ payload }) => {
      if (!kapandi && payload) onOlay({ tur: "sohbet", mesaj: payload as SohbetMesaji });
    })
    .on("broadcast", { event: "durumSor" }, () => {
      if (!kapandi) onOlay({ tur: "durumSor" });
    })
    .on("broadcast", { event: "yetki" }, ({ payload }) => {
      const p = payload as { anahtar?: string; rol?: PartiRol } | null;
      if (!kapandi && p?.anahtar && p.rol) onOlay({ tur: "yetki", anahtar: String(p.anahtar), rol: p.rol });
    })
    .on("broadcast", { event: "atildi" }, ({ payload }) => {
      const p = payload as { anahtar?: string } | null;
      if (!kapandi && p?.anahtar) onOlay({ tur: "atildi", anahtar: String(p.anahtar) });
    })
    .on("broadcast", { event: "odaAyari" }, ({ payload }) => {
      if (!kapandi && payload) onOlay({ tur: "odaAyari", ayar: payload as OdaAyari });
    })
    .on("broadcast", { event: "devir" }, ({ payload }) => {
      const p = payload as { eskiSahip?: string; yeniSahip?: string } | null;
      if (!kapandi && p?.yeniSahip) {
        onOlay({ tur: "devir", eskiSahip: String(p.eskiSahip ?? ""), yeniSahip: String(p.yeniSahip) });
      }
    })
    .on("broadcast", { event: "saatIstek" }, ({ payload }) => {
      const p = payload as { soran?: string; t0?: number } | null;
      if (!kapandi && p?.soran && typeof p.t0 === "number") {
        onOlay({ tur: "saatIstek", soran: String(p.soran), t0: p.t0 });
      }
    })
    .on("broadcast", { event: "saatYanit" }, ({ payload }) => {
      const p = payload as { soran?: string; t0?: number; t1?: number } | null;
      if (kapandi || !p || p.soran !== ben.anahtar) return;
      if (typeof p.t0 === "number" && typeof p.t1 === "number") {
        onOlay({ tur: "saatYanit", t0: p.t0, t1: p.t1 });
      }
    })
    .on("broadcast", { event: "mikrofonIzin" }, ({ payload }) => {
      const p = payload as { anahtar?: string; acik?: boolean } | null;
      if (!kapandi && p?.anahtar) onOlay({ tur: "mikrofonIzin", anahtar: String(p.anahtar), acik: !!p.acik });
    })
    .subscribe((durum) => {
      if (kapandi) return;
      if (durum === "SUBSCRIBED") {
        onOlay({ tur: "baglanti", acik: true });
        kanal.track(ben).catch(() => {});
        return;
      }
      if (durum === "CHANNEL_ERROR" || durum === "TIMED_OUT" || durum === "CLOSED") {
        onOlay({ tur: "baglanti", acik: false });
      }
    });

  const gonder = (olay: string, yuk: unknown) => {
    if (kapandi) return;
    kanal.send({ type: "broadcast", event: olay, payload: yuk }).catch(() => {});
  };

  return {
    kapat: () => {
      if (kapandi) return;
      kapandi = true;
      try {
        kanal.untrack().catch(() => {});
      } catch {
        /* kanal zaten kapanmis olabilir */
      }
      sb.removeChannel(kanal);
    },
    oynatimYayinla: (durum) => gonder("oynatim", durum),
    sohbetYolla: (mesaj) => gonder("sohbet", mesaj),
    durumIste: () => gonder("durumSor", {}),
    yetkiYayinla: (anahtar, rol) => gonder("yetki", { anahtar, rol }),
    atmaYayinla: (anahtar) => gonder("atildi", { anahtar }),
    odaAyariYayinla: (ayar) => gonder("odaAyari", ayar),
    mikrofonIzniYayinla: (anahtar, acik) => gonder("mikrofonIzin", { anahtar, acik }),
    devirYayinla: (eskiSahip, yeniSahip) => gonder("devir", { eskiSahip, yeniSahip }),
    saatIsteYolla: (soran, t0) => gonder("saatIstek", { soran, t0 }),
    saatYanitYolla: (soran, t0, t1) => gonder("saatYanit", { soran, t0, t1 }),
    kendiniGuncelle: (kisi) => {
      if (kapandi) return;
      kanal.track(kisi).catch(() => {});
    },
  };
}
