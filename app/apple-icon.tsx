import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F766E",
          borderRadius: "32px",
        }}
      >
        <div
          style={{
            width: "60%",
            height: "30%",
            background: "white",
            borderRadius: "9999px",
          }}
        />
      </div>
    ),
    { width: 180, height: 180 }
  );
}
