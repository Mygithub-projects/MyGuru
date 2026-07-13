"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function ScanClient() {
  const locale = useLocale();
  const t = getDict(locale).pelajar;
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ok" | "err">(token ? "loading" : "err");
  const [msg, setMsg] = useState(token ? "" : t.scanNoToken);

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
        setMsg(t.scanNetworkError);
      });
  }, [token, t]);

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
        {state === "loading" ? t.scanLoading : msg}
      </p>
    </div>
  );
}
