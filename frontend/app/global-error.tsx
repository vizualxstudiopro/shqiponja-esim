"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Diçka shkoi keq!</h2>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>
            {error?.digest ? `Kodi: ${error.digest}` : "Ndodhi një gabim i papritur."}
          </p>
        </div>
      </body>
    </html>
  );
}
