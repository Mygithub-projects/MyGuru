import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { AppShell } from "@/components/shell/AppShell";
import { AgentChat } from "@/components/AgentChat";

export default async function GuruLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePw) redirect("/tukar-kata-laluan");
  const { t } = await getT();

  return (
    <>
      <AppShell nama={session.nama} role={session.role} subRole={session.subRole}>
        {children}
      </AppShell>
      <AgentChat role={session.role} t={t.chrome.agentChat} />
    </>
  );
}
