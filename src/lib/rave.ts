import { nativeOynaticiVar, raveTokenAyarla } from "../../modules/aron-player/src";

let denendi = false;

export async function raveTokeniYukle(): Promise<void> {
  if (denendi || !nativeOynaticiVar()) return;
  denendi = true;
  const parseToken = process.env.EXPO_PUBLIC_RAVE_TOKEN ?? null;
  const refreshToken = process.env.EXPO_PUBLIC_RAVE_REFRESH ?? null;
  const clientId = process.env.EXPO_PUBLIC_RAVE_CLIENT_ID ?? null;
  const clientSecret = process.env.EXPO_PUBLIC_RAVE_CLIENT_SECRET ?? null;
  if (!parseToken && !refreshToken) return;
  await raveTokenAyarla(parseToken, refreshToken, clientId, clientSecret);
}
