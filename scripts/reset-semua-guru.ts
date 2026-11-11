// ===========================================================================
//  Reset kata laluan SEMUA akaun guru (role = "Guru") kepada satu kata laluan.
//
//    npx tsx scripts/reset-semua-guru.ts <kata-laluan> <fail-backup> [--apply]
//
//  Tanpa --apply: semakan sahaja (tiada apa-apa diubah).
//  Dengan --apply: hash lama disalin ke <fail-backup> DAHULU, kemudian semua
//  akaun guru dikemas kini dalam satu transaksi. mustChangePw = true (guru
//  dipaksa tukar selepas log masuk). statusAktif TIDAK disentuh — akaun yang
//  dinyahaktif kekal dinyahaktif.
// ===========================================================================
import { writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { hashPassword, verifyPassword } from "../src/lib/auth";

const KATA_LALUAN = process.argv[2];
const FAIL_BACKUP = process.argv[3];
const APPLY = process.argv.includes("--apply");

if (!KATA_LALUAN || !FAIL_BACKUP) {
  console.error("Guna: npx tsx scripts/reset-semua-guru.ts <kata-laluan> <fail-backup> [--apply]");
  process.exit(1);
}

async function main() {
  const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/\?.*$/, "");
  console.log(`DB: ${host}`);

  const ikutPeranan = await prisma.user.groupBy({ by: ["role"], _count: true });
  console.log("Akaun ikut peranan:", ikutPeranan.map((r) => `${r.role}=${r._count}`).join(", "));

  const akaun = await prisma.user.findMany({
    where: { role: "Guru" },
    select: { id: true, username: true, passwordHash: true, mustChangePw: true, statusAktif: true, guruId: true },
  });
  const tidakAktif = akaun.filter((a) => !a.statusAktif).length;
  const tanpaProfil = akaun.filter((a) => !a.guruId).length;
  const guruTanpaAkaun = await prisma.guru.count({ where: { user: null } });
  const bukanGuruBerprofil = await prisma.user.count({ where: { role: { not: "Guru" }, guruId: { not: null } } });

  console.log(`Akaun role=Guru: ${akaun.length} (tidak aktif: ${tidakAktif}, tanpa profil Guru: ${tanpaProfil})`);
  console.log(`Profil Guru tanpa akaun log masuk: ${guruTanpaAkaun}`);
  console.log(`Akaun bukan-Guru yang berpaut profil Guru (TIDAK disentuh): ${bukanGuruBerprofil}`);

  if (!APPLY) {
    console.log("Semakan sahaja — tiada apa-apa diubah. Tambah --apply untuk laksana.");
    return;
  }

  writeFileSync(FAIL_BACKUP, JSON.stringify(akaun, null, 2), "utf-8");
  console.log(`Backup hash lama: ${FAIL_BACKUP}`);

  // Hash berasingan (salt unik) bagi setiap akaun.
  const kemaskini = [];
  for (const a of akaun) {
    const passwordHash = await hashPassword(KATA_LALUAN);
    if (!(await verifyPassword(KATA_LALUAN, passwordHash))) throw new Error("Semakan hash gagal");
    kemaskini.push(prisma.user.update({ where: { id: a.id }, data: { passwordHash, mustChangePw: true } }));
  }
  await prisma.$transaction(kemaskini);

  // Sahkan dari DB.
  const selepas = await prisma.user.findMany({ where: { role: "Guru" }, select: { passwordHash: true, mustChangePw: true } });
  let sah = 0;
  for (const s of selepas) if (s.mustChangePw && (await verifyPassword(KATA_LALUAN, s.passwordHash))) sah++;
  console.log(`✓ Dikemas kini: ${kemaskini.length}. Disahkan dari DB: ${sah}/${selepas.length}`);
}

main()
  .catch((e) => { console.error("✗ Ralat:", e.message); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
