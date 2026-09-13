import re, sys

def cevir(dump_yolu):
    metin = open(dump_yolu, encoding="utf-8", errors="replace").read()
    en = float(re.search(r'viewportWidth\(0x[0-9a-f]+\)=([\d.]+)', metin).group(1))
    boy = float(re.search(r'viewportHeight\(0x[0-9a-f]+\)=([\d.]+)', metin).group(1))
    parcalar = []
    for blok in metin.split("E: path")[1:]:
        blok = blok.split("E: ")[0]
        d = re.search(r'pathData\(0x[0-9a-f]+\)="(.*?)"\s*$', blok, re.S | re.M)
        if not d:
            d = re.search(r'pathData\(0x[0-9a-f]+\)="(.*?)"', blok, re.S)
        if not d:
            continue
        renk = re.search(r'fillColor\(0x[0-9a-f]+\)=#([0-9a-fA-F]{8})', blok)
        if renk:
            a = int(renk.group(1)[0:2], 16) / 255
            dolgu = "#" + renk.group(1)[2:]
        else:
            a, dolgu = 1.0, "#ffffff"
        kural = re.search(r'fillType\(0x[0-9a-f]+\)=\(type 0x10\)0x([0-9a-f]+)', blok)
        evenodd = bool(kural) and int(kural.group(1), 16) == 1
        parcalar.append((d.group(1), dolgu, a, evenodd))
    govde = "\n".join(
        '  <path d="%s" fill="%s" fill-opacity="%s"%s/>' %
        (d, c, round(a, 3), ' fill-rule="evenodd"' if eo else "")
        for d, c, a, eo in parcalar
    )
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" width="%g" height="%g">\n%s\n</svg>'
            % (en, boy, en, boy, govde)), len(parcalar)

if __name__ == "__main__":
    svg, adet = cevir(sys.argv[1])
    open(sys.argv[2], "w", encoding="utf-8").write(svg)
    print(adet, "path")
