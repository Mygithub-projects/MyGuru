// Semakan Ekstra Kurikulum — dikongsi oleh /guru/ekstra (Ketua Unit Kokurikulum)
// dan /admin/ekstra. Pengesah memilih perkara Anugerah Khas; markah = skornya.
import { dbKohort } from "@/lib/prisma-kohort";
import { kohortDipilih } from "@/lib/kohort-pilihan";
import { getT } from "@/lib/locale";
import { urlFail } from "@/lib/fail-url";
import { ANUGERAH_KHAS } from "@/lib/enums";
import { EkstraSemakan, type BarisEkstra } from "./EkstraSemakan";

export async function EkstraSemakanPage() {
  const { locale } = await getT();
  const en = locale === "en";
  const db = await dbKohort(); // kohort dipilih sahaja
  const kohort = await kohortDipilih();
  const rekod = await db.pencapaian.findMany({
    where: { kategori: "ekstra" },
    include: { pelajar: { select: { nama: true, kelasT6: true, markahEkstra: true } } },
    orderBy: { createdAt: "desc" },
  });
  const baris: BarisEkstra[] = rekod.map((r) => ({
    id: r.id,
    nama: r.pelajar.nama,
    kelas: r.pelajar.kelasT6,
    markahEkstraPelajar: r.pelajar.markahEkstra,
    program: r.namaPencapaian,
    peringkat: r.peringkat,
    tarikh: r.tarikh ? r.tarikh.toLocaleDateString("ms-MY") : null,
    tempat: r.tempat,
    sijil: urlFail(r.lampiranEviden),
    status: r.statusSemakan,
    perkara: r.perkaraEkstra,
    markah: r.markah,
    komen: r.komenGuru,
  }));
  const menunggu = baris.filter((b) => b.status === "Pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{en ? "Extra-Curricular Review" : "Semakan Ekstra Kurikulum"}</h1>
        <p className="text-sm text-slate-500">
          {en
            ? "Verify students' special-award submissions and choose the item from the Special Award table; the mark follows its score."
            : "Sahkan penghantaran anugerah khas pelajar dan pilih perkara daripada jadual Anugerah Khas; markah mengikut skor perkara itu."}
          {kohort ? ` · ${kohort}` : ""}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {en
            ? "Student's extra mark = the higher of the Service Unit position and verified awards (max 10)."
            : "Markah ekstra pelajar = yang tertinggi antara jawatan Unit Perkhidmatan dan anugerah disahkan (maks 10)."}
        </p>
      </div>
      <EkstraSemakan baris={baris} anugerah={[...ANUGERAH_KHAS]} menunggu={menunggu} en={en} />
    </div>
  );
}
