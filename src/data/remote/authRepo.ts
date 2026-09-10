import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { type Session } from "@supabase/supabase-js";

import { requireSupabase, supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signUpWithEmail(email: string, password: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function changeMyPassword(mevcut: string, yeni: string): Promise<void> {
  const sb = requireSupabase();
  const { data: { user } } = await sb.auth.getUser();
  const email = user?.email;
  if (!email) throw new Error("Bu hesapta e-posta yok; şifre buradan değiştirilemiyor.");

  const { error: dogrulama } = await sb.auth.signInWithPassword({ email, password: mevcut });
  if (dogrulama) throw new Error("Mevcut şifren hatalı.");

  const { error } = await sb.auth.updateUser({ password: yeni });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const sb = requireSupabase();
  const redirectTo = makeRedirectUri();
  console.log("[auth] Google redirectTo:", redirectTo);

  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Google giriş URL'i alınamadı.");

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== "success" || !res.url) {
    throw new Error(
      `Google girişi tamamlanamadı. Tarayıcı "${redirectTo}" adresine geri dönmedi. ` +
        "Bu adres Supabase → Authentication → URL Configuration → Redirect URLs " +
        "listesinde değilse Supabase Site URL'e (localhost) düşer ve sayfa orada kalır.",
    );
  }

  const errDesc = extractParam(res.url, "error_description") || extractParam(res.url, "error");
  if (errDesc) throw new Error(decodeURIComponent(errDesc.replace(/\+/g, " ")));

  const access_token = extractParam(res.url, "access_token");
  const refresh_token = extractParam(res.url, "refresh_token");
  if (access_token && refresh_token) {
    const { data: sess, error: setErr } = await sb.auth.setSession({ access_token, refresh_token });
    if (setErr) throw setErr;
    return sess;
  }

  const code = extractParam(res.url, "code");
  if (code) {
    const { data: sess, error: exErr } = await sb.auth.exchangeCodeForSession(code);
    if (exErr) throw exErr;
    return sess;
  }

  throw new Error("Google oturum bilgisi alınamadı.");
}

function extractParam(rawUrl: string, key: string): string | null {
  const m = rawUrl.match(new RegExp("[?#&]" + key + "=([^&]+)"));
  return m ? m[1] : null;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export type AccountBan = { sebep: string | null; bitis: number | null };

export async function getMyAccountBan(): Promise<AccountBan | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("benim_hesap_yasagim");
  if (error) {
    console.warn("[hesapYasak] benim_hesap_yasagim RPC hatası:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { sebep: row.sebep ?? null, bitis: row.bitis ? new Date(row.bitis).getTime() : null };
}

export async function deleteAccount(): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("hesabimi_sil");
  if (error) throw error;
  await signOut();
}
