// ===========================================================================
//  Seed — import data sebenar (PAJSK T5 + Guru) & cipta akaun
//  Jalankan: npx tsx prisma/seed.ts
// ===========================================================================
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import {
  loadWorkbookFromFile,
  parseNamelistWorksheet,
  parsePajskWorksheet,
  parseGuruWorksheet,
} from "../src/lib/import";
import { mapJawatanGuru } from "../src/lib/jawatan-map";
import { markahJawatan, markahPeringkat } from "../src/lib/pajsk";
import { kiraSemulaT6, syncPenasihatKelab, penasihatDariMedanLama } from "../src/lib/workflow";

// Fail sumber terletak di folder induk projek
const DATA_DIR = path.resolve(process.cwd(), "..");
const FILE_NAMELIST = path.join(DATA_DIR, "namelist.xlsx");
const FILE_PAJSK = path.join(DATA_DIR, "DUMM PAJSK.xlsx"); // sejarah T5 (opsyenal)
const FILE_GURU = path.join(DATA_DIR, "GURU DATA.xlsx");
const DEFAULT_PW = process.env.DEFAULT_SEED_PASSWORD || "ekoko2026";

async function seedTetapanMarkah() {
  const items: { kategori: string; namaItem: string; nilaiMarkah: number }[] = [];
  // Rujukan jawatan (Kelab/Sukan §1.3b) — Uniform (§1.3a) diselia berasingan.
  const jawatanLabels: Record<string, number> = {
    "Pengerusi / Presiden / Kapten / Ketua Pasukan / Ketua Rumah": 10,
    "Timbalan / Naib Pengerusi": 8,
    "Setiausaha / Bendahari": 7,
    "Penolong Setiausaha / Penolong Bendahari": 6,
    "Ahli Jawatankuasa": 5,
    "Ahli Aktif": 4,
    "Ahli Biasa": 2,
  };
  // Rujukan penglibatan ikut peringkat (§1.4).
  const peringkatLabels: Record<string, number> = {
    Kebangsaan: 10,
    Negeri: 8,
    Daerah: 6,
    Sekolah: 4,
  };
  for (const [namaItem, nilaiMarkah] of Object.entries(jawatanLabels))
    items.push({ kategori: "Jawatan", namaItem, nilaiMarkah });
  for (const [namaItem, nilaiMarkah] of Object.entries(peringkatLabels))
    items.push({ kategori: "Peringkat", namaItem, nilaiMarkah });
  items.push({ kategori: "Sistem", namaItem: "Markah Penuh", nilaiMarkah: 100 });
  items.push({ kategori: "Sistem", namaItem: "Markah Kehadiran Penuh", nilaiMarkah: 50 });

  for (const it of items) {
    await prisma.tetapanMarkah.upsert({
      where: { kategori_namaItem: { kategori: it.kategori, namaItem: it.namaItem } },
      update: { nilaiMarkah: it.nilaiMarkah },
      create: { ...it, markahPenuh: 100 },
    });
  }
  console.log(`  Tetapan markah: ${items.length} item`);
}

async function seedAdmin() {
  const passwordHash = await hashPassword(DEFAULT_PW);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@ekoko.local",
      passwordHash,
      role: "Admin",
      mustChangePw: false,
    },
  });
  console.log(`  Admin: username=admin  password=${DEFAULT_PW}`);
}

