export type MetinAnahtari = keyof typeof METINLER;

export const METINLER = {
  "genel.vazgec": { tr: "Vazgeç", en: "Cancel" },
  "genel.devam": { tr: "Devam et", en: "Continue" },
  "genel.tamam": { tr: "Tamam", en: "OK" },
  "genel.kapat": { tr: "Kapat", en: "Close" },
  "genel.yukleniyor": { tr: "Yükleniyor…", en: "Loading…" },
  "genel.hata": { tr: "Bir şeyler ters gitti", en: "Something went wrong" },

  "cubuk.ev": { tr: "Ev", en: "Home" },
  "cubuk.partiler": { tr: "Partiler", en: "Parties" },
  "cubuk.kisi": { tr: "Profil", en: "Profile" },
  "cubuk.baslat": { tr: "Başlat", en: "Start" },

  "partiler.altBaslik": { tr: "Şu an açık olan odalar", en: "Rooms open right now" },

  "ana.baslik": { tr: "Parti", en: "Party" },
  "ana.altBaslik": { tr: "Birlikte izle, birlikte konuş", en: "Watch together, talk together" },
  "ana.canliPartiler": { tr: "Canlı partiler", en: "Live parties" },
  "ana.selam": { tr: "Merhaba {0}", en: "Hello {0}" },
  "ana.duyuruBaslik": { tr: "Aron'a hoş geldin", en: "Welcome to Aron" },
  "ana.duyuruMetin": {
    tr: "Netflix, Prime Video ve YouTube artık yerel oynatıcıda açılıyor. Odanı kur, bağlantını paylaş, film aynı saniyede başlasın.",
    en: "Netflix, Prime Video and YouTube now open in the native player. Set up your room, share your link, and the film starts on the same second.",
  },
  "ana.platformBaslik": { tr: "Desteklenen platformlar", en: "Supported platforms" },
  "ana.platformAlt": {
    tr: "Birini seç, odan saniyesinde kurulsun.",
    en: "Pick one and your room is set up in a second.",
  },

  "ana.kisayolBaslik": { tr: "Ne yapmak istersin?", en: "What would you like to do?" },
  "ana.kisayolKur": { tr: "Parti kur", en: "Start a party" },
  "ana.kisayolKurAlt": { tr: "Platformu seç, oda saniyesinde açılsın", en: "Pick a platform, your room opens in a second" },
  "ana.kisayolKatil": { tr: "Açık partilere bak", en: "Browse open parties" },
  "ana.kisayolKatilAlt": { tr: "Şu an izlenen odalara göz at", en: "See the rooms being watched now" },
  "ana.kisayolDavet": { tr: "Arkadaşını çağır", en: "Invite a friend" },
  "ana.kisayolDavetAlt": { tr: "Davet bağlantını paylaş", en: "Share your invite link" },
  "ana.davetKopyalandi": { tr: "Davet bağlantısı kopyalandı", en: "Invite link copied" },
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

  "profil.hesapKart": { tr: "Hesap bilgilerim", en: "My account details" },
  "profil.hesapKartAlt": { tr: "Seviye, kayıt tarihi, dil", en: "Level, member since, language" },
  "profil.partiKart": { tr: "Parti modu", en: "Party mode" },
  "profil.partiKartAlt": { tr: "İzleme istatistiklerin", en: "Your watching stats" },
  "profil.hesapBolumu": { tr: "HESAP", en: "ACCOUNT" },
  "profil.dil": { tr: "Uygulama dili", en: "App language" },
  "profil.duzenle": { tr: "Profili düzenle", en: "Edit profile" },
  "profil.misafirBaslik": { tr: "Şu anda misafirsin", en: "You are browsing as a guest" },
  "profil.misafirMetin": {
    tr: "Bilgilerini düzenleyebilmek için hesabına giriş yapman gerekiyor.",
    en: "To edit your details you need to sign in to your account.",
  },

  "duzenle.baslik": { tr: "Profili düzenle", en: "Edit profile" },
  "duzenle.kullaniciAdi": { tr: "Kullanıcı adı", en: "Username" },
  "duzenle.kullaniciAdiIpucu": { tr: "Odalarda seni bu ad temsil eder", en: "This name represents you in rooms" },
  "duzenle.avatarDegistir": { tr: "Fotoğrafı değiştir", en: "Change photo" },
  "duzenle.avatarYukleniyor": { tr: "Yükleniyor…", en: "Uploading…" },
  "duzenle.avatarHatasi": { tr: "Fotoğraf yüklenemedi.", en: "The photo could not be uploaded." },
  "duzenle.avatarIzni": {
    tr: "Fotoğraf seçebilmek için galeri izni gerekiyor.",
    en: "Gallery permission is needed to pick a photo.",
  },
  "duzenle.adRengi": { tr: "Ad rengin", en: "Your name colour" },
  "duzenle.adRengiIpucu": {
    tr: "Sohbette ve odalarda adın bu renkte akar",
    en: "Your name flows in this colour in chat and rooms",
  },
  "duzenle.adRengiKilit": {
    tr: "Ad rengi Premium'a özel. Premium'a geçince buradan seçersin.",
    en: "Name colour is Premium only. Once you have Premium you pick it here.",
  },
  "duzenle.adRengiDeneme": {
    tr: "Hesabın bağlı değil, seçimin şimdilik yalnız bu cihazda duruyor.",
    en: "Your account is not connected, your choice stays on this device for now.",
  },
  "duzenle.gokkusagi": { tr: "Gökkuşağı", en: "Rainbow" },
  "duzenle.adKilit": {
    tr: "Kullanıcı adını 7 günde bir değiştirebilirsin. Kalan: {0}",
    en: "You can change your username once every 7 days. Remaining: {0}",
  },
  "duzenle.adKilitGun": { tr: "{0} gün", en: "{0} days" },
  "duzenle.adKilitSaat": { tr: "{0} saat", en: "{0} hours" },
  "duzenle.adKural": {
    tr: "Benzersizdir, başkasında olan adı alamazsın. Değiştirince 7 gün kilitlenir.",
    en: "It is unique, you cannot take a name someone else has. Changing it locks it for 7 days.",
  },

  "duzenle.biyografi": { tr: "Hakkında", en: "About" },
  "duzenle.biyografiIpucu": { tr: "Birkaç satırda kendini anlat", en: "Tell people about yourself in a few lines" },
  "duzenle.ulke": { tr: "Ülke", en: "Country" },
  "duzenle.sehir": { tr: "Şehir", en: "City" },
  "duzenle.kaydet": { tr: "Kaydet", en: "Save" },
  "duzenle.kaydediliyor": { tr: "Kaydediliyor…", en: "Saving…" },
  "duzenle.kaydedildi": { tr: "Profilin güncellendi", en: "Your profile is updated" },
  "duzenle.adKisa": { tr: "Kullanıcı adı en az 3 karakter olmalı.", en: "A username must be at least 3 characters." },
  "duzenle.adGecersiz": {
    tr: "Kullanıcı adında yalnız harf, rakam, alt çizgi ve nokta olabilir.",
    en: "A username can contain only letters, numbers, underscores and dots.",
  },
  "duzenle.adDolu": { tr: "Bu kullanıcı adı alınmış.", en: "That username is taken." },
  "duzenle.adMusait": { tr: "Bu ad müsait.", en: "That name is available." },
  "duzenle.adBakiliyor": { tr: "Bakılıyor…", en: "Checking…" },
  "duzenle.hata": { tr: "Kaydedilemedi. İnternetini kontrol edip tekrar dene.", en: "Could not save. Check your connection and try again." },
  "duzenle.sunucuYok": {
    tr: "Sunucu ayarları eksik, profil düzenlenemiyor.",
    en: "Server settings are missing, the profile cannot be edited.",
  },

  "profil.belgeler": { tr: "YASAL", en: "LEGAL" },
  "profil.partiModu": { tr: "PARTİ MODU", en: "PARTY MODE" },
  "profil.misafirNotu": {
    tr: "Partilerin ve istatistiklerin cihaz değiştirsen de seninle kalsın",
    en: "Keep your parties and stats even if you change devices",
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

  "sistem.katildinBen": { tr: "Partiye katıldın.", en: "You joined the party." },
  "sistem.katildi": { tr: "{0} partiye katıldı.", en: "{0} joined the party." },
  "sistem.ayrildi": { tr: "{0} partiden ayrıldı.", en: "{0} left the party." },
  "sistem.yardimciAlindiBen": {
    tr: "{0} tarafından Parti Yardımcılığından alındın.",
    en: "You were removed as a Party Moderator by {0}.",
  },
  "sistem.yardimciAlindi": {
    tr: "{0}, {1} tarafından Parti Yardımcılığından alındı.",
    en: "{0} was removed as a Party Moderator by {1}.",
  },
  "sistem.rolVerildiBen": {
    tr: "{0} tarafından {1} olarak atandın.",
    en: "You were made a {1} by {0}.",
  },
  "sistem.rolVerildi": {
    tr: "{0}, {1} tarafından {2} olarak atandı.",
    en: "{0} was made a {2} by {1}.",
  },
  "sistem.atildinBen": {
    tr: "{0} tarafından partiden atıldın.",
    en: "You were removed from the party by {0}.",
  },
  "sistem.atildi": {
    tr: "{0}, {1} tarafından partiden atıldı.",
    en: "{0} was removed from the party by {1}.",
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

  "birSeyDaha.ustSatir": { tr: "Bir şey daha…", en: "One more thing…" },
  "birSeyDaha.baslik": { tr: "Aron'un tamamı ücretsiz.", en: "All of Aron is free." },
  "birSeyDaha.altSatir": {
    tr: "Sıradaki ekranı okumadan geçebilirsin. Hiçbir şey kaybetmezsin.",
    en: "You can skip the next screen without reading it. You lose nothing.",
  },

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
  "premium.renkliAdBaslik": { tr: "Özel ad rengin", en: "Your own name colour" },
  "premium.renkliAdMetin": {
    tr: "Kullanıcı adın sohbette ve odada özel renkte parlar. Rengini kendin seçersin.",
    en: "Your username glows in a special colour in chat and in the room. You pick the colour.",
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
  "premium.ornekAd": { tr: "Elif", en: "Alex" },
  "premium.ornekAd2": { tr: "Deniz", en: "Sam" },
  "premium.ornekMesaj": {
    tr: "aynı anda başlıyoruz, hazır mısınız?",
    en: "we start on the same second, ready?",
  },
  "premium.ornekMesaj2": { tr: "hazırım, aç gitsin", en: "ready, hit play" },

  "premium.dahaBaslik": { tr: "Ve çok daha fazlası", en: "And much more" },
  "premium.dahaMetin": {
    tr: "Premium'a özel yeni özellikler eklenmeye devam ediyor.",
    en: "New Premium-only features keep arriving.",
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
  "kurallar.belgeler": { tr: "Sohbet şu belgelere tabidir:", en: "Chat is subject to these documents:" },
  "kurallar.kosullar": { tr: "Kullanım Koşulları", en: "Terms of Use" },
  "kurallar.gizlilik": { tr: "Gizlilik Politikası", en: "Privacy Policy" },
  "kurallar.ve": { tr: " ve ", en: " and " },

  "belge.guncelleme": { tr: "Son güncelleme: {0}", en: "Last updated: {0}" },
  "belge.iletisim": { tr: "İletişim", en: "Contact" },
  "belge.iletisimEksik": {
    tr: "İletişim adresi henüz eklenmedi.",
    en: "The contact address has not been added yet.",
  },

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
