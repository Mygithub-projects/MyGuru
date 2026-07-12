// ===========================================================================
//  Tukar log masuk GURU kepada NO KAD PENGENALAN (dari GURU DATA.xlsx).
//  Jalankan: npx tsx scripts/guru-login-ic.ts
//  - username akaun guru ditetapkan = IC (padan ikut nama dgn fail).
//  - guru.noIc diselaraskan dengan IC fail. Email dikekalkan (untuk rujukan).
// ===========================================================================
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { loadWorkbookFromFile } from "../src/lib/import";

const FILE = path.resolve(process.cwd(), "..", "GURU DATA.xlsx");
function txt(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("text" in o) return String(o.text);
    if ("result" in o) return String(o.result);
    if ("richText" in o) return (o.richText as { text: string }[]).map((r) => r.text).join("");
  }
  return String(v);
}
const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");

async function main() {
  console.log("Menetapkan log masuk guru = No. Kad Pengenalan ...");
  const wb = await loadWorkbookFromFile(FILE);
  const ws = wb.worksheets[0];
  const icByName = new Map<string, string>();
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const nama = txt(row.getCell(1).value).trim();
    const ic = txt(row.getCell(3).value).replace(/\D/g, "");
    if (nama && /^\d{12}$/.test(ic)) icByName.set(norm(nama), ic);
  });

  const guru = await prisma.guru.findMany({ include: { user: true } });
  // Semua username sedia ada (semua peranan) untuk elak pertembungan
  const allUsernames = new Set((await prisma.user.findMany({ select: { username: true } })).map((u) => u.username));

  let updated = 0;
  const skipped: string[] = [];
  let applephyLogin = "";

  for (const g of guru) {
    const ic = icByName.get(norm(g.nama));
    if (!ic) { skipped.push(`${g.nama} (tiada IC dalam fail)`); continue; }
    if (g.user?.username === ic) { updated++; continue; } // sudah IC
    // Elak pertembungan username dengan akaun lain
    if (allUsernames.has(ic)) { skipped.push(`${g.nama} (IC ${ic} bertembung username sedia ada)`); continue; }

    // Selaraskan guru.noIc (jika perlu & tiada konflik)
    if (g.noIc !== ic) {
      try { await prisma.guru.update({ where: { id: g.id }, data: { noIc: ic } }); } catch { /* biar noIc lama */ }
    }
    // Tukar username akaun kepada IC
    if (g.user) {
      allUsernames.delete(g.user.username);
      await prisma.user.update({ where: { id: g.user.id }, data: { username: ic } });
      allUsernames.add(ic);
      updated++;
      if (g.email === "applephy@gmail.com") applephyLogin = ic;
    } else {
      skipped.push(`${g.nama} (tiada akaun user)`);
    }
  }

  console.log(`Selesai ✓  ${updated} guru kini log masuk dengan No. IC. Dilangkau: ${skipped.length}.`);
  if (applephyLogin) console.log(`Akaun anda (LATIFAH BINTI HJ ALI): log masuk dengan No. IC ${applephyLogin} (emel applephy@gmail.com dikekalkan sebagai rujukan).`);
  if (skipped.length) { console.log("Dilangkau:"); skipped.forEach((s) => console.log("  - " + s)); }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
