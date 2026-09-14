import { type ArkadasKisi } from "@/data/remote/sosyalRepo";

export const MOCK_ARKADAS_ACIK = true;

export const MOCK_GELEN_ISTEKLER: ArkadasKisi[] = [
  {
    id: -101, publicId: "deniz", ad: "Deniz", ozelId: "1907",
    ozelIdTip: "premium", ozelIdTema: "yakut", tarih: null,
  },
  {
    id: -102, publicId: "melis", ad: "Melis", ozelId: null,
    ozelIdTip: "kapsul", ozelIdTema: "emerald", tarih: null,
  },
];

export const MOCK_GIDEN_ISTEKLER: ArkadasKisi[] = [
  {
    id: -103, publicId: "ender", ad: "Ender", ozelId: null,
    ozelIdTip: null, ozelIdTema: null, tarih: null,
  },
];

export const MOCK_ARKADASLAR: ArkadasKisi[] = [
  {
    id: -104, publicId: "ruya", ad: "Rüya", ozelId: null,
    ozelIdTip: "premium", ozelIdTema: "gokkusagi", tarih: null,
  },
  {
    id: -105, publicId: "baris", ad: "Barış", ozelId: null,
    ozelIdTip: null, ozelIdTema: null, tarih: null,
  },
];
