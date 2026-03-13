import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./Providers";
import { BottomNav } from "@/components/BottomNav";
import { LayoutContent } from "@/components/LayoutContent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RacketTier",
  description: "Competitive game room for your facility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body
        className="min-h-screen text-gray-800 font-sans antialiased relative"
        style={{
          background: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px),
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(74, 222, 128, 0.15), transparent),
            radial-gradient(ellipse 50% 30% at 0% 80%, rgba(251, 191, 36, 0.12), transparent),
            linear-gradient(180deg, #fafafa 0%, #f4f4f5 50%, #fafafa 100%)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%, 100% 100%, 100% 100%",
        }}
      >
        <LayoutContent>
          <Providers>{children}</Providers>
        </LayoutContent>
        <BottomNav />
      </body>
    </html>
  );
}
