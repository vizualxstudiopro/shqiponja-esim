"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCodeDisplay({ data }: { data: string }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(data, { width: 256, margin: 2, color: { dark: "#0a0a0a", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setError(true));
  }, [data]);

  if (error) {
    return (
      <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
        <p className="text-xs text-red-500">QR gabim</p>
      </div>
    );
  }

  if (!src) return <div className="h-40 w-40 animate-pulse rounded-xl bg-zinc-100" />;

  return <img src={src} alt="eSIM QR Code" className="h-48 w-48 rounded-xl" />;
}
