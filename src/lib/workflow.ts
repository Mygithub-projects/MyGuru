// ===========================================================================
//  Logik Aliran Kerja — pertukaran unit, semakan pencapaian & aktiviti luar.
//  (Spesifikasi §4, §5.5, §7). Semua peralihan status & kemas kini T6 di sini.
// ===========================================================================
import { prisma } from "./prisma";
import {
  kiraSkor,
  markahAktivitiLuar,
  markahJawatan,
  markahPenglibatan,
  markahPencapaian,
  markahProjekJawatan,
  markahProjekPeringkat,
  markahEkstra,
  bidangDariJenisKoko,
} from "./pajsk";
import { JAWATAN_GURU_SELURUH_SEKOLAH, type JenisKoko } from "./enums";
import { notifyPelajar, notifyGuruUntukUnit } from "./notifikasi";
import type { Guru } from "@prisma/client";

// ---------------------------------------------------------------------------
//  Skop akses guru
// ---------------------------------------------------------------------------

/** Adakah guru ini melihat keseluruhan sekolah (Penyelaras / Pemantau / Pen.SU)? */
export function guruSeluruhSekolah(guru: Pick<Guru, "jawatanKoko">): boolean {
  return JAWATAN_GURU_SELURUH_SEKOLAH.includes(
    guru.jawatanKoko as (typeof JAWATAN_GURU_SELURUH_SEKOLAH)[number]
  );
}

/**
 * Senarai nama unit yang diselia guru (padan namaUnitT6).
 * SUMBER KEBENARAN (§3): jadual pautan GuruPenasihatKelab — bukan lagi medan
 * kelabDiselia/sukanDiselia/badanDiselia (deprecated). Skop di peringkat UNIT:
 * KetuaGP/PenolongKetuaGP/GuruPenasihat hanya melihat/mengurus pelajar dalam
 * unit yang ditugaskan secara langsung kepada mereka.
 */
export async function unitSeliaan(guru: Pick<Guru, "id">): Promise<string[]> {
  const rows = await prisma.guruPenasihatKelab.findMany({
    where: { guruId: guru.id },
    select: { namaUnit: true },
  });
  return rows.map((r) => r.namaUnit);
}

export interface PenasihatKelabInput {
  namaUnit: string;
  jenisKoko: string;
  peranan?: string; // Penasihat | KetuaPenasihat (default Penasihat)
}

/**
 * Tetapkan SEMUA penugasan unit seorang guru (§3). Menggantikan penuh baris
 * GuruPenasihatKelab sedia ada untuk guru itu dengan senarai baharu. Digunakan
 * oleh API admin (cipta/edit) & import guru.
 */
export async function syncPenasihatKelab(guruId: string, senarai: PenasihatKelabInput[]) {
  const bersih = senarai
    .map((s) => ({ namaUnit: s.namaUnit.trim(), jenisKoko: s.jenisKoko, peranan: s.peranan ?? "Penasihat" }))
    .filter((s) => s.namaUnit.length > 0);
  // Nyahduplikasi ikut namaUnit (unik per guru).
  const unik = new Map<string, PenasihatKelabInput>();
  for (const s of bersih) unik.set(s.namaUnit, s);

  await prisma.$transaction([
    prisma.guruPenasihatKelab.deleteMany({ where: { guruId } }),
    prisma.guruPenasihatKelab.createMany({
      data: [...unik.values()].map((s) => ({
        guruId,
        namaUnit: s.namaUnit,
        jenisKoko: s.jenisKoko,
        peranan: s.peranan ?? "Penasihat",
      })),
    }),
  ]);
}

/** Bina senarai penugasan dari medan lama kelab/sukan/badanDiselia (migrasi). */
export function penasihatDariMedanLama(g: {
  kelabDiselia?: string | null;
  sukanDiselia?: string | null;
  badanDiselia?: string | null;
}): PenasihatKelabInput[] {
  const out: PenasihatKelabInput[] = [];
  if (g.kelabDiselia) out.push({ namaUnit: g.kelabDiselia, jenisKoko: "Kelab" });
  if (g.sukanDiselia) out.push({ namaUnit: g.sukanDiselia, jenisKoko: "Sukan" });
  if (g.badanDiselia) out.push({ namaUnit: g.badanDiselia, jenisKoko: "Uniform" });
  return out;
}

