import { type Session } from "@supabase/supabase-js";
import { AppState as RNAppState } from "react-native";
import { create } from "zustand";

import { type DMThread } from "@/data/dm";
import { type Room } from "@/data/seed";
import { deleteAccount, getMyAccountBan, getSession, onAuthChange, signOut, type AccountBan } from "@/data/remote/authRepo";
import { evaluateBadges } from "@/data/remote/badgeRepo";
import { betaKapsulHatirlat, ensureMyProfile, getMyProfile } from "@/data/remote/profileRepo";
import { benimKusanilanlarim, BOS_KUSANILI, type Kusanili } from "@/data/remote/esyaRepo";
import { createRoom, getMyRoom, listRooms } from "@/data/remote/roomsRepo";
import { listPosts } from "@/data/remote/feedRepo";
import { addXp } from "@/data/remote/xpRepo";
import { cacheTemizle, prefetch, setCached } from "@/lib/cache";
import { benzersizKanalAdi, isSupabaseConfigured, supabase } from "@/lib/supabase";


function ayniOda(a: Room | null, b: Room | null): boolean {
  if (!a || !b) return false;
  if (a.dbId != null && b.dbId != null) return a.dbId === b.dbId;
  return a.id === b.id;
}

export type BroadcastData = {
  sender: string;
  senderPhoto?: string | null;
  recipient?: string;
  qty: number;
  room: Room;
  gift: { tier: "normal" | "rare" | "epic" | "legendary"; emoji: string; name: string; kod?: string };
};

export type UserRole = "user" | "developer" | "super_admin";

export function yaptirimYetkisi(r: UserRole): boolean {
  return r === "developer" || r === "super_admin";
}

export type KickedUser = {
  name: string;
  publicId?: string;
  photo?: string | null;
  by: string;
  at: number;
};

function mapRole(ekonomiRolu?: string | null): UserRole {
  if (ekonomiRolu === "super_admin" || ekonomiRolu === "developer") return ekonomiRolu;
  return "user";
}

function isStubName(ad?: string | null): boolean {
  return /^user_\d+$/.test((ad || "").trim());
}

type AppState = {
  girisYapildi: boolean;
  setGirisYapildi: (v: boolean) => void;

  session: Session | null;
  bootstrapped: boolean;
  publicId: string | null;
  dbId: number | null;
  initAuth: () => void;
  loadProfile: () => Promise<void>;
  signOutApp: () => Promise<void>;
  deleteAccountApp: () => Promise<void>;
  profilEksik: boolean | null;

  hesapYasak: AccountBan | null;
  banChecked: boolean;
  enforceAccountBan: (zorla?: boolean) => Promise<boolean>;
  clearHesapYasak: () => void;

  userName: string;
  userBio: string;
  userPhoto: string | null;
  userLevel: number;
  userXp: number;
  isStreamer: boolean;
  betaTester: boolean;
  premiumHak: boolean;
  ozelId: string | null;
  ozelIdTip: "premium" | "kapsul" | null;
  ozelIdTema: string | null;
  kusanili: Kusanili;
  kusanilanlariYenile: () => Promise<void>;
  kusanilanRozet: string | null;
  setKusanilanRozet: (kod: string | null) => void;
  role: UserRole;
  hideProfile: boolean;
  setRole: (r: UserRole) => void;
  setBetaTester: (v: boolean) => void;
  setOzelIdKimlik: (id: string | null, tip: "premium" | "kapsul" | null, tema: string | null) => void;
  setHideProfile: (v: boolean) => void;
  myRoom: Room | null;
  currentRoom: Room | null;
  inRoom: boolean;
  odaOturumu: number | null;
  koltugum: { odaId: number; koltuk: number | null; mic: boolean } | null;
  koltukYaz: (odaId: number, koltuk: number | null, mic: boolean) => void;
  girisAdayi: Room | null;
  broadcast: BroadcastData | null;
  activeDM: DMThread | null;
  setActiveDM: (d: DMThread | null) => void;

  roomName: string;
  roomAnnounce: string;
  roomLocked: boolean;
  roomPass: string;
  setRoomName: (v: string) => void;
  setRoomAnnounce: (v: string) => void;
  setRoomLocked: (v: boolean) => void;
  setRoomPass: (v: string) => void;

  kickedUsers: KickedUser[];
  kickFromRoom: (u: Omit<KickedUser, "by" | "at">, by: string) => void;
  unkickFromRoom: (name: string) => void;

  setUserName: (n: string) => void;
  setUserBio: (b: string) => void;
  setUserPhoto: (p: string | null) => void;
  setStreamer: (v: boolean) => void;

  enterRoom: (r: Room) => void;
  patchCurrentRoom: (p: Partial<Room>) => void;
  patchRoomByDbId: (dbId: number, p: Partial<Room>) => void;
  leaveRoom: () => void;
  odayaGirDene: (r: Room) => void;
  girisIptal: () => void;
  makeMyRoom: () => Room;
  openMyRoom: () => Room;
  createMyRoom: () => Promise<Room>;

  fireBroadcast: (d: BroadcastData) => void;
  clearBroadcast: () => void;
};

