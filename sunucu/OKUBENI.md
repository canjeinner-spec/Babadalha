# aron-cdm — sunucu tarafli PlayReady CDM proxy

Bu sunucu Netflix icin ClearKey anahtar cikarma islemini yapar.

## Nasil calisir

1. Uygulama Netflix sayfasindaki video ID'sini yakalar.
2. Netflix cerezleriyle MSL oturumu acar (`NetflixMslYonetici.kt`).
3. Manifesti alir, MPD olusturur.
4. Bu sunucudan `/challenge` ile PlayReady challenge ister (jenerik PSSH ile).
5. Challenge'i Netflix MSL lisans URL'sine gonderir.
6. Netflix'in verdigi lisansi `/keys` ile bu sunucuya gonderir.
7. Sunucu lisansi PlayReady CDM ile parse edip anahtarlari cikarir.
8. Anahtarlar `{kid_b64: key_b64}` seklinde donulur.
9. Uygulama bu anahtarlari ClearKey JWK formatina cevirip ExoPlayer'a verir.

## Gereksinimler

- PlayReady aygit dosyasi (`device.prd`)
  - Ya bu dizine `device.prd` olarak yerlestirilir
  - Ya da `PRD_BASE64` env degiskenine base64 icerik yazilir (Render icin onerilir)

## Render.com'da yayina alma

1. Bu dizindeki `render.yaml`'i Render'a baglayin
2. Ortam degiskeni olarak `PRD_BASE64` ekleyin, `.prd` dosyasinin base64 icerigini yapistirin
   - `base64 -w 0 device.prd | pbcopy` (macOS)
   - `base64 -w 0 device.prd | xclip -selection clipboard` (Linux)
3. Istege bagli: `API_ANAHTAR` env degiskeni ekleyip istemci tarafinda ayni degeri `X-Api-Key` basligina koyabilirsiniz
4. Deploy tamamlandiktan sonra URL'yi (`https://<ad>.onrender.com`) uygulamanin
   `src/app/parti-oda.tsx` icindeki `CDM_PROXY_URL` sabitine yazin

## Yerel calistirma

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PRD_DOSYA=device.prd python app.py
```

## Uc noktalar

- `GET /` — servis bilgisi
- `GET /health` — CDM yuklenebiliyor mu?
- `POST /challenge` — `{"pssh": "..."}` -> `{"challenge": "...", "session_id": "..."}`
- `POST /keys` — `{"session_id": "...", "license": "..."}` -> `{"<kid_b64>": "<key_b64>", ...}`

## Guvenlik

- `.prd` dosyasi asla depoya girmez (`.gitignore` ile korunur)
- Render kullanirken `PRD_BASE64` degiskeni Environment kismindan girilir
- `API_ANAHTAR` ile ucuncu taraflarin sunucuyu kullanmasi engellenebilir
