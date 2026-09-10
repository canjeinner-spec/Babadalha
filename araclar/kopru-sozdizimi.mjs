import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require0 = createRequire(import.meta.url);
const dosya = "src/parti/kopru.ts";

const PLATFORMLAR = [
  "youtube", "netflix", "prime_video", "disney_plus", "hbo_max",
  "hulu", "crunchyroll", "apple_tv", "plex", "google_drive",
];

function modulYukle(isletim) {
  const kaynak = readFileSync(dosya, "utf8");
  const cikti = ts.transpileModule(kaynak, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  const dizin = mkdtempSync(join(tmpdir(), "kopru-"));
  const yol = join(dizin, "kopru.cjs");
  writeFileSync(yol, cikti);

  const gercekYukle = require0;
  const modulOnbellek = {
    "react-native": { Platform: { OS: isletim } },
    "@/oda/platform": {},
  };
  const sarmal = {
    require(ad) {
      if (Object.prototype.hasOwnProperty.call(modulOnbellek, ad)) return modulOnbellek[ad];
      return gercekYukle(ad);
    },
  };
  const govde = readFileSync(yol, "utf8");
  const disari = { exports: {} };
  new Function("require", "module", "exports", govde)(sarmal.require, disari, disari.exports);
  return disari.exports;
}

let hata = 0;
let sinama = 0;

for (const isletim of ["ios", "android"]) {
  let mod;
  try {
    mod = modulYukle(isletim);
  } catch (e) {
    console.log(`${isletim}: modül yüklenemedi — ${e.message}`);
    hata++;
    continue;
  }
  for (const platform of PLATFORMLAR) {
    sinama++;
    let betik;
    try {
      betik = mod.kopruBetigi(platform);
    } catch (e) {
      hata++;
      console.log(`${isletim}/${platform}: betik üretilemedi — ${e.message}`);
      continue;
    }
    try {
      new Function(betik);
      console.log(`${isletim}/${platform}: tamam (${betik.length} karakter)`);
    } catch (e) {
      hata++;
      console.log(`${isletim}/${platform}: SÖZDİZİMİ HATASI — ${e.message}`);
    }
  }
  for (const [ad, kod] of Object.entries(mod.KOMUT)) {
    if (typeof kod !== "string") continue;
    sinama++;
    try {
      new Function(kod);
    } catch (e) {
      hata++;
      console.log(`${isletim}/KOMUT.${ad}: SÖZDİZİMİ HATASI — ${e.message}`);
    }
  }
}

if (!sinama) {
  console.log("hiç sınama yapılmadı");
  process.exit(1);
}
console.log(`${sinama} sınama, ${hata} hata`);
process.exit(hata ? 1 : 0);
