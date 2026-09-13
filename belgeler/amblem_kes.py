import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ESIK = 40
ASGARI_PAY = 0.02
KENAR_PAYI = 0.08
CIKTI_BOYU = 192


def temizle(im: Image.Image) -> Image.Image:
    a = np.array(im.split()[3])
    maske = a > ESIK
    etiket, adet = ndimage.label(maske)
    if adet == 0:
        return im
    boyutlar = ndimage.sum(maske, etiket, range(1, adet + 1))
    esik = boyutlar.max() * ASGARI_PAY
    atilacak = np.isin(etiket, [i + 1 for i, b in enumerate(boyutlar) if b < esik])
    veri = np.array(im)
    veri[atilacak] = 0
    yumusak = a.astype(np.int16) - 12
    veri[..., 3] = np.clip(np.where(atilacak, 0, yumusak), 0, 255).astype(np.uint8)
    return Image.fromarray(veri, "RGBA")


def sutun_gruplari(a: np.ndarray, bosluk: int = 40) -> list[tuple[int, int]]:
    dolu = (a > ESIK).any(axis=0)
    gruplar, bas = [], None
    bos = 0
    for x, d in enumerate(dolu):
        if d:
            if bas is None:
                bas = x
            bos = 0
        elif bas is not None:
            bos += 1
            if bos >= bosluk:
                gruplar.append((bas, x - bos))
                bas, bos = None, 0
    if bas is not None:
        gruplar.append((bas, len(dolu) - 1))
    return gruplar


def kare_yap(im: Image.Image) -> Image.Image:
    kutu = im.getbbox()
    im = im.crop(kutu)
    kenar = int(max(im.size) * (1 + KENAR_PAYI * 2))
    tuval = Image.new("RGBA", (kenar, kenar), (0, 0, 0, 0))
    tuval.alpha_composite(im, ((kenar - im.size[0]) // 2, (kenar - im.size[1]) // 2))
    return tuval.resize((CIKTI_BOYU, CIKTI_BOYU), Image.LANCZOS)


def main(kaynak: str, adlar: list[str], klasor: str) -> None:
    im = temizle(Image.open(kaynak).convert("RGBA"))
    gruplar = sutun_gruplari(np.array(im.split()[3]))
    if len(gruplar) != len(adlar):
        raise SystemExit(f"{len(adlar)} ikon bekleniyordu, {len(gruplar)} küme bulundu")
    for (x0, x1), ad in zip(gruplar, adlar):
        parca = kare_yap(im.crop((x0, 0, x1 + 1, im.size[1])))
        parca.save(f"{klasor}/{ad}.webp", "WEBP", quality=95, method=6)
        print(ad, parca.size)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2].split(","), sys.argv[3])
