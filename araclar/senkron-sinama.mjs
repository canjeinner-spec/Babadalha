import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require0 = createRequire(import.meta.url);

const SAHTE = {
  "@/lib/supabase": { supabase: null },
  "@/oda/platform": {},
  "@/parti/yetki": {
    rolAdi: (rol) =>
      rol === "sahip" ? "Parti Sahibi" : rol === "yardimci" ? "Parti Yardımcısı" : "İzleyici",
  },
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
const D = modulYukle("src/parti/devir.ts");
const M = modulYukle("src/parti/sistemMesaji.ts");
const I = modulYukle("src/parti/icerik.ts");

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

console.log("sahiplik devri karari");
{
  const a = (anahtar, rol) => ({ anahtar, rol });

  ol("sayi eki sayisal karsilastiriliyor", D.anahtarKarsilastir("u9", "u10") < 0);
  ol("ayni sayi esit", D.anahtarKarsilastir("u7", "u7") === 0);
  ol("farkli onek sozlukte", D.anahtarKarsilastir("konuk-a", "u1") < 0);

  ol(
    "otomatik devir kapaliysa atlaniyor",
    JSON.stringify(D.devirKarari([a("u2", "uye")], "u1", false))
      === JSON.stringify({ tur: "atla", sebep: "otomatikKapali" }),
  );
  ol(
    "aday yoksa atlaniyor",
    JSON.stringify(D.devirKarari([a("u1", "sahip")], "u1", true))
      === JSON.stringify({ tur: "atla", sebep: "adayYok" }),
  );

  const roster = [a("u1", "sahip"), a("u5", "uye"), a("u3", "yardimci"), a("u12", "uye")];
  const karar = D.devirKarari(roster, "u1", true);
  ol("yardimci uyenin onunde", karar.tur === "devret" && karar.anahtar === "u3", JSON.stringify(karar));

  const yardimcisiz = [a("u1", "sahip"), a("u12", "uye"), a("u5", "uye")];
  const k2 = D.devirKarari(yardimcisiz, "u1", true);
  ol("yardimci yoksa en kucuk numara", k2.anahtar === "u5", JSON.stringify(k2));

  const kucukSayi = [a("u1", "sahip"), a("u10", "uye"), a("u9", "uye")];
  ol("sozluk degil sayi siralamasi", D.devirKarari(kucukSayi, "u1", true).anahtar === "u9");

  const karisik = [...roster].reverse();
  ol(
    "siralama girdi duzeninden bagimsiz",
    D.devirKarari(karisik, "u1", true).anahtar === D.devirKarari(roster, "u1", true).anahtar,
  );

  ol("ayrilan aday olamaz", D.devirKarari([a("u3", "yardimci"), a("u5", "uye")], "u3", true).anahtar === "u5");
  ol("devralan ben miyim dogru", D.devralanBenMiyim(karar, "u3") === true);
  ol("devralan ben miyim yanlis", D.devralanBenMiyim(karar, "u5") === false);
  ol("atlanan kararda devralan yok", D.devralanBenMiyim({ tur: "atla", sebep: "adayYok" }, "u5") === false);
}

console.log("devir zamanlayicisi");
{
  let bekleyen = null;
  let sayac = 0;
  const kur = (f) => { bekleyen = f; return ++sayac; };
  const boz = () => { bekleyen = null; };
  const z = D.devirZamanlayiciAc(D.DEVIR_GECIKMESI, kur, boz);

  let calisti = 0;
  ol("bosken bekleyen yok", z.bekliyorMu() === false);
  z.basla(() => { calisti += 1; });
  ol("baslayinca bekliyor", z.bekliyorMu() === true);
  z.basla(() => { calisti += 100; });
  ol("bekleyen varken ikinci basla yok sayiliyor", sayac === 1);

  ol("iptal true donuyor", z.iptal() === true);
  ol("iptalden sonra beklemiyor", z.bekliyorMu() === false);
  ol("iptal edilen is calismadi", calisti === 0);
  ol("bos iptal false", z.iptal() === false);

  z.basla(() => { calisti += 1; });
  bekleyen();
  ol("suresi dolunca calisiyor", calisti === 1);
  ol("calistiktan sonra beklemiyor", z.bekliyorMu() === false);

  z.durdur();
  z.basla(() => { calisti += 1; });
  ol("durdurulunca yeni is alinmiyor", z.bekliyorMu() === false && calisti === 1);
  ol("gecikme 8 sn", D.DEVIR_GECIKMESI === 8000);
}

console.log("sistem mesajlari");
{
  const k = (ad, kullaniciAdi) => ({ anahtar: "u" + ad, ad, kullaniciAdi });
  const duz = (parcalar) =>
    parcalar.map((p) => (p.tur === "etiket" ? M.etiketAdi(p.kisi) : p.metin)).join("");

  ol("kullanici adi varsa etiket ondan", M.etiketAdi(k("Ali", "ali_34")) === "@ali_34");
  ol("kullanici adi yoksa ada dusuyor", M.etiketAdi(k("Ali", null)) === "@Ali");
  ol("bos kullanici adi ada dusuyor", M.etiketAdi(k("Ali", "   ")) === "@Ali");

  const ali = k("Ali", "ali_34");
  const ender = k("Ender", "ender");

  ol(
    "baskasi katilinca",
    duz(M.sistemParcalari(ali, { cesit: "katildi" }, false)) === "@ali_34 partiye katıldı",
    duz(M.sistemParcalari(ali, { cesit: "katildi" }, false)),
  );
  ol("ben katilinca ikinci sahis", duz(M.sistemParcalari(ali, { cesit: "katildi" }, true)) === "Partiye katıldın");
  ol("baskasi ayrilinca", duz(M.sistemParcalari(ali, { cesit: "ayrildi" }, false)) === "@ali_34 partiden ayrıldı");

  const rolVer = { cesit: "rol", veren: ender, rol: "yardimci" };
  ol(
    "ucuncu goz rol verilisini goruyor",
    duz(M.sistemParcalari(ali, rolVer, false)) === "@ender, @ali_34 kullanıcısını Parti Yardımcısı yaptı",
    duz(M.sistemParcalari(ali, rolVer, false)),
  );
  ol(
    "rolu alan ikinci sahis goruyor",
    duz(M.sistemParcalari(ali, rolVer, true)) === "@ender seni Parti Yardımcısı yaptı",
    duz(M.sistemParcalari(ali, rolVer, true)),
  );

  const rolAl = { cesit: "rol", veren: ender, rol: "uye" };
  ol(
    "yardimcilik alinisi",
    duz(M.sistemParcalari(ali, rolAl, false)) === "@ender, @ali_34 kullanıcısının yardımcılığını aldı",
    duz(M.sistemParcalari(ali, rolAl, false)),
  );
  ol("yardimciligi alinan ikinci sahis", duz(M.sistemParcalari(ali, rolAl, true)) === "@ender yardımcılığını aldı");

  const sahipAtti = { cesit: "atildi", atanRol: "sahip" };
  const yardimciAtti = { cesit: "atildi", atanRol: "yardimci" };
  ol(
    "sahip attiginda",
    duz(M.sistemParcalari(ali, sahipAtti, false)) === "@ali_34, Parti Sahibi tarafından partiden atıldı",
    duz(M.sistemParcalari(ali, sahipAtti, false)),
  );
  ol(
    "yardimci attiginda",
    duz(M.sistemParcalari(ali, yardimciAtti, false)) === "@ali_34, Parti Yardımcısı tarafından partiden atıldı",
  );
  ol(
    "atilan kisi ikinci sahis goruyor",
    duz(M.sistemParcalari(ali, sahipAtti, true)) === "Parti Sahibi tarafından partiden atıldın",
  );

  ol(
    "etiket parcasi kisiyi tasiyor",
    M.sistemParcalari(ali, { cesit: "katildi" }, false)[0].kisi.ad === "Ali",
  );
}

console.log("icerik kimligi");
{
  const a = I.icerikAnahtari;
  ol("youtube v parametresi", a("youtube", "https://www.youtube.com/watch?v=BcUckd8Ox9I") === "youtube:v:BcUckd8Ox9I");
  ol(
    "youtube ucucu parametreler kimligi degistirmiyor",
    a("youtube", "https://www.youtube.com/watch?v=BcUckd8Ox9I&t=12s&list=RD1&pp=abc") === a("youtube", "https://m.youtube.com/watch?v=BcUckd8Ox9I"),
  );
  ol("youtube shorts", a("youtube", "https://www.youtube.com/shorts/abc123?feature=x") === "youtube:shorts:abc123");
  ol("youtube farkli video farkli kimlik", a("youtube", "https://www.youtube.com/watch?v=aaa") !== a("youtube", "https://www.youtube.com/watch?v=bbb"));
  ol("netflix yol tabanli", a("netflix", "https://www.netflix.com/watch/81731428?trackId=1&tctx=2") === "netflix:www.netflix.com/watch/81731428");
  ol("sondaki egik cizgi ve buyuk harf esitleniyor", a("netflix", "https://WWW.netflix.com/watch/1/") === a("netflix", "https://www.netflix.com/watch/1"));
  ol("bos adres platformla kaliyor", a("youtube", "") === "youtube:");
  ol("bozuk adres cokmuyor", a("plex", "bu bir url degil") === "plex:bu bir url degil");
}

console.log(`\n${gecen} gecti, ${kalan} kaldi`);
process.exit(kalan ? 1 : 0);
