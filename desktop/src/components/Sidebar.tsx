import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Receipt,
  UsersRound,
  Package,
  Webhook,
  Settings,
  LogOut,
  Tag,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Porositë", icon: Receipt },
  { to: "/customers", label: "Klientët", icon: UsersRound },
  { to: "/packages", label: "Paketat", icon: Package },
  { to: "/promo-codes", label: "Promo Kodet", icon: Tag },
  { to: "/referrals", label: "Referimet", icon: UserPlus },
  { to: "/webhooks", label: "Webhook Log", icon: Webhook },
  { to: "/settings", label: "Konfigurimet", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-zinc-800 px-5">
        <img src={logoImg} alt="Shqiponja" className="h-8 w-8 rounded-lg object-contain" />
        <span className="text-sm font-extrabold tracking-tight">
          Shqiponja <span className="font-normal text-zinc-400">eSIM</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive
                    ? "bg-shqiponja/10 text-shqiponja"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {l.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-zinc-800 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-shqiponja/20 text-xs font-bold text-shqiponja">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-200">{user?.name}</p>
            <p className="truncate text-[10px] text-zinc-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Rifresko
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Dil nga llogaria
        </button>
      </div>
    </aside>
  );
}
