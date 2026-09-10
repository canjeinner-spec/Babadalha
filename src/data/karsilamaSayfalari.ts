export type KarsilamaSayfasi = {
  anahtar: string;
  baslik: string;
  altYazi?: string;
  paragraflar: string[];
};

export const KARSILAMA_SAYFALARI: KarsilamaSayfasi[] = [
  {
    anahtar: "tesekkur",
    baslik: "TEŞEKKÜR EDERİM",
    altYazi: "Aynı yere bakmak için aynı yerde olmak gerekmiyor.",
    paragraflar: [
      "Bu uygulamayı uzak mesafe ilişkisi yaşayan insanlar için yaptım. Sevgililer, aileler, arkadaşlar… Aynı odada olamayan herkes için.",
      "Sevgilimle ben aynı şehirde değiliz. Görüntülü konuşurken bile bir şey hep eksik kalıyordu: aynı anda aynı şeyi izlemek. “Şimdi durdur”, “üç deyince başlıyoruz” derken birlikte film izlemek bile küçük bir koordinasyona dönüşüyordu.",
      "Sonra düşündüm: Neden gerçekten aynı odadaymışız gibi olmasın?",
      "Aron böyle ortaya çıktı.",
      "Aron bir film uygulaması değil. Aranızdaki mesafeyi birkaç saatliğine kapatan bir oda.",
      "Eğer Aron sayesinde bir gün olsun sevdiklerinizle aranızdaki uzaklığı unuttuysanız, benim için amacı gerçekleşmiş demektir.",
    ],
  },
];
