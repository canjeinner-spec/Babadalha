import { type ArkadasKisi } from "@/data/remote/sosyalRepo";

export const MOCK_ARKADAS_ACIK = true;

export const MOCK_GELEN_ISTEKLER: ArkadasKisi[] = [
  {
    id: -101, publicId: "deniz", ad: "Deniz", biyografi: "cuma akşamları korku, pazar sabahları anime", ozelId: "1907",
    ozelIdTip: "premium", ozelIdTema: "yakut", tarih: null, oda: null,
  },
  {
    id: -102, publicId: "melis", ad: "Melis", biyografi: "altyazıyı kapatana kızarım", ozelId: null,
    ozelIdTip: "kapsul", ozelIdTema: "emerald", tarih: null, oda: null,
  },
];

export const MOCK_GIDEN_ISTEKLER: ArkadasKisi[] = [
  {
    id: -103, publicId: "ender", ad: "Ender", biyografi: null, ozelId: null,
    ozelIdTip: null, ozelIdTema: null, tarih: null, oda: null,
  },
];

export const MOCK_ARKADASLAR: ArkadasKisi[] = [
  {
    id: -104, publicId: "ruya", ad: "Rüya", biyografi: "aynı filmi on kere izleyebilirim", ozelId: null,
    ozelIdTip: "premium", ozelIdTema: "gokkusagi", tarih: null,
    oda: { kimlik: "mock-parti", ad: "Cuma gecesi korku" },
  },
  {
    id: -105, publicId: "baris", ad: "Barış", biyografi: null, ozelId: null,
    ozelIdTip: null, ozelIdTema: null, tarih: null, oda: null,
  },
];
