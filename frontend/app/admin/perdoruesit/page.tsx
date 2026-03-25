"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import {
  adminGetUsers,
  adminUpdateUserRole,
  adminDeleteUser,
  type User,
  type PaginatedUsers,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetUsers(token, page, search)
      .then((data: PaginatedUsers) => {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search]);

  async function toggleRole(u: User) {
    if (!token) return;
    const newRole = u.role === "admin" ? "customer" : "admin";
    try {
      const updated = await adminUpdateUserRole(token, u.id, newRole);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast(`${u.name} → ${newRole}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function handleDelete(u: User) {
    if (!token) return;
    if (!confirm(`${t("admin.confirmDelete")} ${u.name}?`)) return;
    try {
      await adminDeleteUser(token, u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast(`${u.name} ${t("admin.delete").toLowerCase()}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  if (loading)
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-200" />
        ))}
      </div>
    );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-extrabold">{t("admin.users")}</h1>
      <p className="mt-1 text-sm text-zinc-500">{total} {t("admin.totalSuffix")}</p>

      <input
        type="text"
        placeholder={t("admin.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full sm:max-w-xs rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800"
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">{t("admin.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.email")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.role")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.registered")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50 transition dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-medium">{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-shqiponja/10 text-shqiponja"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {u.role === "admin" ? t("admin.admin") : t("admin.customer")}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(u.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US")}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={u.id === me?.id}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    {u.role === "admin" ? t("admin.makeCustomer") : t("admin.makeAdmin")}
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={u.id === me?.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-40 dark:border-red-800 dark:hover:bg-red-900/30"
                  >
                    {t("admin.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700">◀</button>
          <span className="text-sm text-zinc-500">{t("admin.page")} {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700">▶</button>
        </div>
      )}
    </div>
  );
}
