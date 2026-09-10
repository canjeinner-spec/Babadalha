import { PermissionsAndroid, Platform } from "react-native";
import {
  AudioAinsMode,
  AudioProfileType,
  AudioScenarioType,
  ChannelProfileType,
  ClientRoleType,
  ConnectionStateType,
  VoiceBeautifierPreset,
  createAgoraRtcEngine,
  type AudioVolumeInfo,
  type IRtcEngine,
  type IRtcEngineEventHandler,
} from "react-native-agora";

import { agoraJetonuAl, type KonusanDinleyici, type RtcKatilim, type RtcMotoru } from "@/lib/rtc";

export type SesAyari = {
  profil: AudioProfileType;
  senaryo: AudioScenarioType;
  guzellestirici: VoiceBeautifierPreset;
  gurultuBastirma: boolean;
  gurultuKipi: AudioAinsMode;
};

export const STUDYO_SESI: SesAyari = {
  profil: AudioProfileType.AudioProfileMusicHighQuality,
  senaryo: AudioScenarioType.AudioScenarioGameStreaming,
  guzellestirici: VoiceBeautifierPreset.UltraHighQualityVoice,
  gurultuBastirma: true,
  gurultuKipi: AudioAinsMode.AinsModeBalanced,
};

const SES_OLCUM_ARALIGI_MS = 400;
const SES_YUMUSATMA = 3;
const KONUSMA_ESIGI = 12;
const YEREL_UID = 0;

