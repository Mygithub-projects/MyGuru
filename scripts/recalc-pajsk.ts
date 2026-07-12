// ===========================================================================
//  Kira semula markah PAJSK T6 SEMUA pelajar mengikut model baharu (§1).
//  - Jika pelajar ada rekod kehadiran: kira semula markah kehadiran (skala 50,
//    bundar ke bawah) + semua komponen T6.
//  - Jika tiada rekod kehadiran: kira semula komponen T6 sahaja (markah
//    kehadiran sedia ada dikekalkan — mungkin nilai import lama skala 40).
//
//  ⚠️  Operasi ini mengubah markah RAMAI pelajar sekaligus. Jalankan dengan
//      sedar (rujuk amaran §6). Jalankan: npm run db:recalc-pajsk
// ===========================================================================
import { prisma } from "../src/lib/prisma";
import { kiraSemulaKehadiran } from "../src/lib/kehadiran";
import { kiraSemulaT6 } from "../src/lib/workflow";

async function main() {
  const senarai = await prisma.pelajar.findMany({ select: { id: true, nama: true } });
  console.log(`Kira semula markah PAJSK untuk ${senarai.length} pelajar ...`);

  let adaRekod = 0;
  let tiadaRekod = 0;
  const tanpaKehadiran: string[] = [];

  for (const p of senarai) {
    const bilRekod = await prisma.kehadiran.count({ where: { pelajarId: p.id } });
    if (bilRekod > 0) {
      await kiraSemulaKehadiran(p.id); // termasuk kiraSemulaT6
      adaRekod++;
    } else {
      await kiraSemulaT6(p.id);
      tiadaRekod++;
      tanpaKehadiran.push(p.nama);
    }
  }

  console.log(`\nSelesai. ${adaRekod} pelajar dikira dari rekod kehadiran; ${tiadaRekod} tanpa rekod kehadiran.`);
  if (tanpaKehadiran.length) {
    console.log(
      `\n⚠️  ${tanpaKehadiran.length} pelajar tiada rekod kehadiran — markah kehadiran ` +
        `mengekalkan nilai sedia ada (mungkin skala lama 40). Import/tanda kehadiran ` +
        `untuk kiraan skala 50 yang tepat:\n   ${tanpaKehadiran.slice(0, 20).join(", ")}` +
        (tanpaKehadiran.length > 20 ? ", ..." : "")
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
