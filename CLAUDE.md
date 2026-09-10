# Aron Parti — çalışma kuralları

Bu depo **izleme partisi** uygulaması. Sesli sohbet uygulaması ayrı depoda
(`canjeinner-spec/Aaron`). Buraya sesli sohbet ekranı, ajans, hediye,
sıralama, akış kodu eklenmez.

Ortak olan tek şey Supabase projesi: kullanıcılar, profiller ve odalar aynı
veritabanından geliyor. Şema hakkında hüküm vermeden önce Aaron deposundaki
`belgeler/CANLI_DURUM_2026-09-07.md` okunur.

---

## KURAL 1 — Netflix + Android kapalı, yeniden açılmaya çalışılmaz

`src/oda/platform.ts` içindeki `BU_CIHAZDA_YOK` Android'de Netflix'i
listeden eliyor. Bu bir eksiklik değil, ölçülmüş bir sonuç.

9 Eylül 2026 ölçümü (Aaron deposu, `belgeler/ANDROID_WEBVIEW_DRM_2026-09-09.md`):
Android WebView'de Netflix'in kendi motoru `EME=no` döndürüyor. Beş ayrı
kimlik (UA) denendi, hepsi aynı duvara çıktı; kimlik yalnız hatanın görünen
adını değiştiriyor (1044, 1957, `/unsupported`, sessiz duruş). İzin, MSE
vekili, EME sarmalayıcısı, ağ engelleri ve donanım katmanı tek tek elendi,
hiçbiri sebep değil.

**Denenmişi bir daha deneme:** UA değiştirme, ortam scripti, depo temizliği,
kodek ayarı. Yeni bir şey denenecekse önce `nfyetenek` satırındaki `EME`
değerine bakılsın; `no` olduğu sürece oynatma kurulmaz.

10 Eylül 2026'da üç uygulama söküldü (Turtle, Rave, Dooram). Üçünde de aynı
sonuç: Android'de Netflix'i çözen hiçbiri bunu WebView içinde çözmemiş.
Çözenler servisin kimlik doğrulamasını taklit eden bir istemci yazmış.
**O yol bu depoda uygulanmaz.** Geçerli abonelik bunu değiştirmez.

Netflix dışındaki servisler (Prime, Disney+, Hulu, Max, Crunchyroll,
YouTube, Plex, Drive) Android'de çalışıyor.

### iOS'ta durum farklı ve o da ölçüldü (10 Eylül 2026)

`belgeler/IOS_NETFLIX_2026-09-10.md`. Özet: iOS'ta `EME=yes`, FairPlay
kuruluyor, anahtar üretiliyor. Yani Android'deki duvar burada yok. Buna
rağmen **bazı içerikler oynuyor, bazıları oynamıyor** — aynı oturumda
`/watch/80126264` ve `/watch/82699336` açıldı, `/watch/70301862`,
`/watch/81323556`, `/watch/81035908` açılmadı ve ekranda kodsuz hata
sayfası çıktı, Netflix'in iç hata nesneleri boş geldi.

Sonu `_UA` olan yetenek alanlarının hepsi `maybe`: kimliğimiz
sınıflandırılamıyor ve sınıflandırılamayan istemciye içerik başına karar
veriliyor. **Bu karar aşılmaya çalışılmaz.** iOS'ta Netflix listede
kalıyor çünkü çalışan içerik var; açılmayanda kullanıcıya
`parti-sec` uyarı gösteriyor.

Not: "tam sayfa yükleme çalışır, SPA gezintisi çalışmaz" diye bir ara
hüküm verilmişti, **yanlıştı**; ölçüm çürüttü. Gezinti biçimi belirleyici
değil.

---

## KURAL 2 — Dil

Commit mesajları, belgeler ve arayüz metinleri **Türkçe**.

---

## KURAL 3 — Metro/tünel: yalnız "Bolt" çalışır

```bash
. "$HOME/.aron-expo-token"
EXPO_TOKEN="$EXPO_TOKEN" EXPO_FORCE_WEBCONTAINER_ENV=1 npx expo start
```

Metro `Waiting on http://<alt-alan>.boltexpo.dev` basar. Telefonda
**Expo Go → "Enter URL manually" → `exp://<alt-alan>.boltexpo.dev`**.
QR'a bakma, o yerel adresi gösteriyor.

**Denenmişi bir daha deneme:** `--tunnel` (ngrok) → egress proxy sertifikayı
kesiyor. `cloudflared` → URL üretiyor ama `Registered tunnel connection: 0`.

**Token olmadan başlatma.** Yoksa log şunu basar:
`Could not fetch new Expo development certificate, falling back to cached
certificate` — o satır göründüğünde iOS Expo Go manifest imzasını
doğrulayamıyor. Başlattıktan sonra o satırın **olmadığını** doğrula.
Token depo dışında: `~/.aron-expo-token`. **Depoya yazılmaz.**

### `pkill -f` ile kendi kabuğunu öldürme

`pkill -f <kalıp>` tam komut satırına bakar; çağıran kabuk kendini eşleştirip
öldürüyor ve oturum düşüyor. Aracın kendi durdurma komutunu kullan ya da PID
ile öldür (`pgrep -f ... | grep -v $$`). `pkill -f` en son çare.

---

## KURAL 4 — İş bittiyse push edilir

Her tamamlanan iş hemen commit'lenip push edilir. Bir işin bittiğini
söylemeden önce `git log origin/<dal>` ile karşıya gittiğini doğrula.

7 Eylül'de üç ayrı oturumda "yapıldı" denen dört commit iki depoda da yoktu;
oturum çöktüğünde kod tamamen kayboldu.

---

## KURAL 5 — Kod yorumu yazılmaz

Hiçbir dosyaya açıklama satırı eklenmez. Araca verilen yönergeler kalır:
`eslint-disable*`, `@ts-ignore`, `@ts-expect-error`, `prettier-ignore`,
`/// <reference`.

"Neden böyle yazıldı" bilgisi commit mesajına ve `belgeler/`e gider.

---

## KURAL 6 — `kopru.ts` şablon dizgisi: `\/` kaçışı

`src/parti/kopru.ts` içindeki enjekte script şablonunda `\/` yazılırsa
cihaza `/` olarak gidip regex'i bozuyor. Bu yüzden sözdizimi sınaması var:

```bash
npm run kopru:kontrol
```

`kopru.ts`'e dokunan her değişiklikten sonra çalıştırılır. 26 sınama
(iki işletim × on üç platform), hepsi geçmeli.

---

## KURAL 7 — Avatarda halka yok

`Portrait` halkayı yalnız `ring` prop'u açıkça verildiğinde çizer. Yeni ekran
yazarken avatara süs olarak halka ekleme.
