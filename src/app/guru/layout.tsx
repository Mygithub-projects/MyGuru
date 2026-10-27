import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { AgentChat } from "@/components/AgentChat";

export default async function GuruLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePw) redirect("/tukar-kata-laluan");
  const { t } = await getT();

  // Jawatan dibaca terus dari DB supaya perubahan oleh Admin terpapar tanpa log masuk semula.
  const guru = session.guruId
    ? await prisma.guru.findUnique({ where: { id: session.guruId }, select: { jawatanKoko: true } })
    : null;
  const kunci = guru ? guru.jawatanKoko.charAt(0).toLowerCase() + guru.jawatanKoko.slice(1) : null;
  const jawatan = kunci ? (t.common.jawatanKoko as Record<string, string>)[kunci] ?? null : null;

  return (
    <>
      <AppShell nama={session.nama} role={session.role} subRole={session.subRole} jawatan={jawatan}>
        {children}
      </AppShell>
      <AgentChat role={session.role} t={t.chrome.agentChat} />
    </>
  );
}
