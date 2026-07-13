// ===========================================================================
//  Kemas kini KELAS (kelasT6) + JANTINA pelajar sedia ada dari DUMM PAJSK.xlsx
//  (format roster: header baris 1, data baris 2+; KELAS lajur 2, MYKAD lajur 4,
//  JANTINA lajur 5). Padanan ikut No. IC. TIDAK mengubah markah / rekod lain.
//  Jalankan: npm run db:import-demografi
// ===========================================================================
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { loadWorkbookFromFile, padIC } from "../src/lib/import";

const FILE = path.join(process.cwd(), "..", "DUMM PAJSK.xlsx");
const COL_KELAS = 2;
const COL_IC = 4;
const COL_JANTINA = 5;

/** Nilai sel -> teks selamat (tangani formula/rich-text) + trim. */
function teks(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as { result?: unknown; text?: unknown };
    if ("result" in o) return String(o.result ?? "").trim();
    if ("text" in o) return String(o.text ?? "").trim();
  }
  return String(v).trim();
}

/** Normalkan jantina ke "L" | "P" (atau null jika tak dikenali). */
function normJantina(s: string): string | null {
  const u = s.toUpperCase();
  if (u === "L" || u.startsWith("LELAKI")) return "L";
  if (u === "P" || u.startsWith("PEREMPUAN")) return "P";
  return null;
}

async function main() {
  console.log(`Import KELAS + JANTINA dari ${path.basename(FILE)} ...`);
  const wb = await loadWorkbookFromFile(FILE);
  const ws = wb.worksheets[0];

  const rows: { noIc: string; kelas: string; jantina: string | null }[] = [];
  let tanpaIc = 0;
  ws.eachRow((row, n) => {
    if (n === 1) return; // langkau header
    const noIc = padIC(row.getCell(COL_IC).value);
    const kelas = teks(row.getCell(COL_KELAS).value);
    const jantina = normJantina(teks(row.getCell(COL_JANTINA).value));
    if (!/^\d{12}$/.test(noIc)) {
      if (kelas || jantina) tanpaIc++;
      return;
    }
    rows.push({ noIc, kelas, jantina });
  });

  let dikemas = 0;
  const takJumpa: string[] = [];
  for (const r of rows) {
    const p = await prisma.pelajar.findUnique({ where: { noIc: r.noIc }, select: { id: true } });
    if (!p) {
      takJumpa.push(r.noIc);
      continue;
    }
    await prisma.pelajar.update({
      where: { id: p.id },
      data: {
        kelasT6: r.kelas || undefined,
        jantina: r.jantina ?? undefined,
      },
    });
    dikemas++;
  }

  console.log(`Selesai ✓  ${dikemas}/${rows.length} pelajar dikemas kini (kelas + jantina).`);
  if (tanpaIc) console.log(`  ${tanpaIc} baris tanpa No. IC sah dilangkau.`);
  if (takJumpa.length) {
    console.log(`  ${takJumpa.length} IC tiada padanan dalam DB: ${takJumpa.slice(0, 10).join(", ")}${takJumpa.length > 10 ? " ..." : ""}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
