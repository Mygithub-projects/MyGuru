"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/** Lencana "Tindakan" yang auto-segar setiap 30s (poll seperti loceng notifikasi). */
export function TindakanBadge({
  href,
  onLight,
  label,
  title,
}: {
  href: string;
  onLight?: boolean;
  label: string;
  title: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let stop = false;
    const muat = () =>
      fetch("/api/guru/pending-count")
        .then((r) => r.json())
        .then((j) => {
          if (!stop && j.success) setCount(j.data.count);
        })
        .catch(() => {});
    muat();
    const t = setInterval(muat, 30000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <Link
      href={href}
      className={
        onLight
          ? "flex items-center gap-1.5 rounded-md bg-brand-light px-2.5 py-1.5 text-xs font-semibold text-brand-dark hover:bg-amber-100"
          : "flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
      }
      title={title}
    >
      {label}
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-ink">
        {count}
      </span>
    </Link>
  );
}