/** Peranan guru dalam unit tertentu, atau null jika bukan penasihat unit itu. */
export async function perananGuruUnit(guruId: string, namaUnit: string): Promise<string | null> {
  const row = await prisma.guruPenasihatKelab.findUnique({
    where: { guruId_namaUnit: { guruId, namaUnit } },
    select: { peranan: true },
  });
  return row?.peranan ?? null;
}

/**
 * Keputusan akses TULEN (§3) — boleh diuji tanpa DB. Guru seluruh sekolah:
 * sentiasa boleh. Guru unit: hanya jika pelajar berada dalam salah satu unit
 * seliaan guru. Tiada unit seliaan → tiada akses.
 */
export function bolehAksesUnit(opts: {
  seluruhSekolah: boolean;
  unitSeliaan: string[];
  unitPelajar: string[];
}): boolean {
  if (opts.seluruhSekolah) return true;
  if (opts.unitSeliaan.length === 0) return false;
  const skop = new Set(opts.unitSeliaan);
  return opts.unitPelajar.some((u) => skop.has(u));
}

/** Adakah guru boleh mengakses/menyemak rekod pelajar ini? (skop unit) */
export async function bolehGuruAksesPelajar(
  guru: Pick<Guru, "id" | "jawatanKoko">,
  pelajarId: string
): Promise<boolean> {
  if (guruSeluruhSekolah(guru)) return true;
  const units = await unitSeliaan(guru);
  if (units.length === 0) return false;
  const koko = await prisma.kokurikulum.findMany({
    where: { pelajarId },
    select: { namaUnitT6: true },
  });
  const unitPelajar = koko.map((k) => k.namaUnitT6).filter((u): u is string => !!u);
  return bolehAksesUnit({ seluruhSekolah: false, unitSeliaan: units, unitPelajar });
}

// ---------------------------------------------------------------------------
//  Kira semula markah PAJSK T6 dari komponen semasa (selepas perubahan)
// ---------------------------------------------------------------------------

export async function kiraSemulaT6(pelajarId: string) {
  const pelajar = await prisma.pelajar.findUnique({
    where: { id: pelajarId },
    include: {
      kokurikulum: true,
      kehadiran: true,
      aktivitiLuar: true,
      pencapaian: true,
      laporanProjek: true,
    },
  });
  if (!pelajar) return null;

  const maks = (arr: number[]) => arr.reduce((m, n) => Math.max(m, n), 0);

  // --- JAWATAN (§1.3): tertinggi merentas unit, jadual ikut jenis bidang.
  // Kira semula dari teks jawatanT6 supaya konsisten dengan jadual baharu, dan
  // segarkan nilai tersimpan setiap baris kokurikulum.
  let markahJwt = 0;
  for (const k of pelajar.kokurikulum) {
    const mj = k.jawatanT6 ? markahJawatan(k.jawatanT6, bidangDariJenisKoko(k.jenisKoko)) : 0;
    const mp = markahPenglibatan(k.peringkatT6);
    markahJwt = Math.max(markahJwt, mj);
    if (mj !== (k.markahJawatanT6 ?? -1) || mp !== (k.markahPeringkatT6 ?? -1)) {
      await prisma.kokurikulum.update({
        where: { id: k.id },
        data: { markahJawatanT6: mj, markahPeringkatT6: mp },
      });
    }
  }

  const luarLulus = pelajar.aktivitiLuar.filter((a) => a.statusPengesahan === "Approved");
  const pencapaianLulus = pelajar.pencapaian.filter((p) => p.statusSemakan === "Approved");

  // --- PENGLIBATAN (§1.4): peringkat tertinggi (koko + aktiviti luar diluluskan).
  const markahPglb = maks([
    ...pelajar.kokurikulum.map((k) => markahPenglibatan(k.peringkatT6)),
    ...luarLulus.map((a) => markahPenglibatan(a.peringkat)),
  ]);

  // --- PENCAPAIAN (§1.5): peringkat × kedudukan, tertinggi (kecuali item ekstra).
  const markahPcp = maks([
    ...luarLulus.map((a) => markahPencapaian(a.peringkat, a.namaAktiviti)),
    ...pencapaianLulus
      .filter((p) => p.kategori !== "ekstra")
      .map((p) => markahPencapaian(p.peringkat, p.kedudukan)),
  ]);

  // --- PROJEK (§1.6 & §1.7): tertinggi merentas laporan projek yang diluluskan.
  const projekLulus = pelajar.laporanProjek.filter((pr) => pr.statusPengesahan === "Approved");
  const markahPjJwt = maks(projekLulus.map((pr) => markahProjekJawatan(pr.jawatanProjek)));
  const markahPjPrk = maks(projekLulus.map((pr) => markahProjekPeringkat(pr.peringkatProjek)));

  // --- EKSTRA KURIKULUM (§1.8): MAX antara item ekstra yang diluluskan (bonus).
  const markahEks = markahEkstra(
    pencapaianLulus.filter((p) => p.kategori === "ekstra").map((p) => p.namaPencapaian)
  );

  const skor = kiraSkor({
    markahKehadiran: pelajar.markahKehadiran, // §1.2, dikira oleh modul Kehadiran
    markahJawatan: markahJwt,
    markahPenglibatan: markahPglb,
    markahPencapaian: markahPcp,
    markahProjekJawatan: markahPjJwt,
    markahProjekPeringkat: markahPjPrk,
    markahEkstra: markahEks,
  });

  await prisma.pelajar.update({
    where: { id: pelajarId },
    data: {
      markahPajskT6: skor.jumlahTeras,
      peratusPajskT6: skor.peratus,
      gredPajskT6: skor.gred,
      markahPenglibatan: skor.penglibatan,
      markahPencapaian: skor.pencapaian,
      markahProjekJawatan: skor.projekJawatan,
      markahProjekPeringkat: skor.projekPeringkat,
      markahEkstra: skor.ekstra,
    },
  });
  return skor;
}

