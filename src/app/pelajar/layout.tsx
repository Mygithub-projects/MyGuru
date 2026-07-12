import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { AgentChat } from "@/components/AgentChat";

export default async function PelajarLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePw) redirect("/tukar-kata-laluan");

  return (
    <div className="app-shell flex min-h-full flex-1 flex-col">
      <AppHeader nama={session.nama} role={session.role} subRole={session.subRole} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
        KoKurikulum · Sistem Pengurusan Kokurikulum Tingkatan 6
      </footer>
      <AgentChat role={session.role} />
    </div>
  );
}
