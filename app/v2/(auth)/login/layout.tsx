import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function V2LoginSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
