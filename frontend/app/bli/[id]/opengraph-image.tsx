import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "Shqiponja eSIM Package";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://shqiponja-esim-production.up.railway.app"
    : "http://localhost:3001");

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let pkg: { name: string; data: string; duration: string; price: number; region: string; flag: string; country_code?: string } | null = null;
  try {
    const res = await fetch(`${API_URL}/api/packages/${id}`, { cache: "no-store" });
    if (res.ok) pkg = await res.json();
  } catch {}

  const svg = readFileSync(join(process.cwd(), "public", "logo-dark.svg"));
  const logoUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  const name = pkg?.name?.split("—")[0]?.trim() || "eSIM Package";
  const data = pkg?.data || "";
  const duration = pkg?.duration || "";
  const price = pkg ? `€${pkg.price.toFixed(2)}` : "";
  const region = pkg?.region || "";
  const flag = pkg?.flag || "🌍";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(233, 69, 96, 0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "rgba(83, 52, 131, 0.15)",
          }}
        />

        {/* Top bar: Logo + branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={logoUri} width={48} height={48} />
          <div style={{ fontSize: 28, fontWeight: 700, color: "white", letterSpacing: -0.5 }}>
            Shqiponja eSIM
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 60,
          }}
        >
          {/* Left: Flag + Region */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 96 }}>{flag}</div>
            <div
              style={{
                marginTop: 12,
                fontSize: 18,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: 4,
                fontWeight: 600,
              }}
            >
              {region}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: 2,
              height: 200,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 1,
            }}
          />

          {/* Right: Package details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: "white",
                lineHeight: 1.2,
                maxWidth: 600,
              }}
            >
              {name}
            </div>

            {/* Data + Duration badges */}
            <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
              {data && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "10px 20px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}>📶</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{data}</div>
                </div>
              )}
              {duration && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "10px 20px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}>⏱️</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{duration}</div>
                </div>
              )}
            </div>

            {/* Price */}
            {price && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 20 }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: "#e94560" }}>
                  {price}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.35)" }}>
            shqiponjaesim.com
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 16,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <span>Pa roaming</span>
            <span>·</span>
            <span>Pa SIM fizike</span>
            <span>·</span>
            <span>Aktivizim i menjëhershëm</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
