import { type PlatformKodu } from "@/oda/platform";

export type PartiSohbetOgesi =
  | { tur: "katilim"; anahtar: string; kisi: string; ayrildi?: boolean; foto?: string; ozelIdTip?: "premium" | "kapsul" | null; ozelIdTema?: string | null }
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
