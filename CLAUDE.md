# Aron Parti — çalışma kuralları

Bu depo **izleme partisi** uygulaması. Sesli sohbet uygulaması ayrı depoda
(`canjeinner-spec/Aaron`). Buraya sesli sohbet ekranı, ajans, hediye,
sıralama, akış kodu eklenmez.

Ortak olan tek şey Supabase projesi: kullanıcılar, profiller ve odalar aynı
veritabanından geliyor. Şema hakkında hüküm vermeden önce Aaron deposundaki
`belgeler/CANLI_DURUM_2026-09-07.md` okunur.

---

## KURAL 1 — Netflix Android: MSL protokolü ile yerel oynatıcıdan

Android'de Netflix WebView ile çalışmıyor (EME=no). Bu yüzden Netflix
Android'de MSL (Message Security Layer) protokolü üzerinden yerel
ExoPlayer ile oynatılıyor. Uygulama:

- `modules/aron-player/` altında MSL oturum, istek, yanıt, manifest
  üreteci ve ClearKey DRM geri çağrısı Kotlin'de yazıldı.
- Rave uygulamasının protokolü birebir uygulandı (11 Eylül 2026).
- Netflix çerezleri (`netflixId`, `secureNetflixId`) WebView'den
  `cerezAl` ile alınıp yerel modüle aktarılıyor.

iOS'ta WebView ile EME=yes, FairPlay çalışıyor; iOS yolu değişmedi.

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

### `expo-dev-client` kurulmaz

10 Eylül 2026: EAS Update hazırlığı diye Aron'daki modüller toplu kurulurken
`expo-dev-client` de kuruldu. Bu paket `dependencies`'te olunca `npx expo
start` geliştirme derlemesi kipine geçiyor ve `Waiting on` satırı
`exp+aron-parti://...` oluyor. Expo Go o pakete bağlanınca yerel modül
köprüsünü hiç kuramıyor:

```
WARN  No native ExponentConstants module found...
ERROR [runtime not ready]: Cannot find native module 'ExpoAsset'
ERROR [runtime not ready]: Invariant Violation: "main" has not been registered.
```

Paket kaldırıldı, `Waiting on http://...` geri geldi. `expo-dev-client`
gerçekten dev build alınacağı gün kurulur; KURAL 3 gereği telefona tek
bağlanma yolu Expo Go olduğu sürece depoda durmaz.

Genel kural: yeni bir yerel modül kurduktan sonra Metro'yu yeniden başlat ve
logda `Cannot find native module` var mı diye bak. Expo Go'nun içinde
olmayan bir modül eklemişsen uygulama hiç açılmıyor.

### `pkill -f` ile kendi kabuğunu öldürme

`pkill -f <kalıp>` tam komut satırına bakar; çağıran kabuk kendini eşleştirip
öldürüyor ve oturum düşüyor. Aracın kendi durdurma komutunu kullan ya da PID
ile öldür (`pgrep -f ... | grep -v $$`). `pkill -f` en son çare.

---

## KURAL 3.5 — Karşılama akışı geliştirmede her açılışta gösterilir

`src/lib/ilkAcilis.ts` içindeki `OTURUMLUK` bayrağı `__DEV__`'e bağlı.

- **Geliştirmede (Expo Go):** karşılama ve giriş bayrakları diske
  yazılmıyor, yalnız JS oturumu boyunca hatırlanıyor. Yani her tam
  yeniden yüklemede karşılama bir kez daha çıkıyor, denemek için
  uygulamayı silmek gerekmiyor.
- **Sürüm derlemesinde:** `__DEV__` false olduğu için bayraklar
  SecureStore ve AsyncStorage'a yazılıyor, akış hayatta bir kez çıkıyor.

Yani build alırken elle bir şey geri açmaya gerek yok, kendiliğinden
doğru davranıyor. Bu davranışı değiştirmen gerekirse tek yer `OTURUMLUK`.

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
