import { Key, Shield, Mail, Globe, Server, AlertTriangle } from "lucide-react";

function ConfigCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Icon className="h-4 w-4 text-shqiponja" />
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-sm">
            <span className="text-zinc-500">{item.label}</span>
            <span className="font-mono text-xs text-zinc-300">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">Konfigurimet</h1>
        <p className="text-sm text-zinc-500">Variablat e mjedisit menaxhohen në Railway</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Për arsye sigurie, vlerat e çelësave të API janë të fshehura. Ndrysho ato direkt në Railway Dashboard.</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ConfigCard
          icon={Key}
          title="Airalo API"
          items={[
            { label: "Client ID", value: "••••••••" },
            { label: "Client Secret", value: "••••••••" },
            { label: "Mode", value: "sandbox" },
            { label: "API Base", value: "sandbox-partners-api.airalo.com/v2" },
          ]}
        />
        <ConfigCard
          icon={Shield}
          title="Payment Gateway"
          items={[
            { label: "Provider", value: "Lemon Squeezy" },
            { label: "API Key", value: "••••••••" },
            { label: "Store ID", value: "336530" },
            { label: "Webhook Secret", value: "••••••••" },
          ]}
        />
        <ConfigCard
          icon={Mail}
          title="Email (Brevo)"
          items={[
            { label: "API Key", value: "••••••••" },
            { label: "SMTP Host", value: "smtp-relay.brevo.com" },
            { label: "SMTP Port", value: "587" },
            { label: "From", value: "info@shqiponjaesim.com" },
          ]}
        />
        <ConfigCard
          icon={Globe}
          title="Application"
          items={[
            { label: "Frontend URL", value: "shqiponjaesim.com" },
            { label: "Backend URL", value: "*.railway.app" },
            { label: "Currency", value: "EUR (€)" },
            { label: "Languages", value: "sq, en" },
          ]}
        />
        <ConfigCard
          icon={Server}
          title="Database & Auth"
          items={[
            { label: "Database", value: "PostgreSQL (Railway)" },
            { label: "JWT Secret", value: "••••••••" },
            { label: "OAuth", value: "Google, Microsoft" },
            { label: "2FA", value: "TOTP Enabled" },
          ]}
        />
      </div>
    </div>
  );
}