async function seedPelajar() {
  // Roster sebenar Tingkatan 6 (namelist.xlsx). Termasuk demografi (Kaum,
  // Agama) serta jawatan & peringkat T6 per unit jika lajur tersebut wujud;
  // skor PAJSK T6 dikira semula dari komponen yang ada.
  const wb = await loadWorkbookFromFile(FILE_NAMELIST);
  const ws = wb.worksheets[0];
  const rows = parseNamelistWorksheet(ws);
  let ok = 0;
  const ralatRows: string[] = [];

  for (const r of rows) {
    if (r.ralat.length) ralatRows.push(`${r.kelas} ${r.nama}: ${r.ralat.join("; ")}`);
    if (!/^\d{12}$/.test(r.noIc)) continue; // langkau IC tak sah

    const pelajar = await prisma.pelajar.upsert({
      where: { noIc: r.noIc },
      update: {
        nama: r.nama,
        kelasT6: r.kelas,
        jantina: r.jantina || null,
        kaum: r.kaum || null,
        agama: r.agama || null,
        komitmen: r.komitmen ?? 0,
        khidmatSumbangan: r.khidmatSumbangan ?? 0,
        markahKehadiran: r.markahKehadiran ?? 0,
      },
      create: {
        nama: r.nama,
        noIc: r.noIc,
        kelasT6: r.kelas,
        jantina: r.jantina || null,
        kaum: r.kaum || null,
        agama: r.agama || null,
        markahPajskT6: 0,
        peratusPajskT6: 0,
        komitmen: r.komitmen ?? 0,
        khidmatSumbangan: r.khidmatSumbangan ?? 0,
        markahEkstra: 0,
        markahKehadiran: r.markahKehadiran ?? 0,
      },
    });

    // Unit kokurikulum semasa T6 — nama unit + jawatan & peringkat (jika ada
    // dalam fail). Markah jawatan/peringkat dikira dari teks oleh enjin PAJSK.
    const units = [
      { jenisKoko: "Uniform", nama: r.uniform, jawatan: r.jawatanUniform, peringkat: r.peringkatUniform },
      { jenisKoko: "Kelab", nama: r.kelab, jawatan: r.jawatanKelab, peringkat: r.peringkatKelab },
      { jenisKoko: "Sukan", nama: r.sukan, jawatan: r.jawatanSukan, peringkat: r.peringkatSukan },
    ] as const;
    for (const u of units) {
      if (!u.nama) continue;
      const data = {
        namaUnitT6: u.nama,
        jawatanT6: u.jawatan || null,
        peringkatT6: u.peringkat || null,
        markahJawatanT6: u.jawatan ? markahJawatan(u.jawatan) : null,
        markahPeringkatT6: u.peringkat ? markahPeringkat(u.peringkat) : null,
      };
      await prisma.kokurikulum.upsert({
        where: { pelajarId_jenisKoko: { pelajarId: pelajar.id, jenisKoko: u.jenisKoko } },
        update: data,
        create: { pelajarId: pelajar.id, jenisKoko: u.jenisKoko, statusPertukaran: "None", ...data },
      });
    }

    // Kira semula skor PAJSK T6 dari komponen yang ada (jawatan/peringkat).
    await kiraSemulaT6(pelajar.id);

    // Akaun login — username = No. IC, kata laluan awal = No. IC (dipaksa tukar).
    // Hanya akaun BAHARU ditetapkan kata laluan = IC; akaun sedia ada tidak
    // disentuh supaya kata laluan yang telah ditukar pengguna tidak dipadam.
    const passwordHash = await hashPassword(r.noIc);
    await prisma.user.upsert({
      where: { username: r.noIc },
      update: { pelajarId: pelajar.id },
      create: {
        username: r.noIc,
        passwordHash,
        role: "Pelajar",
        pelajarId: pelajar.id,
        mustChangePw: true,
      },
    });
    ok++;
  }
  console.log(`  Pelajar diimport: ${ok}/${rows.length}`);
  if (ralatRows.length) console.log(`  ⚠ Ralat IC (${ralatRows.length}):\n   - ${ralatRows.join("\n   - ")}`);
}

