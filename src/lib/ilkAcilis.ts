import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Guvenli from "expo-secure-store";

const KARSILAMA = "aron.karsilama.goruldu";
const GIRIS = "aron.giris.atlandi";
const PREMIUM = "aron.premium.goruldu";
const KURALLAR = "aron.kurallar.goruldu";

export const OTURUMLUK = __DEV__;

const oturum = { karsilama: false, giris: false, premium: false, kurallar: false };

async function oku(anahtar: string): Promise<boolean> {
  try {
    if (await Guvenli.getItemAsync(anahtar)) return true;
  } catch { /* yoksay */ }
  try {
    if (await AsyncStorage.getItem(anahtar)) return true;
  } catch { /* yoksay */ }
  return false;
}

async function yaz(anahtar: string): Promise<void> {
  try {
    await Guvenli.setItemAsync(anahtar, "1");
  } catch { /* yoksay */ }
  try {
    await AsyncStorage.setItem(anahtar, "1");
  } catch { /* yoksay */ }
}

export async function karsilamaGoruldu(): Promise<boolean> {
  if (OTURUMLUK) return oturum.karsilama;
  return oku(KARSILAMA);
}

export async function karsilamayiIsaretle(): Promise<void> {
  oturum.karsilama = true;
  if (!OTURUMLUK) await yaz(KARSILAMA);
}

export async function girisEkraniGecildi(): Promise<boolean> {
  if (OTURUMLUK) return oturum.giris;
  return oku(GIRIS);
}

export async function girisEkraniniGec(): Promise<void> {
  oturum.giris = true;
  if (!OTURUMLUK) await yaz(GIRIS);
}

export async function premiumGoruldu(): Promise<boolean> {
  if (OTURUMLUK) return oturum.premium;
  return oku(PREMIUM);
}

export async function premiumuIsaretle(): Promise<void> {
  oturum.premium = true;
  if (!OTURUMLUK) await yaz(PREMIUM);
}

export async function kurallarGoruldu(): Promise<boolean> {
  if (OTURUMLUK) return oturum.kurallar;
  return oku(KURALLAR);
}

export async function kurallariIsaretle(): Promise<void> {
  oturum.kurallar = true;
  if (!OTURUMLUK) await yaz(KURALLAR);
}
