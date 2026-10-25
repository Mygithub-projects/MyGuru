"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface BarisPelan {
  baris: number;
  nama: string;
  tindakan: "baru" | "ubah" | "sama" | "ralat";
  perubahan: string[];
  ralat: string[];
}

const LABEL: Record<BarisPelan["tindakan"], { l: string; c: string }> = {
  baru: { l: "Baru", c: "bg-emerald-100 text-emerald-700" },
  ubah: { l: "Ubah", c: "bg-blue-100 text-blue-700" },
  sama: { l: "Sama", c: "bg-slate-100 text-slate-500" },
  ralat: { l: "Ralat", c: "bg-red-100 text-red-700" },
};

export function GuruExcelButtons() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [fail, setFail] = useState<File | null>(null);
  const [pelan, setPelan] = useState<BarisPelan[] | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [mesej, setMesej] = useState<string | null>(null);

  async function hantar(f: File, mod: "pratonton" | "laksana") {
    const fd = new FormData();
    fd.append("fail", f);
    fd.append("mod", mod);
    const res = await fetch("/api/admin/guru/excel", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.message ?? "Gagal memproses fail.");
    return j;
  }

  async function pilih(f: File | undefined) {
    if (!f) return;
    setFail(f);
    setMesej(null);
    setSibuk(true);
    try {
      setPelan((await hantar(f, "pratonton")).data);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Ralat rangkaian.");
      tutup();
    } finally {
      setSibuk(false);
    }
  }

  async function sahkan() {
    if (!fail) return;
    setSibuk(true);
    try {
      const j = await hantar(fail, "laksana");
      setMesej(j.message);
      setPelan(null);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Ralat rangkaian.");
    } finally {
      setSibuk(false);
    }
  }

  function tutup() {
    setPelan(null);
    setFail(null);
    if (input.current) input.current.value = "";
  }

  const kira = (t: BarisPelan["tindakan"]) => pelan?.filter((p) => p.tindakan === t).length ?? 0;
  const adaTulis = kira("baru") + kira("ubah") > 0;
  const btn = "shrink-0 rounded-md px-4 py-2 text-sm font-semibold ring-1 transition";

  return (
    <>
      <a href="/api/admin/guru/excel" download className={`${btn} bg-white text-slate-700 ring-slate-300 hover:bg-slate-50`}>
        Muat Turun Excel
      </a>
      <button onClick={() => input.current?.click()} disabled={sibuk} className={`${btn} bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 disabled:opacity-50`}>
        {sibuk && !pelan ? "Memproses…" : "Muat Naik Excel"}
      </button>
      <input ref={input} type="file" accept=".xlsx" className="hidden" onChange={(e) => pilih(e.target.files?.[0])} />

      {mesej && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">
          {mesej}
          <button onClick={() => setMesej(null)} className="font-bold">×</button>
        </div>
      )}

      {pelan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={tutup}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-base font-semibold text-slate-800">Pratonton Muat Naik — {fail?.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {kira("baru")} baru · {kira("ubah")} berubah · {kira("sama")} tiada perubahan · {kira("ralat")} ralat (dilangkau)
              </p>
            </div>
            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
              {pelan.filter((p) => p.tindakan !== "sama").map((p) => (
                <div key={p.baris} className="flex gap-3 py-2.5 text-sm">
                  <span className="w-10 shrink-0 pt-0.5 text-xs text-slate-400">#{p.baris}</span>
                  <span className={`h-fit shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${LABEL[p.tindakan].c}`}>{LABEL[p.tindakan].l}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{p.nama}</p>
                    {[...p.perubahan, ...p.ralat].map((s, i) => (
                      <p key={i} className={`text-xs ${p.tindakan === "ralat" ? "text-red-600" : "text-slate-500"}`}>{s}</p>
                    ))}
                  </div>
                </div>
              ))}
              {!pelan.some((p) => p.tindakan !== "sama") && <p className="py-6 text-center text-sm text-slate-400">Tiada perubahan dalam fail ini.</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button onClick={tutup} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Batal</button>
              <button onClick={sahkan} disabled={sibuk || !adaTulis}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                {sibuk ? "Menyimpan…" : `Sahkan ${kira("baru") + kira("ubah")} perubahan`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
