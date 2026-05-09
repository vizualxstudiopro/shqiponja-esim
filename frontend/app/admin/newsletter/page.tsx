"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetNewsletterSubscribers,
  adminBroadcastNewsletter,
  adminBrevoSetup,
  type NewsletterSubscriber,
  type BroadcastResult,
  type BrevoSetupResult,
} from "@/lib/api";
import { Mail, Send, Users, ChevronLeft, ChevronRight, Eye, EyeOff, AlertCircle, CheckCircle2, Settings2 } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = { sq: "🇦🇱 Shqip", en: "🇬🇧 English" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sq-AL", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminNewsletterPage() {
  const { token } = useAuth();

  // Subscribers
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(true);

  // Composer
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [locale, setLocale] = useState<"all" | "sq" | "en">("all");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Brevo setup
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<BrevoSetupResult | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function loadSubscribers(p: number) {
    if (!token) return;
    setLoadingList(true);
    try {
      const data = await adminGetNewsletterSubscribers(token, p);
      setSubscribers(data.subscribers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { loadSubscribers(1); }, [token]);

  const recipientCount = locale === "all"
    ? total
    : subscribers.filter(s => s.locale === locale).length; // approximate from loaded page

  async function handleSend() {
    if (!token || !subject.trim() || !bodyHtml.trim()) return;
    setSending(true);
    setResult(null);
    setSendError(null);
    setConfirmOpen(false);
    try {
      const res = await adminBroadcastNewsletter(token, subject, bodyHtml, locale === "all" ? undefined : locale);
      setResult(res);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setSending(false);
    }
  }

  async function handleBrevoSetup() {
    if (!token) return;
    setSetupLoading(true);
    setSetupResult(null);
    setSetupError(null);
    try {
      const res = await adminBrevoSetup(token);
      setSetupResult(res);
    } catch (err: unknown) {
      setSetupError(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setSetupLoading(false);
    }
  }

  // Live preview in iframe
  useEffect(() => {
    if (preview && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const previewHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font-family:sans-serif;background:#f4f4f5}</style></head><body>${bodyHtml}</body></html>`;
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [preview, bodyHtml]);

  const canSend = subject.trim().length >= 3 && bodyHtml.trim().length >= 10;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-shqiponja/10">
          <Mail className="h-5 w-5 text-shqiponja" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Newsletter</h1>
          <p className="text-sm text-zinc-500">{total} abonentë aktivë</p>
        </div>
      </div>

      {/* ── Brevo Setup Panel ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-bold">Konfiguro Brevo</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Krijon automatikisht listat "Newsletter Subscribers" dhe "Registered Users" në Brevo dhe importon të gjithë kontaktet ekzistues.
            </p>
          </div>
          <button
            onClick={handleBrevoSetup}
            disabled={setupLoading}
            className="shrink-0 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Settings2 className={`h-4 w-4 ${setupLoading ? "animate-spin" : ""}`} />
            {setupLoading ? "Duke konfiguruar..." : "Konfiguro tani"}
          </button>
        </div>

        {setupResult && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-green-700 dark:text-green-400">Konfigurimi u krye me sukses!</p>
                <p className="text-green-600 dark:text-green-500">
                  Newsletter Subscribers → List ID: <strong>{setupResult.newsletterListId}</strong> ({setupResult.subscribersSynced} kontakte)
                </p>
                <p className="text-green-600 dark:text-green-500">
                  Registered Users → List ID: <strong>{setupResult.usersListId}</strong> ({setupResult.usersSynced} kontakte)
                </p>
                <p className="text-green-600 dark:text-green-500 text-xs">✓ Variablat Railway janë vendosur automatikisht.</p>
              </div>
            </div>
          </div>
        )}
        {setupError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="text-red-700 dark:text-red-400">{setupError}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Composer ── */}
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-zinc-500">Kompozo fushatën</h2>

            {/* Locale filter */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Dërgo te</label>
              <div className="flex gap-2">
                {(["all", "sq", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      locale === l
                        ? "border-shqiponja bg-shqiponja/10 text-shqiponja"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {l === "all" ? "🌍 Të gjithë" : LOCALE_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Subjekti</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="p.sh. 🌍 Oferta speciale — eSIM për Shqipërinë!"
                maxLength={200}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-shqiponja transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            {/* Body */}
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium">Përmbajtja (HTML)</label>
                <button
                  onClick={() => setPreview(p => !p)}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
                >
                  {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {preview ? "Fshih preview" : "Shfaq preview"}
                </button>
              </div>
              {preview ? (
                <iframe
                  ref={iframeRef}
                  className="h-80 w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-700"
                  title="Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  rows={14}
                  placeholder={`<h2 style="color:#18181b">Oferta speciale 🎉</h2>\n<p style="color:#52525b;line-height:1.6">Blej eSIM-in tënd tani dhe udhëto pa kufij...</p>\n<a href="https://shqiponjaesim.com/paketa" style="display:inline-block;background:#C8102E;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:700">Shiko paketat →</a>`}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-xs outline-none ring-shqiponja transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              )}
              <p className="mt-1 text-xs text-zinc-400">
                HTML i plotë. Linku i çregjistrimit shtohet automatikisht në fund.
              </p>
            </div>

            {/* Hints */}
            <div className="mb-5 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/50">
              <strong className="text-zinc-600 dark:text-zinc-300">Sugjerime HTML:</strong>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>Titull: <code>{`<h2 style="color:#18181b">...</h2>`}</code></li>
                <li>Buton: <code>{`<a href="URL" style="background:#C8102E;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:700;display:inline-block">Teksti</a>`}</code></li>
                <li>Paragraf: <code>{`<p style="color:#52525b;line-height:1.6">...</p>`}</code></li>
              </ul>
            </div>

            {/* Result */}
            {result && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    U dërgua: <strong>{result.sent}</strong> · Dështoi: <strong>{result.failed}</strong> · Gjithsej: <strong>{result.total}</strong>
                  </p>
                  {result.message && <p className="text-green-600">{result.message}</p>}
                </div>
              </div>
            )}
            {sendError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-900/20">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-red-700 dark:text-red-400">{sendError}</p>
              </div>
            )}

            {/* Send button */}
            {confirmOpen ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-300">
                  Po dërgon <strong>{locale === "all" ? total : "?"}</strong> email me subjektin <em>"{subject}"</em>. Vazhdo?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-lg bg-shqiponja px-4 py-2 text-sm font-semibold text-white hover:bg-shqiponja/90 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Duke dërguar..." : "Po, dërgo"}
                  </button>
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Anulo
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!canSend || sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-shqiponja py-3 text-sm font-bold text-white shadow-sm hover:bg-shqiponja/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Dërgo fushatën
              </button>
            )}
          </div>
        </div>

        {/* ── Subscribers list ── */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-semibold">Abonentët</span>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {total}
              </span>
            </div>

            {loadingList ? (
              <div className="flex justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-shqiponja border-t-transparent" />
              </div>
            ) : subscribers.length === 0 ? (
              <p className="p-6 text-center text-sm text-zinc-400">Ende nuk ka abonentë</p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {subscribers.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.email}</p>
                      <p className="text-xs text-zinc-400">{formatDate(s.subscribed_at)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {LOCALE_LABELS[s.locale] ?? s.locale}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <button
                  onClick={() => loadSubscribers(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-50 disabled:opacity-30 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-zinc-500">{page} / {totalPages}</span>
                <button
                  onClick={() => loadSubscribers(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-50 disabled:opacity-30 dark:hover:bg-zinc-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
