"use client";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { getOAuthProviders, type OAuthProviders } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";

interface OAuthButtonsProps {
  mode: "login" | "register";
}

export default function OAuthButtons({ mode }: OAuthButtonsProps) {
  const { loginWithGoogle, loginWithMicrosoft, loginWithApple } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [providers, setProviders] = useState<OAuthProviders | null>(null);
  const fetched = useRef(false);
  const googleReady = useRef(false);

  // Fetch available OAuth providers from backend
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    getOAuthProviders().then(setProviders).catch(() => setProviders(null));
  }, []);

  // ─── Google Sign-In ───
  const handleGoogleCallback = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;
      setError("");
      setLoading("google");
      try {
        await loginWithGoogle(response.credential);
        router.push("/");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Google login dështoi");
      } finally {
        setLoading(null);
      }
    },
    [loginWithGoogle, router]
  );

  useEffect(() => {
    if (!providers?.googleClientId) return;

    const renderGoogleButton = () => {
      if (typeof window === "undefined" || !window.google) return;

      if (!googleReady.current) {
        window.google.accounts.id.initialize({
          client_id: providers.googleClientId!,
          callback: handleGoogleCallback,
        });
        googleReady.current = true;
      }

      const btnContainer = document.getElementById("google-btn");
      if (btnContainer) {
        btnContainer.innerHTML = "";
        const buttonWidth = Math.min(btnContainer.clientWidth || 360, 400);
        window.google.accounts.id.renderButton(btnContainer, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: String(buttonWidth),
          text: mode === "login" ? "signin_with" : "signup_with",
          logo_alignment: "center",
        });
      }
    };

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      if (window.google) renderGoogleButton();
      else existingScript.addEventListener("load", renderGoogleButton, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.body.appendChild(script);
  }, [handleGoogleCallback, mode, providers]);

  // ─── Microsoft Sign-In ───
  function handleMicrosoft() {
    if (!providers?.microsoftClientId) return;
    setError("");
    const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
    const scope = "openid email profile User.Read";
    const url =
      `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${encodeURIComponent(providers.microsoftClientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_mode=query`;
    window.location.href = url;
  }

  // ─── Apple Sign-In ───
  function handleApple() {
    if (!providers?.appleClientId) return;
    setError("");
    // Apple form_post goes to backend, which validates and redirects back
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const redirectUri = `${apiUrl}/api/auth/oauth/apple/callback`;
    const url =
      `https://appleid.apple.com/auth/authorize?` +
      `client_id=${encodeURIComponent(providers.appleClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code id_token` +
      `&scope=name email` +
      `&response_mode=form_post`;
    window.location.href = url;
  }

  if (!providers) return null;
  const hasAnyProvider = providers.google || providers.microsoft || providers.apple;
  if (!hasAnyProvider) return null;

  const label = mode === "login" ? t("auth.continueWith") : t("auth.signUpWith");

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {t("auth.orContinueWith")}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {/* Google */}
        {providers.google && (
          <div id="google-btn" className="flex justify-center" />
        )}

        {/* Microsoft */}
        {providers.microsoft && (
          <button
            type="button"
            onClick={handleMicrosoft}
            disabled={loading === "microsoft"}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            {label} Microsoft
          </button>
        )}

        {/* Apple */}
        {providers.apple && (
          <button
            type="button"
            onClick={handleApple}
            disabled={loading === "apple"}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            {label} Apple
          </button>
        )}
      </div>
    </div>
  );
}

// Type declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, config: Record<string, string>) => void;
        };
      };
    };
  }
}