// ---------------------------------------------------------------------------
//  Pertukaran unit (§7)
// ---------------------------------------------------------------------------

export async function mohonPertukaran(input: {
  pelajarId: string;
  jenisKoko: JenisKoko;
  unitBaru: string;
  sebab?: string;
}) {
  const koko = await prisma.kokurikulum.findUnique({
    where: { pelajarId_jenisKoko: { pelajarId: input.pelajarId, jenisKoko: input.jenisKoko } },
  });
  if (koko && koko.statusPertukaran === "Pending") {
    throw new Error("Sudah ada permohonan pertukaran yang menunggu kelulusan untuk unit ini.");
  }

  const log = await prisma.logPertukaran.create({
    data: {
      pelajarId: input.pelajarId,
      jenisKoko: input.jenisKoko,
      unitLama: koko?.namaUnitT6 ?? null,
      unitBaru: input.unitBaru,
      sebab: input.sebab,
      status: "Pending",
    },
  });

  // Tandakan baris kokurikulum sebagai Pending (cipta jika belum ada)
  await prisma.kokurikulum.upsert({
    where: { pelajarId_jenisKoko: { pelajarId: input.pelajarId, jenisKoko: input.jenisKoko } },
    update: { statusPertukaran: "Pending" },
    create: {
      pelajarId: input.pelajarId,
      jenisKoko: input.jenisKoko,
      statusPertukaran: "Pending",
    },
  });

  // Notifikasi guru seliaan + Penyelaras/Pemantau bahawa ada permohonan baharu
  const pelajar = await prisma.pelajar.findUnique({
    where: { id: input.pelajarId },
    select: { nama: true },
  });
  const jenisMohon = koko?.namaUnitT6 ? "Pertukaran" : "Pendaftaran";
  await notifyGuruUntukUnit(koko?.namaUnitT6 ?? input.unitBaru, {
    tajuk: `Permohonan ${jenisMohon} unit`,
    mesej: `${pelajar?.nama ?? "Pelajar"} memohon ${jenisMohon.toLowerCase()} ${input.jenisKoko}: ${
      koko?.namaUnitT6 ? `${koko.namaUnitT6} → ` : ""
    }${input.unitBaru}. Menunggu kelulusan.`,
    jenis: "info",
    pautan: "/guru",
  });

  return log;
}

