// ===========================================================================
//  Backfill §3: isi jadual GuruPenasihatKelab dari medan lama
//  kelabDiselia/sukanDiselia/badanDiselia. Idempoten (boleh ulang jalan).
//  Jalankan: npm run db:migrate-penasihat
// ===========================================================================
import { prisma } from "../src/lib/prisma";
import { penasihatDariMedanLama } from "../src/lib/workflow";

async function main() {
  const gurus = await prisma.guru.findMany({
    select: { id: true, nama: true, kelabDiselia: true, sukanDiselia: true, badanDiselia: true },
  });
  let pautan = 0;
  let adaUnit = 0;
  for (const g of gurus) {
    const senarai = penasihatDariMedanLama(g);
    if (senarai.length === 0) continue;
    // Backfill sahaja: JANGAN buang pautan sedia ada (elak padam penugasan
    // manual). Upsert setiap medan lama.
    for (const s of senarai) {
      await prisma.guruPenasihatKelab.upsert({
        where: { guruId_namaUnit: { guruId: g.id, namaUnit: s.namaUnit } },
        update: { jenisKoko: s.jenisKoko },
        create: { guruId: g.id, namaUnit: s.namaUnit, jenisKoko: s.jenisKoko, peranan: "Penasihat" },
      });
      pautan++;
    }
    adaUnit++;
  }
  console.log(
    `Selesai: ${gurus.length} guru diproses; ${adaUnit} guru mempunyai unit; ${pautan} pautan GuruPenasihatKelab dikemas kini.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
