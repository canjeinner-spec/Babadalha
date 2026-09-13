export type BelgeYazisi = { tr: string; en: string };

export type BelgeBolumu = { baslik: BelgeYazisi; maddeler: BelgeYazisi[] };

export type Belge = {
  anahtar: BelgeAnahtari;
  baslik: BelgeYazisi;
  ozet: BelgeYazisi;
  bolumler: BelgeBolumu[];
};

export type BelgeAnahtari = "kosullar" | "gizlilik";

export const BELGE_TARIHI = "2026-09-13";

export const ARON_ILETISIM = "";

const KOSULLAR: Belge = {
  anahtar: "kosullar",
  baslik: { tr: "Kullanım Koşulları", en: "Terms of Use" },
  ozet: {
    tr: "Aron'u kullanarak bu koşulları kabul etmiş olursun.",
    en: "By using Aron you accept these terms.",
  },
  bolumler: [
    {
      baslik: { tr: "1. Bu sözleşme", en: "1. This agreement" },
      maddeler: [
        {
          tr: "Aron, uzaktaki insanların aynı içeriği aynı anda izleyip sesli ve yazılı sohbet ettiği bir izleme partisi uygulamasıdır. Uygulamayı indirip kullandığında bu koşulları kabul etmiş olursun.",
          en: "Aron is a watch-party app where people who are apart watch the same content at the same time and talk by voice and text. By downloading and using the app you accept these terms.",
        },
        {
          tr: "Koşulları kabul etmiyorsan uygulamayı kullanma ve cihazından kaldır.",
          en: "If you do not accept these terms, do not use the app and remove it from your device.",
        },
      ],
    },
    {
      baslik: { tr: "2. Yaş", en: "2. Age" },
      maddeler: [
        {
          tr: "Aron 13 yaşından küçükler için değildir. 13-18 yaş arasındaysan uygulamayı veli ya da vasinin bilgisi ve izniyle kullanabilirsin.",
          en: "Aron is not for anyone under 13. If you are between 13 and 18 you may use the app only with the knowledge and consent of a parent or guardian.",
        },
        {
          tr: "Odalar tanımadığın kişilere açık olabilir ve sohbet canlıdır. Yaşını doğru bildirmen gerekir.",
          en: "Rooms can be open to people you do not know and the chat is live. You must state your age truthfully.",
        },
      ],
    },
    {
      baslik: { tr: "3. Hesabın", en: "3. Your account" },
      maddeler: [
        {
          tr: "Apple ya da Google ile giriş yapabilir veya misafir olarak gezebilirsin. Misafirken partilerin ve istatistiklerin cihazına bağlıdır; giriş yaparsan hesabınla taşınır.",
          en: "You can sign in with Apple or Google, or browse as a guest. As a guest your parties and stats are tied to your device; signing in moves them to your account.",
        },
        {
          tr: "Kullanıcı adın benzersizdir ve odalarda seni temsil eder. Hesabının güvenliğinden ve hesabından yapılan her şeyden sen sorumlusun.",
          en: "Your username is unique and represents you in rooms. You are responsible for the security of your account and for everything done from it.",
        },
        {
          tr: "Başkasının kimliğine bürünemez, başka birinin hesabını kullanamazsın.",
          en: "You may not impersonate anyone or use another person's account.",
        },
      ],
    },
    {
      baslik: { tr: "4. İçerik kuralları: sıfır tolerans", en: "4. Content rules: zero tolerance" },
      maddeler: [
        {
          tr: "Aron sakıncalı içeriğe ve taciz eden kullanıcılara sıfır tolerans uygular. Sohbete yazdığın, mikrofonla söylediğin ve odanda açtığın her şey senin sorumluluğundadır.",
          en: "Aron has zero tolerance for objectionable content and abusive users. Everything you type in chat, say on the mic and play in your room is your responsibility.",
        },
        {
          tr: "Yasak olanlar: taciz, zorbalık, tehdit; nefret söylemi ve ırk, etnik köken, din, cinsiyet, cinsel yönelim, engellilik temelli aşağılama; cinsel içerik ve müstehcenlik; çocukları cinselleştiren ya da tehlikeye atan her türlü içerik; şiddet ve kendine zarar vermeye teşvik; yasa dışı faaliyet; kişisel bilgi ifşası; spam, dolandırıcılık ve kimlik taklidi; hakkın olmayan içeriği yayınlamak.",
          en: "Not allowed: harassment, bullying, threats; hate speech and degradation based on race, ethnicity, religion, sex, sexual orientation or disability; sexual and obscene content; any content that sexualises or endangers children; violence and encouragement of self-harm; illegal activity; disclosure of personal information; spam, fraud and impersonation; publishing content you have no right to.",
        },
      ],
    },
    {
      baslik: { tr: "5. Bildirme, engelleme, kaldırma", en: "5. Reporting, blocking, removal" },
      maddeler: [
        {
          tr: "Her mesajı ve her kullanıcıyı bildirebilirsin. Oda sahibi ve yardımcıları rahatsız eden kişiyi odadan çıkarabilir, sohbetini kapatabilir ve odaya tekrar girmesini engelleyebilir.",
          en: "You can report any message and any user. The room host and moderators can remove someone who bothers others, mute their chat and block them from re-entering the room.",
        },
        {
          tr: "Bize ulaşan bildirimleri 24 saat içinde inceleriz. Kuralları çiğneyen içeriği kaldırır, çiğneyen kullanıcıyı uygulamadan çıkarırız.",
          en: "We review reports that reach us within 24 hours. We remove content that breaks the rules and eject the user who posted it.",
        },
        {
          tr: "Yaptırımlar kademeli değildir; ağırlığına göre doğrudan kalıcı kapatmaya kadar gidebilir. Çocuk istismarı içeriğinde hesap anında kapatılır ve yetkili makamlara bildirilir.",
          en: "Enforcement is not necessarily graduated; depending on severity it can go straight to permanent closure. For child abuse content the account is closed immediately and reported to the authorities.",
        },
      ],
    },
    {
      baslik: { tr: "6. İzlediğin platformlar", en: "6. The platforms you watch" },
      maddeler: [
        {
          tr: "Aron film, dizi ya da video sunmaz, barındırmaz ve dağıtmaz. Netflix, Prime Video, YouTube ve diğerlerini kendi hesabınla, kendi aboneliğinle açarsın.",
          en: "Aron does not provide, host or distribute any films, series or videos. You open Netflix, Prime Video, YouTube and the others with your own account and your own subscription.",
        },
        {
          tr: "O platformların kendi kullanım koşulları geçerlidir ve onlara uymak senin sorumluluğundadır. Bir platformun koşulları izleme partisine izin vermiyorsa orada parti kurmamalısın.",
          en: "Those platforms' own terms apply and complying with them is your responsibility. If a platform's terms do not allow watch parties, you should not host a party there.",
        },
      ],
    },
    {
      baslik: { tr: "7. Premium ve ödemeler", en: "7. Premium and payments" },
      maddeler: [
        {
          tr: "Aron'un temel kullanımı ücretsizdir. Premium isteğe bağlıdır; reklamları kaldırır, ad rengi ve mikrofon ayrıcalıkları verir.",
          en: "Core use of Aron is free. Premium is optional; it removes ads and gives name colour and microphone benefits.",
        },
        {
          tr: "Ödeme App Store ya da Google Play üzerinden alınır. Abonelik, iptal etmediğin sürece dönem sonunda kendini yeniler. İptal ve iade işlemleri mağazanın kendi kuralları ve arayüzü üzerinden yürür.",
          en: "Payment is taken through the App Store or Google Play. Unless you cancel, the subscription renews at the end of each period. Cancellations and refunds are handled by the store's own rules and interface.",
        },
      ],
    },
    {
      baslik: { tr: "8. Fikri mülkiyet", en: "8. Intellectual property" },
      maddeler: [
        {
          tr: "Aron adı, logosu, arayüzü ve kodu bize aittir. Uygulamayı kopyalayamaz, tersine mühendislik yapamaz, üzerinden türev ürün satamazsın.",
          en: "The Aron name, logo, interface and code belong to us. You may not copy the app, reverse engineer it, or sell derivative products based on it.",
        },
        {
          tr: "Sohbette ve odanda paylaştığın içerik senindir. Bu içeriği uygulamanın çalışması için gereken ölçüde göstermemize izin vermiş olursun.",
          en: "The content you share in chat and in your room is yours. You grant us permission to display it to the extent needed for the app to work.",
        },
      ],
    },
    {
      baslik: { tr: "9. Garanti ve sorumluluk", en: "9. Warranty and liability" },
      maddeler: [
        {
          tr: "Aron olduğu gibi sunulur. Kesintisiz çalışacağını, her platformun her zaman açılacağını ya da eşzamanlamanın her ağda kusursuz olacağını garanti etmiyoruz.",
          en: "Aron is provided as is. We do not guarantee uninterrupted operation, that every platform will always open, or that sync will be flawless on every network.",
        },
        {
          tr: "Diğer kullanıcıların davranışlarından ve paylaştıklarından sorumlu değiliz; bildirilenlere karşı yukarıdaki yaptırımları uygularız.",
          en: "We are not responsible for other users' behaviour or what they share; we apply the enforcement above to what is reported to us.",
        },
      ],
    },
    {
      baslik: { tr: "10. Fesih", en: "10. Termination" },
      maddeler: [
        {
          tr: "Hesabını istediğin an kapatabilirsin. Bu koşulları çiğnersen hesabını askıya alabilir ya da kapatabiliriz.",
          en: "You can close your account at any time. If you break these terms we may suspend or close your account.",
        },
      ],
    },
    {
      baslik: { tr: "11. Değişiklikler ve iletişim", en: "11. Changes and contact" },
      maddeler: [
        {
          tr: "Koşullar değiştiğinde uygulamada duyururuz. Soruların ve bildirimlerin için aşağıdaki adresten bize ulaşabilirsin.",
          en: "When these terms change we announce it in the app. For questions and reports you can reach us at the address below.",
        },
      ],
    },
  ],
};

