import Link from "next/link";
import { getT } from "@/lib/locale";
import { dataJawatanBelum } from "@/lib/jawatan-belum";
import { JawatanBelumClient } from "./JawatanBelumClient";

export const dynamic = "force-dynamic";

export default async function JawatanBelumPage() {
  const [{ t, locale }, units] = await Promise.all([getT(), dataJawatanBelum()]);
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← {t.common.kembali}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.admin.actJawatanBelum}</h1>
        <p className="text-sm text-slate-500">
          {L(
            "Pelajar yang jawatan T6 belum ditetapkan, butiran belum disahkan, atau cadangan jawatan masih menunggu — dikumpul ikut unit bersama GKP & PGKP yang bertanggungjawab.",
            "Students whose T6 position is not set, details not verified, or position proposal still pending — grouped by unit with the responsible Head & Asst. Head Advisor.",
          )}
        </p>
      </div>
      <JawatanBelumClient units={units} locale={locale} />
    </div>
  );
}
