export interface EsimPackage {
  id: number;
  name: string;
  region: string;
  flag: string;
  data: string;
  duration: string;
  price: number;
  currency: string;
  highlight: boolean;
  description: string;
  airalo_package_id?: string;
  country_code?: string;
  networks?: string;
  package_type?: string;
  net_price?: number;
  sms?: number;
  voice?: number;
  visible?: boolean;
  category?: string;
}

export interface Order {
  id: number;
  package_id: number;
  email: string;
  status: string;
  payment_status: string;
  qr_data: string | null;
  created_at: string;
  package_name: string;
  package_flag: string;
  package_price?: number;
  airalo_order_id?: string;
  iccid?: string;
  esim_status?: string;
  qr_code_url?: string;
  activation_code?: string;
  customer_name?: string;
  phone?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://shqiponja-esim-production.up.railway.app"
    : "http://localhost:3001");
const API_TIMEOUT = 30_000; // 30 seconds

function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function getPackages(): Promise<EsimPackage[]> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/packages`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getPackagesByCountry(countryCode: string): Promise<EsimPackage[]> {
  if (!countryCode || countryCode.trim().length !== 2) return [];
  try {
    const res = await fetchWithTimeout(
      `${API_URL}/api/packages?country=${encodeURIComponent(countryCode.trim().toUpperCase())}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getFeaturedPackages(): Promise<EsimPackage[]> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/packages/featured`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export interface Destination {
  destination_id: string;
  flag: string;
  region: string;
  country_code: string | null;
  min_price: number;
  package_count: number;
  popular: boolean;
  name: string;
}

export async function getDestinations(): Promise<Destination[]> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/packages/destinations`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export interface CoverageCountry {
  country_code: string;
  name: string;
  flag: string;
  min_price: number;
  package_count: number;
  category: string;
}

export async function getCoverageCountries(): Promise<CoverageCountry[]> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/packages/countries`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Backend returns { countries: { category: [...] }, global_count: N }
    // Flatten into a single array
    if (data && typeof data === "object" && data.countries) {
      return Object.values(data.countries as Record<string, CoverageCountry[]>).flat();
    }
    // Fallback: if it ever returns a plain array
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

export async function searchPackages(q: string): Promise<EsimPackage[]> {
  if (!q || q.trim().length < 2) return [];
  try {
    const res = await fetchWithTimeout(
      `${API_URL}/api/packages/search?q=${encodeURIComponent(q.trim())}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export interface ExchangeRates {
  eur_to_all: number;
  base: string;
  rates: Record<string, number>;
  updated_at: string | null;
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/rates`, { cache: "no-store" });
    if (!res.ok) return { eur_to_all: 109, base: "EUR", rates: { EUR: 1, ALL: 109, USD: 1.09, GBP: 0.86 }, updated_at: null };
    return res.json();
  } catch {
    return { eur_to_all: 109, base: "EUR", rates: { EUR: 1, ALL: 109, USD: 1.09, GBP: 0.86 }, updated_at: null };
  }
}

export async function getPackageById(id: number): Promise<EsimPackage | null> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/packages/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface CheckoutResponse {
  url?: string;
  clientSecret?: string;
  orderId?: number;
  order?: Order;
  accessToken?: string;
}

export interface CountryInfo {
  country_code: string;
  name: string;
  flag: string;
  min_price: number;
  package_count: number;
}

export interface CountriesByContinent {
  countries: Record<string, CountryInfo[]>;
  global_count: number;
}

export async function getCountriesByContinent(): Promise<CountriesByContinent> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/packages/countries`, {
      cache: "no-store",
    });
    if (!res.ok) return { countries: {}, global_count: 0 };
    return res.json();
  } catch {
    return { countries: {}, global_count: 0 };
  }
}

