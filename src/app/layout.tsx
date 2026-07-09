import type { Metadata, Viewport } from "next";
import ThemeRegistry from "@/components/ThemeRegistry";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guess Game",
  description: "A 2-10 player mobile guessing game",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="mobile-shell">
          <ThemeRegistry>{children}</ThemeRegistry>
        </div>
      </body>
    </html>
  );
}