/** Guru memproses permohonan: "Approved" atau "Reject". */
export async function prosesPertukaran(input: {
  logId: string;
  status: "Approved" | "Reject";
  guruId: string | null; // null bila diproses oleh Admin (bukan rekod Guru)
  komen?: string;
}) {
  const log = await prisma.logPertukaran.findUnique({ where: { id: input.logId } });
  if (!log) throw new Error("Permohonan pertukaran tidak dijumpai.");
  if (log.status !== "Pending") throw new Error("Permohonan ini telah pun diproses.");

  await prisma.logPertukaran.update({
    where: { id: input.logId },
    data: {
      status: input.status,
      guruId: input.guruId ?? null,
      komenGuru: input.komen,
      tarikhLulus: new Date(),
    },
  });

  if (input.status === "Approved") {
    // T6 = unit baru; jawatan reset ke "Ahli"; markah jawatan/peringkat reset.
    // Data T5 KEKAL (tidak disentuh).
    await prisma.kokurikulum.update({
      where: { pelajarId_jenisKoko: { pelajarId: log.pelajarId, jenisKoko: log.jenisKoko } },
      data: {
        namaUnitT6: log.unitBaru,
        jawatanT6: "Ahli Aktif",
        markahJawatanT6: 4, // Ahli Aktif = 4 (spec 5.2)
        peringkatT6: "Sekolah",
        markahPeringkatT6: 5,
        statusPertukaran: "Approved",
        tarikhKemaskini: new Date(),
        guruLulusId: input.guruId ?? null,
      },
    });
    await kiraSemulaT6(log.pelajarId);
  } else {
    // Ditolak: kekal unit asal
    await prisma.kokurikulum.update({
      where: { pelajarId_jenisKoko: { pelajarId: log.pelajarId, jenisKoko: log.jenisKoko } },
      data: { statusPertukaran: "None" },
    });
  }

  await notifyPelajar(log.pelajarId, {
    tajuk: input.status === "Approved" ? "Pertukaran unit diluluskan" : "Pertukaran unit ditolak",
    mesej:
      input.status === "Approved"
        ? `Pertukaran ${log.jenisKoko} ke "${log.unitBaru}" telah diluluskan. Data T6 dikemas kini.`
        : `Permohonan pertukaran ${log.jenisKoko} ditolak.${input.komen ? " Sebab: " + input.komen : ""}`,
    jenis: input.status === "Approved" ? "lulus" : "tolak",
    pautan: "/pelajar/tukar-unit",
  });

  return log;
}

// ---------------------------------------------------------------------------
//  Semakan Pencapaian (guru beri markah + status)
// ---------------------------------------------------------------------------

export async function sahkanPencapaian(input: {
  pencapaianId: string;
  status: "Approved" | "Kuiri";
  markah?: number;
  komen?: string;
}) {
  const p = await prisma.pencapaian.update({
    where: { id: input.pencapaianId },
    data: {
      statusSemakan: input.status,
      markah: input.markah ?? undefined,
      komenGuru: input.komen,
    },
  });
  await kiraSemulaT6(p.pelajarId);
  await notifyPelajar(p.pelajarId, {
    tajuk: input.status === "Approved" ? "Pencapaian disahkan" : "Pencapaian dikuiri",
    mesej:
      input.status === "Approved"
        ? `Pencapaian "${p.namaPencapaian}" disahkan (${input.markah ?? 0} markah).`
        : `Pencapaian "${p.namaPencapaian}" perlu pembetulan.${input.komen ? " " + input.komen : ""}`,
    jenis: input.status === "Approved" ? "lulus" : "kuiri",
    pautan: "/pelajar",
  });
  return p;
}

// ---------------------------------------------------------------------------
//  Semakan Aktiviti Luar (Lulus → markah auto ikut peringkat → e-Cert aktif)
// ---------------------------------------------------------------------------

/** Jana No. Siri e-Cert unik & boleh diaudit. */
export function janaNoSiri(pelajarId: string, aktivitiId: string): string {
  const tahun = new Date().getFullYear();
  const a = pelajarId.slice(-4).toUpperCase();
  const b = aktivitiId.slice(-4).toUpperCase();
  return `EKOKO/${tahun}/${a}-${b}`;
}

