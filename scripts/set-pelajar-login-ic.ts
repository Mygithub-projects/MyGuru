// ===========================================================================
//  set-pelajar-login-ic.ts — Tetapkan SEMUA akaun pelajar supaya boleh log
//  masuk dengan No. IC sebagai kata laluan awal (mustChangePw = true).
//
//  Skema log masuk pelajar:
//    Username  = No. IC
//    Kata laluan awal = No. IC (sama)   → dipaksa tukar selepas log masuk
//
//  Jalankan: npx tsx scripts/set-pelajar-login-ic.ts
//  Selamat dijalankan berulang (idempoten).
// ===========================================================================
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const pelajar = await prisma.pelajar.findMany({
    select: { id: true, nama: true, noIc: true, user: { select: { id: true } } },
  });

  let dikemas = 0;
  let dicipta = 0;
  let langkau = 0;
  const ralat: string[] = [];

  for (const p of pelajar) {
    // Kata laluan awal = No. IC. Hanya IC 12 digit yang sah sebagai username.
    if (!/^\d{12}$/.test(p.noIc)) {
      langkau++;
      ralat.push(`${p.nama}: IC tidak sah ('${p.noIc}') — dilangkau`);
      continue;
    }
    const passwordHash = await hashPassword(p.noIc);

    if (p.user) {
      await prisma.user.update({
        where: { id: p.user.id },
        data: { username: p.noIc, passwordHash, role: "Pelajar", mustChangePw: true, statusAktif: true },
      });
      dikemas++;
    } else {
      // Pelajar tanpa akaun log masuk — cipta sekarang.
      await prisma.user.create({
        data: { username: p.noIc, passwordHash, role: "Pelajar", pelajarId: p.id, mustChangePw: true },
      });
      dicipta++;
    }
  }

  console.log("=== Tetapan log masuk pelajar (No. IC) ===");
  console.log(`Jumlah pelajar        : ${pelajar.length}`);
  console.log(`Akaun dikemas kini    : ${dikemas}`);
  console.log(`Akaun baharu dicipta  : ${dicipta}`);
  console.log(`Dilangkau (IC tak sah): ${langkau}`);
  if (ralat.length) console.log("Amaran:\n - " + ralat.join("\n - "));
  console.log("\nSelesai ✓  Pelajar kini log masuk: username = No. IC, kata laluan = No. IC (dipaksa tukar).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
