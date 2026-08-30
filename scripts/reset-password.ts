// ===========================================================================
//  Reset kata laluan mana-mana akaun (Admin/Guru/Pelajar) — untuk kes
//  "lupa kata laluan, jumpa admin". Jana kata laluan rawak (atau guna yang
//  dinyatakan), hash, dan simpan hanya hash dalam DB. Kata laluan teks biasa
//  ditulis SEKALI ke fail tempatan (bukan konsol) supaya tidak tersiar dalam
//  log/output arahan.
//
//    npx tsx scripts/reset-password.ts <username> [fail-output] [kata-laluan]
//
//  <username>     wajib — No. IC (pelajar/guru) atau "admin".
//  [fail-output]  default: ./password-reset.txt
//  [kata-laluan]  opsyenal — jika tiada, dijana rawak.
// ===========================================================================
import { randomBytes } from "crypto";
import { writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { hashPassword, verifyPassword } from "../src/lib/auth";

const USERNAME = process.argv[2];
const OUT_FILE = process.argv[3] || "./password-reset.txt";
const KATA_LALUAN_EKSPLISIT = process.argv[4];

if (!USERNAME) {
  console.error("Guna: npx tsx scripts/reset-password.ts <username> [fail-output] [kata-laluan]");
  process.exit(1);
}

// Set aksara mudah taip (tiada simbol/huruf serupa cth I/l/1, O/0) — kurangkan
// risiko silap taip di papan kekunci telefon.
function janaKataLaluan(panjang = 12): string {
  const aksara = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
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

  const kataLaluanBaharu = KATA_LALUAN_EKSPLISIT || janaKataLaluan();
  const passwordHash = await hashPassword(kataLaluanBaharu);

  // Sahkan hash betul-betul sepadan SEBELUM disimpan/ditulis ke fail — elak
  // menghantar kata laluan yang tak boleh disahkan semula.
  const sahDiriSendiri = await verifyPassword(kataLaluanBaharu, passwordHash);
  if (!sahDiriSendiri) {
    console.error("✗ Semakan hash sendiri gagal — tiada apa-apa diubah. Cuba lagi.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { username: USERNAME },
    data: { passwordHash, mustChangePw: true, statusAktif: true },
  });

  writeFileSync(
    OUT_FILE,
    `Username: ${USERNAME}\nPeranan: ${user.role}\nKata laluan sementara: ${kataLaluanBaharu}\n\n` +
      `Log masuk dengan ini, sistem akan paksa tukar kata laluan serta-merta.\n` +
      `PADAM fail ini selepas pengguna log masuk dan tukar kata laluan.\n`,
    "utf-8"
  );

  console.log(`✓ Kata laluan untuk "${USERNAME}" (${user.role}) telah ditetapkan semula.`);
  console.log(`  Kata laluan sementara ditulis ke: ${OUT_FILE}`);
  console.log(`  (mustChangePw=true — dipaksa tukar pada log masuk pertama)`);
}

main()
  .catch((e) => { console.error("✗ Ralat:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
