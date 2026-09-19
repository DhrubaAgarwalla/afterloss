// Read-only Gmail search that runs entirely in this browser.
// Google Identity Services gives a short-lived access token (about 1 hour) for one account at a time; the
// family can connect as many accounts as they like. Tokens stay in memory, are never sent to our servers,
// and are revoked on "Disconnect". Only what the family taps "Add" on is saved to the case.
import { config } from "./config";
import { type Finding, findingsFor, type Meta, SOURCES } from "./gmailScan";

declare global {
  interface Window {
    google?: any;
  }
}

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export type GmailAccount = { email: string; token: string; expiresAt: number };

export const gmailAvailable = () => Boolean(config.googleClientId);

let gisLoad: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisLoad ??= new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => {
      gisLoad = null;
      fail(new Error("Couldn't load Google sign-in. Check your connection and try again."));
    };
    document.head.appendChild(s);
  });
  return gisLoad;
}

let client: any = null;
let pending: { ok: (r: any) => void; fail: (e: Error) => void } | null = null;

/** Load Google's script early, so the click can open the account chooser right away (no popup blocker). */
export async function prepareGmail(): Promise<void> {
  if (!gmailAvailable() || client) return;
  await loadGis();
  client = window.google.accounts.oauth2.initTokenClient({
    client_id: config.googleClientId,
    scope: GMAIL_SCOPE,
    callback: (resp: any) => {
      const p = pending;
      pending = null;
      if (!p) return;
      if (resp.error) p.fail(new Error(resp.error_description || resp.error));
      else if (!window.google.accounts.oauth2.hasGrantedAllScopes(resp, GMAIL_SCOPE))
        p.fail(new Error("Please allow 'Read your email' on Google's screen, so we can search it."));
      else p.ok(resp);
    },
    error_callback: (err: any) => {
      const p = pending;
      pending = null;
      p?.fail(new Error(err?.type === "popup_closed" ? "The Google window was closed." : err?.message || "Google sign-in didn't finish."));
    },
  });
}

/** Opens Google's account chooser. Call it straight from a click. */
export function connectGmail(): Promise<GmailAccount> {
  if (!client) return Promise.reject(new Error("Google sign-in is still loading. Try again in a second."));
  return new Promise((ok, fail) => {
    pending = {
      fail,
      ok: async (resp) => {
        try {
          const profile = await gget(resp.access_token, "profile");
          ok({ email: profile.emailAddress, token: resp.access_token, expiresAt: Date.now() + (Number(resp.expires_in) || 3600) * 1000 });
        } catch (e) {
          fail(e as Error);
        }
      },
    };
    client.requestAccessToken({ prompt: "select_account" });
  });
}

export function disconnectGmail(acc: GmailAccount): void {
  try {
    window.google?.accounts?.oauth2?.revoke(acc.token, () => {});
  } catch {
    /* already expired */
  }
}

async function gget(token: string, path: string, attempt = 0): Promise<any> {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) throw new Error("Gmail access expired. Connect the account again.");
  if ((r.status === 429 || r.status === 403 || r.status >= 500) && attempt < 4) {
    // per-user rate limit (250 units/s) or a hiccup: back off and retry
    await new Promise((ok) => setTimeout(ok, 400 * 2 ** attempt + Math.random() * 200));
    return gget(token, path, attempt + 1);
  }
  if (!r.ok) throw new Error(`Gmail said ${r.status}. Try again in a minute.`);
  return r.json();
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Runs every search on one account. Reads only the From, Subject and Date headers of a few messages each. */
export async function scanGmail(acc: GmailAccount, onProgress?: (done: number, total: number) => void): Promise<Finding[]> {
  let done = 0;
  const results = await mapLimit(SOURCES, 3, async (src) => {
    const list = await gget(acc.token, `messages?q=${encodeURIComponent(src.q)}&maxResults=${src.bySender ? 15 : 1}`);
    const ids: string[] = (list.messages ?? []).map((m: any) => m.id);
    const metas: Meta[] = await mapLimit(ids, 3, async (id) => {
      const m = await gget(acc.token, `messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
      const hs = m.payload?.headers ?? [];
      const get = (n: string) => hs.find((h: any) => h.name.toLowerCase() === n.toLowerCase())?.value ?? "";
      return { from: get("From"), subject: get("Subject"), date: get("Date") || new Date(Number(m.internalDate || 0)).toISOString() };
    });
    onProgress?.(++done, SOURCES.length);
    return findingsFor(src, metas, Number(list.resultSizeEstimate || ids.length), acc.email);
  });
  return results.flat();
}
