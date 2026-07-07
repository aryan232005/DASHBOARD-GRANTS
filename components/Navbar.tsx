"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/grants", label: "Global Grants" },
  { href: "/applied", label: "Applied" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
      <div
        className={`inline-flex items-center rounded-full backdrop-blur-md border border-white/10 bg-surface px-2 py-2 transition-shadow ${
          scrolled ? "shadow-md shadow-black/10" : ""
        }`}
      >
        <Link href="/" className="group flex items-center justify-center w-9 h-9 rounded-full accent-gradient p-[1.5px] mr-1 transition-transform hover:scale-110">
          <div className="w-full h-full rounded-full bg-bg flex items-center justify-center">
            <span className="font-display italic text-[13px]">Sb</span>
          </div>
        </Link>
        <div className="w-px h-5 bg-stroke mx-1 hidden sm:block" />

        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-xs sm:text-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-colors ${
              pathname === l.href
                ? "text-text-primary bg-stroke/50"
                : "text-muted hover:text-text-primary hover:bg-stroke/50"
            }`}
          >
            {l.label}
          </Link>
        ))}

        <div className="w-px h-5 bg-stroke mx-1 hidden sm:block" />

        <Link href="/grants" className="relative group">
          <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-1 text-xs sm:text-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 bg-surface backdrop-blur-md text-text-primary">
            Find grants <span className="text-muted">↗</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
