import type { BarisRumusan } from "@/lib/rumusan";
import type { Dict } from "@/lib/i18n";

// Slip PAJSK pelajar — format seperti laporan rasmi: satu lajur setiap bahagian
// (Sukan / Kelab / Uniform) + Ekstra Kurikulum. Data sama dengan Borang Rumusan
// guru (dataRumusan), jadi nilai yang pelajar lihat = nilai dalam borang guru.

const BAHAGIAN_LAJUR = ["Sukan", "Kelab", "Uniform"] as const;

function sel(teks: string, markah?: number | null) {
  if (!teks) return "—";
  return markah == null ? teks.toUpperCase() : `${teks.toUpperCase()} (${markah})`;
}

export function SlipPajsk({
  rows,
  markah,
  gred,
  markahEkstra,
  t,
  label,
}: {
  rows: BarisRumusan[];
  markah: number | null;
  gred: string | null;
  markahEkstra: number;
  t: Dict["pelajar"]["slip"];
  label: Record<string, string>;
}) {
  const lajur = BAHAGIAN_LAJUR.map((b) => rows.find((r) => r.bahagian === b) ?? null);
  const up = rows.find((r) => r.bahagian === "Perkhidmatan") ?? null;
  const anugerah = rows.find((r) => r.anugerah)?.anugerah ?? "";
  const mAnugerah = rows.find((r) => r.anugerah)?.mAnugerah ?? 0;

  const th = "border border-slate-300 bg-slate-100 px-2 py-1.5 text-left text-[11px] font-bold uppercase text-slate-700";
  const td = "border border-slate-300 px-2 py-1.5 align-top";
  const bahagianSel = (f: (r: BarisRumusan) => string) =>
    lajur.map((r, i) => (
      <td key={i} className={`${td} ${r ? "" : "text-slate-400"}`}>{r ? f(r) : "—"}</td>
    ));

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{t.title}</h2>
      <p className="mb-3 text-xs text-slate-500">{t.sub}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-xs text-slate-700">
          <thead>
            <tr>
              <th className={th}>{t.elemen}</th>
              <th className={th}>{t.aspek}</th>
              {BAHAGIAN_LAJUR.map((b) => <th key={b} className={th}>{label[b]}</th>)}
              <th className={th}>{t.ekstra}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={4} className={`${td} font-semibold`}>{t.pelibatan}</td>
              <td className={td}>{t.aktiviti}</td>
              {lajur.map((r, i) => (
                <td key={i} className={`${td} font-semibold ${r ? "" : "italic text-slate-400"}`}>
                  {r ? r.unit.toUpperCase() : t.belumDaftar}
                </td>
              ))}
              <td className={`${td} bg-slate-50 text-center font-semibold`}>{t.perkhidmatan}</td>
            </tr>
            <tr>
              <td className={td}>{t.jawatan}</td>
              {bahagianSel((r) => sel(r.jawatan, r.mJawatan))}
              <td className={td}>{up ? `${up.unit.toUpperCase()} — ${sel(up.jawatan, up.mJawatan)}` : "—"}</td>
            </tr>
            <tr>
              <td className={td}>{t.peringkat}</td>
              {bahagianSel((r) => sel(r.peringkat, r.mPenglibatan))}
              <td className={`${td} bg-slate-50 text-center font-semibold`}>{t.anugerah}</td>
            </tr>
            <tr>
              <td className={td}>{t.tahapPencapaian}</td>
              {bahagianSel((r) => sel(r.pcpTahap, r.pcpTahap ? r.pcpMarkah : null))}
              <td className={td}>{sel(anugerah, anugerah ? mAnugerah : null)}</td>
            </tr>
            <tr>
              <td colSpan={2} className={`${td} font-semibold`}>{t.namaProjek}</td>
              {bahagianSel((r) => (r.pjNamaJ || r.pjNamaP || "—").toUpperCase())}
              <td rowSpan={4} className={td} />
            </tr>
            <tr>
              <td rowSpan={2} className={`${td} font-semibold`}>{t.pengurusan}</td>
              <td className={td}>{t.jawatan}</td>
              {bahagianSel((r) => sel(r.pjJawatan, r.pjJawatan ? r.pjMJ : null))}
            </tr>
            <tr>
              <td className={td}>{t.peringkatPelaksanaan}</td>
              {bahagianSel((r) => sel(r.pjTahap, r.pjTahap ? r.pjMP : null))}
            </tr>
            <tr>
              <td className={`${td} font-semibold`}>{t.penyertaan}</td>
              <td className={td}>
                {t.kehadiran}
                <span className="block text-[10px] text-slate-400">{t.kehadiranNote}</span>
              </td>
              {lajur.map((r, i) => (
                <td key={i} className={`${td} text-center`}>
                  {r ? `${r.perjumpaan} (${r.mKehadiran})` : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td colSpan={6} className="border border-slate-300 bg-slate-100 px-2 py-1.5 text-center text-[11px] font-bold uppercase text-slate-700">
                {t.pelaporan}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className={`${td} text-right font-bold`}>{t.jumlahSkor}</td>
              {lajur.map((r, i) => (
                <td key={i} className={`${td} text-center font-bold`}>{r?.jumlah != null ? `${r.jumlah} (${r.jumlah}%)` : "—"}</td>
              ))}
              <td className={`${td} text-center font-bold`}>{markahEkstra}</td>
            </tr>
            <tr>
              <td colSpan={2} className={`${td} text-right font-bold`}>{t.gred10}</td>
              <td colSpan={4} className={`${td} text-center text-sm font-bold text-brand-dark`}>
                {markah == null ? "—" : `${Math.round(markah * 10) / 100} / ${gred ?? "-"}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{t.note}</p>
    </section>
  );
}
