import { type PlatformKodu } from "@/oda/platform";
import { type SistemKisi, type SistemOlayi } from "@/parti/sistemMesaji";

export type PartiSohbetOgesi =
  | { tur: "sistem"; anahtar: string; kisi: SistemKisi; olay: SistemOlayi; benim?: boolean }
  | { tur: "davet"; anahtar: string; adres: string }
  | { tur: "karsilama"; anahtar: string; sahip: string }
  | { tur: "simdi"; anahtar: string; baslik: string; platform?: PlatformKodu }
  | {
      tur: "mesaj";
      anahtar: string;
      kisi: string;
      metin: string;
      benim?: boolean;
      tac?: boolean;
      ozelIdTip?: "premium" | "kapsul" | null;
      ozelIdTema?: string | null;
    };
