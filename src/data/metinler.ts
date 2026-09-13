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
  "giris.baslik1": { tr: "Arada ne kadar yol varsa,", en: "However far apart you are," },
  "giris.baslik2": { tr: "film aynı saniyede başlar", en: "the film starts on the same second" },
  "giris.altYazi": {
    tr: "Netflix, Disney+, Prime Video, YouTube ve daha fazlası.",
    en: "Netflix, Disney+, Prime Video, YouTube and more.",
  },
  "giris.apple": { tr: "Apple ile devam edin", en: "Continue with Apple" },
  "giris.google": { tr: "Google ile devam edin", en: "Continue with Google" },
  "giris.veya": { tr: "veya", en: "or" },
  "giris.misafir": { tr: "Misafir Olarak Devam Et", en: "Continue as Guest" },
  "giris.saglayiciKapali": {
    tr: "{0} girişi sunucuda açık değil.",
    en: "{0} sign-in is not enabled on the server.",
  },

  "profil.baslik": { tr: "Profilim", en: "My profile" },
  "profil.seviye": { tr: "Seviye", en: "Level" },
  "profil.hesap": { tr: "Hesap", en: "Account" },
  "profil.misafir": { tr: "Misafir", en: "Guest" },
  "profil.favoriPlatform": { tr: "Favori platform", en: "Favourite platform" },
  "profil.buHafta": { tr: "Bu hafta", en: "This week" },
  "profil.enUzunOturum": { tr: "En uzun oturum", en: "Longest session" },
  "profil.ortalamaOturum": { tr: "Ortalama oturum", en: "Average session" },
  "profil.enAktifSaat": { tr: "En aktif saat", en: "Most active hour" },
  "profil.sonOturum": { tr: "Son oturum", en: "Last session" },

  "odaEkran.baslik": { tr: "Parti", en: "Party" },
  "odaEkran.sohbet": { tr: "Sohbet", en: "Chat" },
  "odaEkran.sohbetKapali": { tr: "Sohbet kapalı", en: "Chat is off" },
  "odaEkran.video": { tr: "Video", en: "Video" },
  "odaEkran.odaSahibi": { tr: "Oda sahibi", en: "Room owner" },
  "odaEkran.davetKopyalandi": { tr: "Davet linki kopyalandı", en: "Invite link copied" },
  "odaEkran.mikAcildi": { tr: "Mikrofonun açıldı", en: "Your mic is on" },
  "odaEkran.mikKapatildi": { tr: "Mikrofonun kapatıldı", en: "Your mic is off" },
  "odaEkran.girisKapali": { tr: "Bu odaya girişin kapalı", en: "You cannot join this room" },
  "odaEkran.sahipDegisti": { tr: "Parti sahibi değişti", en: "The party host changed" },
  "odaEkran.sahiplikSana": { tr: "Parti sahipliği sana geçti", en: "You are the party host now" },
  "odaEkran.ayrilOnay": {
    tr: "Partiden ayrılmak istediğine emin misin?",
    en: "Are you sure you want to leave the party?",
  },
  "odaEkran.ayrilNot": {
    tr: "Sen çıkınca parti odadaki birine geçecek.",
    en: "When you leave, the party passes to someone else in the room.",
  },
  "odaEkran.rolHatasi": { tr: "Rol kaydedilemedi", en: "Could not save the role" },
  "odaEkran.yasakHatasi": { tr: "Yasaklama kaydedilemedi", en: "Could not save the ban" },

  "profil.partiModu": { tr: "PARTİ MODU", en: "PARTY MODE" },
  "profil.misafirNotu": {
    tr: "Misafir olarak geziyorsun. Giriş yaparsan partilerin, arkadaşların ve istatistiklerin cihaz değiştirsen de seninle kalır.",
    en: "You are browsing as a guest. Sign in and your parties, friends and stats stay with you even if you change devices.",
  },
  "profil.cikisOnayNotu": {
    tr: "Hesabından çıkacaksın. Partilerin ve istatistiklerin silinmiyor, tekrar giriş yaptığında yerinde duruyor.",
    en: "You will be signed out. Your parties and stats are not deleted; they are still there when you sign back in.",
  },
  "profil.kimlik": { tr: "ID {0}", en: "ID {0}" },
  "profil.bos": { tr: "—", en: "—" },

  "rol.sahip": { tr: "Parti Sahibi", en: "Party Host" },
  "rol.yardimci": { tr: "Parti Yardımcısı", en: "Party Moderator" },
  "rol.uye": { tr: "İzleyici", en: "Viewer" },

  "sistem.katildinBen": { tr: "Partiye katıldın", en: "You joined the party" },
  "sistem.katildi": { tr: "{0} partiye katıldı", en: "{0} joined the party" },
  "sistem.ayrildinBen": { tr: "Partiden ayrıldın", en: "You left the party" },
  "sistem.ayrildi": { tr: "{0} partiden ayrıldı", en: "{0} left the party" },
  "sistem.yardimciAlindiBen": {
    tr: "{0} yardımcılığını aldı",
    en: "{0} removed you as a moderator",
  },
  "sistem.yardimciAlindi": {
    tr: "{0}, {1} kullanıcısının yardımcılığını aldı",
    en: "{0} removed {1} as a moderator",
  },
  "sistem.rolVerildiBen": { tr: "{0} seni {1} yaptı", en: "{0} made you a {1}" },
  "sistem.rolVerildi": {
    tr: "{0}, {1} kullanıcısını {2} yaptı",
    en: "{0} made {1} a {2}",
  },
  "sistem.atildinBen": {
    tr: "{0} tarafından partiden atıldın",
    en: "You were removed from the party by the {0}",
  },
  "sistem.atildi": {
    tr: "{0}, {1} tarafından partiden atıldı",
    en: "{0} was removed from the party by the {1}",
  },

  "odaEkran.karsilamaSahipsiz": { tr: "Oda sahibi", en: "the room host" },
  "odaEkran.karsilama": {
    tr: "{0} izleme partisine hoş geldin! Film ve dizi izlerken herkesin keyfi yerinde olsun diye küfür, argo ve hakaretten uzak duralım. Sohbet et, eğlen, iyi seyirler!",
    en: "Welcome to {0} watch party! Let's keep the swearing, slang and insults out so everyone enjoys the film. Chat, have fun, enjoy the show!",
  },
  "odaEkran.davetLinki": { tr: "Davet linki: ", en: "Invite link: " },
  "odaEkran.simdiOynatiliyor": { tr: " oynatılıyor", en: " is playing" },
  "odaEkran.baglaniyor": { tr: "Partiye bağlanılıyor…", en: "Connecting to the party…" },
  "odaEkran.ayril": { tr: "Ayrıl", en: "Leave" },
  "odaEkran.ayrilBaslik": { tr: "Partiden ayrıl", en: "Leave the party" },
  "odaEkran.ayrilDevirAcik": {
    tr: "Sen çıkınca parti odadaki birine geçecek.",
    en: "When you leave, the party passes to someone else in the room.",
  },
  "odaEkran.ayrilDevirKapali": {
    tr: "Sahiplik devri kapalı; sen çıkınca parti kimseye geçmeyecek.",
    en: "Host transfer is off; when you leave, the party passes to no one.",
  },
  "odaEkran.atildinBaslik": { tr: "Partiden çıkarıldın", en: "You were removed from the party" },
  "odaEkran.atildinNot": {
    tr: "{0} seni bu partiden çıkardı. Bu partiye tekrar giremezsin.",
    en: "The {0} removed you from this party. You cannot join it again.",
  },
  "odaEkran.sahipOldu": { tr: "{0} parti sahibi oldu", en: "{0} is the party host now" },
  "odaEkran.mikIzinVerildi": { tr: "{0} mikrofonu açabilir", en: "{0} can turn the mic on" },
  "odaEkran.mikIzinAlindi": { tr: "{0} mikrofonu kapatıldı", en: "{0}'s mic was turned off" },
  "odaEkran.varsayilanBaslik": { tr: "Video", en: "Video" },
  "odaEkran.partiAdi": { tr: "Parti", en: "Party" },

  "karsilama.ileri": { tr: "İleri", en: "Next" },
  "karsilama.dokunarakGec": { tr: "dokunarak geç", en: "tap to skip" },

  "premium.baslik": { tr: "ARON PREMIUM", en: "ARON PREMIUM" },
  "premium.altYazi": { tr: "İsteğe bağlı. Gerçekten.", en: "Optional. Really." },
  "premium.giris": {
    tr: "Aron'un tamamı ücretsiz. Oda açmak, katılmak, birlikte izlemek, mikrofon, sohbet… Hiçbiri paranın arkasında değil.",
    en: "All of Aron is free. Opening a room, joining, watching together, the mic, the chat… none of it is behind a paywall.",
  },
  "premium.gerekce": {
    tr: "Premium'la aldığın asıl şey, Aron'un yarın da açık olması.",
    en: "What Premium really buys you is Aron still being here tomorrow.",
  },
  "premium.reklamsizBaslik": { tr: "Reklamsız", en: "No ads" },
  "premium.reklamsizMetin": {
    tr: "Oda listesinde ve izlerken reklam görmezsin.",
    en: "No ads in the room list or while you watch.",
  },
  "premium.renkliAdBaslik": { tr: "Renkli ad", en: "Coloured name" },
  "premium.renkliAdMetin": {
    tr: "Adın sohbette ve odada kendi seçtiğin renkte görünür.",
    en: "Your name shows in a colour you pick, in chat and in the room.",
  },
  "premium.mikrofonBaslik": { tr: "Sınırsız mikrofon", en: "Unlimited mic" },
  "premium.mikrofonMetin": {
    tr: "Sesli sohbette süre sınırı olmadan konuşursun.",
    en: "Talk in voice chat with no time limit.",
  },
  "premium.erkenBaslik": { tr: "Önce sen denersin", en: "You try it first" },
  "premium.erkenMetin": {
    tr: "Yeni platformlar ve özellikler önce Premium'da açılır.",
    en: "New platforms and features open on Premium first.",
  },
  "premium.aylik": { tr: "Aylık", en: "Monthly" },
  "premium.yillik": { tr: "Yıllık", en: "Yearly" },
  "premium.ayBasi": { tr: "ayda {0}", en: "{0} per month" },
  "premium.rozet": { tr: "2 AY BEDAVA", en: "2 MONTHS FREE" },
  "premium.basla": { tr: "Premium'u başlat", en: "Start Premium" },
  "premium.simdiDegil": { tr: "Şimdi değil", en: "Not now" },
  "premium.iptalNotu": {
    tr: "İstediğin an iptal edebilirsin. İptal edersen Aron aynı şekilde açık kalır.",
    en: "Cancel any time. If you cancel, Aron stays open to you just the same.",
  },
  "hazir.baslik": { tr: "Hazırsın", en: "You're all set" },
  "hazir.altYazi": {
    tr: "Odan bir dokunuş uzakta. Platformu seç, bağlantını paylaş, film aynı saniyede başlasın.",
    en: "Your room is one tap away. Pick a platform, share your link, and the film starts on the same second.",
  },
  "hazir.kur": { tr: "İlk partini kur", en: "Set up your first party" },
  "hazir.etrafaBak": { tr: "Önce etrafa bakayım", en: "Let me look around first" },

  "kurallar.baslik": { tr: "Aron'da birlikteyiz", en: "We're in this together on Aron" },
  "kurallar.metin": {
    tr: "Odalar herkese açık olabiliyor. Küfür, hakaret, taciz ve 18 yaş altına uygun olmayan içerik yasak. Rahatsız eden birini odadan çıkarabilir, bildirebilirsin.",
    en: "Rooms can be open to everyone. Swearing, insults, harassment and content unsuitable for under-18s are not allowed. You can remove someone who bothers you from the room, and report them.",
  },
  "kurallar.onay": { tr: "Anladım", en: "Got it" },

  "premium.yakinda": {
    tr: "Satın alma mağaza bağlantısı açıldığında etkinleşecek.",
    en: "Purchases will be enabled once the store connection is live.",
  },

  "oynatici.ayarlar": { tr: "Ayarlar", en: "Settings" },
  "oynatici.hiz": { tr: "Oynatma hızı", en: "Playback speed" },
  "oynatici.kalite": { tr: "Video kalitesi", en: "Video quality" },
  "oynatici.ses": { tr: "Ses", en: "Audio" },
  "oynatici.altyazi": { tr: "Altyazılar", en: "Subtitles" },
  "oynatici.ayrinti": { tr: "Video ayrıntıları", en: "Video details" },
  "oynatici.kapali": { tr: "Kapalı", en: "Off" },
  "oynatici.otomatik": { tr: "Otomatik", en: "Auto" },
  "oynatici.baslik": { tr: "Başlık", en: "Title" },
  "oynatici.kaynak": { tr: "Kaynak", en: "Source" },
  "oynatici.hizKisa": { tr: "Hız", en: "Speed" },
  "oynatici.cozunurluk": { tr: "Çözünürlük", en: "Resolution" },
  "oynatici.sesDili": { tr: "Ses dili", en: "Audio language" },
  "oynatici.sesDiliSayisi": { tr: "Ses dili sayısı", en: "Audio languages" },
  "oynatici.altyaziTek": { tr: "Altyazı", en: "Subtitle" },
  "oynatici.altyaziSayisi": { tr: "Altyazı sayısı", en: "Subtitles available" },
  "oynatici.secenekYok": { tr: "Bu içerik için seçenek yok.", en: "No options for this content." },
  "oynatici.yalnizAndroid": {
    tr: "Doğrudan bağlantı oynatıcısı yalnız Android geliştirme derlemesinde çalışıyor.",
    en: "The direct-link player only works on an Android development build.",
  },
  "oynatici.baglantiHatasi": { tr: "Bağlantı yüklenemedi.", en: "The link could not be loaded." },

  "panel.devirAcik": {
    tr: "Çıkarsan parti odadaki birine geçer",
    en: "If you leave, the party passes to someone in the room",
  },
  "panel.devirKapali": {
    tr: "Çıkarsan parti kimseye geçmez",
    en: "If you leave, the party passes to no one",
  },
  "panel.yardimciYap": { tr: "Parti Yardımcısı yap", en: "Make a Party Moderator" },
  "panel.yardimciAl": { tr: "Yardımcılığı al", en: "Remove moderator" },
  "panel.mikKapat": { tr: "Mikrofonu kapat", en: "Turn the mic off" },
  "panel.mikAc": { tr: "Mikrofonu aç", en: "Turn the mic on" },
  "panel.yetkiYok": { tr: "Bu kişi için yetkin yok", en: "You have no rights over this person" },

  "panel.odadakiler": { tr: "Odadakiler", en: "In the room" },
  "panel.sahiplikDevri": { tr: "Sahiplik devri", en: "Host transfer" },
  "panel.odadanAt": { tr: "Odadan at", en: "Remove from room" },

  "banner.yeni": { tr: "YENİ", en: "NEW" },
  "banner.baslik": { tr: "Birlikte izlemek artık burada", en: "Watching together is here" },
  "banner.altYazi": {
    tr: "Odanı kur, bağlantını paylaş, aynı sahneyi aynı anda izleyin. Sesli sohbet açık.",
    en: "Set up your room, share your link, watch the same scene at the same time. Voice chat is on.",
  },

  "girisGerekli.baslik": { tr: "Giriş gerekli", en: "Sign-in required" },
  "girisGerekli.dugme": { tr: "Giriş Yap", en: "Sign In" },
  "girisGerekli.aciklama": {
    tr: "Bu videoyu izlemek için {0} hesabında oturum aç",
    en: "Sign in to your {0} account to watch this video",
  },
} as const;

export function metinCevir(anahtar: string, dilKodu: string, degerler?: (string | number)[]): string {
  const kayit = (METINLER as Record<string, Record<string, string>>)[anahtar];
  if (!kayit) return anahtar;
  const kok = dilKodu.split("-")[0];
  const ham = kayit[dilKodu] ?? kayit[kok] ?? kayit.en ?? anahtar;
  if (!degerler?.length) return ham;
  return ham.replace(/\{(\d+)\}/g, (eslesme, i) => String(degerler[Number(i)] ?? eslesme));
}
