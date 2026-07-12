"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function ScanClient() {
  const params = useSearchParams();
  const token = params.get("token");
  // Keadaan awal diterbitkan dari token — elak setState segerak dalam effect.
  const [state, setState] = useState<"loading" | "ok" | "err">(token ? "loading" : "err");
  const [msg, setMsg] = useState(token ? "" : "Tiada token. Sila imbas kod QR yang sah.");

  useEffect(() => {
    if (!token) return;
    fetch("/api/kehadiran/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((j) => {
        setState(j.success ? "ok" : "err");
        setMsg(j.message);
      })
      .catch(() => {
        setState("err");
        setMsg("Ralat rangkaian.");
      });
  }, [token]);

  const tone =
    state === "ok"
      ? "bg-brand-light text-brand-dark ring-brand/30"
      : state === "err"
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <div className={`rounded-xl p-6 text-center ring-1 ${tone}`}>
      <div className="text-3xl">{state === "ok" ? "✅" : state === "err" ? "⚠️" : "⏳"}</div>
      <p className="mt-2 text-sm font-medium">
        {state === "loading" ? "Merekod kehadiran..." : msg}
      </p>
    </div>
  );
}
