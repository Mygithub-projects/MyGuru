// Pagar keselamatan untuk `npm run db:reset`.
// ---------------------------------------------------------------------------
// `prisma migrate reset --force` menggugurkan SETIAP jadual tanpa bertanya.
// Semasa pembangunan SQLite dahulu ia hanya membuang dev.db, tetapi kini
// DATABASE_URL menunjuk ke Postgres yang mengandungi rekod pelajar sebenar.
// Skrip ini keluar dengan kod bukan-sifar jika DB tidak kosong, jadi rantaian
// `&&` dalam package.json terhenti sebelum reset sempat berjalan.
//
// Untuk benar-benar reset (cth. DB pembangunan pakai buang):
//   ALLOW_DESTRUCTIVE_RESET=1 npm run db:reset
import { prisma } from "../src/lib/prisma";

async function main() {
  if (process.env.ALLOW_DESTRUCTIVE_RESET === "1") {
    console.warn("ALLOW_DESTRUCTIVE_RESET=1 — pagar dilangkau, meneruskan reset.");
    return;
  }

  const [pelajar, guru, user] = await Promise.all([
    prisma.pelajar.count(),
    prisma.guru.count(),
    prisma.user.count(),
  ]);
  const jumlah = pelajar + guru + user;
  if (jumlah === 0) return; // DB kosong — reset tidak memusnahkan apa-apa

  console.error(
    [
      "",
      "  RESET DIBATALKAN — pangkalan data mengandungi data.",
      "",
      `    Pelajar : ${pelajar}`,
      `    Guru    : ${guru}`,
      `    User    : ${user}`,
      "",
      `  DATABASE_URL: ${(process.env.DATABASE_URL ?? "(tidak diset)").replace(/(:\/\/[^:]*:)[^@]*@/, "$1***@")}`,
      "",
      "  `prisma migrate reset --force` akan menggugurkan kesemua jadual di atas.",
      "  Ambil sandaran dahulu:",
      "",
      "    pg_dump \"$DATABASE_URL\" -f sandaran.sql",
      "",
      "  Jika anda memang berniat memadamnya:",
      "",
      "    ALLOW_DESTRUCTIVE_RESET=1 npm run db:reset",
      "",
    ].join("\n"),
  );
  process.exitCode = 1;
}

main()
  .catch((e) => {
    // Gagal menyemak == tidak selamat untuk reset.
    console.error("Pagar reset gagal menyemak pangkalan data:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
