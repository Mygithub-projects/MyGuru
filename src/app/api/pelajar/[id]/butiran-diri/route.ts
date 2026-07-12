import { getSession } from "@/lib/auth";
import { fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getPelajarProfil } from "@/lib/pelajar";
import { statusPilihanT6 } from "@/lib/pajsk";
import { getLocale } from "@/lib/locale";
import { janaButiranPDF } from "@/lib/pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const muatTurun = new URL(request.url).searchParams.get("download") === "1";
  const session = await getSession();
  if (!session) return fail("Tidak dibenarkan", 401);
  if (session.role === "Pelajar" && session.pelajarId !== id) return fail("Akses ditolak", 403);

  const data = await getPelajarProfil(id);
  if (!data) return fail("Pelajar tidak dijumpai", 404);
  const { pelajar, markah, kehadiran } = data;
  const locale = await getLocale();

  // Kehadiran mengikut bidang (rujukan §9) — dikira dari rekod kehadiran.
  const recs = await prisma.kehadiran.findMany({
    where: { pelajarId: id },
    select: { jenisKoko: true, statusHadir: true },
  });
  const bidangMap = new Map<string, { hadir: number; jumlah: number }>();
  for (const r of recs) {
    const m = bidangMap.get(r.jenisKoko) ?? { hadir: 0, jumlah: 0 };
    m.jumlah++;
    if (r.statusHadir) m.hadir++;
    bidangMap.set(r.jenisKoko, m);
  }
  const kehadiranBidang = [...bidangMap.entries()].map(([bidang, m]) => ({ bidang, ...m }));

  // 2 Pilihan Terbaik (§9) — pencapaian/penyertaan markah tertinggi (disahkan).
  const pilihanTerbaik = [
    ...pelajar.aktivitiLuar
      .filter((a) => a.statusPengesahan === "Approved")
      .map((a) => ({ nama: a.namaAktiviti, peringkat: a.peringkat, kedudukan: null as string | null, markah: a.markahLuar })),
    ...pelajar.pencapaian
      .filter((p) => p.statusSemakan === "Approved")
      .map((p) => ({ nama: p.namaPencapaian, peringkat: p.peringkat, kedudukan: p.kedudukan, markah: p.markah })),
  ]
    .sort((a, b) => b.markah - a.markah)
    .slice(0, 2);

  const pdf = await janaButiranPDF({
    locale,
    nama: pelajar.nama,
    noIc: pelajar.noIc,
    kelas: pelajar.kelasT6 ?? "-",
    markahT6: pelajar.markahPajskT6,
    peratusT6: pelajar.peratusPajskT6,
    gred: pelajar.gredPajskT6,
    markah,
    kokurikulum: pelajar.kokurikulum.map((k) => ({
      jenisKoko: k.jenisKoko,
      namaUnitT6: k.namaUnitT6,
      jawatanT6: k.jawatanT6,
      peringkatT6: k.peringkatT6,
      status: statusPilihanT6(k),
    })),
    kehadiran: {
      hadir: kehadiran.hadir,
      jumlah: kehadiran.jumlahSetahun,
      markah: kehadiran.markah,
      peratus: kehadiran.peratus,
    },
    kehadiranBidang,
    pilihanTerbaik,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${muatTurun ? "attachment" : "inline"}; filename="ButiranDiri-${pelajar.noIc}.pdf"`,
    },
  });
}
