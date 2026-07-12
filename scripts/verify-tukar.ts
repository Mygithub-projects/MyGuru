import { prisma } from "../src/lib/prisma";
(async () => {
  const p = await prisma.pelajar.findUnique({
    where: { noIc: "080917074685" },
    include: { kokurikulum: true },
  });
  if (!p) { console.log("pelajar tidak dijumpai"); return; }
  const sukan = p.kokurikulum.find((k) => k.jenisKoko === "Sukan")!;
  console.log("--- Rekod Sukan selepas pertukaran diluluskan ---");
  console.log("T5 (sejarah, MESTI kekal): unit=", sukan.namaUnitT5, "| jawatan=", sukan.jawatanT5, "| markahJaw=", sukan.markahJawatanT5);
  console.log("T6 (aktif, dikemaskini):   unit=", sukan.namaUnitT6, "| jawatan=", sukan.jawatanT6, "| markahJaw=", sukan.markahJawatanT6, "| status=", sukan.statusPertukaran);
  console.log("Markah PAJSK: T5=", p.markahPajskT5, "(" + p.peratusPajskT5 + "%) | T6=", p.markahPajskT6, "(" + p.peratusPajskT6 + "%) [dikira semula]");
  const log = await prisma.logPertukaran.findFirst({ where: { pelajarId: p.id, status: "Approved" }, orderBy: { tarikhLulus: "desc" } });
  console.log("Log:", log?.unitLama, "->", log?.unitBaru, "| status=", log?.status, "| guruId=", log?.guruId);
  await prisma.$disconnect();
})();