export async function checkout(
  packageId: number,
  email: string,
  customerName?: string,
  phone?: string,
  promoCode?: string
): Promise<CheckoutResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const jwt = localStorage.getItem("token");
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
  }
  const res = await fetchWithTimeout(`${API_URL}/api/checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify({ packageId, email, customerName, phone, promoCode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Checkout failed" }));
    throw new Error(err.error);
  }
  return res.json();
}

export interface PromoResult {
  valid: boolean;
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
}

export async function validatePromo(code: string, packagePrice: number): Promise<PromoResult> {
  const res = await fetchWithTimeout(`${API_URL}/api/promo/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, packagePrice }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Invalid promo code" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function getOrderById(id: number, token?: string): Promise<Order | null> {
  try {
    const url = token
      ? `${API_URL}/api/orders/${id}?token=${encodeURIComponent(token)}`
      : `${API_URL}/api/orders/${id}`;
    const headers: Record<string, string> = {};
    // Send JWT if available (for logged-in users accessing their own orders)
    if (typeof window !== "undefined") {
      const jwt = localStorage.getItem("token");
      if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
    }
    const res = await fetchWithTimeout(url, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface UsageData {
  total: number;
  remaining: number;
  used: number;
  unit: string;
  expired_at?: string;
  status?: string;
}

export async function getOrderUsage(id: number): Promise<UsageData | null> {
  try {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const jwt = localStorage.getItem("token");
      if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
    }
    const res = await fetchWithTimeout(`${API_URL}/api/orders/${id}/usage`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.usage || null;
  } catch {
    return null;
  }
}

/* ─── Auth ─── */

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  email_verified: number;
  created_at: string;
  oauth_provider?: string;
  sms_2fa_enabled?: number;
  masked_phone?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  requires2FA?: boolean;
  requiresSms2FA?: boolean;
  maskedPhone?: string;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Regjistrimi dështoi" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function login(
  email: string,
  password: string,
  totpCode?: string,
  smsCode?: string
): Promise<AuthResponse> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, totpCode, smsCode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Hyrja dështoi" }));
    throw new Error(err.error);
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function getMe(token: string): Promise<User> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, "Nuk je i kyçur");
  return res.json();
}

export async function verifyEmail(verifyToken: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: verifyToken }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Verifikimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function resendVerification(token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/resend-verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

/* ─── OAuth ─── */

export interface OAuthProviders {
  google: boolean;
  microsoft: boolean;
  apple: boolean;
  facebook: boolean;
  googleClientId: string | null;
  microsoftClientId: string | null;
  appleClientId: string | null;
  facebookAppId: string | null;
}

export async function getOAuthProviders(): Promise<OAuthProviders> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/oauth/providers`);
  if (!res.ok) return { google: false, microsoft: false, apple: false, facebook: false, googleClientId: null, microsoftClientId: null, appleClientId: null, facebookAppId: null };
  return res.json();
}

export async function oauthGoogle(idToken: string): Promise<AuthResponse> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/oauth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Google login dështoi" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function oauthMicrosoft(code: string, redirectUri: string): Promise<AuthResponse> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/oauth/microsoft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Microsoft login dështoi" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function oauthFacebook(code: string, redirectUri: string): Promise<AuthResponse> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/oauth/facebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Facebook login dështoi" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function oauthApple(idToken: string, code: string, user?: { name?: { firstName?: string; lastName?: string } }): Promise<AuthResponse> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/oauth/apple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, code, user }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Apple login dështoi" }));
    throw new Error(err.error);
  }
  return res.json();
}

/* ─── Admin helpers ─── */

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function adminGetStats(token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/stats`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json() as Promise<{ totalOrders: number; paidOrders: number; totalRevenue: number; totalUsers: number; totalPackages: number; monthlyRevenue: { month: string; revenue: number; orders: number }[]; monthlyUsers: { month: string; users: number }[] }>;
}

