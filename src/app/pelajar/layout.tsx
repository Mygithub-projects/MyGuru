import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { AppShell } from "@/components/shell/AppShell";
import { AgentChat } from "@/components/AgentChat";
import { prisma } from "@/lib/prisma";
import { unitSeliaanSU } from "@/lib/pelajar";

export default async function PelajarLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePw) redirect("/tukar-kata-laluan");
  const { t, locale } = await getT();
  const adaProjek = session.pelajarId
    ? (await prisma.projekTag.count({ where: { pelajarId: session.pelajarId, peranan: { in: ["SU", "NSU"] } } })) > 0
    : false;

  // Label header: "SU Kelab Komputer" / "NSU Bola Jaring" (unit sebenar SU/NSU).
  const isSU = session.subRole === "SU" || session.subRole === "NSU";
  const unitSU = isSU && session.pelajarId ? await unitSeliaanSU(session.pelajarId, session.subRole) : [];
  const subRoleLabel = unitSU.length ? `${session.subRole} ${unitSU.join(", ")}` : null;

  return (
    <>
      <AppShell
        subRoleLabel={subRoleLabel}
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
        {session.role === "Pelajar" && !session.butiranDisahkan && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
            {locale === "ms"
              ? `Butiran anda belum disahkan oleh Ketua GP/Penolong Ketua GP. Anda belum boleh mengisi maklumat${session.subRoleTertangguh ? ` atau menggunakan fungsi ${session.subRoleTertangguh}` : ""}, dan markah belum dikira sehingga disahkan.`
              : `Your particulars have not been confirmed by your Head/Assistant Head Advisor Teacher. You cannot submit information${session.subRoleTertangguh ? ` or use ${session.subRoleTertangguh} functions` : ""}, and marks are not computed until confirmed.`}
          </div>
        )}
        {children}
      </AppShell>
      <AgentChat role={session.role} t={t.chrome.agentChat} />
    </>
  );
}
