import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";

export default async function BantuanPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { t } = await getT();
  const roleKey = session.role === "Guru" ? "guru" : session.role === "Admin" ? "admin" : "pelajar";
  const c = t.bantuan[roleKey];

  return (
    <div className="app-shell min-h-full flex-1">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <Link href={c.back} className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">{c.title}</h1>
          <p className="text-sm text-slate-500">{t.bantuan.subtitle}</p>
        </div>
        {c.sections.map((s) => (
          <section key={s.h} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-dark">{s.h}</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {s.isi.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