export interface SyncStatus { at: string; count: number; error: string | null }
export interface AdminCronStatus {
  enabled: boolean;
  intervalMs: number;
  retryMs: number;
  staleAfterMs: number;
  lastSync: SyncStatus | null;
}
export async function getHealthStatus(): Promise<{ status: string; uptime: number; build: string; lastSync: SyncStatus | null }> {
  const res = await fetchWithTimeout(`${API_URL}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health fetch failed");
  return res.json();
}

export async function adminGetCronStatus(token: string): Promise<AdminCronStatus> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/cron-status`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Cron status fetch failed");
  return res.json();
}

export interface PaginatedUsers { users: User[]; total: number; page: number; totalPages: number }
export async function adminGetUsers(token: string, page = 1, q = ''): Promise<PaginatedUsers> {
  const params = new URLSearchParams({ page: String(page) });
  if (q.trim()) params.set('q', q.trim());
  const res = await fetchWithTimeout(`${API_URL}/api/admin/users?${params}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminUpdateUserRole(token: string, userId: number, role: string): Promise<User> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/users/${userId}/role`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ role }) });
  if (!res.ok) throw new Error("Ndryshimi dështoi");
  return res.json();
}

export async function adminDeleteUser(token: string, userId: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/users/${userId}`, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Fshirja dështoi" })); throw new Error(e.error); }
  return res.json();
}

export interface MarketingResult { sent: number; failed: number; total: number; message?: string }
export async function adminSendMarketing(
  token: string,
  data: { type: 'email' | 'sms'; subject?: string; message: string; userIds?: number[] }
): Promise<MarketingResult> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/marketing/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Dërgimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export interface TwilioBalance { balance: number; currency: string; accountName: string }
export async function adminGetTwilioBalance(token: string): Promise<TwilioBalance> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/twilio-balance`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Bilanci nuk u ngarkua");
  return res.json();
}

export interface PaginatedOrders { orders: Order[]; total: number; page: number; totalPages: number }
export async function adminGetOrders(token: string, page = 1, filters?: { status?: string; payment_status?: string; q?: string }): Promise<PaginatedOrders> {
  const params = new URLSearchParams({ page: String(page) });
  if (filters?.status) params.set('status', filters.status);
  if (filters?.payment_status) params.set('payment_status', filters.payment_status);
  if (filters?.q?.trim()) params.set('q', filters.q.trim());
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders?${params}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminUpdateOrderStatus(token: string, orderId: number, data: { status?: string; payment_status?: string }) {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${orderId}/status`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Ndryshimi dështoi");
  return res.json();
}

export interface PaginatedPackages {
  packages: EsimPackage[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetPackages(token: string, page = 1, limit = 50, q = "", visible?: 0 | 1, countryCode?: string): Promise<PaginatedPackages> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q.trim()) params.set("q", q.trim());
  if (visible !== undefined) params.set("visible", String(visible));
  if (countryCode !== undefined) params.set("country_code", countryCode);
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages?${params}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminTogglePackageVisible(token: string, id: number, visible: boolean): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}/visible`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ visible }) });
  if (!res.ok) throw new Error("Ndryshimi dështoi");
  return res.json();
}

export async function adminTogglePackageHighlight(token: string, id: number, highlight: boolean): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}/highlight`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ highlight }) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Ndryshimi dështoi" })); throw new Error(e.error || "Ndryshimi dështoi"); }
  return res.json();
}

export async function adminSetCategory(token: string, id: number, category: string): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}/category`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ category }) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Ndryshimi dështoi" })); throw new Error(e.error || "Ndryshimi dështoi"); }
  return res.json();
}

export async function adminCreatePackage(token: string, data: Omit<EsimPackage, "id">): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages`, { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Krijimi dështoi");
  return res.json();
}

export async function adminUpdatePackage(token: string, id: number, data: Omit<EsimPackage, "id">): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}`, { method: "PUT", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Përditësimi dështoi");
  return res.json();
}

