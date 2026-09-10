import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const android = Platform.OS === "android";

const yut = () => {};

export const haptic = {
  select: () =>
    android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick).catch(yut)
      : Haptics.selectionAsync().catch(yut),

  medium: () =>
    android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(yut)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(yut),

  heavy: () =>
    android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press).catch(yut)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(yut),

  success: () =>
    android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(yut)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(yut),

  warning: () =>
    android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject).catch(yut)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(yut),
};
