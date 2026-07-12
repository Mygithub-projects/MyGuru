import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { loadWorkbookFromFile, parsePajskWorksheet } from "../src/lib/import";
import { kiraSemulaT6 } from "../src/lib/workflow";

(async () => {
  const file = path.join(path.resolve(process.cwd(), ".."), "DUMM PAJSK.xlsx");
  const wb = await loadWorkbookFromFile(file);
  const rows = parsePajskWorksheet(wb.worksheets[0]);
  let n = 0;
  for (const r of rows) {
    if (!/^\d{12}$/.test(r.noIc)) continue;
    const p = await prisma.pelajar.findUnique({ where: { noIc: r.noIc } });
    if (!p) continue;
    await prisma.pelajar.update({
      where: { id: p.id },
      data: { markahKehadiran: r.markahKehadiran },
    });
    await kiraSemulaT6(p.id);
    n++;
  }
  console.log(`Backfill markahKehadiran + kira semula T6 untuk ${n} pelajar.`);
  await prisma.$disconnect();
})();
