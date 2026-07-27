"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ label = "Log Keluar", onLight }: { label?: string; onLight?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      disabled={loading}
      className={
        onLight
          ? "rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          : "rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25 disabled:opacity-50"
      }
    >
      {loading ? "..." : label}
    </button>
  );
}
