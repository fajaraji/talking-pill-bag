import type { Metadata, Viewport } from "next";
import "./globals.css";
import DemoLoader from "./demo-loader";

export const metadata: Metadata = {
  title: "Talking Pill Bag",
  description:
    "Medication management made simple for seniors and their families.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DemoLoader />
        {children}
      </body>
    </html>
  );
}
