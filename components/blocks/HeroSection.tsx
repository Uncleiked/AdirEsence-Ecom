import Link from "next/link";

export function HeroSection({ data }: { data: any }) {
  return (
    <section className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-zinc-950 z-10" />

      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-4">
        <Link
          href="/shop"
          className="water-hover bg-white text-black px-8 py-4 rounded-full font-semibold text-lg uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
        >
          Pre-order Now
        </Link>
      </div>
    </section>
  );
}
