import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { AppShell } from "@/components/shell/AppShell";
import { AgentChat } from "@/components/AgentChat";
import { prisma } from "@/lib/prisma";

export default async function PelajarLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePw) redirect("/tukar-kata-laluan");
  const { t } = await getT();
  const adaProjek = session.pelajarId
    ? (await prisma.projekTag.count({ where: { pelajarId: session.pelajarId, peranan: { in: ["SU", "NSU"] } } })) > 0
    : false;

  return (
    <>
      <AppShell
        nama={session.nama}
        role={session.role}
        subRole={session.subRole}
        adaProjek={adaProjek}
        footer={
          <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
            EzKokoT6 · Active Hands, Brilliant Minds
          </footer>
        }
      >
        {children}
      </AppShell>
      <AgentChat role={session.role} t={t.chrome.agentChat} />
    </>
  );
}
