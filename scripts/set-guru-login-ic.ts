// ===========================================================================
//  set-guru-login-ic.ts — Tetapkan SEMUA akaun guru supaya log masuk dengan
//  No. IC (username = IC, kata laluan awal = IC, mustChangePw = true).
//
//  Bekerja terus atas pangkalan data (tidak perlu GURU DATA.xlsx). Guru tanpa
//  No. IC 12 digit yang sah dilangkau (akaun emel dikekalkan) & dilaporkan.
//
//  Jalankan: npx tsx scripts/set-guru-login-ic.ts   (idempoten)
// ===========================================================================
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const guru = await prisma.guru.findMany({
    select: { id: true, nama: true, noIc: true, email: true, user: { select: { id: true, username: true } } },
  });

  // Username sedia ada untuk elak pertembungan bila menukar kepada IC.
  const allUsernames = new Set(
    (await prisma.user.findMany({ select: { username: true } })).map((u) => u.username)
  );

  let dikemas = 0;
  let dicipta = 0;
  let langkau = 0;
  const ralat: string[] = [];

  for (const g of guru) {
    if (!/^\d{12}$/.test(g.noIc)) {
      langkau++;
      ralat.push(`${g.nama}: IC tidak sah ('${g.noIc}') — akaun emel dikekalkan`);
      continue;
    }
    const ic = g.noIc;
    const passwordHash = await hashPassword(ic);

    // Elak pertembungan username IC dengan akaun LAIN (bukan milik guru ini).
    if (allUsernames.has(ic) && g.user?.username !== ic) {
      langkau++;
      ralat.push(`${g.nama}: IC ${ic} bertembung username sedia ada — dilangkau`);
      continue;
    }

    if (g.user) {
      if (g.user.username !== ic) { allUsernames.delete(g.user.username); allUsernames.add(ic); }
      await prisma.user.update({
        where: { id: g.user.id },
        data: { username: ic, passwordHash, role: "Guru", mustChangePw: true, statusAktif: true },
      });
      dikemas++;
    } else {
      await prisma.user.create({
        data: { username: ic, passwordHash, role: "Guru", guruId: g.id, mustChangePw: true },
      });
      allUsernames.add(ic);
      dicipta++;
    }
  }

  console.log("=== Tetapan log masuk guru (No. IC) ===");
  console.log(`Jumlah guru           : ${guru.length}`);
  console.log(`Akaun dikemas kini    : ${dikemas}`);
  console.log(`Akaun baharu dicipta  : ${dicipta}`);
  console.log(`Dilangkau             : ${langkau}`);
  if (ralat.length) console.log("Amaran:\n - " + ralat.join("\n - "));
  console.log("\nSelesai ✓  Guru kini log masuk: username = No. IC, kata laluan = No. IC (dipaksa tukar).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
