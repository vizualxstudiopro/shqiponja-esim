import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const png = readFileSync(join(process.cwd(), "public", "favicon-browser.png"));
  const dataUri = `data:image/png;base64,${Buffer.from(png).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <img src={dataUri} width={32} height={32} />
      </div>
    ),
    { ...size }
  );
}