export async function adminDeletePackage(token: string, id: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}`, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) throw new Error("Fshirja dështoi");
  return res.json();
}

export interface CountryGroup {
  country_code: string;
  region: string;
  flag: string;
  country_name: string;
  total: number;
  visible_count: number;
  category: string;
}

export async function adminGetCountries(token: string): Promise<CountryGroup[]> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages-countries`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminBulkUpdate(token: string, body: { action: string; ids?: number[]; country_code?: string; category?: string }): Promise<{ updated: number }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages-bulk`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Veprimi dështoi" })); throw new Error(e.error || "Veprimi dështoi"); }
  return res.json();
}

export async function adminAutoCategorize(token: string): Promise<{ updated: number; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages-auto-categorize`, { method: "POST", headers: authHeaders(token) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Kategorizimi dështoi" })); throw new Error(e.error || "Kategorizimi dështoi"); }
  return res.json();
}

/* ─── 2FA ─── */

export async function twoFactorSetup(token: string): Promise<{ secret: string; qrCode: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/2fa/setup`, { method: "POST", headers: authHeaders(token) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Setup dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function twoFactorVerifySetup(token: string, code: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/2fa/verify-setup`, { method: "POST", headers: authHeaders(token), body: JSON.stringify({ code }) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Verifikimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function twoFactorDisable(token: string, code: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/2fa/disable`, { method: "POST", headers: authHeaders(token), body: JSON.stringify({ code }) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Çaktivizimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function twoFactorStatus(token: string): Promise<{ enabled: boolean }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/2fa/status`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

/* ─── User orders ─── */

export async function getMyOrders(token: string): Promise<Order[]> {
  const res = await fetchWithTimeout(`${API_URL}/api/orders/my`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

/* ─── Forgot / Reset password ─── */

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: "Kërkesa dështoi" }));
    throw new Error(e.error);
  }
  return res.json();
}

export async function resetPassword(token: string, password: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Rivendosja dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Contact ─── */

export async function submitContact(name: string, email: string, message: string): Promise<{ ok: boolean }> {
  const res = await fetchWithTimeout(`${API_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Dërgimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Profile update ─── */

export async function updateProfile(token: string, name: string): Promise<User> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/update-profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Përditësimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Ndryshimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── SMS 2FA ─── */

export async function sendSms2FACode(token: string, phone: string): Promise<{ ok: boolean }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/sms-2fa/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Dërgimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function enableSms2FA(token: string, phone: string, code: string): Promise<{ ok: boolean }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/sms-2fa/enable`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Aktivizimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function disableSms2FA(token: string): Promise<{ ok: boolean }> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/sms-2fa/disable`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Deaktivizimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Admin: Customers ─── */

export interface Customer {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export interface CustomerDetail extends Customer {
  orders: Order[];
}

export interface PaginatedCustomers { customers: Customer[]; total: number; page: number; totalPages: number }
export async function adminGetCustomers(token: string, page = 1, q = ''): Promise<PaginatedCustomers> {
  const params = new URLSearchParams({ page: String(page) });
  if (q.trim()) params.set('q', q.trim());
  const res = await fetchWithTimeout(`${API_URL}/api/admin/customers?${params}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminGetCustomerDetail(token: string, id: number): Promise<CustomerDetail> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/customers/${id}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

/* ─── Admin: Order Detail + Resend eSIM ─── */

export interface OrderDetail extends Order {
  package_price: number;
  package_data: string;
  package_duration: string;
  airalo_package_id: string | null;
  user_name: string | null;
  user_email: string | null;
  access_token: string | null;
}

export async function adminGetOrderDetail(token: string, id: number): Promise<OrderDetail> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${id}/detail`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminResendEsim(token: string, orderId: number): Promise<{ ok: boolean; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${orderId}/resend-esim`, { method: "POST", headers: authHeaders(token) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Ridërgimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Referrals ─── */

/* ─── Admin: Promo Codes ─── */

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_order: number;
  active: number;
  expires_at: string | null;
  created_at: string;
}

export async function adminGetPromoCodes(token: string): Promise<PromoCode[]> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/promo-codes`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminCreatePromoCode(token: string, data: { code: string; discount_type: string; discount_value: number; max_uses?: number | null; min_order?: number; expires_at?: string | null }): Promise<PromoCode> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/promo-codes`, { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Gabim" })); throw new Error(e.error); }
  return res.json();
}

export async function adminUpdatePromoCode(token: string, id: number, data: { active?: boolean; max_uses?: number | null; expires_at?: string | null }): Promise<PromoCode> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/promo-codes/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Gabim" })); throw new Error(e.error); }
  return res.json();
}

export async function adminDeletePromoCode(token: string, id: number): Promise<void> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/promo-codes/${id}`, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) throw new Error("Fshirja dështoi");
}

/* ─── Admin: Referrals ─── */

export interface AdminReferral {
  id: number;
  referrer_id: number;
  referrer_name: string;
  referrer_email: string;
  referrer_code: string;
  referred_id: number;
  referred_name: string;
  referred_email: string;
  order_id: number | null;
  reward_type: string;
  reward_value: number;
  status: string;
  created_at: string;
}

export interface AdminReferralStats {
  referrals: AdminReferral[];
  total: number;
  page: number;
  totalPages: number;
  summary: { totalReferrals: number; completed: number; totalRewards: number };
}

export async function adminGetReferrals(token: string, page = 1, status = ''): Promise<AdminReferralStats> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set('status', status);
  const res = await fetchWithTimeout(`${API_URL}/api/admin/referrals?${params}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminUpdateReferralStatus(token: string, id: number, status: string): Promise<AdminReferral> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/referrals/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ status }) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Gabim" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Admin: Webhook Logs ─── */

