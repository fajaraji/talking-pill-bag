import { ImageResponse } from "next/og";

export async function GET() {
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
          borderRadius: "24px",
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
    { width: 192, height: 192 }
  );
}