let bcTimer: ReturnType<typeof setTimeout> | null = null;
let authStarted = false;
let sonAuthUid: string | null = null;

let banChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
let watchedBanDbId: number | null = null;
let banPollTimer: ReturnType<typeof setInterval> | null = null;
let banYoklamaGeriCagri: (() => void) | null = null;
let banKontrolUcusta: Promise<boolean> | null = null;
const BAN_POLL_MS = 45000;
const BAN_CHECK_TIMEOUT_MS = 5000;

function startBanEnforcement(dbId: number, onChange: () => void) {
  if (!supabase) return;
  banYoklamaGeriCagri = onChange;
  if (watchedBanDbId !== dbId) {
    if (banChannel) { supabase.removeChannel(banChannel); banChannel = null; }
    watchedBanDbId = dbId;
    banChannel = supabase
      // Ad benzersiz: bir üstteki `removeChannel` ASENKRON, aynı adla hemen
      // yenisini istemek abone olmuş kanalı geri getirip `on(...)` hatası
      // verebiliyor (bkz. lib/supabase.ts benzersizKanalAdi).
      .channel(benzersizKanalAdi(`hesap-yasak-${dbId}`))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hesap_yasaklari", filter: `kullanici_id=eq.${dbId}` },
        (payload) => { if (payload.eventType !== "DELETE") onChange(); },
      )
      .subscribe();
  }
  banYoklamaKur();
}

function banYoklamaKur() {
  if (banPollTimer || !banYoklamaGeriCagri) return;
  banPollTimer = setInterval(banYoklamaGeriCagri, BAN_POLL_MS);
}
function banYoklamaDurdur() {
  if (banPollTimer) { clearInterval(banPollTimer); banPollTimer = null; }
}
function stopBanEnforcement() {
  if (supabase && banChannel) supabase.removeChannel(banChannel);
  banChannel = null;
  watchedBanDbId = null;
  banYoklamaDurdur();
  banYoklamaGeriCagri = null;
}