const GIZLILIK: Belge = {
  anahtar: "gizlilik",
  baslik: { tr: "Gizlilik Politikası", en: "Privacy Policy" },
  ozet: {
    tr: "Hangi veriyi neden tuttuğumuz, neyi hiç toplamadığımız.",
    en: "What data we keep and why, and what we never collect.",
  },
  bolumler: [
    {
      baslik: { tr: "1. Topladığımız veriler", en: "1. Data we collect" },
      maddeler: [
        {
          tr: "Hesap: kullanıcı adın, Apple ya da Google'dan gelen e-posta adresin, profil resmin ve doldurursan biyografin, cinsiyetin, ülken, şehrin ve doğum tarihin.",
          en: "Account: your username, the email address from Apple or Google, your profile picture and, if you fill them in, your bio, gender, country, city and date of birth.",
        },
        {
          tr: "Kullanım: seviyen, deneyim puanın, rozetlerin, hangi odalara girdiğin, odalarda geçirdiğin süre ve oda içi yönetim kayıtları (atma, yasaklama, rol verme).",
          en: "Usage: your level, experience points, badges, which rooms you entered, time spent in rooms, and in-room moderation records (removals, bans, role changes).",
        },
        {
          tr: "Sohbet: odalarda yazdığın mesajlar sunucuda saklanır; bildirim geldiğinde incelenebilmesi için gereklidir.",
          en: "Chat: the messages you write in rooms are stored on the server; this is necessary so they can be reviewed when reported.",
        },
        {
          tr: "Cihazda: seçtiğin dil ve hangi tanıtım ekranlarını gördüğün. Bunlar cihazından çıkmaz.",
          en: "On your device: your chosen language and which intro screens you have seen. These never leave your device.",
        },
      ],
    },
    {
      baslik: { tr: "2. Toplamadığımız veriler", en: "2. Data we do not collect" },
      maddeler: [
        {
          tr: "Sesini kaydetmiyoruz. Sesli sohbet canlı akar, partidekilere iletilir ve biter; sunucuda bir kaydı kalmaz.",
          en: "We do not record your voice. Voice chat streams live, reaches the people in the party, and ends; no recording is kept on the server.",
        },
        {
          tr: "Netflix, Prime Video ve diğer platformlardaki oturum bilgilerin cihazında kalır. Uygulama bunları yalnız o platformun kendi sunucusuyla konuşmak için, cihazın üstünde kullanır; bize gönderilmez ve bizde saklanmaz.",
          en: "Your session details for Netflix, Prime Video and the other platforms stay on your device. The app uses them on the device only to talk to that platform's own servers; they are never sent to us or stored by us.",
        },
        {
          tr: "Hangi filmi ya da diziyi izlediğin bize gitmez. Odanın hangi platformda olduğunu biliriz, ne izlediğini bilmeyiz.",
          en: "Which film or series you watch does not reach us. We know which platform a room is on; we do not know what you are watching.",
        },
        {
          tr: "Uygulamada reklam ağı, analitik ya da izleme yazılımı yok. Seni uygulamalar arasında takip etmiyoruz, veri satmıyoruz.",
          en: "There is no ad network, analytics or tracking software in the app. We do not track you across apps and we do not sell data.",
        },
      ],
    },
    {
      baslik: { tr: "3. Neden tutuyoruz", en: "3. Why we keep it" },
      maddeler: [
        {
          tr: "Hesabını tanımak, odaları kurup birleştirmek, eşzamanlı oynatmayı sürdürmek, istatistiklerini göstermek, kuralları uygulamak ve bildirilen içeriği incelemek için.",
          en: "To recognise your account, to create and join rooms, to keep playback in sync, to show your stats, to enforce the rules and to review reported content.",
        },
      ],
    },
    {
      baslik: { tr: "4. Kimlerle paylaşılıyor", en: "4. Who it is shared with" },
      maddeler: [
        {
          tr: "Supabase: hesabın, odaların ve mesajların bu altyapıda saklanır.",
          en: "Supabase: your account, rooms and messages are stored on this infrastructure.",
        },
        {
          tr: "Agora: sesli sohbetin gerçek zamanlı iletimi. Ses buradan da kayıtsız geçer.",
          en: "Agora: real-time delivery of voice chat. Voice passes through without being recorded here either.",
        },
        {
          tr: "Apple ve Google: girişi doğrulamak ve Premium ödemesini almak için.",
          en: "Apple and Google: to verify sign-in and to take Premium payments.",
        },
        {
          tr: "İzlediğin platformlar: onlarla doğrudan senin cihazın konuşur, arada biz durmayız.",
          en: "The platforms you watch: your device talks to them directly; we do not sit in between.",
        },
        {
          tr: "Bunların dışında kimseyle paylaşmayız. Yasal bir zorunluluk doğarsa yalnız zorunlu olan kadarını veririz.",
          en: "We share with no one else. If a legal obligation arises we provide only what is required.",
        },
      ],
    },
    {
      baslik: { tr: "5. Ne kadar saklıyoruz", en: "5. How long we keep it" },
      maddeler: [
        {
          tr: "Hesap verilerini hesabın açık olduğu sürece tutarız. Hesabını kapattığında profilin ve istatistiklerin silinir.",
          en: "We keep account data for as long as your account is open. When you close your account your profile and stats are deleted.",
        },
        {
          tr: "Oda mesajları ve yönetim kayıtları, bildirimlerin incelenebilmesi için sınırlı bir süre saklanır, sonra silinir.",
          en: "Room messages and moderation records are kept for a limited period so reports can be reviewed, then deleted.",
        },
      ],
    },
    {
      baslik: { tr: "6. Hakların", en: "6. Your rights" },
      maddeler: [
        {
          tr: "Verilerine erişmeyi, düzeltilmesini, silinmesini ya da bir kopyasının verilmesini isteyebilirsin. Hesabını uygulamadan kapatabilirsin.",
          en: "You can ask to access your data, have it corrected or deleted, or receive a copy of it. You can close your account from within the app.",
        },
        {
          tr: "Bu talepler için aşağıdaki adresten bize yaz; en geç 30 gün içinde döneriz.",
          en: "Write to us at the address below for these requests; we respond within 30 days at the latest.",
        },
      ],
    },
    {
      baslik: { tr: "7. Çocuklar", en: "7. Children" },
      maddeler: [
        {
          tr: "Aron 13 yaşından küçüklere yönelik değildir ve bilerek onlardan veri toplamayız. Böyle bir hesap fark edersek kapatır, verisini sileriz.",
          en: "Aron is not directed at anyone under 13 and we do not knowingly collect data from them. If we notice such an account we close it and delete its data.",
        },
      ],
    },
    {
      baslik: { tr: "8. Değişiklikler ve iletişim", en: "8. Changes and contact" },
      maddeler: [
        {
          tr: "Bu politika değiştiğinde uygulamada duyururuz. Sorularını aşağıdaki adrese yazabilirsin.",
          en: "When this policy changes we announce it in the app. You can send your questions to the address below.",
        },
      ],
    },
  ],
};

export const BELGELER: Record<BelgeAnahtari, Belge> = {
  kosullar: KOSULLAR,
  gizlilik: GIZLILIK,
};

export function belgeYazisi(yazi: BelgeYazisi, dilKodu: string): string {
  return dilKodu.split("-")[0] === "tr" ? yazi.tr : yazi.en;
}
