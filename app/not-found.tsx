import Link from "next/link";
import { RacketTierLogo } from "@/components/RacketTierLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
      <RacketTierLogo textSize="text-4xl" tagline={null} className="mb-8" />
      <h1 className="text-2xl font-bold text-zinc-900">Page not found</h1>
      <p className="text-zinc-500 mt-2 text-center max-w-sm">
        This facility may not exist or you don&apos;t have access to it. Check in at a facility first.
      </p>
      <Link
        href="/facility/join"
        className="mt-6 text-emerald-600 font-medium hover:text-emerald-700"
      >
        ← Back to facilities
      </Link>
    </div>
  );
}
