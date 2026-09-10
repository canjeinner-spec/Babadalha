import { type ImageSourcePropType } from "react-native";

export type KarsilamaParagrafi = { metin: string; vurgu?: boolean };

export type KarsilamaSayfasi = {
  anahtar: string;
  baslik: string;
  altYazi?: string;
  gorsel?: ImageSourcePropType;
  paragraflar: KarsilamaParagrafi[];
};

export const KARSILAMA_SAYFALARI: KarsilamaSayfasi[] = [
  {
    anahtar: "tesekkur",
    baslik: "TEŞEKKÜR EDERİM",
    altYazi: "Aynı yere bakmak için aynı yerde olmak gerekmiyor.",
    gorsel: require("@/assets/karsilama/kediler.webp"),
    paragraflar: [
      { metin: "Bu uygulamayı uzak mesafe ilişkisi yaşayan insanlar için yaptım. Sevgililer, aileler, arkadaşlar… Aynı odada olamayan herkes için." },
      { metin: "Sevgilimle ben aynı şehirde değiliz. Sesini duyuyorum, yüzünü görüyorum; yine de yanımda değil. Bir film açalım diyorduk, iki ayrı ekranda iki ayrı saniyede başlıyordu. “Şimdi durdur”, “üç deyince başlıyoruz”… Benim güldüğüm sahneye o daha gelmemiş oluyordu, o ağladığında ben çoktan geçmiş oluyordum. Aynı filmi izliyorduk ama aynı anı yaşamıyorduk." },
      { metin: "Sonra düşündüm: Neden gerçekten aynı odadaymışız gibi olmasın?" },
      { metin: "Aron böyle ortaya çıktı." },
      { metin: "Aron bir film uygulaması değil. Aranızdaki mesafeyi birkaç saatliğine kapatan bir oda." },
      { metin: "Eğer Aron sayesinde bir gün olsun sevdiklerinizle aranızdaki uzaklığı unuttuysanız, benim için amacı gerçekleşmiş demektir.", vurgu: true },
    ],
  },
  {
    anahtar: "aron-nedir",
    baslik: "ARON NEDİR?",
    altYazi: "Film bahane.",
    paragraflar: [
      { metin: "Aron’u bir film uygulaması sanıp açanlar oluyor. Yarısı doğru." },
      { metin: "Aron bir oda. İçeri girersin, bir şey açarsın ve odadaki herkes aynı sahneyi aynı saniyede görür. Kimse “sen neredesin”, “ben ileri sardım” demez." },
      { metin: "Ama iş orada bitmiyor. Mikrofonu açıp konuşursun, sohbete yazarsın, aynı yerde birlikte gülersin. Film biter, muhabbet devam eder." },
      { metin: "Kendi odanı açıp sevdiklerini çağırabilirsin. Ya da açık odalara göz atıp hiç tanımadığın birinin odasına girebilirsin. Zaten çoğu arkadaşlık da öyle başlıyor: aynı şeyi seven iki kişi." },
      { metin: "Aron hem birlikte izlemek hem de tanışmak için var. Asıl olan aynı odada olmak.", vurgu: true },
    ],
  },
  {
    anahtar: "premium",
    baslik: "ARON PREMIUM",
    altYazi: "İsteğe bağlı. Gerçekten.",
    paragraflar: [
      { metin: "Önce şunu söyleyeyim: Aron’un tamamı ücretsiz. Oda açmak, odaya katılmak, birlikte izlemek, mikrofon, sohbet… Hiçbiri paranın arkasında değil ve olmayacak." },
      { metin: "Ama Aron kendi kendine ayakta durmuyor. Sunucular var, ses altyapısı var, her ay ödenen faturalar var. Şu an bunları ben karşılıyorum." },
      { metin: "Premium tam olarak bunun için. Karşılığında reklamlar kalkar, adın kendi seçtiğin renkte görünür, mikrofonu sınırsız kullanırsın." },
      { metin: "Ama asıl aldığın şey bunlar değil. Asıl aldığın şey, Aron’un yarın da açık olması." },
      { metin: "Abone olmak zorunda değilsin. Olmazsan da hiçbir şey değişmez; kapı herkese aynı şekilde açık.", vurgu: true },
    ],
  },
];
