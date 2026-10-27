import Link from "next/link";
import { getT } from "@/lib/locale";
import { senaraiInfoKohort } from "@/lib/kohort-urus";
import { kohortSeterusnya } from "@/lib/kohort";
import { KohortClient } from "./KohortClient";

export const dynamic = "force-dynamic";

const back = "group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white";

/** Tarikh hari ini (YYYY-MM-DD) ikut waktu Malaysia. */
function tarikhHariIniMYT(): string {
  return new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
}

export default async function KohortPage() {
  const [senarai, { t, locale }] = await Promise.all([senaraiInfoKohort(), getT()]);
  const hariIni = tarikhHariIniMYT();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className={back}>{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{locale === "en" ? "Cohort Management" : "Pengurusan Kohort"}</h1>
        <p className="text-sm text-slate-500">
          {locale === "en"
            ? "Each cohort stays 18 months; a new cohort enters in month 8. Pick the cohort to view in the header — every Admin & Teacher page follows it."
            : "Setiap kohort berada 18 bulan; kohort baharu masuk pada bulan ke-8. Pilih kohort di header — semua halaman Admin & Guru ikut pilihan itu."}
        </p>
      </div>
      <KohortClient senarai={senarai} seterusnya={kohortSeterusnya(senarai.map((k) => k.nama))} hariIni={hariIni} locale={locale} />
    </div>
  );
}
