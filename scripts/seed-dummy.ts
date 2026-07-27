// ===========================================================================
//  Seed DUMMY — gantikan semua pelajar dengan 50 pelajar dummy untuk demo.
//  Jalankan: npx tsx scripts/seed-dummy.ts
//  Kekalkan: guru, admin, tetapan. Padam: semua pelajar & rekod berkaitan.
// ===========================================================================
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import { markahJawatan, markahPeringkat } from "../src/lib/pajsk";
import { kiraSemulaT6 } from "../src/lib/workflow";

const JUMLAH = 50;
const PW = process.env.DEFAULT_SEED_PASSWORD || "ekoko2026";
const KELAS = ["6 Sains 1", "6 Sains 2", "6 Kemanusiaan 1", "6 Kemanusiaan 2"];
const KAUM = ["Melayu", "Cina", "India", "Lain-lain"];
const AGAMA: Record<string, string> = { Melayu: "Islam", Cina: "Buddha", India: "Hindu", "Lain-lain": "Kristian" };
const PERINGKAT_CYCLE = ["Sekolah", "Sekolah", "Sekolah", "Daerah", "Negeri", "Kebangsaan"];
const pad2 = (n: number) => String(n).padStart(2, "0");

async function unitBerpenasihat() {
  const guru = await prisma.guru.findMany({
    select: { kelabDiselia: true, sukanDiselia: true, badanDiselia: true },
  });
  const uniq = (arr: (string | null)[]) => [...new Set(arr.filter(Boolean) as string[])];
  return {
    kelab: uniq(guru.map((g) => g.kelabDiselia)),
    sukan: uniq(guru.map((g) => g.sukanDiselia)),
    uniform: uniq(guru.map((g) => g.badanDiselia)),
  };
}

async function padamPelajar() {
  await prisma.notifikasi.deleteMany({});
  await prisma.cadanganAgent.deleteMany({});
  await prisma.cadanganJawatan.deleteMany({});
  await prisma.kehadiran.deleteMany({});
  await prisma.sesiKehadiran.deleteMany({});
  await prisma.laporanMingguan.deleteMany({});
  await prisma.laporanProjek.deleteMany({});
  await prisma.logPertukaran.deleteMany({});
  await prisma.pencapaian.deleteMany({});
  await prisma.aktivitiLuar.deleteMany({});
  await prisma.kokurikulum.deleteMany({});
  await prisma.user.deleteMany({ where: { role: "Pelajar" } });
  const del = await prisma.pelajar.deleteMany({});
  console.log(`  Padam ${del.count} pelajar sedia ada + rekod berkaitan`);
}

// Jawatan kelab ikut corak indeks (beri kepelbagaian + beberapa SU/NSU)
function jawatanKelab(i: number): { jawatan: string; subRole: string } {
  const m = i % 10;
  if (m === 1) return { jawatan: "Ketua", subRole: "Pelajar" };
  if (m === 2) return { jawatan: "Setiausaha", subRole: "SU" };
  if (m === 3) return { jawatan: "Penolong Setiausaha", subRole: "NSU" };
  if (m === 4) return { jawatan: "Naib Ketua", subRole: "Pelajar" };
  if (m === 5) return { jawatan: "AJK", subRole: "Pelajar" };
  return { jawatan: "Ahli Aktif", subRole: "Pelajar" };
}

async function main() {
  console.log("Seeding 50 pelajar DUMMY ...");
  const units = await unitBerpenasihat();
  if (!units.kelab.length || !units.sukan.length || !units.uniform.length) {
    throw new Error("Tiada unit berpenasihat mencukupi. Seed guru dahulu (npm run db:seed).");
  }
  await padamPelajar();
  const passwordHash = await hashPassword(PW);

  for (let i = 1; i <= JUMLAH; i++) {
    const noIc = "0701010000" + pad2(i); // 12 digit, unik
    const kaum = KAUM[i % KAUM.length];
    const jkelab = jawatanKelab(i);
    const kelab = units.kelab[i % units.kelab.length];
    const sukan = units.sukan[i % units.sukan.length];
    const uniform = units.uniform[i % units.uniform.length];
    const peringkatKelab = PERINGKAT_CYCLE[i % PERINGKAT_CYCLE.length];

    const pelajar = await prisma.pelajar.create({
      data: {
        nama: `Pelajar Dummy ${pad2(i)}`,
        noIc,
        kelasT6: KELAS[i % KELAS.length],
        jantina: i % 2 === 0 ? "P" : "L",
        kaum,
        agama: AGAMA[kaum],
        komitmen: 6 + (i % 5),          // 6..10
        khidmatSumbangan: 4 + (i % 6),  // 4..9
        markahEkstra: 0,
        markahKehadiran: 0,             // tiada rekod kehadiran lagi (diisi SU kelak)
        markahPajskT6: 0,
        peratusPajskT6: 0,
      },
    });

    // 3 unit T6 (+ salinan ringkas ke T5 untuk perbandingan)
    const unitDefs = [
      { jenisKoko: "Kelab", nama: kelab, jawatan: jkelab.jawatan, peringkat: peringkatKelab },
      { jenisKoko: "Sukan", nama: sukan, jawatan: "Ahli Aktif", peringkat: PERINGKAT_CYCLE[(i + 2) % PERINGKAT_CYCLE.length] },
      { jenisKoko: "Uniform", nama: uniform, jawatan: "Ahli Aktif", peringkat: "Sekolah" },
    ] as const;

    for (const u of unitDefs) {
      await prisma.kokurikulum.create({
        data: {
          pelajarId: pelajar.id,
          jenisKoko: u.jenisKoko,
          statusPertukaran: "None",
          namaUnitT6: u.nama,
          jawatanT6: u.jawatan,
          peringkatT6: u.peringkat,
          markahJawatanT6: markahJawatan(u.jawatan),
          markahPeringkatT6: markahPeringkat(u.peringkat),
          // T5 rujukan (kekal unit, jawatan asas)
          namaUnitT5: u.nama,
          jawatanT5: "Ahli Aktif",
          peringkatT5: "Sekolah",
          markahJawatanT5: markahJawatan("Ahli Aktif"),
          markahPeringkatT5: markahPeringkat("Sekolah"),
        },
      });
    }

    // Sub-peranan (SU/NSU) ikut jawatan kelab
    if (jkelab.subRole !== "Pelajar") {
      await prisma.pelajar.update({ where: { id: pelajar.id }, data: { subRole: jkelab.subRole } });
    }

    // Kira markah PAJSK T6 dari komponen
    await kiraSemulaT6(pelajar.id);

    // Akaun login (username = No. IC), boleh terus log masuk
    await prisma.user.create({
      data: {
        username: noIc,
        passwordHash,
        role: "Pelajar",
        pelajarId: pelajar.id,
        mustChangePw: false,
      },
    });
  }

  const total = await prisma.pelajar.count();
  console.log(`Selesai ✓  ${total} pelajar dummy dicipta. Log masuk: No. IC 070101000001..0701010000${JUMLAH}, kata laluan ${PW}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
