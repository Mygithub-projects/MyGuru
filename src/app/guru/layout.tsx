import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { AgentChat } from "@/components/AgentChat";
import { JAWATAN_SAHKAN_EKSTRA, JAWATAN_SAHKAN_KEHADIRAN_GURU } from "@/lib/enums";

export default async function GuruLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePw) redirect("/tukar-kata-laluan");
  const { t } = await getT();

  // Jawatan dibaca terus dari DB supaya perubahan oleh Admin terpapar tanpa log masuk semula.
  const guru = session.guruId
    ? await prisma.guru.findUnique({
        where: { id: session.guruId },
        select: { jawatanKoko: true, penasihatKelab: { select: { namaUnit: true, peranan: true }, orderBy: { namaUnit: "asc" } } },
      })
    : null;
  const label = t.common.jawatanKoko as Record<string, string>;
  const kunci = guru ? guru.jawatanKoko.charAt(0).toLowerCase() + guru.jawatanKoko.slice(1) : null;
  const jawatanUmum = kunci ? label[kunci] ?? null : null;

  // Peranan ikut unit, cth. "Ketua Guru Penasihat (Kelab Komputer) · Guru Penasihat (Badminton)".
  // Jawatan peringkat sekolah (Penyelaras dll.) dikekalkan di hadapan.
  const PERANAN: [string, string][] = [["KetuaPenasihat", "ketuaGP"], ["PenolongKetuaGP", "penolongKetuaGP"], ["Penasihat", "guruPenasihat"], ["Pemantau", "guruPemantau"]];
  const ikutUnit = PERANAN.map(([peranan, k]) => {
    const units = guru?.penasihatKelab.filter((u) => u.peranan === peranan).map((u) => u.namaUnit) ?? [];
    return units.length ? `${label[k] ?? peranan} (${units.join(", ")})` : null;
  }).filter(Boolean) as string[];
  const peringkatSekolah = guru && !["KetuaGP", "PenolongKetuaGP", "GuruPenasihat", "GuruPemantau"].includes(guru.jawatanKoko);
  const jawatan = ikutUnit.length
    ? [...(peringkatSekolah && jawatanUmum ? [jawatanUmum] : []), ...ikutUnit].join(" · ")
    : jawatanUmum;

  return (
    <>
      <AppShell
        nama={session.nama}
        role={session.role}
        subRole={session.subRole}
        jawatan={jawatan}
        sahkanKehadiranGuru={!!guru && JAWATAN_SAHKAN_KEHADIRAN_GURU.includes(guru.jawatanKoko)}
        sahkanEkstra={!!guru && JAWATAN_SAHKAN_EKSTRA.includes(guru.jawatanKoko)}
      >
        {children}
      </AppShell>
      <AgentChat role={session.role} t={t.chrome.agentChat} />
    </>
  );
}
