"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./StatusBadge";

export interface BarisEkstra {
  id: string;
  nama: string;
  kelas: string | null;
  markahEkstraPelajar: number;
  program: string;
  peringkat: string | null;
  tarikh: string | null;
  tempat: string | null;
  sijil: string | null;
  status: string;
  perkara: string | null;
  markah: number;
  komen: string | null;
}

type Tapis = "Pending" | "Approved" | "Kuiri" | "semua";

export function EkstraSemakan({ baris, anugerah, menunggu, en }: {
  baris: BarisEkstra[];
  anugerah: { perkara: string; skor: number }[];
  menunggu: number;
  en: boolean;
}) {
  const [tapis, setTapis] = useState<Tapis>("Pending");
  const paparan = tapis === "semua" ? baris : baris.filter((b) => b.status === tapis);
  const label: Record<Tapis, string> = en
    ? { Pending: `Awaiting (${menunggu})`, Approved: "Verified", Kuiri: "Query", semua: "All" }
    : { Pending: `Menunggu (${menunggu})`, Approved: "Disahkan", Kuiri: "Kuiri", semua: "Semua" };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["Pending", "Approved", "Kuiri", "semua"] as Tapis[]).map((k) => (
          <button key={k} onClick={() => setTapis(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tapis === k ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {label[k]}
          </button>
        ))}
      </div>
      {paparan.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
          {en ? "No submissions in this list." : "Tiada penghantaran dalam senarai ini."}
        </p>
      ) : (
        <ul className="space-y-3">
          {paparan.map((b) => <Kad key={b.id} b={b} anugerah={anugerah} en={en} />)}
        </ul>
      )}
    </section>
  );
}

function Kad({ b, anugerah, en }: { b: BarisEkstra; anugerah: { perkara: string; skor: number }[]; en: boolean }) {
  const router = useRouter();
  const [perkara, setPerkara] = useState(b.perkara ?? "");
  const [komen, setKomen] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const skor = anugerah.find((a) => a.perkara === perkara)?.skor;
  const boleh = b.status !== "Approved";

  async function hantar(status: "Approved" | "Kuiri") {
    setMsg(null);
    if (status === "Approved" && !perkara) { setMsg({ text: en ? "Choose an award item first." : "Pilih perkara Anugerah Khas dahulu.", ok: false }); return; }
    if (status === "Kuiri" && !komen.trim()) { setMsg({ text: en ? "State the reason for the query." : "Nyatakan sebab kuiri.", ok: false }); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/ekstra/${b.id}/sahkan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status === "Approved" ? { status, perkara } : { status, komen: komen.trim() }),
      });
      const json = await res.json().catch(() => null);
      setMsg({ text: json?.message ?? `${en ? "Request failed" : "Permintaan gagal"} (${res.status})`, ok: !!json?.success });
      if (json?.success) router.refresh();
    } catch {
      setMsg({ text: en ? "Network error." : "Ralat rangkaian.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  const sel = "w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm";
  return (
    <li className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">{b.nama} <span className="text-xs font-normal text-slate-500">· {b.kelas ?? "-"}</span></p>
          <p className="mt-0.5 text-sm text-slate-700">{b.program}</p>
          <p className="text-xs text-slate-500">
            {b.peringkat ?? "-"} · {b.tarikh ?? "-"} · {b.tempat ?? "-"}
          </p>
          {b.sijil ? (
            <a href={b.sijil} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-brand-dark hover:underline">
              📎 {en ? "View certificate" : "Lihat sijil"}
            </a>
          ) : (
            <p className="mt-1 text-xs text-rose-600">{en ? "No certificate" : "Tiada sijil"}</p>
          )}
        </div>
        <div className="text-right">
          <StatusBadge status={b.status} label={b.status === "Pending" ? (en ? "Awaiting" : "Menunggu") : b.status === "Approved" ? (en ? "Verified" : "Disahkan") : "Kuiri"} />
          <p className="mt-1 text-[11px] text-slate-400">{en ? "Student's extra mark" : "Markah ekstra pelajar"}: {b.markahEkstraPelajar}/10</p>
        </div>
      </div>

      {b.status === "Approved" && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">✓ {b.perkara ?? "-"} — <span className="font-semibold">{b.markah} {en ? "marks" : "markah"}</span></p>
      )}
      {b.status === "Kuiri" && b.komen && (
        <p className="mt-2 rounded-lg bg-orange-50 px-3 py-1.5 text-xs text-orange-800">{en ? "Query:" : "Kuiri:"} {b.komen}</p>
      )}

      {boleh && (
        <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="text-xs font-semibold text-slate-600">
            {en ? "Special Award item (sets the mark)" : "Perkara Anugerah Khas (menentukan markah)"}
            <select value={perkara} onChange={(e) => setPerkara(e.target.value)} className={`${sel} mt-1`}>
              <option value="">{en ? "— Choose item —" : "— Pilih perkara —"}</option>
              {anugerah.map((a) => <option key={a.perkara} value={a.perkara}>{a.perkara} — {a.skor}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={() => hantar("Approved")} disabled={busy}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto">
              {en ? "Verify" : "Sahkan"}{skor != null ? ` (${skor})` : ""}
            </button>
          </div>
          <label className="text-xs font-semibold text-slate-600">
            {en ? "Query reason (if not eligible / needs correction)" : "Sebab kuiri (jika tidak layak / perlu pembetulan)"}
            <input value={komen} onChange={(e) => setKomen(e.target.value)} maxLength={500} className={`${sel} mt-1`} />
          </label>
          <div className="flex items-end">
            <button onClick={() => hantar("Kuiri")} disabled={busy}
              className="w-full rounded-lg bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-200 disabled:opacity-50 sm:w-auto">
              {en ? "Query" : "Kuiri"}
            </button>
          </div>
        </div>
      )}
      {msg && <p className={`mt-2 text-xs ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.text}</p>}
    </li>
  );
}
