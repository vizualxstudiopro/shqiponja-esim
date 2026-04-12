import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { login } from "@/lib/api";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import eagleImg from "@/assets/eagle.png";

const SAVED_CREDS_KEY = "shqiponja_saved_creds";

function getSavedCreds(): { email: string; password: string } | null {
  try {
    const raw = localStorage.getItem(SAVED_CREDS_KEY);
    if (!raw) return null;
    return JSON.parse(atob(raw));
  } catch { return null; }
}

function saveCreds(email: string, password: string) {
  localStorage.setItem(SAVED_CREDS_KEY, btoa(JSON.stringify({ email, password })));
}

function clearCreds() {
  localStorage.removeItem(SAVED_CREDS_KEY);
}

export default function Login() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getSavedCreds();
    if (saved) {
      setEmail(saved.email);
      setPassword(saved.password);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password, totpCode || undefined);
      if (res.requires2FA) {
        setNeeds2FA(true);
        setLoading(false);
        return;
      }
      if (res.user.role !== "admin") {
        setError("Kjo llogari nuk ka qasje admin.");
        setLoading(false);
        return;
      }
      if (rememberMe) {
        saveCreds(email, password);
      } else {
        clearCreds();
      }
      setAuth(res.token, res.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hyrja dështoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <img src={eagleImg} alt="Shqiponja" className="h-20 w-20 object-contain" />
          <h1 className="mt-4 text-xl font-extrabold">Shqiponja eSIM</h1>
          <p className="mt-1 text-sm text-zinc-500">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-shqiponja transition"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Fjalëkalimi</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 pr-10 text-sm outline-none focus:border-shqiponja transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {needs2FA && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Kodi 2FA (6 shifra)</label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-center font-mono tracking-[0.3em] outline-none focus:border-shqiponja transition"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 text-shqiponja accent-shqiponja"
              />
              <span className="text-xs text-zinc-400">Më mbaj mend</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-shqiponja px-4 py-2.5 text-sm font-bold text-white transition hover:bg-shqiponja-dark disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hyr"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-[10px] text-zinc-600">
          Electron v{window.electronAPI?.versions?.electron || "–"} • Node v{window.electronAPI?.versions?.node || "–"}
        </p>
      </div>
    </div>
  );
}
