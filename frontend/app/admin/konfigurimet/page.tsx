"use client";

import { useI18n } from "@/lib/i18n-context";
import { Shield, Key, Mail, Globe, Server, AlertTriangle, Webhook } from "lucide-react";

function ConfigCard({ icon: Icon, title, items }: { icon: React.ComponentType<{ className?: string }>; title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Icon className="h-4 w-4 text-shqiponja" />
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
            <span className="text-zinc-500">{item.label}</span>
            <span className="font-mono text-xs">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { locale } = useI18n();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.shqiponjaesim.com";
  const webhookUrl = `${apiBaseUrl.replace(/\/$/, "")}/stripe-webhook`;
  const legacyWebhookUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/stripe/webhook`;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-extrabold">⚙️ Konfigurimet</h1>
      <p className="mt-1 text-sm text-zinc-500">{locale === "sq" ? "Variablat e mjedisit menaxhohen në Railway" : "Environment variables are managed on Railway"}</p>

      <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/10 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{locale === "sq" ? "Për arsye sigurie, vlerat e çelësave të API janë të fshehura. Ndrysho ato direkt në Railway Dashboard." : "For security, API key values are hidden. Change them directly in the Railway Dashboard."}</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ConfigCard
          icon={Key}
          title="Airalo API"
          items={[
            { label: "Client ID", value: "••••••••" },
            { label: "Client Secret", value: "••••••••" },
            { label: "Mode", value: "sandbox" },
            { label: "API Base", value: "https://sandbox-partners-api.airalo.com/v2" },
          ]}
        />

        <ConfigCard
          icon={Shield}
          title="Payment Gateway"
          items={[
            { label: "Provider", value: "Stripe (aktiv)" },
            { label: "Secret Key", value: "••••••••" },
            { label: "Publishable Key", value: "••••••••" },
            { label: "Webhook Secret", value: "••••••••" },
          ]}
        />

        <ConfigCard
          icon={Webhook}
          title="Stripe Webhook"
          items={[
            { label: "Endpoint primar", value: webhookUrl },
            { label: "Endpoint kompatibil", value: legacyWebhookUrl },
            { label: "Event", value: "checkout.session.completed" },
            { label: "Parser", value: "express.raw(application/json)" },
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

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Webhook className="h-4 w-4 text-shqiponja" />
          {locale === "sq" ? "Udhëzime për Stripe Webhook" : "Stripe Webhook Setup"}
        </div>
        <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <p>{locale === "sq" ? "1. Në Stripe Dashboard hap Developers > Webhooks dhe shto endpoint-in primar më sipër." : "1. In Stripe Dashboard open Developers > Webhooks and add the primary endpoint above."}</p>
          <p>{locale === "sq" ? "2. Zgjidh event-in checkout.session.completed." : "2. Select the checkout.session.completed event."}</p>
          <p>{locale === "sq" ? "3. Kopjo Signing Secret në Railway si STRIPE_WEBHOOK_SECRET." : "3. Copy the Signing Secret into Railway as STRIPE_WEBHOOK_SECRET."}</p>
          <p>{locale === "sq" ? "4. Sigurohu që Checkout Session dërgon metadata.airalo_package_id ose order_id." : "4. Ensure the Checkout Session sends metadata.airalo_package_id or order_id."}</p>
        </div>
      </div>
    </div>
  );
}
