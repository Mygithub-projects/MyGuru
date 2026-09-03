// ===========================================================================
//  set-guru-login-email.ts — Tetapkan SEMUA akaun guru supaya log masuk dengan
//  emel (username = email, kata laluan = "koko2026").
//
//  Jalankan: npx tsx scripts/set-guru-login-email.ts   (idempoten)
// ===========================================================================
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

const PASSWORD_BAHARU = "koko2026";

async function main() {
  const guru = await prisma.guru.findMany({
    select: { id: true, nama: true, email: true, user: { select: { id: true, username: true } } },
  });

  const allUsernames = new Set(
    (await prisma.user.findMany({ select: { username: true } })).map((u) => u.username)
  );

  const passwordHash = await hashPassword(PASSWORD_BAHARU);

  let dikemas = 0;
  let dicipta = 0;
  let langkau = 0;
  const ralat: string[] = [];

  for (const g of guru) {
    const email = g.email?.trim().toLowerCase();
    if (!email) {
      langkau++;
      ralat.push(`${g.nama}: tiada emel — dilangkau`);
      continue;
    }

    // Elak pertembungan username emel dengan akaun LAIN (bukan milik guru ini).
    if (allUsernames.has(email) && g.user?.username !== email) {
      langkau++;
      ralat.push(`${g.nama}: emel ${email} bertembung username sedia ada — dilangkau`);
      continue;
    }

    if (g.user) {
      if (g.user.username !== email) { allUsernames.delete(g.user.username); allUsernames.add(email); }
      await prisma.user.update({
        where: { id: g.user.id },
        data: { username: email, email, passwordHash, role: "Guru", mustChangePw: false, statusAktif: true },
      });
      dikemas++;
    } else {
      await prisma.user.create({
        data: { username: email, email, passwordHash, role: "Guru", guruId: g.id, mustChangePw: false },
      });
      allUsernames.add(email);
      dicipta++;
    }
  }

  console.log("=== Tetapan log masuk guru (Emel) ===");
  console.log(`Jumlah guru           : ${guru.length}`);
  console.log(`Akaun dikemas kini    : ${dikemas}`);
  console.log(`Akaun baharu dicipta  : ${dicipta}`);
  console.log(`Dilangkau             : ${langkau}`);
  if (ralat.length) console.log("Amaran:\n - " + ralat.join("\n - "));
  console.log(`\nSelesai ✓  Guru kini log masuk: username = emel, kata laluan = ${PASSWORD_BAHARU}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
