import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { AppShell } from "@/components/shell/AppShell";
import { AgentChat } from "@/components/AgentChat";

export default async function PelajarLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePw) redirect("/tukar-kata-laluan");
  const { t } = await getT();

  return (
    <>
      <AppShell
        nama={session.nama}
        role={session.role}
        subRole={session.subRole}
        footer={
          <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
            MyGuru AI · Active Hands, Brilliant Minds
          </footer>
        }
      >
        {children}
      </AppShell>
      <AgentChat role={session.role} t={t.chrome.agentChat} />
    </>
  );
}