function ayniKume(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

async function androidMikrofonIzni(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  const sonuc = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return sonuc === PermissionsAndroid.RESULTS.GRANTED;
}

export class AgoraRtcMotoru implements RtcMotoru {
  readonly ad = "agora";

  constructor(private readonly ses: SesAyari = STUDYO_SESI) {}

  private _motor: IRtcEngine | null = null;
  private _kuruldu = false;
  private _bagli = false;
  private _kanal: string | null = null;
  private _uid = 0;
  private _yayinci = false;
  private _mic = false;
  private _micIstendi = false;
  private _hoparlor = true;

  private _baglantiDurumu: ConnectionStateType = ConnectionStateType.ConnectionStateDisconnected;
  private _yerelKonusuyor = false;
  private _uzakKonusanlar = new Set<number>();
  private _sonYayin = new Set<number>();
  private _dinleyiciler = new Set<KonusanDinleyici>();

  get bagli() { return this._bagli; }

  private olaylar: IRtcEngineEventHandler = {
    onAudioVolumeIndication: (_baglanti, konusanlar: AudioVolumeInfo[]) => {
      const liste = konusanlar ?? [];
      const yerelGeriCagri = liste.length === 1 && (liste[0]?.uid ?? YEREL_UID) === YEREL_UID;
      if (yerelGeriCagri) {
        this._yerelKonusuyor = this._mic && (liste[0]?.volume ?? 0) >= KONUSMA_ESIGI;
      } else {
        const yeni = new Set<number>();
        for (const k of liste) {
          const uid = k.uid ?? YEREL_UID;
          if (uid !== YEREL_UID && (k.volume ?? 0) >= KONUSMA_ESIGI) yeni.add(uid);
        }
        this._uzakKonusanlar = yeni;
      }
      this.konusanlariYayinla();
    },
    onUserOffline: (_baglanti, uid) => {
      if (!this._uzakKonusanlar.has(uid)) return;
      this._uzakKonusanlar.delete(uid);
      this.konusanlariYayinla();
    },
    onConnectionStateChanged: (_baglanti, durum) => {
      this._baglantiDurumu = durum;
      if (durum === ConnectionStateType.ConnectionStateFailed) {
        console.warn("[rtc-agora] baglanti basarisiz, motor serbest birakiliyor");
        this._bagli = false;
        this._yerelKonusuyor = false;
        this._uzakKonusanlar = new Set();
        this.konusanlariYayinla();
        return;
      }
      if (durum === ConnectionStateType.ConnectionStateReconnecting) {
        this._yerelKonusuyor = false;
        this._uzakKonusanlar = new Set();
        this.konusanlariYayinla();
      }
    },
    onRejoinChannelSuccess: () => { void this.jetonuYenile(); },
    onTokenPrivilegeWillExpire: () => { void this.jetonuYenile(); },
    onRequestToken: () => { void this.jetonuYenile(); },
    onError: (kod, mesaj) => { console.warn("[rtc-agora] hata:", kod, mesaj); },
  };

  private konusanlariYayinla() {
    const kume = new Set(this._uzakKonusanlar);
    if (this._yerelKonusuyor && this._uid > 0) kume.add(this._uid);
    if (ayniKume(kume, this._sonYayin)) return;
    this._sonYayin = kume;
    for (const d of this._dinleyiciler) d(new Set(kume));
  }

  private sesDurumunuUygula() {
    const motor = this._motor;
    if (!motor) return;
    const yayinlansin = this._yayinci && this._mic;
    motor.enableLocalAudio(this._yayinci);
    motor.muteLocalAudioStream(!yayinlansin);
    motor.muteAllRemoteAudioStreams(!this._hoparlor);
    if (Platform.OS === "android") motor.setEnableSpeakerphone(true);
  }

  private async jetonuYenile() {
    if (!this._kanal || !this._motor) return;
    try {
      const bilgi = await agoraJetonuAl(this._kanal);
      if (bilgi.jeton) this._motor.renewToken(bilgi.jeton);
    } catch (e) {
      console.warn("[rtc-agora] jeton yenilenemedi:", (e as Error)?.message || e);
    }
  }

  private motoruKur(appId: string) {
    if (!this._motor) this._motor = createAgoraRtcEngine();
    if (this._kuruldu) return this._motor;
    this._motor.initialize({ appId, channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting });
    this._motor.registerEventHandler(this.olaylar);
    this._motor.enableAudio();
    this._motor.setAudioProfile(this.ses.profil, this.ses.senaryo);
    this._motor.setVoiceBeautifierPreset(this.ses.guzellestirici);
    this._motor.setAINSMode(this.ses.gurultuBastirma, this.ses.gurultuKipi);
    this._motor.enableAudioVolumeIndication(SES_OLCUM_ARALIGI_MS, SES_YUMUSATMA, true);
    if (Platform.OS === "android") this._motor.setDefaultAudioRouteToSpeakerphone(true);
    this._kuruldu = true;
    return this._motor;
  }

  async katil(katilim: RtcKatilim) {
    this._bagli = true;
    this._kanal = katilim.kanal;
    this._uid = katilim.uid;
    this._yayinci = katilim.yayinci;
    if (!this._micIstendi) this._mic = katilim.yayinci;
    try {
      if (katilim.yayinci && !(await androidMikrofonIzni())) throw new Error("Mikrofon izni verilmedi");
      const bilgi = await agoraJetonuAl(katilim.kanal);
      if (!bilgi.appId) throw new Error("Sunucu appId dondurmedi");
      const motor = this.motoruKur(bilgi.appId);
      motor.joinChannel(bilgi.jeton ?? "", katilim.kanal, katilim.uid, {
        clientRoleType: katilim.yayinci ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience,
        publishMicrophoneTrack: katilim.yayinci,
        publishCameraTrack: false,
        autoSubscribeAudio: this._hoparlor,
        autoSubscribeVideo: false,
      });
      this.sesDurumunuUygula();
    } catch (e) {
      this._bagli = false;
      this._kanal = null;
      throw e;
    }
  }

  async ayril() {
    this._bagli = false;
    this._kanal = null;
    this._yayinci = false;
    this._mic = false;
    this._micIstendi = false;
    this._yerelKonusuyor = false;
    this._uzakKonusanlar = new Set();
    this.konusanlariYayinla();
    this._motor?.leaveChannel();
  }

  async micAyarla(acik: boolean) {
    this._mic = acik;
    this._micIstendi = true;
    if (!acik) { this._yerelKonusuyor = false; this.konusanlariYayinla(); }
    this.sesDurumunuUygula();
  }

  async hoparlorAyarla(acik: boolean) {
    this._hoparlor = acik;
    if (!this._motor) return;
    this._motor.muteAllRemoteAudioStreams(!acik);
    if (this._bagli) this._motor.updateChannelMediaOptions({ autoSubscribeAudio: acik });
  }

  async rolAyarla(yayinci: boolean) {
    if (this._yayinci === yayinci) return;
    this._yayinci = yayinci;
    if (!yayinci) { this._yerelKonusuyor = false; this.konusanlariYayinla(); }
    this._motor?.updateChannelMediaOptions({
      clientRoleType: yayinci ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience,
      publishMicrophoneTrack: yayinci,
    });
    this.sesDurumunuUygula();
  }

  aktifKonusanlariDinle(dinleyici: KonusanDinleyici) {
    this._dinleyiciler.add(dinleyici);
    dinleyici(new Set(this._sonYayin));
    return () => { this._dinleyiciler.delete(dinleyici); };
  }

  durum() {
    return {
      ad: this.ad, bagli: this._bagli, kanal: this._kanal, uid: this._uid,
      yayinci: this._yayinci, mic: this._mic, hoparlor: this._hoparlor,
      baglantiDurumu: this._baglantiDurumu,
      konusanlar: [...this._sonYayin], ses: this.ses,
    };
  }
}