async function seedSejarahT5() {
  // Overlay sejarah PAJSK T5 (DUMM PAJSK.xlsx) ke pelajar T6 sedia ada,
  // dipadan melalui No. IC. Hanya mengisi medan T5 (rekod sejarah read-only)
  // untuk perbandingan T5↔T6; medan T6 dari namelist tidak disentuh.
  let wb;
  try {
    wb = await loadWorkbookFromFile(FILE_PAJSK);
  } catch {
    console.log("  Sejarah T5: fail DUMM PAJSK.xlsx tiada — dilangkau");
    return;
  }
  const ws = wb.worksheets[0];
  const rows = parsePajskWorksheet(ws);
  let ok = 0;
  let takJumpa = 0;

  for (const r of rows) {
    if (!/^\d{12}$/.test(r.noIc)) continue;
    const pelajar = await prisma.pelajar.findUnique({ where: { noIc: r.noIc } });
    if (!pelajar) {
      takJumpa++;
      continue;
    }

    // Isi medan T5 pada baris kokurikulum sedia ada (dipadan ikut Jenis_Koko)
    for (const k of r.koko) {
      await prisma.kokurikulum.upsert({
        where: { pelajarId_jenisKoko: { pelajarId: pelajar.id, jenisKoko: k.jenisKoko } },
        update: {
          namaUnitT5: k.namaUnit,
          jawatanT5: k.jawatan,
          peringkatT5: k.peringkat,
          markahJawatanT5: k.markahJawatan,
          markahPeringkatT5: k.markahPeringkat,
        },
        create: {
          pelajarId: pelajar.id,
          jenisKoko: k.jenisKoko,
          namaUnitT5: k.namaUnit,
          jawatanT5: k.jawatan,
          peringkatT5: k.peringkat,
          markahJawatanT5: k.markahJawatan,
          markahPeringkatT5: k.markahPeringkat,
          statusPertukaran: "None",
        },
      });
    }

    // Pencapaian ekstra kurikulum (import sebagai rekod disahkan)
    for (const e of r.ekstra) {
      const exists = await prisma.pencapaian.findFirst({
        where: { pelajarId: pelajar.id, namaPencapaian: e },
      });
      if (!exists) {
        await prisma.pencapaian.create({
          data: {
            pelajarId: pelajar.id,
            namaPencapaian: e,
            kategori: "ekstra",
            statusSemakan: "Approved",
            markah: 0,
          },
        });
      }
    }
    ok++;
  }
  console.log(
    `  Sejarah T5 dipadan: ${ok}/${rows.length}` +
      (takJumpa ? ` (${takJumpa} IC tiada dalam roster T6)` : "")
  );
}

async function seedGuru() {
  const wb = await loadWorkbookFromFile(FILE_GURU);
  const ws = wb.worksheets[0];
  const rows = parseGuruWorksheet(ws);
  let ok = 0;
  for (const g of rows) {
    if (!g.email) continue;
    const guru = await prisma.guru.upsert({
      where: { email: g.email },
      update: {
        nama: g.nama,
        jawatanKoko: mapJawatanGuru(g.jawatan),
        kelabDiselia: g.kelab || null,
        sukanDiselia: g.sukan || null,
        badanDiselia: g.badan || null,
      },
      create: {
        nama: g.nama,
        noIc: g.noIc || `NA-${g.email}`,
        email: g.email,
        jawatanKoko: mapJawatanGuru(g.jawatan),
        kelabDiselia: g.kelab || null,
        sukanDiselia: g.sukan || null,
        badanDiselia: g.badan || null,
      },
    });
    await syncPenasihatKelab(
      guru.id,
      penasihatDariMedanLama({ kelabDiselia: g.kelab, sukanDiselia: g.sukan, badanDiselia: g.badan })
    );
    // Akaun login guru — username & kata laluan awal = No. IC (dipaksa tukar).
    // Jika No. IC tidak sah, guna emel sebagai username & kata laluan lalai.
    // Dikunci ikut guruId supaya akaun sedia ada tidak diduplikasi/dipadam.
    const icSah = /^\d{12}$/.test(guru.noIc);
    const username = icSah ? guru.noIc : g.email;
    const passwordHash = await hashPassword(icSah ? guru.noIc : DEFAULT_PW);
    const akaun = await prisma.user.findFirst({ where: { guruId: guru.id }, select: { id: true } });
    if (akaun) {
      await prisma.user.update({ where: { id: akaun.id }, data: { guruId: guru.id } });
    } else {
      await prisma.user.create({
        data: { username, email: g.email, passwordHash, role: "Guru", guruId: guru.id, mustChangePw: true },
      });
    }
    ok++;
  }
  console.log(`  Guru diimport: ${ok}/${rows.length}`);
}

async function main() {
  console.log("Seeding KoKurikulum ...");
  await seedTetapanMarkah();
  await seedAdmin();
  await seedPelajar();
  await seedSejarahT5();
  await seedGuru();
  console.log("Selesai ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
