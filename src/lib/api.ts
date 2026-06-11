// API client for the ksell wallet web view.
//
// This screen is opened inside the Flutter app's WebView. The native app passes
// the authentication token (and the ad request id being paid for) as query
// params on the URL, e.g.
//   /payment?token=<bearer>&ad_request_id=2971&lang=ar
// We read those once on load and use the token as a Bearer header for every
// request against the ksell API.

export const BASE_URL = 'https://ksell.net/apiv5/api';

/** Read a value from the current URL query string. */
function param(...keys: string[]): string | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  for (const key of keys) {
    const v = q.get(key);
    if (v) return v;
  }
  return null;
}

/** Bearer token supplied by the native app (query param, then storage). */
export function getToken(): string | null {
  const fromUrl = param('token', 'access_token', 'auth_token');
  if (fromUrl) {
    try {
      window.localStorage.setItem('ksell_token', fromUrl);
    } catch {
      /* ignore storage errors (private mode) */
    }
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

/** Preferred language for the API (Accept-Language). */
export function getLang(): string {
  return param('lang', 'locale') ?? 'en';
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
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': getLang(),
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
    .filter((p) => p?.description) // skip entries without plan details (e.g. "Showrooms")
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
