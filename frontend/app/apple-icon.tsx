import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const png = readFileSync(join(process.cwd(), "public", "icon-light.png"));
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
        }}
      >
        <img src={dataUri} width={180} height={180} />
      </div>
    ),
    { ...size }
  );
}
