import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import styles from "./create-match.module.css";

const headline = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-rt-headline",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rt-body",
});

export const metadata: Metadata = {
  title: "RacketTier | Create Match",
};

export default function CreateMatchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${styles.root} ${headline.variable} ${body.variable} dark`}
    >
      {children}
    </div>
  );
}
