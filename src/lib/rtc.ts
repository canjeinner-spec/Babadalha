import { NativeModules, TurboModuleRegistry } from "react-native";

import { requireSupabase } from "@/lib/supabase";

export type RtcKatilim = {
  kanal: string;
  uid: number;
  yayinci: boolean;
  jeton?: string | null;
};

export type KonusanDinleyici = (uidler: Set<number>) => void;

export interface RtcMotoru {
  readonly ad: string;
  readonly bagli: boolean;
  katil(katilim: RtcKatilim): Promise<void>;
  ayril(): Promise<void>;
  micAyarla(acik: boolean): Promise<void>;
  hoparlorAyarla(acik: boolean): Promise<void>;
  uzakSesSeviyesi(deger: number): Promise<void>;
  rolAyarla(yayinci: boolean): Promise<void>;
  aktifKonusanlariDinle(dinleyici: KonusanDinleyici): () => void;
}

export class BosRtcMotoru implements RtcMotoru {
  readonly ad = "bos";
  private _bagli = false;
  private _kanal: string | null = null;
  private _yayinci = false;
  private _mic = false;
  private _hoparlor = true;

  get bagli() { return this._bagli; }

  async katil(katilim: RtcKatilim) {
    this._bagli = true;
    this._kanal = katilim.kanal;
    this._yayinci = katilim.yayinci;
  }

  async ayril() {
    this._bagli = false;
    this._kanal = null;
    this._yayinci = false;
    this._mic = false;
  }

  async micAyarla(acik: boolean) { this._mic = acik; }
  async hoparlorAyarla(acik: boolean) { this._hoparlor = acik; }
  async uzakSesSeviyesi(_deger: number) {}
  async rolAyarla(yayinci: boolean) { this._yayinci = yayinci; }

  aktifKonusanlariDinle(_dinleyici: KonusanDinleyici) {
    return () => {};
  }

  durum() {
    return { ad: this.ad, bagli: this._bagli, kanal: this._kanal, yayinci: this._yayinci, mic: this._mic, hoparlor: this._hoparlor };
  }
}

let _motor: RtcMotoru | null = null;

export function agoraNativeVar(): boolean {
  try {
    if (TurboModuleRegistry.get?.("AgoraRtcNg")) return true;
    return !!NativeModules.AgoraRtcNg;
  } catch {
    return false;
  }
}

function agoraMotoruDene(): RtcMotoru | null {
  if (!agoraNativeVar()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const modul = require("@/lib/rtcAgora") as typeof import("@/lib/rtcAgora");
    return new modul.AgoraRtcMotoru();
  } catch (e) {
    console.warn("[rtc] agora yuklenemedi, bos motora dusuldu:", (e as Error)?.message || e);
    return null;
  }
}

export function rtcMotoruGetir(): RtcMotoru {
  if (!_motor) _motor = agoraMotoruDene() ?? new BosRtcMotoru();
  return _motor;
}

export function rtcKanalAdi(dbId: number): string {
  return `room-${dbId}`;
}

export type AgoraJetonu = {
  jeton: string | null;
  sonaErer: number | null;
  appId: string | null;
  uid: number;
};

export async function agoraJetonuAl(kanal: string): Promise<AgoraJetonu> {
  const sb = requireSupabase();
  const { data, error } = await sb.functions.invoke("agora-token", { body: { kanal } });
  if (error) throw error;
  return data as AgoraJetonu;
}
