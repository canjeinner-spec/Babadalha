import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require0 = createRequire(import.meta.url);

const SAHTE = {
  "@/lib/supabase": { supabase: null },
  "@/oda/platform": {},
  "@/parti/yetki": {},
  "@supabase/supabase-js": {},
};

function modulYukle(dosya) {
  const cikti = ts.transpileModule(readFileSync(dosya, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const yol = join(mkdtempSync(join(tmpdir(), "senkron-")), "m.cjs");
  writeFileSync(yol, cikti);
  const yukle = (ad) => (Object.prototype.hasOwnProperty.call(SAHTE, ad) ? SAHTE[ad] : require0(ad));
  const disari = { exports: {} };
  new Function("require", "module", "exports", readFileSync(yol, "utf8"))(yukle, disari, disari.exports);
  return disari.exports;
}

const S = modulYukle("src/parti/senkron.ts");
const K = modulYukle("src/parti/saat.ts");

let gecen = 0;
let kalan = 0;

function ol(ad, kosul, ek = "") {
  if (kosul) {
    gecen += 1;
  } else {
    kalan += 1;
    console.log(`  KALDI  ${ad}${ek ? " — " + ek : ""}`);
  }
}

function yakin(a, b, tolerans) {
  return Math.abs(a - b) <= tolerans;
}

console.log("saat sapmasi");
{
  const o = K.sapmaHesapla(1000, 4040, 1080);
  ol("simetrik gidis-donusde sapma tam cikiyor", yakin(o.sapma, 3000, 0.001), `sapma=${o.sapma}`);
  ol("gidis-donus olculuyor", o.gidisDonus === 80);

  const asimetrik = K.sapmaHesapla(0, 5000, 1000);
  ol("asimetrik gecikmede yarim gidis-donus dusuluyor", asimetrik.sapma === 4500);

  ol("ornek yoksa null", K.sapmaSec([]) === null);
  ol(
    "tavani asan ornekler eleniyor",
    K.sapmaSec([{ gidisDonus: K.GIDIS_DONUS_TAVANI + 1, sapma: 9999 }]) === null,
  );

  const ornekler = [
    { gidisDonus: 40, sapma: 100 },
    { gidisDonus: 60, sapma: 104 },
    { gidisDonus: 900, sapma: 400 },
    { gidisDonus: 1200, sapma: 800 },
  ];
  ol(
    "yavas ornekler medyani bozmuyor",
    K.sapmaSec(ornekler) === 102,
    `sapma=${K.sapmaSec(ornekler)}`,
  );
}

console.log("esleyici uctan uca");
{
  const UZAK_SAPMA = 3000;
  const TEK_YON = 45;
  let saat = 10000;
  const kuyruk = [];
  const esleyici = K.saatEsleyiciAc({
    simdi: () => saat,
    yollaIstek: (t0) => kuyruk.push(t0),
  });
  esleyici.basla();
  ol("hazir olmadan sapma sifir", esleyici.sapma() === 0 && !esleyici.hazir());

  for (let i = 0; i < K.ORNEK_SAYISI; i++) {
    const t0 = kuyruk.shift();
    if (t0 === undefined) break;
    saat = t0 + TEK_YON;
    const uzakSaat = saat + UZAK_SAPMA;
    saat = t0 + TEK_YON * 2;
    esleyici.yanit(t0, uzakSaat);
  }
  ol("ornekler sonrasi hazir", esleyici.hazir());
  ol("kestirilen sapma dogru", yakin(esleyici.sapma(), UZAK_SAPMA, 1), `sapma=${esleyici.sapma()}`);

  const oncekiSapma = esleyici.sapma();
  esleyici.yanit(999999, 0);
  ol("beklenmeyen t0 yok sayiliyor", esleyici.sapma() === oncekiSapma);
  esleyici.durdur();
}

console.log("beklenen konum");
{
  const d = { konum: 100, oynuyor: true, an: 50000 };
  ol("duraklamisken konum sabit", S.beklenenKonum({ ...d, oynuyor: false }, 60000, 0) === 100);
  ol("sapmasiz gecen sure ekleniyor", S.beklenenKonum(d, 52000, 0) === 102);
  ol(
    "saat sapmasi konuma yansiyor",
    S.beklenenKonum(d, 52000, 3000) === 105,
    `konum=${S.beklenenKonum(d, 52000, 3000)}`,
  );
  ol("gecmis damgada geri sarilmiyor", S.beklenenKonum(d, 40000, 0) === 100);
}

console.log("eski paket suzgeci");
{
  const onceki = { kaynak: "u1", sira: 5 };
  const p = (kaynak, sira) => ({ kaynak, sira, konum: 0, oynuyor: true, an: 0 });
  ol("ilk pakette onceki yok", S.eskiPaketMi(null, p("u1", 1)) === false);
  ol("ayni kaynaktan kucuk sira eleniyor", S.eskiPaketMi(onceki, p("u1", 4)) === true);
  ol("ayni sira eleniyor", S.eskiPaketMi(onceki, p("u1", 5)) === true);
  ol("buyuk sira geciyor", S.eskiPaketMi(onceki, p("u1", 6)) === false);
  ol("baska kaynak geciyor", S.eskiPaketMi(onceki, p("u2", 1)) === false);
  ol(
    "sira tasimayan eski istemci paketi geciyor",
    S.eskiPaketMi(onceki, { konum: 0, oynuyor: true, an: 0 }) === false,
  );
  ol("kimlik cikariliyor", S.paketKimligi(p("u1", 9)).sira === 9);
  ol("sirasiz pakette kimlik yok", S.paketKimligi({ konum: 0, oynuyor: true, an: 0 }) === null);
}

console.log("yanki penceresi");
{
  const bitis = 1000 + S.UZAK_UYGULAMA_SOGUMA;
  ol("pencere icinde yayin kapali", S.yankiPenceresinde(bitis, 1400) === true);
  ol("pencere bitince yayin acik", S.yankiPenceresinde(bitis, 1751) === false);
  ol("soguma suresi 750 ms", S.UZAK_UYGULAMA_SOGUMA === 750);
}

console.log(`\n${gecen} gecti, ${kalan} kaldi`);
process.exit(kalan ? 1 : 0);
