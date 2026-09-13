import { Image } from "expo-image";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { aktifTema, type Tema, type TemaIcerik } from "@/data/remote/temaRepo";
import { getCached, setCached, useCachedResource } from "@/lib/cache";
import { isSupabaseConfigured } from "@/lib/supabase";
import { C } from "./colors";

export const TEMA_ANAHTARI = "tema:aktif";
export const TEMA_HAZIR_ANAHTARI = "tema:hazir";

type TemaRenk = { ana: string; solgun: string; vurgu: string };

type TemaDurumu = { tema: Tema | null; ic: TemaIcerik | null; renk: TemaRenk };

export const TEMA_YAZI_GOLGESI = {
  textShadowColor: "rgba(0,0,0,.55)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 5,
} as const;

const VARSAYILAN_RENK: TemaRenk = { ana: C.text, solgun: C.dim, vurgu: C.gold };
const BOS: TemaDurumu = { tema: null, ic: null, renk: VARSAYILAN_RENK };

const Baglam = createContext<TemaDurumu>(BOS);

export function useTema(): TemaDurumu {
  return useContext(Baglam);
}

function suresiDoldu(t: Tema): boolean {
  if (!t.bitis) return false;
  const bitis = Date.parse(t.bitis);
  return Number.isFinite(bitis) && bitis <= Date.now();
}

function kritikGorseller(t: Tema): string[] {
  return [t.icerik.ustGorsel, t.icerik.navGorsel].filter((u): u is string => !!u);
}

function ikincilGorseller(t: Tema): string[] {
  const liste: (string | undefined)[] = [];
  for (const par of Object.values(t.icerik.navIkonlar ?? {})) liste.push(par.aktif, par.pasif);
  return liste.filter((u): u is string => !!u);
}

export function TemaSaglayici({ children }: { children: ReactNode }) {
  const { data } = useCachedResource<Tema | null>(TEMA_ANAHTARI, aktifTema, {
    persist: true,
    enabled: isSupabaseConfigured,
  });

  const aday = data && !suresiDoldu(data) ? data : null;
  const [hazirKod, setHazirKod] = useState<string | null>(() => getCached<string>(TEMA_HAZIR_ANAHTARI) ?? null);
  const kritik = useMemo(() => (aday ? kritikGorseller(aday) : []), [aday]);

  const { data: kayitliHazir } = useCachedResource<string | null>(
    TEMA_HAZIR_ANAHTARI,
    async () => getCached<string>(TEMA_HAZIR_ANAHTARI) ?? null,
    { persist: true },
  );

  useEffect(() => {
    if (!aday) return;
    let canli = true;
    const ikincil = ikincilGorseller(aday);
    if (ikincil.length > 0) void Image.prefetch(ikincil, { cachePolicy: "disk" }).catch(() => {});
    if (kritik.length > 0) {
      Image.prefetch(kritik, { cachePolicy: "disk" })
        .then((tamam) => {
          if (!canli) return;
          if (tamam) {
            setHazirKod(aday.kod);
            setCached(TEMA_HAZIR_ANAHTARI, aday.kod, true);
          } else if (getCached<string>(TEMA_HAZIR_ANAHTARI) === aday.kod) {
            setHazirKod(null);
            setCached<string | null>(TEMA_HAZIR_ANAHTARI, null, true);
          }
        })
        .catch(() => {});
    }
    return () => { canli = false; };
  }, [aday, kritik]);

  const etkinHazirKod = hazirKod ?? kayitliHazir ?? null;
  const hazir = !!aday && (kritik.length === 0 || etkinHazirKod === aday.kod);

  useEffect(() => {
    if (!aday?.bitis) return;
    const kalan = Date.parse(aday.bitis) - Date.now();
    if (!Number.isFinite(kalan) || kalan <= 0 || kalan > 86_400_000) return;
    const z = setTimeout(() => { setHazirKod(null); }, kalan);
    return () => { clearTimeout(z); };
  }, [aday]);

  const deger = useMemo<TemaDurumu>(() => {
    if (!aday || !hazir) return BOS;
    return {
      tema: aday,
      ic: aday.icerik,
      renk: {
        ana: aday.icerik.yaziAna ?? C.text,
        solgun: aday.icerik.yaziSolgun ?? C.dim,
        vurgu: aday.icerik.vurgu ?? C.gold,
      },
    };
  }, [aday, hazir]);

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}
