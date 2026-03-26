import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

export const metadata: Metadata = {
  title: "RacketTier | Global Rankings",
};

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-headline",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export default function V2RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${plusJakarta.variable} ${inter.variable} min-h-[max(884px,100dvh)] w-full bg-[#131316] text-[#e4e1e6] antialiased selection:bg-[#c2c1ff] selection:text-[#282671]`}
      style={{
        fontFamily: "var(--font-body), ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
