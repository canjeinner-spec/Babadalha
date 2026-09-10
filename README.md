# Aron Parti

Arkadaşlarınla aynı anda film/dizi izleme uygulaması. Expo + expo-router,
Supabase (oda ve kullanıcı verisi), Agora (parti içi sesli sohbet).

## Kurulum

```bash
npm install
cp .env.example .env   # Supabase değerlerini doldur
```

## Çalıştırma

```bash
. "$HOME/.aron-expo-token"
EXPO_TOKEN="$EXPO_TOKEN" EXPO_FORCE_WEBCONTAINER_ENV=1 npx expo start
```

Telefonda Expo Go → "Enter URL manually" → `exp://<alt-alan>.boltexpo.dev`

## Sınamalar

```bash
npm run tsc            # tip denetimi
npm run lint
npm run kopru:kontrol  # enjekte script sözdizimi (26 sınama)
```

## Yapı

```
src/app/         ekranlar (expo-router)
src/parti/       köprü, senkron, lobi, kuyruk, yetki, giriş
src/components/  oynatıcı, köprü web görünümü, kontrol çubuğu
src/oda/         platform tanımları
modules/         yerel native modüller (aron-player, aron-webview)
araclar/         kopru-sozdizimi.mjs
```

Native modüller yalnız dev build'de çalışır; Expo Go'da
`react-native-webview`'a düşer.
