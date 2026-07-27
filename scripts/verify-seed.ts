import { prisma } from "../src/lib/prisma";
(async () => {
  const p = await prisma.pelajar.findFirst({ include: { kokurikulum: true, pencapaian: true } });
  console.log("Pelajar contoh:", p?.nama, "| IC:", JSON.stringify(p?.noIc), "(len", p?.noIc.length + ")");
  console.log("  Markah T6(kira):", p?.markahPajskT6, p?.peratusPajskT6 + "%");
  for (const k of p?.kokurikulum ?? []) console.log(`  ${k.jenisKoko}: ${k.namaUnitT5} | ${k.jawatanT5} (${k.markahJawatanT5}) | ${k.peringkatT5} (${k.markahPeringkatT5})`);
  console.log("  Pencapaian:", p?.pencapaian.map(x => x.namaPencapaian));
  const g = await prisma.guru.findFirst();
  console.log("Guru contoh:", g?.nama, "|", g?.email, "| Jawatan:", g?.jawatanKoko, "| Sukan:", g?.sukanDiselia);
  console.log("Jumlah: pelajar=", await prisma.pelajar.count(), "guru=", await prisma.guru.count(), "user=", await prisma.user.count(), "koko=", await prisma.kokurikulum.count());
  await prisma.$disconnect();
})();
