// ===========================================================================
//  Reset kata laluan akaun Admin — jana kata laluan rawak baharu, hash, dan
//  simpan hanya hash dalam DB. Kata laluan teks biasa ditulis SEKALI ke fail
//  tempatan (bukan konsol/log) supaya tidak tersiar dalam output arahan.
//
//    npx tsx scripts/reset-admin-password.ts [username] [fail-output]
//
//  Default username: "admin". Default fail-output: ./admin-password-reset.txt
// ===========================================================================
import { randomBytes } from "crypto";
import { writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

const USERNAME = process.argv[2] || "admin";
const OUT_FILE = process.argv[3] || "./admin-password-reset.txt";

function janaKataLaluan(panjang = 16): string {
  const aksara = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bait = randomBytes(panjang);
  let hasil = "";
  for (let i = 0; i < panjang; i++) hasil += aksara[bait[i] % aksara.length];
  return hasil;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { username: USERNAME } });
  if (!user) {
    console.error(`✗ Akaun dengan username "${USERNAME}" tidak dijumpai. Tiada apa-apa diubah.`);
    process.exit(1);
  }
  if (user.role !== "Admin") {
    console.error(`✗ Akaun "${USERNAME}" bukan peranan Admin (peranan: ${user.role}). Tiada apa-apa diubah.`);
    process.exit(1);
  }

  const kataLaluanBaharu = janaKataLaluan();
  const passwordHash = await hashPassword(kataLaluanBaharu);

  await prisma.user.update({
    where: { username: USERNAME },
    data: { passwordHash, mustChangePw: true },
  });

  writeFileSync(
    OUT_FILE,
    `Username: ${USERNAME}\nKata laluan sementara: ${kataLaluanBaharu}\n\n` +
      `Log masuk dengan ini, sistem akan paksa tukar kata laluan serta-merta.\n` +
      `PADAM fail ini selepas anda log masuk dan tukar kata laluan.\n`,
    "utf-8"
  );

  console.log(`✓ Kata laluan untuk "${USERNAME}" telah ditetapkan semula.`);
  console.log(`  Kata laluan sementara ditulis ke: ${OUT_FILE}`);
  console.log(`  (mustChangePw=true — dipaksa tukar pada log masuk pertama)`);
}

main()
  .catch((e) => { console.error("✗ Ralat:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
