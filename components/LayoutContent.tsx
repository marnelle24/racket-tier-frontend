"use client";

import { AuthGuard } from "@/components/AuthGuard";

export function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div
      className={`min-h-screen max-w-md mx-auto px-4`}
    >
      <AuthGuard>{children}</AuthGuard>
    </div>
  );
}
