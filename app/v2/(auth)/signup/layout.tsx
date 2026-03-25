import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function V2SignupSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
