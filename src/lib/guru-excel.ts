// ===========================================================================
//  Muat turun / muat naik maklumat guru (Excel) — format pergi-balik:
//  fail yang dimuat turun boleh diedit & dimuat naik semula.
//  Satu baris = satu guru. Lajur unit (SUKAN/UNIFORM/KELAB/PERKHIDMATAN)
//  memuatkan senarai unit dipisah ";" dengan tag peranan, cth.
//  "Badminton (K); Ping Pong" — (K) Ketua, (P) Penolong, tiada tag = Penasihat.
// ===========================================================================
import ExcelJS from "exceljs";
import { prisma } from "./prisma";
import { hashPassword, normalizeIC } from "./auth";
import { cellText } from "./import";
import { mapJawatanGuru } from "./jawatan-map";
import { senaraiUnit, type SenaraiUnit } from "./unit-list";
import { JAWATAN_GURU, type JawatanGuru } from "./enums";

const DEFAULT_PW = process.env.DEFAULT_SEED_PASSWORD || "ekoko2026";

export const JAWATAN_LABEL: Record<JawatanGuru, string> = {
  GuruPenasihat: "Guru Penasihat",
  PenolongKetuaGP: "Penolong Guru Penasihat",
  KetuaGP: "Ketua Guru Penasihat",
  PenolongSU: "Penolong SU Kokurikulum",
  PemantauKUPP: "Pemantau (KUPP)",
  Penyelaras: "Penyelaras Kokurikulum",
  KetuaUnitKoko: "Ketua Unit Kokurikulum",
};

const JENIS = ["Sukan", "Uniform", "Kelab", "Perkhidmatan"] as const;
type Jenis = (typeof JENIS)[number];
const LAJUR_JENIS: Record<Jenis, string> = { Sukan: "SUKAN", Uniform: "UNIFORM", Kelab: "KELAB", Perkhidmatan: "PERKHIDMATAN" };
const LAJUR = ["ID", "NAMA", "EMAIL", "NO IC", "JAWATAN KOKO", "STATUS", "SUKAN", "UNIFORM", "KELAB", "PERKHIDMATAN"];

const TAG: Record<string, string> = { KetuaPenasihat: " (K)", PenolongKetuaGP: " (P)" };

type Tugas = { namaUnit: string; jenisKoko: Jenis; peranan: string };

// ---------------------------------------------------------------------------
//  Muat turun
// ---------------------------------------------------------------------------

