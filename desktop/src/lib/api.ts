const API_URL = "https://shqiponja-esim-production.up.railway.app";
const TIMEOUT = 30_000;

function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ─── Auth ─────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified: number;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  requires2FA?: boolean;
}

export async function login(email: string, password: string, totpCode?: string): Promise<AuthResponse> {
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
  });
  if (!res.ok) throw new Error("Session expired");
  return res.json();
}

// ─── Admin Stats ──────────────────────────────────
export interface AdminStats {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalUsers: number;
  recentOrders: Order[];
  dailyRevenue: { date: string; revenue: number; count: number }[];
}

export async function adminGetStats(token: string): Promise<AdminStats> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/stats`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Stats fetch failed");
  return res.json();
}

// ─── Orders ───────────────────────────────────────
export interface Order {
  id: number;
  package_id: number;
  email: string;
  status: string;
  payment_status: string;
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

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetOrders(token: string, page = 1, filters?: { status?: string; payment_status?: string; q?: string }): Promise<PaginatedOrders> {
  const params = new URLSearchParams({ page: String(page) });
  if (filters?.status) params.set("status", filters.status);
  if (filters?.payment_status) params.set("payment_status", filters.payment_status);
  if (filters?.q) params.set("q", filters.q);
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders?${params}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Orders fetch failed");
  return res.json();
}

export async function adminUpdateOrderStatus(token: string, orderId: number, data: { status?: string; payment_status?: string }) {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export interface OrderDetail extends Order {
  package_price?: number;
  package_data?: string;
  package_duration?: string;
  airalo_package_id?: string;
  user_name?: string;
  user_email?: string;
  access_token?: string;
}

export async function adminGetOrderDetail(token: string, id: number): Promise<OrderDetail> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${id}/detail`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Order detail fetch failed");
  return res.json();
}

export async function adminResendEsim(token: string, orderId: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/orders/${orderId}/resend-esim`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Resend failed" }));
    throw new Error(err.error);
  }
  return res.json();
}

// ─── Packages ─────────────────────────────────────
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
  visible?: boolean;
  category?: string;
}

export interface PaginatedPackages {
  packages: EsimPackage[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetPackages(token: string, page = 1, limit = 50, q = "", visible?: 0 | 1, category?: string): Promise<PaginatedPackages> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  if (visible !== undefined) params.set("visible", String(visible));
  if (category) params.set("category", category);
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages?${params}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Packages fetch failed");
  return res.json();
}

export async function adminToggleVisible(token: string, id: number, visible: boolean): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}/visible`, {
    method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ visible }),
  });
  if (!res.ok) throw new Error("Toggle failed");
  return res.json();
}

export async function adminToggleHighlight(token: string, id: number, highlight: boolean): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}/highlight`, {
    method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ highlight }),
  });
  if (!res.ok) throw new Error("Toggle failed");
  return res.json();
}

export async function adminUpdateCategory(token: string, id: number, category: string): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}/category`, {
    method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error("Category update failed");
  return res.json();
}

export async function adminUpdatePackage(token: string, id: number, data: Partial<EsimPackage>): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}`, {
    method: "PUT", headers: authHeaders(token), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function adminDeletePackage(token: string, id: number): Promise<void> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages/${id}`, {
    method: "DELETE", headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Delete failed");
}

export async function adminCreatePackage(token: string, data: Partial<EsimPackage>): Promise<EsimPackage> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}

export async function adminAutoCategories(token: string): Promise<{ updated: number; message: string }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/packages-auto-categorize`, {
    method: "POST", headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Auto-categorize failed");
  return res.json();
}

// ─── Customers ────────────────────────────────────
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

export interface PaginatedCustomers {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetCustomers(token: string, page = 1, q = ""): Promise<PaginatedCustomers> {
  const params = new URLSearchParams({ page: String(page) });
  if (q) params.set("q", q);
  const res = await fetchWithTimeout(`${API_URL}/api/admin/customers?${params}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Customers fetch failed");
  return res.json();
}

export async function adminGetCustomerDetail(token: string, id: number): Promise<CustomerDetail> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/customers/${id}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Customer detail failed");
  return res.json();
}

// ─── Webhook Logs ─────────────────────────────────
export interface WebhookLog {
  id: number;
  source: string;
  event_type: string;
  order_id: number | null;
  payload_preview?: string;
  payload?: string;
  status: string;
  error: string | null;
  created_at: string;
}

export interface PaginatedWebhookLogs {
  logs: WebhookLog[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetWebhookLogs(token: string, page = 1, status = ""): Promise<PaginatedWebhookLogs> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  const res = await fetchWithTimeout(`${API_URL}/api/admin/webhook-logs?${params}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Webhook logs fetch failed");
  return res.json();
}

export async function adminGetWebhookLogDetail(token: string, id: number): Promise<WebhookLog> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/webhook-logs/${id}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Webhook log detail failed");
  return res.json();
}
