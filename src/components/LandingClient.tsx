"use client";
import { useEffect, useRef, useState } from "react";

/** Reveal — fade + naik halus apabila elemen masuk paparan (IntersectionObserver). */
export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true); // dalam callback observer (async) — bukan segerak dalam effect
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5 motion-reduce:opacity-100 motion-reduce:translate-y-0"
      }`}
    >
      {children}
    </div>
  );
}

/** Toggle mod gelap — kelaskan .dark pada <html> + simpan dalam localStorage.
 *  `onDark`: untuk header navy (sentiasa permukaan gelap) → guna ikon putih. */
export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  function toggle() {
    const root = document.documentElement;
    const dark = root.classList.toggle("dark");
    try {
      localStorage.setItem("ekoko-theme", dark ? "dark" : "light");
    } catch {
      /* abaikan */
    }
  }
  const cls = onDark
    ? "text-white/80 hover:bg-white/15"
    : "text-slate-500 hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10";
  return (
    <button onClick={toggle} aria-label="Tukar mod terang/gelap" title="Tukar mod terang/gelap" className={`rounded-lg p-2 transition ${cls}`}>
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline">☀️</span>
    </button>
  );
}
