import { type ImageSourcePropType } from "react-native";

export type KarsilamaYazisi = { tr: string; en: string };

export type KarsilamaParagrafi = { metin: string; vurgu?: boolean; selam?: boolean };

export type KarsilamaSayfasi = {
  anahtar: string;
  baslik: string;
  altYazi?: string;
  gorsel?: ImageSourcePropType;
  atlanamaz?: boolean;
  yazarak?: boolean;
  paragraflar: KarsilamaParagrafi[];
};

type HamParagraf = { metin: KarsilamaYazisi; vurgu?: boolean; selam?: boolean };

type HamSayfa = {
  anahtar: string;
  baslik: KarsilamaYazisi;
  altYazi?: KarsilamaYazisi;
  gorsel?: ImageSourcePropType;
  atlanamaz?: boolean;
  yazarak?: boolean;
  paragraflar: HamParagraf[];
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
    anahtar: "aron-nedir",
    baslik: { tr: "ARON NEDİR?", en: "WHAT IS ARON?" },
    altYazi: { tr: "Film bahane.", en: "The film is just an excuse." },
    paragraflar: [
      {
        metin: {
          tr: "Aron’u bir film uygulaması sanıp açanlar oluyor. Yarısı doğru.",
          en: "Some people open Aron thinking it is a film app. Half of that is true.",
        },
      },
      {
        metin: {
          tr: "Aron bir oda. İçeri girersin, bir şey açarsın ve odadaki herkes aynı sahneyi aynı saniyede görür. Kimse “sen neredesin”, “ben ileri sardım” demez.",
          en: "Aron is a room. You step in, you put something on, and everyone in the room sees the same scene on the same second. Nobody asks “where are you”, “I skipped ahead”.",
        },
      },
      {
        metin: {
          tr: "Ama iş orada bitmiyor. Mikrofonu açıp konuşursun, sohbete yazarsın, aynı yerde birlikte gülersin. Film biter, muhabbet devam eder.",
          en: "But it doesn't end there. You turn on the mic and talk, you type in the chat, you laugh together in the same place. The film ends, the conversation carries on.",
        },
      },
      {
        metin: {
          tr: "Kendi odanı açıp sevdiklerini çağırabilirsin. Ya da açık odalara göz atıp hiç tanımadığın birinin odasına girebilirsin. Zaten çoğu arkadaşlık da öyle başlıyor: aynı şeyi seven iki kişi.",
          en: "You can open your own room and invite the people you love. Or you can browse the open rooms and walk into a stranger's room. Most friendships start that way anyway: two people who love the same thing.",
        },
      },
      {
        metin: {
          tr: "Aron hem birlikte izlemek hem de tanışmak için var. Asıl olan aynı odada olmak.",
          en: "Aron is there both for watching together and for meeting people. What matters is being in the same room.",
        },
        vurgu: true,
      },
    ],
  },
  {
    anahtar: "premium",
    baslik: { tr: "ARON PREMIUM", en: "ARON PREMIUM" },
    altYazi: { tr: "İsteğe bağlı. Gerçekten.", en: "Optional. Really." },
    paragraflar: [
      {
        metin: {
          tr: "Önce şunu söyleyeyim: Aron’un tamamı ücretsiz. Oda açmak, odaya katılmak, birlikte izlemek, mikrofon, sohbet… Hiçbiri paranın arkasında değil ve olmayacak.",
          en: "First things first: all of Aron is free. Opening a room, joining a room, watching together, the mic, the chat… none of it is behind a paywall, and none of it will be.",
        },
      },
      {
        metin: {
          tr: "Ama Aron kendi kendine ayakta durmuyor. Sunucular var, ses altyapısı var, her ay ödenen faturalar var. Şu an bunları ben karşılıyorum.",
          en: "But Aron doesn't keep itself standing. There are servers, there is voice infrastructure, there are bills paid every month. Right now I cover them myself.",
        },
      },
      {
        metin: {
          tr: "Premium tam olarak bunun için. Karşılığında reklamlar kalkar, adın kendi seçtiğin renkte görünür, mikrofonu sınırsız kullanırsın.",
          en: "Premium exists exactly for that. In return the ads go away, your name shows in a colour you pick, and you use the mic without limits.",
        },
      },
      {
        metin: {
          tr: "Ama asıl aldığın şey bunlar değil. Asıl aldığın şey, Aron’un yarın da açık olması.",
          en: "But those are not what you are really buying. What you are really buying is Aron still being here tomorrow.",
        },
      },
      {
        metin: {
          tr: "Abone olmak zorunda değilsin. Olmazsan da hiçbir şey değişmez; kapı herkese aynı şekilde açık.",
          en: "You don't have to subscribe. Nothing changes if you don't; the door is open to everyone the same way.",
        },
        vurgu: true,
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
    paragraflar: s.paragraflar.map((p) => ({
      metin: yaziSec(p.metin, dilKodu),
      vurgu: p.vurgu,
      selam: p.selam,
    })),
  }));
}

export const KARSILAMA_SAYFA_SAYISI = HAM_SAYFALAR.length;