export interface AdminWebhookLog {
  id: number;
  source: string;
  event_type: string;
  order_id: number | null;
  status: "received" | "success" | "failed";
  error: string | null;
  created_at: string;
  payload_preview?: string;
  payload?: string;
  external_event_id?: string | null;
}

export interface AdminWebhookLogList {
  logs: AdminWebhookLog[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetWebhookLogs(token: string, page = 1, status = "", eventType = ""): Promise<AdminWebhookLogList> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  if (eventType) params.set("event_type", eventType);
  const res = await fetchWithTimeout(`${API_URL}/api/admin/webhook-logs?${params}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function adminGetWebhookLog(token: string, id: number): Promise<AdminWebhookLog> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/webhook-logs/${id}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Log-u nuk u gjet" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Referrals ─── */

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  stats: {
    totalReferred: number;
    completedReferrals: number;
    totalEarnings: number;
    totalRewardsGb?: number;
  };
  rewards?: Array<{
    id: number;
    amount: number;
    kind: string;
    status: string;
    note?: string;
    orderId?: number;
    createdAt: string;
    direction?: "referrer" | "friend";
  }>;
}

export async function getMyReferral(token: string): Promise<ReferralStats> {
  const res = await fetchWithTimeout(`${API_URL}/api/referrals/my`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export async function applyReferralCode(token: string, referralCode: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/referrals/apply`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ referralCode }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Aplikimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Compatibility ─── */

export interface CompatibleDeviceMatch {
  brand: string;
  model: string;
}

export interface CompatibilityCheckResponse {
  compatible: boolean;
  query: string;
  confidence: number;
  matches: CompatibleDeviceMatch[];
  cached?: boolean;
}

export async function getCompatibilityBrands(): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/compatibility/brands`, { cache: "force-cache" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getCompatibilityDevices(brand: string): Promise<string[]> {
  if (!brand.trim()) return [];
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/compatibility/devices?brand=${encodeURIComponent(brand.trim())}`, {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function checkDeviceCompatibility(query: string): Promise<CompatibilityCheckResponse> {
  const q = query.trim();
  if (!q) return { compatible: false, query, confidence: 0, matches: [] };

  const res = await fetchWithTimeout(`${API_URL}/api/compatibility/check?q=${encodeURIComponent(q)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return { compatible: false, query, confidence: 0, matches: [] };
  }
  return res.json();
}

/* ─── Avatars ─── */

export interface EagleAvatarAsset {
  key: string;
  name: string;
  role: string;
  region: string;
  useCase: string;
  prompt: string;
  imageData: string;
}

export async function getAvatarTeam(): Promise<EagleAvatarAsset[]> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/avatars/team`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

/* ─── Admin: Fulfill awaiting_esim order ─── */
export async function adminFulfillEsim(
  token: string,
  orderId: number,
  data: { iccid?: string; qr_data?: string; qr_code_url?: string; activation_code?: string }
): Promise<{ ok: boolean; order: Order }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${orderId}/fulfill`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Fulfillimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Admin: Provision eSIM via Airalo (auto) ─── */
export async function adminProvisionEsim(
  token: string,
  orderId: number
): Promise<{ ok: boolean; order: Order }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${orderId}/provision`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Provizioni dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Admin: Refund order via Stripe ─── */
export async function adminRefundOrder(
  token: string,
  orderId: number
): Promise<{ ok: boolean; refundId: string; status: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${orderId}/refund`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Rimbursimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function adminDeletePendingOrders(
  token: string
): Promise<{ ok: boolean; deleted: number; ids: number[] }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/pending`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Fshirja dështoi" })); throw new Error(e.error); }
  return res.json();
}

/* ─── Admin: Webhook Logs ─── */

/** @deprecated Use adminGetWebhookLog */
export const adminGetWebhookLogDetail = adminGetWebhookLog;

/* ─── Newsletter ─── */
export async function subscribeNewsletter(email: string, locale: string): Promise<{ ok: boolean }> {
  const res = await fetchWithTimeout(`${API_URL}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, locale }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Regjistrimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  locale: string;
  subscribed_at: string;
}

export interface PaginatedNewsletterSubscribers {
  subscribers: NewsletterSubscriber[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetNewsletterSubscribers(token: string, page = 1): Promise<PaginatedNewsletterSubscribers> {
  const res = await fetchWithTimeout(`${API_URL}/api/newsletter/subscribers?page=${page}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Nuk ke qasje");
  return res.json();
}

export interface BroadcastResult {
  sent: number;
  failed: number;
  total: number;
  message?: string;
  errors?: { email: string; error: string }[];
}

export interface BrevoSetupResult {
  newsletterListId: number;
  usersListId: number;
  subscribersSynced: number;
  usersSynced: number;
  message: string;
}

export interface BrevoContactsResult {
  newsletterListId: number | null;
  usersListId: number | null;
  newsletterEmails: string[];
  userEmails: string[];
}

export async function adminBroadcastNewsletter(
  token: string,
  subject: string,
  bodyHtml: string,
  locale?: "sq" | "en" | "all"
): Promise<BroadcastResult> {
  const res = await fetchWithTimeout(`${API_URL}/api/newsletter/broadcast`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ subject, bodyHtml, locale: locale === "all" ? undefined : locale }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Dërgimi dështoi" })); throw new Error(e.error); }
  return res.json();
}

export async function adminBrevoSetup(token: string): Promise<BrevoSetupResult> {
  const url = `${API_URL}/api/newsletter/brevo-setup`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `HTTP ${res.status} @ ${url}`;
    try { const j = JSON.parse(text); msg = j.error || msg; } catch { msg = `${msg} — ${text.slice(0, 80)}`; }
    throw new Error(msg);
  }
  return res.json();
}

export async function adminGetBrevoContacts(token: string): Promise<BrevoContactsResult> {
  const res = await fetchWithTimeout(`${API_URL}/api/newsletter/brevo-contacts`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: "Nuk u lexuan kontaktet nga Brevo" }));
    throw new Error(e.error);
  }
  return res.json();
}