export async function eksportGuruExcel(): Promise<Buffer> {
  const [guru, unit] = await Promise.all([
    prisma.guru.findMany({ orderBy: { nama: "asc" }, include: { penasihatKelab: { orderBy: { namaUnit: "asc" } } } }),
    senaraiUnit(),
  ]);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Guru");
  ws.columns = LAJUR.map((h) => ({
    header: h,
    width: h === "ID" ? 28 : h === "NAMA" ? 42 : h === "EMAIL" ? 36 : h === "NO IC" ? 16 : h === "STATUS" ? 12 : 28,
  }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];

  for (const g of guru) {
    const unitJenis = (j: Jenis) =>
      g.penasihatKelab.filter((p) => p.jenisKoko === j).map((p) => p.namaUnit + (TAG[p.peranan] ?? "")).join("; ");
    ws.addRow([
      g.id,
      g.nama,
      g.email,
      g.noIc.startsWith("NA-") ? "" : g.noIc,
      JAWATAN_LABEL[g.jawatanKoko as JawatanGuru] ?? g.jawatanKoko,
      g.statusAktif ? "Aktif" : "Tidak Aktif",
      unitJenis("Sukan"),
      unitJenis("Uniform"),
      unitJenis("Kelab"),
      unitJenis("Perkhidmatan"),
    ]);
  }
  ws.getColumn(1).font = { color: { argb: "FF94A3B8" } };
  ws.getColumn(4).numFmt = "@";
  ws.autoFilter = { from: "A1", to: `J${guru.length + 1}` };

  const p = wb.addWorksheet("Panduan");
  p.getColumn(1).width = 30;
  p.getColumn(2).width = 90;
  const panduan: [string, string][] = [
    ["ID", "Jangan ubah. Kosongkan untuk guru baru."],
    ["NAMA / EMAIL", "Wajib. Email mesti unik."],
    ["NO IC", "12 digit, boleh dikosongkan."],
    ["JAWATAN KOKO", (["GuruPenasihat", "PenolongKetuaGP", "KetuaGP", "Penyelaras", "KetuaUnitKoko"] as JawatanGuru[]).map((j) => JAWATAN_LABEL[j]).join(" | ")],
    ["STATUS", "Aktif | Tidak Aktif"],
    ["SUKAN / UNIFORM / KELAB / PERKHIDMATAN", "Nama unit dipisah ';'. Tambah (K) untuk Ketua, (P) untuk Penolong. Cth: Badminton (K); Ping Pong"],
    ["", "Jika keempat-empat lajur unit kosong, unit guru sedia ada TIDAK diubah."],
    ["Guru tiada dalam fail", "Tidak dipadam atau diubah."],
    ["Guru baru", `Log masuk dengan email; kata laluan awal = No. IC (jika ada) atau "${DEFAULT_PW}".`],
    ["", ""],
  ];
  for (const j of JENIS) panduan.push([`Unit ${j}`, unit[j].join("; ")]);
  for (const r of panduan) p.addRow(r);
  p.getColumn(1).font = { bold: true };
  p.getColumn(2).alignment = { wrapText: true, vertical: "top" };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------------------------------------------------------------------------
//  Muat naik — parse, rancang (pratonton), laksana
// ---------------------------------------------------------------------------

export interface BarisPelan {
  baris: number;
  nama: string;
  tindakan: "baru" | "ubah" | "sama" | "ralat";
  perubahan: string[];
  ralat: string[];
}

interface Rancangan extends BarisPelan {
  guruId?: string;
  data?: {
    nama: string;
    email: string;
    noIc: string | null; // null = kekal
    jawatanKoko: JawatanGuru;
    statusAktif: boolean | null; // null = kekal
    tugas: Tugas[] | null; // null = kekal
  };
}

function cariJawatan(teks: string): JawatanGuru | null {
  const t = teks.trim();
  if (!t) return null;
  const kod = JAWATAN_GURU.find((j) => j.toLowerCase() === t.toLowerCase());
  if (kod) return kod;
  const label = (Object.entries(JAWATAN_LABEL) as [JawatanGuru, string][]).find(([, l]) => l.toLowerCase() === t.toLowerCase());
  return label ? label[0] : mapJawatanGuru(t);
}

function parseUnit(sel: string, jenis: Jenis, unit: SenaraiUnit, ralat: string[]): Tugas[] {
  const out: Tugas[] = [];
  for (const bahagian of sel.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)) {
    const m = bahagian.match(/^(.*?)\s*\((K|P)\)\s*$/i);
    const nama = (m ? m[1] : bahagian).trim();
    const rasmi = unit[jenis].find((u) => u.toLowerCase() === nama.toLowerCase());
    if (!rasmi) {
      ralat.push(`Unit ${jenis} "${nama}" tidak dikenali`);
      continue;
    }
    const tag = m?.[2].toUpperCase();
    out.push({ namaUnit: rasmi, jenisKoko: jenis, peranan: tag === "K" ? "KetuaPenasihat" : tag === "P" ? "PenolongKetuaGP" : "Penasihat" });
  }
  return out;
}

const ringkasUnit = (t: { namaUnit: string; peranan: string }[]) =>
  t.map((u) => u.namaUnit + (TAG[u.peranan] ?? "")).sort().join("; ");

async function rancang(wb: ExcelJS.Workbook): Promise<Rancangan[]> {
  const ws = wb.getWorksheet("Guru") ?? wb.worksheets[0];
  if (!ws) throw new Error("Fail tiada helaian");
  const idx: Record<string, number> = {};
  ws.getRow(1).eachCell((c, col) => { idx[cellText(c.value).toUpperCase().trim()] = col; });
  for (const h of ["NAMA", "EMAIL"]) if (!idx[h]) throw new Error(`Lajur "${h}" tiada dalam fail`);

  const [guru, unit] = await Promise.all([
    prisma.guru.findMany({ include: { penasihatKelab: true } }),
    senaraiUnit(),
  ]);
  const users = await prisma.user.findMany({ select: { username: true, email: true, guruId: true } });
  const byId = new Map(guru.map((g) => [g.id, g]));
  const byEmail = new Map(guru.map((g) => [g.email.toLowerCase(), g]));
  const emailDalamFail = new Map<string, number>();
  const icDalamFail = new Map<string, number>();

  const pelan: Rancangan[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const get = (h: string) => (idx[h] ? cellText(row.getCell(idx[h]).value) : "");
    const nama = get("NAMA").replace(/\s+/g, " ").trim();
    const email = get("EMAIL").toLowerCase().trim();
    if (!nama && !email) return;

    const ralat: string[] = [];
    const id = get("ID").trim();
    const g = (id && byId.get(id)) || byEmail.get(email);
    if (id && !byId.has(id)) ralat.push(`ID "${id}" tidak wujud`);
    if (nama.length < 3) ralat.push("Nama kosong/terlalu pendek");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ralat.push("Email tidak sah");
    else if (emailDalamFail.has(email)) ralat.push(`Email sama dengan baris ${emailDalamFail.get(email)}`);
    else {
      emailDalamFail.set(email, n);
      const lain = byEmail.get(email);
      const userLain = users.find((u) => (u.email === email || u.username === email) && u.guruId !== g?.id);
      if ((lain && lain.id !== g?.id) || userLain) ralat.push(`Email ${email} sudah digunakan akaun lain`);
    }

    const icMentah = get("NO IC");
    const ic = icMentah ? normalizeIC(icMentah) : "";
    if (ic) {
      if (!/^\d{12}$/.test(ic)) ralat.push(`No. IC "${icMentah}" bukan 12 digit`);
      else if (icDalamFail.has(ic)) ralat.push(`No. IC sama dengan baris ${icDalamFail.get(ic)}`);
      else {
        icDalamFail.set(ic, n);
        const lain = guru.find((x) => x.noIc === ic && x.id !== g?.id);
        const userLain = users.find((u) => u.username === ic && u.guruId !== g?.id);
        if (lain || userLain) ralat.push(`No. IC ${ic} sudah digunakan akaun lain`);
      }
    }

    const jawatanTeks = get("JAWATAN KOKO");
    const jawatan = cariJawatan(jawatanTeks) ?? (g?.jawatanKoko as JawatanGuru | undefined) ?? "GuruPenasihat";

    const statusTeks = get("STATUS").toLowerCase();
    const statusAktif = !statusTeks ? null : /tidak|tak|non|inactive/.test(statusTeks) ? false : /aktif|active|ya/.test(statusTeks) ? true : null;
    if (statusTeks && statusAktif === null) ralat.push(`Status "${get("STATUS")}" tidak dikenali`);

    const selUnit = JENIS.map((j) => [j, get(LAJUR_JENIS[j])] as const);
    const adaUnit = selUnit.some(([, s]) => s.trim());
    const tugas = adaUnit ? selUnit.flatMap(([j, s]) => parseUnit(s, j, unit, ralat)) : null;
    if (tugas && new Set(tugas.map((t) => t.namaUnit)).size !== tugas.length) ralat.push("Unit yang sama disenaraikan dua kali");

    const data = { nama, email, noIc: ic || null, jawatanKoko: jawatan, statusAktif, tugas };
    if (ralat.length) {
      pelan.push({ baris: n, nama: nama || email, tindakan: "ralat", perubahan: [], ralat });
      return;
    }
    if (!g) {
      pelan.push({
        baris: n, nama, tindakan: "baru", ralat: [], data,
        perubahan: [`${JAWATAN_LABEL[jawatan]} · ${email}`, tugas ? `Unit: ${ringkasUnit(tugas)}` : "Tiada unit"],
      });
      return;
    }
    const perubahan: string[] = [];
    if (g.nama !== nama) perubahan.push(`Nama: ${g.nama} → ${nama}`);
    if (g.email !== email) perubahan.push(`Email: ${g.email} → ${email}`);
    if (ic && g.noIc !== ic) perubahan.push(`No. IC: ${g.noIc.startsWith("NA-") ? "-" : g.noIc} → ${ic}`);
    if (g.jawatanKoko !== jawatan) perubahan.push(`Jawatan: ${JAWATAN_LABEL[g.jawatanKoko as JawatanGuru] ?? g.jawatanKoko} → ${JAWATAN_LABEL[jawatan]}`);
    if (statusAktif !== null && g.statusAktif !== statusAktif) perubahan.push(`Status: ${statusAktif ? "Aktif" : "Tidak Aktif"}`);
    if (tugas && ringkasUnit(g.penasihatKelab) !== ringkasUnit(tugas))
      perubahan.push(`Unit: ${ringkasUnit(g.penasihatKelab) || "-"} → ${ringkasUnit(tugas) || "-"}`);
    pelan.push({ baris: n, nama, tindakan: perubahan.length ? "ubah" : "sama", perubahan, ralat: [], guruId: g.id, data });
  });
  return pelan;
}

