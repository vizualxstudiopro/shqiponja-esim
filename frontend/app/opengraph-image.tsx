import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shqiponja eSIM — Paketa eSIM ndërkombëtare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(185, 28, 28, 0.08)",
          }}
        />
        <div style={{ fontSize: 80, marginBottom: 8 }}>🦅</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            letterSpacing: -1,
            marginBottom: 16,
          }}
        >
          Shqiponja eSIM
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            marginBottom: 40,
          }}
        >
          Lidhu me botën menjëherë
        </div>
        <div
          style={{
            width: 200,
            height: 3,
            background: "rgba(185, 28, 28, 0.6)",
            borderRadius: 2,
            marginBottom: 40,
          }}
        />
        <div
          style={{
            fontSize: 22,
            color: "#71717a",
          }}
        >
          Paketa eSIM ndërkombëtare · Pa roaming · Pa SIM fizike
        </div>
        <div
          style={{
            display: "flex",
            gap: 64,
            marginTop: 48,
          }}
        >
          {[
            { num: "190+", label: "Vende" },
            { num: "50K+", label: "Klientë" },
            { num: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: "#d4d4d8" }}>
                {stat.num}
              </div>
              <div style={{ fontSize: 14, color: "#52525b", marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