export const useApp = create<AppState>((set, get) => ({
  girisYapildi: false,
  setGirisYapildi: (v) => set({ girisYapildi: v }),

  session: null,
  bootstrapped: false,
  publicId: null,
  dbId: null,
  profilEksik: null,

  initAuth: () => {
    if (authStarted) return;
    authStarted = true;
    if (!isSupabaseConfigured) {
      set({ bootstrapped: true });
      return;
    }
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
    Promise.race([getSession(), timeout])
      .then((session) => {
        set({ session, girisYapildi: !!session, bootstrapped: true });
        if (session) {
          try { supabase?.realtime.setAuth(session.access_token); } catch { /* yoksay */ }
          get().loadProfile();
          get().enforceAccountBan();
          addXp("gunluk_giris").then((g) => { if (g > 0) get().loadProfile(); });
          prefetch("rooms:list", () => listRooms(), true);
          listPosts().then(({ posts }) => setCached("feed:db", posts, true)).catch(() => {});
          getMyRoom().then((r) => { if (r) set({ myRoom: r }); }).catch(() => {});
        }
      })
      .catch(() => set({ bootstrapped: true }));

    onAuthChange(async (session) => {
      const uid = session?.user?.id ?? null;
      const kullaniciDegisti = uid !== sonAuthUid;
      sonAuthUid = uid;
      set({
        session,
        girisYapildi: !!session,
        ...(kullaniciDegisti ? { banChecked: !session } : null),
      });
      if (session) {
        try { supabase?.realtime.setAuth(session.access_token); } catch { /* yoksay */ }
        get().enforceAccountBan(true);
        await get().loadProfile();
        getMyRoom().then((r) => { if (r) set({ myRoom: r }); }).catch(() => {});
      } else {
        stopBanEnforcement();
        set({ profilEksik: null, myRoom: null });
      }
    });

    if (RNAppState?.addEventListener) {
      RNAppState.addEventListener("change", (s) => {
        if (s === "active") {
          if (get().session) get().enforceAccountBan(true);
          banYoklamaKur();
        } else {
          banYoklamaDurdur();
        }
      });
    }
  },

  hesapYasak: null,
  banChecked: false,
  clearHesapYasak: () => set({ hesapYasak: null }),
  enforceAccountBan: async (zorla = false) => {
    if (banKontrolUcusta && !zorla) return banKontrolUcusta;
    banKontrolUcusta = (async () => {
    try {
      const t0 = Date.now();
      const ban = await Promise.race([
        getMyAccountBan(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), BAN_CHECK_TIMEOUT_MS)),
      ]);
      const sure = Date.now() - t0;
      if (!get().banChecked || !!ban !== !!get().hesapYasak || sure > 1500) {
        console.log(`[acilis] yasak kontrolu bitti (${sure}ms) ban=${ban ? "VAR" : "yok"}`);
      }
      if (ban) {
        stopBanEnforcement();
        await signOut().catch(() => {});
        cacheTemizle();
        set({
          hesapYasak: ban,
          banChecked: true,
          session: null,
          girisYapildi: false,
          publicId: null,
          dbId: null,
          role: "user",
          profilEksik: null,
          inRoom: false,
          currentRoom: null,
          girisAdayi: null,
        });
        return true;
      }
      set({ banChecked: true });
    } catch {
      set({ banChecked: true });
    }
    return false;
    })().finally(() => { banKontrolUcusta = null; });
    return banKontrolUcusta;
  },

  loadProfile: async () => {
    try {
      let p = await getMyProfile();
      if (!p) {
        try {
          await ensureMyProfile();
        } catch {
          await new Promise((r) => setTimeout(r, 800));
        }
        p = await getMyProfile();
      }
      if (!p) return;
      set({
        userName: p.kullanici_adi || get().userName,
        userBio: p.biyografi || "",
        userPhoto: p.profil_resmi || null,
        userLevel: p.seviye_id ?? 1,
        userXp: p.deneyim_puani ?? 0,
        publicId: p.public_id || null,
        dbId: p.id ?? null,
        role: mapRole(p.ekonomi_rolu),
        betaTester: !!p.beta_tester,
        premiumHak: !!p.premium_hak,
        ozelId: p.ozel_id ?? null,
        ozelIdTip: p.ozel_id_tip ?? null,
        ozelIdTema: p.ozel_id_tema ?? null,
        ...(p.kusanilan_rozet !== undefined ? { kusanilanRozet: p.kusanilan_rozet } : null),
        profilEksik: isStubName(p.kullanici_adi), // register gerekiyor mu?
      });
      if (p.id != null) startBanEnforcement(p.id, () => get().enforceAccountBan());
      if (p.beta_tester && !p.ozel_id) betaKapsulHatirlat().catch(() => {});
      evaluateBadges().catch(() => {});
      get().kusanilanlariYenile();
    } catch {
      // sessizce geç — oturum geçerli, profil sonradan yüklenebilir
    }
  },

  kusanilanlariYenile: async () => {
    const k = await benimKusanilanlarim().catch(() => null);
    if (k) set({ kusanili: k });
  },

  signOutApp: async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
    cacheTemizle();
    set({
      session: null,
      girisYapildi: false,
      publicId: null,
      dbId: null,
      userName: "Sen",
      userBio: "",
      userPhoto: null,
      userLevel: 1,
      userXp: 0,
      role: "user",
      profilEksik: null,
      myRoom: null,
    });
  },

  deleteAccountApp: async () => {
    await deleteAccount();
    set({
      session: null,
      girisYapildi: false,
      publicId: null,
      dbId: null,
      userName: "Sen",
      userBio: "",
      userPhoto: null,
      userLevel: 1,
      userXp: 0,
      role: "user",
      profilEksik: null,
      myRoom: null,
    });
  },

  userName: "Sen",
  userBio: "",
  userPhoto: null,
  userLevel: 1,
  userXp: 0,
  isStreamer: false,
  betaTester: false,
  premiumHak: false,
  ozelId: null,
  ozelIdTip: null,
  ozelIdTema: null,
  kusanilanRozet: null,
  role: "user",
  hideProfile: false,
  setRole: (r) => set({ role: r }),
  setHideProfile: (v) => set({ hideProfile: v }),
  myRoom: null,
  currentRoom: null,
  inRoom: false,
  odaOturumu: null,
  koltugum: null,
  koltukYaz: (odaId, koltuk, mic) => set({ koltugum: { odaId, koltuk, mic } }),
  girisAdayi: null,
  kusanili: { ...BOS_KUSANILI },
  broadcast: null,
  activeDM: null,
  setActiveDM: (d) => set({ activeDM: d }),

  roomName: "",
  roomAnnounce: "",
  roomLocked: false,
  roomPass: "",
  setRoomName: (v) => set({ roomName: v }),
  setRoomAnnounce: (v) => set({ roomAnnounce: v }),
  setRoomLocked: (v) => set({ roomLocked: v }),
  setRoomPass: (v) => set({ roomPass: v }),

  kickedUsers: [],
  kickFromRoom: (u, by) =>
    set((s) => ({
      kickedUsers: [
        { ...u, by, at: Date.now() },
        ...s.kickedUsers.filter((k) => k.name !== u.name),
      ],
    })),
  unkickFromRoom: (name) =>
    set((s) => ({ kickedUsers: s.kickedUsers.filter((k) => k.name !== name) })),

  setUserName: (n) => set({ userName: n }),
  setUserBio: (b) => set({ userBio: b }),
  setUserPhoto: (p) => set({ userPhoto: p }),
  setStreamer: (v) => set({ isStreamer: v }),
  setBetaTester: (v) => set({ betaTester: v }),
  setOzelIdKimlik: (id, tip, tema) => set({ ozelId: id, ozelIdTip: tip, ozelIdTema: tema }),
  setKusanilanRozet: (kod) => set({ kusanilanRozet: kod }),

  enterRoom: (r) =>
    set((s) => ({
      currentRoom: r,
      inRoom: true,
      odaOturumu: s.inRoom && ayniOda(s.currentRoom, r) ? s.odaOturumu : Date.now(),
      girisAdayi: null,
      roomName: r.name,
      roomAnnounce: r.announce || (r.official ? "Resmî odaya hoş geldiniz! Lütfen nazik olun, keyifli sohbetler dileriz." : "Herkes davetli, saygıyı koru 🌙"),
      roomLocked: !!r.locked,
      roomPass: r.pass || "",
      kickedUsers: [],
    })),
  patchCurrentRoom: (p) =>
    set((s) => {
      const guncel = s.currentRoom ? { ...s.currentRoom, ...p } : s.currentRoom;
      const benimOdam =
        !!guncel && !!s.myRoom &&
        (s.myRoom.dbId != null ? s.myRoom.dbId === guncel.dbId : s.myRoom.id === guncel.id);
      return {
        currentRoom: guncel,
        ...(benimOdam ? { myRoom: { ...s.myRoom!, ...p } } : null),
        ...(p.name != null ? { roomName: p.name } : {}),
        ...(p.announce != null ? { roomAnnounce: p.announce } : {}),
      };
    }),
  patchRoomByDbId: (dbId, p) =>
    set((s) => {
      const guncelMi = (r: Room | null) => !!r && r.dbId === dbId;
      const yeniCurrent = guncelMi(s.currentRoom) ? { ...s.currentRoom!, ...p } : s.currentRoom;
      return {
        currentRoom: yeniCurrent,
        ...(guncelMi(s.myRoom) ? { myRoom: { ...s.myRoom!, ...p } } : null),
        ...(guncelMi(s.currentRoom) && p.name != null ? { roomName: p.name } : {}),
        ...(guncelMi(s.currentRoom) && p.announce !== undefined ? { roomAnnounce: p.announce || "" } : {}),
      };
    }),
  leaveRoom: () => set({ inRoom: false, currentRoom: null, odaOturumu: null, girisAdayi: null, koltugum: null }),
  odayaGirDene: (r) => set({ girisAdayi: r }),
  girisIptal: () => set({ girisAdayi: null }),

  makeMyRoom: () => {
    const { userName, userPhoto } = get();
    const r: Room = {
      id: String(Math.floor(100000 + Math.random() * 899999)),
      name: `${userName} Odası`,
      host: "Sen",
      online: 1,
      mic: 1,
      extra: 0,
      live: true,
      scene: "club",
      locked: false,
      owner: true,
      crowd: ["Sen"],
      photo: userPhoto || undefined,
    };
    set({ myRoom: r });
    return r;
  },

  openMyRoom: () => {
    const { myRoom, makeMyRoom, enterRoom } = get();
    const r = myRoom || makeMyRoom();
    enterRoom(r);
    return r;
  },

  createMyRoom: async () => {
    const { userName, userPhoto, enterRoom, makeMyRoom } = get();
    if (isSupabaseConfigured && get().session) {
      const r = (await getMyRoom()) ?? (await createRoom({ name: `${userName} Odası`, photo: userPhoto || null }));
      set({ myRoom: r });
      enterRoom(r);
      return r;
    }
    const r = makeMyRoom();
    enterRoom({ ...r, photo: userPhoto || r.photo });
    return r;
  },

  fireBroadcast: (d) => {
    set({ broadcast: d });
    if (bcTimer) clearTimeout(bcTimer);
    bcTimer = setTimeout(() => set({ broadcast: null }), 16500);
  },
  clearBroadcast: () => {
    if (bcTimer) clearTimeout(bcTimer);
    set({ broadcast: null });
  },
}));
