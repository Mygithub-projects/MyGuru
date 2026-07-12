// ===========================================================================
//  Bootstrap produksi — cipta akaun Admin + tetapan markah PAJSK asas.
//  TIDAK memerlukan fail Excel (data pelajar/guru diimport melalui UI Admin
//  selepas deploy). Jalankan sekali terhadap pangkalan data produksi:
//
//    DATABASE_URL="postgresql://..." npx tsx scripts/bootstrap.ts
// ===========================================================================
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PW = process.env.ADMIN_PASSWORD || process.env.DEFAULT_SEED_PASSWORD || "ekoko2026";

async function main() {
  console.log("Bootstrap produksi KoKurikulum ...");

  // 1. Tetapan markah PAJSK
  const jawatan: Record<string, number> = {
    "Pengerusi / Presiden / Kapten / Ketua Pasukan / Ketua Rumah": 10,
    "Timbalan / Naib Pengerusi": 8,
    "Setiausaha / Bendahari": 7,
    "Penolong Setiausaha / Penolong Bendahari": 6,
    "Ahli Jawatankuasa": 5,
    "Ahli Aktif": 4,
    "Ahli Biasa": 2,
  };
  const peringkat: Record<string, number> = { Kebangsaan: 10, Negeri: 8, Daerah: 6, Sekolah: 4 };
  const items = [
    ...Object.entries(jawatan).map(([namaItem, nilaiMarkah]) => ({ kategori: "Jawatan", namaItem, nilaiMarkah })),
    ...Object.entries(peringkat).map(([namaItem, nilaiMarkah]) => ({ kategori: "Peringkat", namaItem, nilaiMarkah })),
    { kategori: "Sistem", namaItem: "Markah Penuh", nilaiMarkah: 100 },
    { kategori: "Sistem", namaItem: "Markah Kehadiran Penuh", nilaiMarkah: 50 },
  ];
  for (const it of items) {
    await prisma.tetapanMarkah.upsert({
      where: { kategori_namaItem: { kategori: it.kategori, namaItem: it.namaItem } },
      update: { nilaiMarkah: it.nilaiMarkah },
      create: { ...it, markahPenuh: 100 },
    });
  }
  console.log(`  Tetapan markah: ${items.length} item`);

  // 2. Templat sijil lalai
  await prisma.tetapanSijil.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", institusi: process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota" },
  });

  // 3. Akaun Admin
  await prisma.user.upsert({
    where: { username: ADMIN_USER },
    update: {},
    create: {
      username: ADMIN_USER,
      email: `${ADMIN_USER}@ekoko.local`,
      passwordHash: await hashPassword(ADMIN_PW),
      role: "Admin",
      mustChangePw: true, // paksa tukar pada log masuk pertama (produksi)
    },
  });
  console.log(`  Admin: username=${ADMIN_USER} (mustChangePw=true)`);
  console.log("Selesai ✓  — log masuk sebagai Admin, tukar kata laluan, kemudian Import Data.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
