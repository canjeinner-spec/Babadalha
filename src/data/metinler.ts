export type MetinAnahtari = keyof typeof METINLER;

export const METINLER = {
  "genel.vazgec": { tr: "Vazgeç", en: "Cancel" },
  "genel.devam": { tr: "Devam et", en: "Continue" },
  "genel.tamam": { tr: "Tamam", en: "OK" },
  "genel.kapat": { tr: "Kapat", en: "Close" },
  "genel.yukleniyor": { tr: "Yükleniyor…", en: "Loading…" },
  "genel.hata": { tr: "Bir şeyler ters gitti", en: "Something went wrong" },

  "ana.baslik": { tr: "Parti", en: "Party" },
  "ana.altBaslik": { tr: "Birlikte izle, birlikte konuş", en: "Watch together, talk together" },
  "ana.canliPartiler": { tr: "Canlı partiler", en: "Live parties" },
  "ana.partiYok": { tr: "Şu an açık parti yok", en: "No open parties right now" },
  "ana.partiBaslat": { tr: "Parti başlat", en: "Start a party" },

  "oda.canli": { tr: "Canlı", en: "Live" },
  "oda.yeniBasladi": { tr: "Yeni başladı", en: "Just started" },
  "oda.yarisinda": { tr: "Yarısında", en: "Halfway" },
  "oda.bitmekUzere": { tr: "Bitmek üzere", en: "Almost over" },
  "oda.kalanDk": { tr: "{0} dk kaldı", en: "{0} min left" },

  "platform.baslik": { tr: "Ne izleyeceğiz?", en: "What shall we watch?" },

  "dogrudan.baslik": { tr: "Doğrudan bağlantı", en: "Direct link" },
  "dogrudan.gec": { tr: "Bu bağlantıya geç", en: "Open this link" },
  "dogrudan.baslat": { tr: "Partiyi başlat", en: "Start the party" },

  "giris.baglaniyor": { tr: "Bağlanılıyor…", en: "Connecting…" },
  "giris.basarisiz": { tr: "Giriş tamamlanamadı, tekrar dene.", en: "Sign-in failed, please try again." },
  "giris.sunucuEksik": {
    tr: "Sunucu ayarları eksik, şimdilik misafir olarak devam edebilirsin.",
    en: "Server settings are missing, you can continue as a guest for now.",
  },
  "giris.yap": { tr: "Giriş yap", en: "Sign in" },

  "profil.cikisYap": { tr: "Çıkış yap", en: "Sign out" },
  "profil.cikiliyor": { tr: "Çıkılıyor…", en: "Signing out…" },
  "profil.cikisHatasi": {
    tr: "Çıkış yapılamadı. İnternetini kontrol edip tekrar dene.",
    en: "Could not sign out. Check your connection and try again.",
  },
  "profil.dogrulanmis": { tr: "Doğrulanmış", en: "Verified" },
  "profil.kayitTarihi": { tr: "Kayıt tarihi", en: "Member since" },
  "profil.oturumSayisi": { tr: "Oturum sayısı", en: "Sessions" },
  "profil.toplamSure": { tr: "Toplam geçirilen süre", en: "Total time spent" },
  "profil.farkliOda": { tr: "Farklı oda", en: "Rooms visited" },
} as const;

export function metinCevir(anahtar: string, dilKodu: string, degerler?: (string | number)[]): string {
  const kayit = (METINLER as Record<string, Record<string, string>>)[anahtar];
  if (!kayit) return anahtar;
  const kok = dilKodu.split("-")[0];
  const ham = kayit[dilKodu] ?? kayit[kok] ?? kayit.en ?? anahtar;
  if (!degerler?.length) return ham;
  return ham.replace(/\{(\d+)\}/g, (eslesme, i) => String(degerler[Number(i)] ?? eslesme));
}
