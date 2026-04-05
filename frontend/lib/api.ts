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
  paddle_transaction_id: string | null;
  ls_order_id: string | null;
  qr_data: string | null;
  created_at: string;
  package_name: string;
  package_flag: string;
  airalo_order_id?: string;
  iccid?: string;
  esim_status?: string;
  qr_code_url?: string;
  activation_code?: string;
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
  orderId?: number;
  order?: Order;
}

export async function checkout(
  packageId: number,
  email: string
): Promise<CheckoutResponse> {
  const res = await fetchWithTimeout(`${API_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageId, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Checkout failed" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function getOrderById(id: number): Promise<Order | null> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/orders/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ─── Auth ─── */

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified: number;
  created_at: string;
  oauth_provider?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  requires2FA?: boolean;
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
  totpCode?: string
): Promise<AuthResponse> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, totpCode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Hyrja dështoi" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function getMe(token: string): Promise<User> {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Nuk je i kyçur");
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

export async function adminGetPackages(token: string, page = 1, limit = 50, q = "", visible?: 0 | 1): Promise<PaginatedPackages> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q.trim()) params.set("q", q.trim());
  if (visible !== undefined) params.set("visible", String(visible));
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
