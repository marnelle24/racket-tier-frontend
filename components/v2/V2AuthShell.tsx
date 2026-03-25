import Image from "next/image";
import Link from "next/link";

const IMG_HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBuiQvEUbibNDHHCNjwO2e8lIj98smZFwOTDBSkYkg529KVWtzJ6x5O5JN7RdsO0xDxLgfauQ-b09aXrADrpzAxutttjgeCKCRC8hDYT199FRjA6l85ptCneiqqPvvHD712-OCiBrsGeg2sqz00TcJDgwpqmJ0tAXK43bR9pthYw99s6Gnz7KMrblNuo9lj5NHMLw9NCT-aGkuyKFYznl205z0YIrU-mJ23PXiSPwsf0zSNUidVDo59mQI2v93nv0Wy9LFTbvyv6es";

type V2AuthShellProps = {
  children: React.ReactNode;
};

export function V2AuthShell({ children }: V2AuthShellProps) {
  return (
    <div className="mesh-bg relative flex min-h-[max(884px,100dvh)] flex-col text-[#e4e1e6] lg:min-h-screen lg:flex-row">
      <Link
        href="/v2/landing-page"
        className="font-label absolute left-6 top-6 z-20 text-[10px] font-bold uppercase tracking-[0.2em] text-[#918f9c] transition-colors hover:text-[#e4e1e6] lg:left-10 lg:top-8"
      >
        ← Back
      </Link>

      <section className="relative flex min-h-[min(42vh,480px)] w-full shrink-0 overflow-hidden lg:min-h-0 lg:w-[46%] lg:max-w-xl lg:flex-none">
        <Image
          alt="Competitive racket sports action"
          src={IMG_HERO}
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 46vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#131316] via-[#131316]/40 to-transparent lg:bg-linear-to-r lg:from-transparent lg:via-[#131316]/30 lg:to-[#131316]/90" />
        <div className="pointer-events-none absolute inset-0 bg-[#131316]/20 lg:bg-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-end p-8 pb-10 lg:absolute lg:inset-0 lg:justify-between lg:p-10">
          <div className="hidden lg:block" aria-hidden />
          <div className="space-y-3">
            <div className="inline-block rounded-full border-none bg-[#2a2a2d]/90 px-3 py-1 backdrop-blur-sm">
              <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ce081]">
                Every Smash Counts
              </span>
            </div>
            <p className="font-headline max-w-sm text-2xl font-extrabold leading-tight tracking-tighter text-[#e4e1e6] md:text-3xl">
              Master the court. <span className="text-[#c2c1ff] italic">Own the tier.</span>
            </p>
          </div>
        </div>
      </section>

      <div className="relative flex flex-1 flex-col justify-center px-6 pb-10 pt-14 md:px-10 lg:px-14 lg:py-12">
        <div className="pointer-events-none fixed -left-20 top-[10%] h-64 w-64 rounded-full bg-[#c2c1ff]/5 blur-[100px]" />
        <div className="pointer-events-none fixed -right-20 bottom-[10%] h-80 w-80 rounded-full bg-[#4ce081]/5 blur-[120px]" />

        <main className="relative z-10 mx-auto w-full max-w-md flex-1 py-6 lg:flex lg:items-center lg:py-0">
          {children}
        </main>

        <footer className="relative z-10 mt-auto pt-8 text-center lg:pt-10">
          <div className="font-label flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-[#918f9c]">
            <a className="transition-colors hover:text-[#e4e1e6]" href="#">
              Privacy Policy
            </a>
            <a className="transition-colors hover:text-[#e4e1e6]" href="#">
              Terms of Service
            </a>
            <a className="transition-colors hover:text-[#e4e1e6]" href="#">
              Help Center
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
