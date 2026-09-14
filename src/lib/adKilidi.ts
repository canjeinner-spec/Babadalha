import AsyncStorage from "@react-native-async-storage/async-storage";

const ANAHTAR = "aron.kullaniciAdi.sonDegisim";
export const AD_KILIT_SURESI = 7 * 24 * 60 * 60 * 1000;

export async function adKilidiKalan(): Promise<number> {
  try {
    const ham = await AsyncStorage.getItem(ANAHTAR);
    if (!ham) return 0;
    const kalan = Number(ham) + AD_KILIT_SURESI - Date.now();
    return kalan > 0 ? kalan : 0;
  } catch {
    return 0;
  }
}

export async function adKilidiKur(): Promise<void> {
  try {
    await AsyncStorage.setItem(ANAHTAR, String(Date.now()));
  } catch {
    /* yoksay */
  }
}
