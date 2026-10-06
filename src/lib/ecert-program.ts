// ===========================================================================
//  e-Cert Program — program anjuran kolej; peserta dipilih dari vw_murid MOE.
// ===========================================================================
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { muridT6IkutNoKp } from "./moe-murid";

/** Awalan No. Siri e-Cert Program: KTEDM/<tahun>/<nombor 4 digit>. */
export const AWALAN_SIRI = "KTEDM";
export const PERINGKAT_PROGRAM = ["Zon", "Negeri", "Kebangsaan"] as const;

export function formatNoSiri(tahun: number, n: number): string {
  return `${AWALAN_SIRI}/${tahun}/${String(n).padStart(4, "0")}`;
}

/** Nombor larian seterusnya bagi tahun tersebut (merentas semua program). */
export async function nomborSiriSeterusnya(tahun: number, db: Prisma.TransactionClient = prisma): Promise<number> {
  const awalan = `${AWALAN_SIRI}/${tahun}/`;
  const rekod = await db.pesertaProgram.findMany({
    where: { noSiri: { startsWith: awalan } },
    select: { noSiri: true },
  });
  const maks = rekod.reduce((m, r) => Math.max(m, Number(r.noSiri.slice(awalan.length)) || 0), 0);
  return maks + 1;
}

/**
 * Tambah peserta ke program. Butiran (nama, sekolah, kelas) diambil semula
 * dari vw_murid ikut No. KP — klien tidak boleh menghantar nama sendiri.
 * Peserta yang sudah ada dalam program dilangkau. No. Siri diberi berturutan.
 */
export async function tambahPeserta(programId: string, noKp: string[], peranan: string) {
  const program = await prisma.programECert.findUnique({ where: { id: programId } });
  if (!program) throw new Error("Program tidak dijumpai.");

  const unik = [...new Set(noKp.map((k) => k.trim()).filter(Boolean))];
  const murid = await muridT6IkutNoKp(unik);
  const sedia = new Set(
    (await prisma.pesertaProgram.findMany({ where: { programId, noKp: { in: unik } }, select: { noKp: true } }))
      .map((p) => p.noKp)
  );
  const baru = murid.filter((m) => !sedia.has(m.noKp)).sort((a, b) => a.nama.localeCompare(b.nama));

  // Nombor larian dikira dalam transaksi; cuba semula jika berlaku perlanggaran
  // No. Siri (dua admin menjana serentak).
  for (let cubaan = 0; ; cubaan++) {
    try {
      await prisma.$transaction(async (tx) => {
        const mula = await nomborSiriSeterusnya(program.tahunSiri, tx);
        await tx.pesertaProgram.createMany({
          data: baru.map((m, i) => ({
            programId,
            nama: m.nama,
            noKp: m.noKp,
            idMoeis: m.idMoeis,
            kodSekolah: m.kodSekolah,
            namaSekolah: m.namaSekolah,
            namaKelas: m.namaKelas,
            peranan,
            noSiri: formatNoSiri(program.tahunSiri, mula + i),
          })),
        });
      });
      break;
    } catch (e) {
      const langgar = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!langgar || cubaan >= 4) throw e;
    }
  }

  return {
    ditambah: baru.length,
    sudahAda: sedia.size,
    tidakDijumpai: unik.length - murid.length,
  };
}
