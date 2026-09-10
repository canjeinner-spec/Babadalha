import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Guvenli from "expo-secure-store";

const ANAHTAR = "aron.karsilama.goruldu";

export async function karsilamaGoruldu(): Promise<boolean> {
  try {
    if (await Guvenli.getItemAsync(ANAHTAR)) return true;
  } catch { /* yoksay */ }
  try {
    if (await AsyncStorage.getItem(ANAHTAR)) return true;
  } catch { /* yoksay */ }
  return false;
}

export async function karsilamayiIsaretle(): Promise<void> {
  try {
    await Guvenli.setItemAsync(ANAHTAR, "1");
  } catch { /* yoksay */ }
  try {
    await AsyncStorage.setItem(ANAHTAR, "1");
  } catch { /* yoksay */ }
}
