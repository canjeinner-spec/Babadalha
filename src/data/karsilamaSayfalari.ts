import { type ImageSourcePropType } from "react-native";

import { type IconName } from "@/icons/paths";

export type KarsilamaYazisi = { tr: string; en: string };

export type KarsilamaParagrafi = { metin: string; vurgu?: boolean; selam?: boolean };

export type KarsilamaAdimi = { simge: IconName; baslik: string; metin: string };

export type KarsilamaSayfasi = {
  anahtar: string;
  baslik: string;
  altYazi?: string;
  gorsel?: ImageSourcePropType;
  atlanamaz?: boolean;
  yazarak?: boolean;
  paragraflar: KarsilamaParagrafi[];
  adimlar: KarsilamaAdimi[];
};

type HamParagraf = { metin: KarsilamaYazisi; vurgu?: boolean; selam?: boolean };

type HamAdim = { simge: IconName; baslik: KarsilamaYazisi; metin: KarsilamaYazisi };

type HamSayfa = {
  anahtar: string;
  baslik: KarsilamaYazisi;
  altYazi?: KarsilamaYazisi;
  gorsel?: ImageSourcePropType;
  atlanamaz?: boolean;
  yazarak?: boolean;
  paragraflar?: HamParagraf[];
  adimlar?: HamAdim[];
};

const HAM_SAYFALAR: HamSayfa[] = [
  {
    anahtar: "tesekkur",
    baslik: { tr: "TEŞEKKÜR EDERİM", en: "THANK YOU" },
    altYazi: {
      tr: "Aynı yere bakmak için aynı yerde olmak gerekmiyor.",
      en: "You don't have to be in the same place to look at the same thing.",
    },
    gorsel: require("@/assets/karsilama/kediler.webp"),
    atlanamaz: true,
    yazarak: true,
    paragraflar: [
      {
        metin: {
          tr: "Aron'u ilk kez açtığını görüyorum. O yüzden birkaç satır yazacağım.",
          en: "I can see this is your first time opening Aron. So let me write you a few lines.",
        },
      },
      {
        metin: {
          tr: "Bu uygulamayı uzak mesafe ilişkisi yaşayan insanlar için yaptım. Sevgililer, aileler, arkadaşlar… Aynı odada olamayan herkes için.",
          en: "I built this app for people in long-distance relationships. Couples, families, friends… everyone who can't be in the same room.",
        },
      },
      {
        metin: {
          tr: "Sevgilimle ben aynı şehirde değiliz. Sesini duyuyorum, yüzünü görüyorum; yine de yanımda değil. Bir film açalım diyorduk, iki ayrı ekranda iki ayrı saniyede başlıyordu. “Şimdi durdur”, “üç deyince başlıyoruz”… Benim güldüğüm sahneye o daha gelmemiş oluyordu, o ağladığında ben çoktan geçmiş oluyordum. Aynı filmi izliyorduk ama aynı anı yaşamıyorduk.",
          en: "My partner and I don't live in the same city. I hear their voice, I see their face; still, they are not next to me. We'd say let's put a film on, and it would start on two screens on two different seconds. “Pause now”, “we start on three”… They hadn't reached the scene I was laughing at, and when they cried I was long past it. We were watching the same film, but we were not living the same moment.",
        },
      },
      {
        metin: {
          tr: "Sonra düşündüm: Neden gerçekten aynı odadaymışız gibi olmasın?",
          en: "Then I thought: why can't it really feel like being in the same room?",
        },
      },
      { metin: { tr: "Aron böyle ortaya çıktı.", en: "That's how Aron came about." } },
      {
        metin: {
          tr: "Aron bir film uygulaması değil. Aranızdaki mesafeyi birkaç saatliğine kapatan bir oda.",
          en: "Aron is not a film app. It is a room that closes the distance between you for a few hours.",
        },
      },
      {
        metin: {
          tr: "Eğer Aron sayesinde bir gün olsun sevdiklerinizle aranızdaki uzaklığı unuttuysanız, benim için amacı gerçekleşmiş demektir.",
          en: "If Aron makes you forget the distance to the people you love for even one day, then for me it has done its job.",
        },
        vurgu: true,
      },
      { metin: { tr: "Aron'a hoş geldin.", en: "Welcome to Aron." }, selam: true },
    ],
  },
  {
    anahtar: "adimlar",
    baslik: { tr: "NASIL ÇALIŞIYOR?", en: "HOW IT WORKS" },
    altYazi: { tr: "Dört adım, tek oda.", en: "Four steps, one room." },
    adimlar: [
      {
        simge: "evParty",
        baslik: { tr: "Odanı aç", en: "Open your room" },
        metin: {
          tr: "Netflix, Prime, YouTube… Hangisinde izleyeceksen seç, oda saniyesinde kurulsun.",
          en: "Netflix, Prime, YouTube… pick where you'll watch and your room is up in a second.",
        },
      },
      {
        simge: "userAdd",
        baslik: { tr: "Sevdiklerini çağır", en: "Invite the people you love" },
        metin: {
          tr: "Davet bağlantını gönder. Tek dokunuşla içeri girerler, hesap kurmakla uğraşmazlar.",
          en: "Send your invite link. They walk in with one tap, no account setup to wrestle with.",
        },
      },
      {
        simge: "bolt",
        baslik: { tr: "Aynı saniyede izleyin", en: "Watch on the same second" },
        metin: {
          tr: "Kim durdurursa herkeste durur, kim sararsa herkeste sarar. “Üç deyince başlıyoruz” bitti.",
          en: "Whoever pauses, pauses it for everyone; whoever seeks, seeks for everyone. No more “we start on three”.",
        },
      },
      {
        simge: "mic",
        baslik: { tr: "Sesini aç", en: "Turn your voice on" },
        metin: {
          tr: "Mikrofonu aç, sohbete yaz, birlikte gül. Film biter, muhabbet devam eder.",
          en: "Turn on the mic, type in the chat, laugh together. The film ends, the conversation carries on.",
        },
      },
    ],
  },
];

function yaziSec(yazi: KarsilamaYazisi, dilKodu: string): string {
  return dilKodu.split("-")[0] === "tr" ? yazi.tr : yazi.en;
}

export function karsilamaSayfalari(dilKodu: string): KarsilamaSayfasi[] {
  return HAM_SAYFALAR.map((s) => ({
    anahtar: s.anahtar,
    baslik: yaziSec(s.baslik, dilKodu),
    altYazi: s.altYazi ? yaziSec(s.altYazi, dilKodu) : undefined,
    gorsel: s.gorsel,
    atlanamaz: s.atlanamaz,
    yazarak: s.yazarak,
    paragraflar: (s.paragraflar ?? []).map((p) => ({
      metin: yaziSec(p.metin, dilKodu),
      vurgu: p.vurgu,
      selam: p.selam,
    })),
    adimlar: (s.adimlar ?? []).map((a) => ({
      simge: a.simge,
      baslik: yaziSec(a.baslik, dilKodu),
      metin: yaziSec(a.metin, dilKodu),
    })),
  }));
}

export const KARSILAMA_SAYFA_SAYISI = HAM_SAYFALAR.length;
