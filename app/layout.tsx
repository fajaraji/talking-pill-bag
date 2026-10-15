import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import DemoLoader from "./demo-loader";
import { StoreProvider } from "@/lib/store";

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Talking Pill Bag",
  description:
    "Medication management made simple for seniors and their families.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={atkinsonHyperlegible.className}>
        <StoreProvider>
          <DemoLoader />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
