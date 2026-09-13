import { router } from "expo-router";

export function geriDon(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/");
}
