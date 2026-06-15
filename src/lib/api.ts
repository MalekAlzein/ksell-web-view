// API client for the ksell wallet web view.
//
// This screen is opened inside the Flutter app's WebView. The native app hands
// the auth token to this page in one of three ways (most → least secure):
//   1. Inject it into storage (token never touches the URL, logs or Referer):
//        controller.runJavaScript("localStorage.setItem('ksell_token','<t>')")
//   2. Pass it in the URL *fragment* — never sent to the server, so it stays
//      out of access logs:  /#/plans?token=<bearer>&ad_request_id=2971&lang=ar
//   3. Pass it in the query string (legacy; visible in server access logs):
//        /plans?token=<bearer>&ad_request_id=2971&lang=ar
// However it arrives, we cache it in localStorage, strip it from the visible
// URL, and send it as a Bearer header on every request to the ksell API.

export const BASE_URL = 'https://ksell.net/apiv5/api';

const TOKEN_KEYS = ['token', 'access_token', 'auth_token'];

/**
 * Read a value from the URL — both the real query string (?a=b) and any query
 * embedded in the hash fragment (#/route?a=b). The fragment is never sent to
 * the server, so it is the safer place for the native app to carry the token.
 */
function param(...keys: string[]): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const sources = [
    new URLSearchParams(window.location.search),
    new URLSearchParams(hashQuery),
  ];
  for (const q of sources) {
    for (const key of keys) {
      const v = q.get(key);
      if (v) return v;
    }
  }
  return null;
}

/** Remove the token from the visible query string once we've captured it. */
function scrubTokenFromUrl(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  const search = new URLSearchParams(window.location.search);
  let changed = false;
  for (const key of TOKEN_KEYS) {
    if (search.has(key)) {
      search.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const qs = search.toString();
  const newUrl = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
  window.history.replaceState(null, '', newUrl);
}

/** Bearer token supplied by the native app (URL, then storage). */
export function getToken(): string | null {
  const fromUrl = param(...TOKEN_KEYS);
  if (fromUrl) {
    try {
      window.localStorage.setItem('ksell_token', fromUrl);
    } catch {
      /* ignore storage errors (private mode) */
    }
    scrubTokenFromUrl();
    return fromUrl;
  }
  try {
    const stored = window.localStorage.getItem('ksell_token');
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

/** The ad request being paid for. PDF references /pay-ad-request-quote-flutter/2971. */
export function getAdRequestId(): string {
  return param('ad_request_id', 'adRequestId', 'request_id') ?? '2971';
}

/** The plan/package id chosen on the Select Plan screen (passed as ?plan=). */
export function getSelectedPlanId(): string | null {
  return param('plan', 'plan_id', 'setting_id');
}

/** Raw language code as passed in the URL (ar / en / fa for Kurdish). */
export function getLang(): string {
  return param('lang', 'locale') ?? 'en';
}

/**
 * Language code the ksell backend expects in the `lang` request header. Its
 * three languages are en / ar / fr — where **fr means Kurdish** (the app's
 * Kurdish locale is `fa`, mapped to `fr` here, exactly like the Flutter
 * `currentLang()` helper does).
 */
export function apiLang(): string {
  const raw = getLang().toLowerCase();
  if (raw.startsWith('ar')) return 'ar';
  if (
    raw.startsWith('fa') ||
    raw.startsWith('fr') ||
    raw.startsWith('ku') ||
    raw.startsWith('ckb')
  ) {
    return 'fr';
  }
  return 'en';
}

/**
 * YouTube showcase link supplied by the native app via the WebView URL, e.g.
 *   /plans?token=<bearer>&showcase_url=https://youtu.be/abc123
 * Mirrors the Flutter `ShowCaseRequestYoutubeLink` Remote Config value, which
 * the native app reads and forwards to this WebView.
 */
export function getShowcaseUrl(): string | null {
  return param('showcase_url', 'youtube_url', 'video_url');
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = getToken();
  const lang = apiLang();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // The ksell backend reads the language from the `lang` header (en/ar/fr);
    // Accept-Language is sent too for good measure.
    lang,
    'Accept-Language': lang,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload: any = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  // The API sometimes returns 200 with { status: false, message }.
  const apiSaysFailed =
    payload && typeof payload === 'object' && payload.status === false;

  if (!res.ok || apiSaysFailed) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String(payload.message)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.-]/g, ''));
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Types (shaped from real API responses)
// ---------------------------------------------------------------------------

/** An ad package / plan returned by GET /settings. */
export interface AdPackage {
  id: number;
  /** Display label, e.g. "THE". */
  label: string;
  /** Number of stars parsed from the name. */
  stars: number;
  /** Price in IQD. */
  fees: number;
  /** Feature lines (excluding the price line). */
  features: string[];
  recommended: boolean;
  recommendNote?: string;
  raw: any;
}

export interface Quote {
  amount: number;
  currency?: string;
  plan_name?: string;
  ad_request_id?: number;
}

export interface WalletBalance {
  balance: number;
  currency?: string;
}

export interface TransferCompany {
  id: number;
  name: string;
  /** Deep link to open the company's transfer app (may be null). */
  app_link?: string | null;
  /** The account number to transfer money to. */
  account_number?: string | null;
  image?: string | null;
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  reason?: string;
  ad_request_id?: number | null;
  transfer_company_id?: number | null;
  created_at?: string;
}

export interface WalletHistoryPage {
  total_balance: number;
  currency?: string;
  transactions: WalletTransaction[];
  current_page: number;
  last_page: number;
}

const STAR = '⭐';

/** GET /settings — the list of ad packages shown on the Select Plan screen. */
export async function fetchAdPackages(): Promise<AdPackage[]> {
  const raw: any = await request<any>('GET', 'settings');
  const list: any[] = raw?.settings?.data ?? raw?.data ?? [];
  return list
    .filter((p) => p && String(p?.name ?? '').trim() !== '')
    .map((p) => {
      const name: string = p?.name ?? '';
      const stars = (name.match(new RegExp(STAR, 'g')) ?? []).length;
      const label = name.replace(new RegExp(`\\s*${STAR}+\\s*`, 'g'), '').trim() || 'THE';

      const lines: string[] = String(p?.description ?? '')
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*[-•]\s*/, '').trim())
        .filter(Boolean);

      let recommendNote: string | undefined;
      const features: string[] = [];
      for (const line of lines) {
        if (/^price/i.test(line)) continue; // shown separately from `fees`
        if (/\(\(\(.*\)\)\)/.test(line)) {
          recommendNote = line.replace(/[()]/g, '').trim();
          continue;
        }
        if (/recommend|most selected/i.test(line)) {
          recommendNote = line;
          continue;
        }
        features.push(line);
      }

      return {
        id: toNumber(p?.id),
        label,
        stars,
        fees: toNumber(p?.fees),
        features,
        recommended: !!recommendNote,
        recommendNote,
        raw: p,
      };
    });
}