function medanLama(tugas: Tugas[]) {
  return {
    kelabDiselia: tugas.find((t) => t.jenisKoko === "Kelab")?.namaUnit ?? null,
    sukanDiselia: tugas.find((t) => t.jenisKoko === "Sukan")?.namaUnit ?? null,
    badanDiselia: tugas.find((t) => t.jenisKoko === "Uniform")?.namaUnit ?? null,
  };
}

/** Pratonton sahaja (tiada tulisan). */
export async function pratontonImportGuru(wb: ExcelJS.Workbook): Promise<BarisPelan[]> {
  return (await rancang(wb)).map(({ baris, nama, tindakan, perubahan, ralat }) => ({ baris, nama, tindakan, perubahan, ralat }));
}

/** Laksana baris "baru" & "ubah". Baris ralat dilangkau. */
export async function laksanaImportGuru(wb: ExcelJS.Workbook) {
  const pelan = await rancang(wb);
  let baru = 0, ubah = 0;
  for (const p of pelan) {
    if (!p.data || (p.tindakan !== "baru" && p.tindakan !== "ubah")) continue;
    const d = p.data;
    if (p.tindakan === "baru") {
      const passwordHash = await hashPassword(d.noIc ?? DEFAULT_PW);
      await prisma.$transaction(async (tx) => {
        const g = await tx.guru.create({
          data: {
            nama: d.nama, email: d.email, noIc: d.noIc ?? `NA-${d.email}`, jawatanKoko: d.jawatanKoko,
            statusAktif: d.statusAktif ?? true, ...medanLama(d.tugas ?? []),
          },
        });
        if (d.tugas?.length) await tx.guruPenasihatKelab.createMany({ data: d.tugas.map((t) => ({ guruId: g.id, ...t })) });
        await tx.user.create({ data: { username: d.email, email: d.email, passwordHash, role: "Guru", guruId: g.id, mustChangePw: true } });
      });
      baru++;
    } else {
      const id = p.guruId!;
      await prisma.$transaction(async (tx) => {
        const lama = await tx.guru.findUniqueOrThrow({ where: { id }, select: { email: true, noIc: true } });
        await tx.guru.update({
          where: { id },
          data: {
            nama: d.nama, email: d.email, jawatanKoko: d.jawatanKoko,
            ...(d.noIc ? { noIc: d.noIc } : {}),
            ...(d.statusAktif !== null ? { statusAktif: d.statusAktif } : {}),
            ...(d.tugas ? medanLama(d.tugas) : {}),
          },
        });
        if (d.tugas) {
          await tx.guruPenasihatKelab.deleteMany({ where: { guruId: id } });
          if (d.tugas.length) await tx.guruPenasihatKelab.createMany({ data: d.tugas.map((t) => ({ guruId: id, ...t })) });
        }
        // Akaun log masuk: email ikut guru; username ikut jika ia email/IC lama.
        const akaun = await tx.user.findFirst({ where: { guruId: id }, select: { id: true, username: true } });
        if (akaun) {
          const username =
            akaun.username === lama.email ? d.email : d.noIc && akaun.username === lama.noIc ? d.noIc : akaun.username;
          await tx.user.update({ where: { id: akaun.id }, data: { email: d.email, username } });
        }
      });
      ubah++;
    }
  }
  return { baru, ubah, ralat: pelan.filter((p) => p.tindakan === "ralat").length, sama: pelan.filter((p) => p.tindakan === "sama").length };
}
