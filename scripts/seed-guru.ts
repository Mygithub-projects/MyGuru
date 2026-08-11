// ===========================================================================
//  Update GURU dari GURU DATA.xlsx (kolum: NAMA, JAWATAN, IC, KELAB, SUKAN, BADAN).
//  Jalankan: npx tsx scripts/seed-guru.ts
//  - Padan guru sedia ada ikut NAMA → kemas kini (kekalkan email & kata laluan).
//  - Guru baru → jana email log masuk (slug nama) + akaun (kata laluan default).
//  - TIDAK menyentuh pelajar. Fail ini tiada lajur email.
// ===========================================================================
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import { loadWorkbookFromFile } from "../src/lib/import";
import { mapJawatanGuru } from "../src/lib/jawatan-map";
import { syncPenasihatKelab, penasihatDariMedanLama } from "../src/lib/workflow";

const FILE = path.resolve(process.cwd(), "..", "GURU DATA.xlsx");
const PW = process.env.DEFAULT_SEED_PASSWORD || "ekoko2026";

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
const slugEmail = (nama: string) => nama.toLowerCase().replace(/[^a-z0-9]/g, "") + "@gmail.com";

async function main() {
  console.log("Kemas kini guru dari GURU DATA.xlsx ...");
  const wb = await loadWorkbookFromFile(FILE);
  const ws = wb.worksheets[0];

  const rows: { nama: string; jawatan: string; ic: string; kelab: string; sukan: string; badan: string }[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return; // header
    const nama = txt(row.getCell(1).value).trim();
    if (!nama) return;
    rows.push({
      nama,
      jawatan: txt(row.getCell(2).value).trim(),
      ic: txt(row.getCell(3).value).replace(/\D/g, ""),
      kelab: txt(row.getCell(4).value).trim(),
      sukan: txt(row.getCell(5).value).trim(),
      badan: txt(row.getCell(6).value).trim(),
    });
  });

  const existing = await prisma.guru.findMany();
  const byName = new Map(existing.map((g) => [norm(g.nama), g]));
  const usedEmails = new Set(existing.map((g) => g.email));
  const usedIcs = new Set(existing.map((g) => g.noIc));
  const passwordHash = await hashPassword(PW);

  let updated = 0, created = 0;
  const newAccounts: string[] = [];

  for (const r of rows) {
    const data = {
      nama: r.nama,
      jawatanKoko: mapJawatanGuru(r.jawatan),
      kelabDiselia: r.kelab || null,
      sukanDiselia: r.sukan || null,
      badanDiselia: r.badan || null,
    };
    const match = byName.get(norm(r.nama));

    if (match) {
      // Kemas kini guru sedia ada (kekalkan email/akaun/kata laluan)
      await prisma.guru.update({ where: { id: match.id }, data });
      // Cuba kemas kini IC jika berbeza & tiada konflik
      if (r.ic && /^\d{12}$/.test(r.ic) && r.ic !== match.noIc && !usedIcs.has(r.ic)) {
        try { await prisma.guru.update({ where: { id: match.id }, data: { noIc: r.ic } }); usedIcs.add(r.ic); } catch {}
      }
      await syncPenasihatKelab(match.id, penasihatDariMedanLama(data));
      updated++;
    } else {
      // Guru baru — jana email unik
      let email = slugEmail(r.nama);
      if (usedEmails.has(email)) email = `${email.split("@")[0]}${r.ic.slice(-4)}@gmail.com`;
      usedEmails.add(email);
      const noIc = /^\d{12}$/.test(r.ic) && !usedIcs.has(r.ic) ? r.ic : `NA-${email}`;
      usedIcs.add(noIc);
      const guru = await prisma.guru.create({ data: { ...data, noIc, email } });
      await syncPenasihatKelab(guru.id, penasihatDariMedanLama(data));
      await prisma.user.create({
        data: { username: email, email, passwordHash, role: "Guru", guruId: guru.id, mustChangePw: true },
      });
      created++;
      newAccounts.push(`${r.nama} → ${email} (${data.jawatanKoko})`);
    }
  }

  const total = await prisma.guru.count();
  const applephy = await prisma.guru.findFirst({ where: { email: "applephy@gmail.com" }, select: { nama: true, jawatanKoko: true, kelabDiselia: true } });
  console.log(`Selesai ✓  ${updated} dikemas kini, ${created} baru dicipta. Jumlah guru: ${total}.`);
  console.log(`Akaun anda (applephy@gmail.com): ${JSON.stringify(applephy)}`);
  if (newAccounts.length) {
    console.log(`\nAkaun guru baru (kata laluan: ${PW}, tukar pada log masuk pertama):`);
    newAccounts.forEach((a) => console.log("  - " + a));
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
