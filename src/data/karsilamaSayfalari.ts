export type KarsilamaParagrafi = { metin: string; vurgu?: boolean };

export type KarsilamaSayfasi = {
  anahtar: string;
  baslik: string;
  altYazi?: string;
  paragraflar: KarsilamaParagrafi[];
};

export const KARSILAMA_SAYFALARI: KarsilamaSayfasi[] = [
  {
    anahtar: "tesekkur",
    baslik: "TEŞEKKÜR EDERİM",
    altYazi: "Aynı yere bakmak için aynı yerde olmak gerekmiyor.",
    paragraflar: [
      { metin: "Bu uygulamayı uzak mesafe ilişkisi yaşayan insanlar için yaptım. Sevgililer, aileler, arkadaşlar… Aynı odada olamayan herkes için." },
      { metin: "Sevgilimle ben aynı şehirde değiliz. Görüntülü konuşurken bile bir şey hep eksik kalıyordu: aynı anda aynı şeyi izlemek. “Şimdi durdur”, “üç deyince başlıyoruz” derken birlikte film izlemek bile küçük bir koordinasyona dönüşüyordu." },
      { metin: "Sonra düşündüm: Neden gerçekten aynı odadaymışız gibi olmasın?" },
      { metin: "Aron böyle ortaya çıktı." },
      { metin: "Aron bir film uygulaması değil. Aranızdaki mesafeyi birkaç saatliğine kapatan bir oda." },
      { metin: "Eğer Aron sayesinde bir gün olsun sevdiklerinizle aranızdaki uzaklığı unuttuysanız, benim için amacı gerçekleşmiş demektir.", vurgu: true },
    ],
  },
];