/** Payment: GET /pay-ad-request-quote-flutter/{adRequestId} — selected plan value. */
export async function fetchQuote(adRequestId = getAdRequestId()): Promise<Quote> {
  const raw: any = await request<any>('GET', `pay-ad-request-quote-flutter/${adRequestId}`);
  const q = raw?.data ?? raw;
  return {
    amount: toNumber(q?.amount ?? q?.price ?? q?.total ?? q?.fees ?? q?.quote),
    currency: q?.currency ?? 'IQD',
    plan_name: q?.plan_name ?? q?.name,
    ad_request_id: toNumber(q?.ad_request_id ?? adRequestId),
  };
}

/** Payment: GET /wallet-balance-flutter — wallet balance value. */
export async function fetchWalletBalance(): Promise<WalletBalance> {
  const raw: any = await request<any>('GET', 'wallet-balance-flutter');
  return {
    balance: toNumber(raw?.balance ?? raw?.wallet_balance ?? raw?.data?.balance),
    currency: raw?.currency ?? raw?.data?.currency ?? 'IQD',
  };
}

/** Payment: GET /transfer-companies-list */
export async function fetchTransferCompanies(): Promise<TransferCompany[]> {
  const raw: any = await request<any>('GET', 'transfer-companies-list');
  const list: any[] = raw?.transfer_companies ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
  return list.map((c) => ({
    id: toNumber(c?.id),
    name: c?.name ?? c?.title ?? `Company #${c?.id}`,
    app_link: c?.app_link ?? c?.app_url ?? c?.url ?? c?.link ?? null,
    account_number: c?.account_number ?? c?.number ?? null,
    image: c?.image ?? c?.logo ?? null,
  }));
}

/** Option 1: pay the plan straight from the wallet balance. PUT. */
export async function payWithWallet(adRequestId = getAdRequestId()): Promise<{ message?: string }> {
  return request('PUT', 'pay-ad-request-with-wallet-flutter', {
    ad_request_id: Number(adRequestId),
  });
}

/** Option 3: top up the wallet via a transfer company. POST. */
export async function submitTopUp(args: {
  amount: number;
  transferCompanyId: number;
}): Promise<{ message?: string; redirect_url?: string }> {
  return request('POST', 'submit-top-up-flutter', {
    amount: args.amount,
    transfer_company_id: args.transferCompanyId,
  });
}

/** Transaction history: GET /wallet-history-flutter?page=N */
export async function fetchWalletHistory(page = 1): Promise<WalletHistoryPage> {
  const raw: any = await request<any>('GET', `wallet-history-flutter?page=${page}`);
  // Real shape: { transactions: { data: [...], current_page, last_page }, balance, currency }
  const paginator = raw?.transactions ?? raw?.data ?? raw;
  const txRaw: any[] = Array.isArray(paginator)
    ? paginator
    : paginator?.data ?? [];

  const transactions: WalletTransaction[] = txRaw.map((t) => ({
    id: toNumber(t?.id),
    type: String(t?.type ?? t?.direction ?? (toNumber(t?.amount) >= 0 ? 'in' : 'out')),
    amount: toNumber(t?.amount),
    reason: t?.reason ?? t?.description ?? t?.note,
    ad_request_id: t?.ad_request_id ?? null,
    transfer_company_id: t?.transfer_company_id ?? null,
    created_at: t?.created_at ?? t?.date,
  }));

  return {
    total_balance: toNumber(raw?.balance ?? raw?.total_balance ?? paginator?.total_balance),
    currency: raw?.currency ?? 'IQD',
    transactions,
    current_page: toNumber(paginator?.current_page ?? page, page),
    last_page: toNumber(paginator?.last_page ?? page, page),
  };
}

/** Normalize a transaction type to inbound/outbound for the UI. */
export function isInbound(t: WalletTransaction): boolean {
  const ty = t.type.toLowerCase();
  if (ty.includes('in') || ty.includes('credit') || ty.includes('top')) return true;
  if (ty.includes('out') || ty.includes('debit') || ty.includes('pay')) return false;
  return t.amount >= 0;
}
