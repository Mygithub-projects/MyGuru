import type { BarisPenyertaan } from "@/lib/pelajar";
import type { Dict } from "@/lib/i18n";

// Kad skor setiap bidang (/100) + kad Unit Perkhidmatan (ekstra). Dikongsi oleh
// laman pelajar & butiran pelajar (Admin). 2 bidang terbaik ditanda "dikira".

function Baris({ label, sub, nilai, maks }: { label: string; sub?: string; nilai: number; maks: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="min-w-0 text-slate-500">
        {label}
        {sub && <span className="ml-1 truncate text-[11px] text-slate-400">({sub})</span>}
      </dt>
      <dd className="shrink-0 font-semibold text-slate-700">
        {nilai}
        <span className="text-[11px] font-normal text-slate-400"> /{maks}</span>
      </dd>
    </div>
  );
}

export function KadPenyertaan({
  penyertaan,
  label,
  pajsk,
  t,
}: {
  penyertaan: BarisPenyertaan[];
  label: Record<string, string>;
  pajsk: Dict["pajsk"];
  t: Pick<Dict["pelajar"], "participationTotal" | "best2" | "attendedOf" | "extraTotal">;
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${penyertaan.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {penyertaan.map((p) => {
        const s = p.skor;
        const up = p.jenisKoko === "Perkhidmatan";
        return (
          <div
            key={p.jenisKoko}
            className={`rounded-lg border p-3 ${p.dikira ? "border-brand/50 ring-1 ring-brand/20" : "border-slate-200"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase text-brand-dark">{label[p.jenisKoko] ?? p.label}</p>
              {p.dikira && (
                <span className="shrink-0 rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark">{t.best2}</span>
              )}
            </div>
            <p className="mt-1 font-medium text-slate-800">{p.namaUnit}</p>
            <dl className="mt-2 space-y-1 text-sm">
              {up ? (
                <>
                  <Baris label={pajsk.jawatan} sub={s.jawatan || undefined} nilai={s.mJawatan} maks={10} />
                  <div className="flex justify-between border-t border-slate-100 pt-1">
                    <dt className="font-semibold text-slate-600">{t.extraTotal}</dt>
                    <dd className="font-bold text-brand-dark">{p.ekstra ?? 0}<span className="text-[11px] font-normal text-slate-400"> /10</span></dd>
                  </div>
                </>
              ) : (
                <>
                  <Baris label={pajsk.kehadiran} sub={t.attendedOf(s.hadir, s.jumlahAktiviti)} nilai={s.mKehadiran} maks={50} />
                  <Baris label={pajsk.jawatan} sub={s.jawatan || undefined} nilai={s.mJawatan} maks={10} />
                  <Baris label={pajsk.penglibatan} sub={s.peringkat || undefined} nilai={s.mPenglibatan} maks={10} />
                  <Baris label={pajsk.pencapaian} nilai={s.pcpMarkah} maks={10} />
                  <Baris label={pajsk.projekJawatan} nilai={s.pjMJ} maks={10} />
                  <Baris label={pajsk.projekPeringkat} nilai={s.pjMP} maks={10} />
                  <div className="flex justify-between border-t border-slate-100 pt-1">
                    <dt className="font-semibold text-slate-600">{t.participationTotal}</dt>
                    <dd className="font-bold text-brand-dark">
                      {s.jumlah}
                      <span className="text-[11px] font-normal text-slate-400"> /100 · {s.gred}</span>
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
