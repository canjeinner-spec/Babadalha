import io, re, sys, cairosvg
from PIL import Image, ImageFilter

KAYNAK = open("/home/user/Babadalha/src/icons/paths.ts", encoding="utf-8").read()

def yol(ad):
    m = re.search(r'^\s{2}' + ad + r':\s*\n?\s*"(.*?)",\s*$', KAYNAK, re.M | re.S)
    if not m:
        raise SystemExit("yol yok: " + ad)
    return m.group(1)

SVG = '''<svg xmlns="http://www.w3.org/2000/svg" width="{p}" height="{p}" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="a" x1="0.1" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#FFF6DE"/>
      <stop offset="0.26" stop-color="#F8D98A"/>
      <stop offset="0.55" stop-color="#EFC25C"/>
      <stop offset="0.8" stop-color="#D9A238"/>
      <stop offset="1" stop-color="#B8811F"/>
    </linearGradient>
  </defs>
  <path d="{d}" fill="{fill}" stroke="url(#a)" stroke-width="{sw}"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

def uret(dosya, ikon, dolu=False, sw=1.8, p=192, bulanik=8, oran=0.5):
    svg = SVG.format(p=p, d=yol(ikon), fill="url(#a)" if dolu else "none", sw=sw)
    ham = cairosvg.svg2png(bytestring=svg.encode(), output_width=p, output_height=p)
    im = Image.open(io.BytesIO(ham)).convert("RGBA")
    hale = im.filter(ImageFilter.GaussianBlur(bulanik))
    hale.putalpha(hale.split()[3].point(lambda v: int(v * oran)))
    taban = Image.new("RGBA", im.size, (0, 0, 0, 0))
    taban.alpha_composite(hale)
    taban.alpha_composite(im)
    yol_ = "/home/user/Babadalha/assets/amblem/" + dosya + ".webp"
    taban.save(yol_, "WEBP", quality=95, method=6)
    return taban

if __name__ == "__main__":
    isler = [("parti", "evParty", False, 1.9), ("kisi-ekle", "userAdd", False, 1.9)]
    serit = Image.new("RGBA", (192 * len(isler), 192), (18, 14, 8, 255))
    for i, (dosya, ikon, dolu, sw) in enumerate(isler):
        serit.alpha_composite(uret(dosya, ikon, dolu, sw), (i * 192, 0))
    serit.convert("RGB").save("/tmp/claude-0/-home-user-Babadalha/4ff7819b-36fd-5df1-bc89-243c2a19a120/scratchpad/yeni.png")
    print("tamam")