export async function sahkanAktivitiLuar(input: {
  aktivitiId: string;
  status: "Approved" | "Kuiri";
  komen?: string;
}) {
  const aktiviti = await prisma.aktivitiLuar.findUnique({ where: { id: input.aktivitiId } });
  if (!aktiviti) throw new Error("Aktiviti luar tidak dijumpai.");

  // Syarat eviden lengkap untuk kelulusan (Verification Agent — §14)
  if (input.status === "Approved" && (!aktiviti.lampiranSurat || !aktiviti.lampiranSijil)) {
    throw new Error("Eviden tidak lengkap: surat & sijil diperlukan sebelum kelulusan.");
  }

  const markah = input.status === "Approved" ? markahAktivitiLuar(aktiviti.peringkat) : 0;
  const updated = await prisma.aktivitiLuar.update({
    where: { id: input.aktivitiId },
    data: {
      statusPengesahan: input.status,
      markahLuar: markah,
      komenGuru: input.komen,
      // Aktifkan e-Cert hanya bila diluluskan
      noSiriECert:
        input.status === "Approved"
          ? aktiviti.noSiriECert ?? janaNoSiri(aktiviti.pelajarId, aktiviti.id)
          : null,
      tarikhJanaECert: input.status === "Approved" ? aktiviti.tarikhJanaECert ?? new Date() : null,
    },
  });
  await kiraSemulaT6(aktiviti.pelajarId);
  await notifyPelajar(aktiviti.pelajarId, {
    tajuk: input.status === "Approved" ? "Aktiviti luar disahkan" : "Aktiviti luar dikuiri",
    mesej:
      input.status === "Approved"
        ? `"${updated.namaAktiviti}" disahkan — ${markah} markah, e-Cert sedia dijana.`
        : `"${updated.namaAktiviti}" perlu pembetulan.${input.komen ? " " + input.komen : ""}`,
    jenis: input.status === "Approved" ? "lulus" : "kuiri",
    pautan: "/pelajar/aktiviti",
  });
  return updated;
}

// ---------------------------------------------------------------------------
//  Pemilihan Pelajar untuk Pertandingan / Sukan (guru pilih → penyertaan)
// ---------------------------------------------------------------------------

/**
 * Guru memilih pelajar untuk mewakili menyertai pertandingan/sukan pada
 * peringkat tertentu (Zon/Daerah, Negeri, Kebangsaan, Antarabangsa). Mencipta
 * rekod Aktiviti Luar berstatus "Pending" — markah peringkat & e-Cert hanya
 * diberi selepas surat & sijil dimuat naik dan disahkan melalui saluran
 * `sahkanAktivitiLuar` sedia ada. Skop akses guru disemak di lapisan API.
 */
export async function pilihPelajarUntukPertandingan(input: {
  pelajarId: string;
  namaAktiviti: string;
  peringkat: string;
  tarikh?: Date | null;
}) {
  const rec = await prisma.aktivitiLuar.create({
    data: {
      pelajarId: input.pelajarId,
      namaAktiviti: input.namaAktiviti,
      peringkat: input.peringkat,
      tarikh: input.tarikh ?? null,
      statusPengesahan: "Pending",
    },
  });
  await notifyPelajar(input.pelajarId, {
    tajuk: "Anda dipilih menyertai pertandingan",
    mesej: `Anda dipilih untuk "${input.namaAktiviti}" (peringkat ${input.peringkat}). Muat naik surat & sijil selepas pertandingan untuk pengesahan markah & e-Cert.`,
    jenis: "info",
    pautan: "/pelajar/aktiviti",
  });
  return rec;
}

// ---------------------------------------------------------------------------
//  Cadangan Jawatan Tertinggi (SU cadang -> Guru sahkan)
// ---------------------------------------------------------------------------

export async function cadangJawatan(input: {
  pelajarId: string;
  jenisKoko: JenisKoko;
  jawatanBaru: string;
  dicadangOlehId?: string;
}) {
  const sedia = await prisma.cadanganJawatan.findFirst({
    where: { pelajarId: input.pelajarId, jenisKoko: input.jenisKoko, status: "Pending" },
  });
  if (sedia) throw new Error("Sudah ada cadangan jawatan menunggu kelulusan untuk unit ini.");

  return prisma.cadanganJawatan.create({
    data: {
      pelajarId: input.pelajarId,
      jenisKoko: input.jenisKoko,
      jawatanBaru: input.jawatanBaru,
      markahJawatan: markahJawatan(input.jawatanBaru, bidangDariJenisKoko(input.jenisKoko)),
      dicadangOlehId: input.dicadangOlehId,
      status: "Pending",
    },
  });
}

/**
 * Guru penasihat MENETAPKAN terus jawatan pelajar untuk satu unit (spec guru §5).
 * Tidak melalui aliran cadangan — terus kemas kini T6, kira semula markah, dan
 * selaraskan sub-peranan pelajar (Setiausaha → SU, Penolong Setiausaha → NSU)
 * supaya mereka boleh mengisi kehadiran & laporan.
 */
export async function tetapkanJawatanOlehGuru(input: {
  pelajarId: string;
  jenisKoko: JenisKoko;
  jawatan: string;
  guruId: string | null;
}) {
  const koko = await prisma.kokurikulum.findUnique({
    where: { pelajarId_jenisKoko: { pelajarId: input.pelajarId, jenisKoko: input.jenisKoko } },
  });
  if (!koko || !koko.namaUnitT6) {
    throw new Error("Pelajar belum berdaftar dalam unit ini untuk T6.");
  }

  const markah = markahJawatan(input.jawatan);
  await prisma.kokurikulum.update({
    where: { pelajarId_jenisKoko: { pelajarId: input.pelajarId, jenisKoko: input.jenisKoko } },
    data: {
      jawatanT6: input.jawatan,
      markahJawatanT6: markah,
      tarikhKemaskini: new Date(),
      guruLulusId: input.guruId ?? null,
    },
  });

  // Selaraskan sub-peranan pelajar mengikut jawatan yang ditetapkan.
  const j = input.jawatan.toUpperCase();
  const subRole = j.includes("PENOLONG SETIAUSAHA")
    ? "NSU"
    : j.includes("SETIAUSAHA")
    ? "SU"
    : null;
  if (subRole) {
    await prisma.pelajar.update({ where: { id: input.pelajarId }, data: { subRole } });
  }

  await kiraSemulaT6(input.pelajarId);
  await notifyPelajar(input.pelajarId, {
    tajuk: "Jawatan kokurikulum dikemas kini",
    mesej: `Guru penasihat menetapkan jawatan ${input.jenisKoko} anda kepada "${input.jawatan}" (${markah} markah)${
      subRole ? ` — anda kini ${subRole === "SU" ? "Setiausaha" : "Penolong Setiausaha"} unit.` : "."
    }`,
    jenis: "lulus",
    pautan: "/pelajar",
  });
  return { markah, subRole };
}

export async function prosesCadanganJawatan(input: {
  id: string;
  status: "Approved" | "Reject";
  guruId: string | null;
  komen?: string;
}) {
  const c = await prisma.cadanganJawatan.findUnique({ where: { id: input.id } });
  if (!c) throw new Error("Cadangan jawatan tidak dijumpai.");
  if (c.status !== "Pending") throw new Error("Cadangan ini telah pun diproses.");

  await prisma.cadanganJawatan.update({
    where: { id: input.id },
    data: { status: input.status, guruId: input.guruId, komen: input.komen, tarikhProses: new Date() },
  });

  if (input.status === "Approved") {
    await prisma.kokurikulum.update({
      where: { pelajarId_jenisKoko: { pelajarId: c.pelajarId, jenisKoko: c.jenisKoko } },
      data: { jawatanT6: c.jawatanBaru, markahJawatanT6: c.markahJawatan, tarikhKemaskini: new Date() },
    });
    await kiraSemulaT6(c.pelajarId);
  }

  await notifyPelajar(c.pelajarId, {
    tajuk: input.status === "Approved" ? "Jawatan T6 disahkan" : "Cadangan jawatan ditolak",
    mesej:
      input.status === "Approved"
        ? `Jawatan ${c.jenisKoko} anda dikemas kini kepada "${c.jawatanBaru}" (${c.markahJawatan} markah).`
        : `Cadangan jawatan ${c.jenisKoko} ditolak.${input.komen ? " " + input.komen : ""}`,
    jenis: input.status === "Approved" ? "lulus" : "tolak",
    pautan: "/pelajar",
  });
  return c;
}
