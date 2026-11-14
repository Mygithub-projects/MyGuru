// ===========================================================================
//  Program Kolej (Admin) — pelajar terlibat menerima markah PENGLIBATAN (§1.4)
//  ikut peringkat program, bagi semua unit bidang (lihat penglibatanUnit()).
// ===========================================================================
import { after } from "next/server";
import { z } from "zod";
import { kiraSemulaT6 } from "./workflow";
import { PERINGKAT_PROGRAM } from "./projek-jawatan";


export const schemaProgram = z.object({
  nama: z.string().trim().min(1, "Nama program diperlukan").max(200),
  tarikh: z.string().max(20).optional().nullable(),
  peringkat: z.enum(PERINGKAT_PROGRAM, { message: "Peringkat tidak sah" }),
});

/** Kira semula markah PAJSK pelajar terjejas selepas respons dihantar. */
export function kiraSemulaLatar(pelajarIds: Iterable<string>, label: string) {
  const ids = [...new Set(pelajarIds)];
  if (ids.length === 0) return;
  after(async () => {
    for (const id of ids) {
      try {
        await kiraSemulaT6(id);
      } catch (e) {
        console.error(`[program kolej] kira semula gagal (${label}) ${id}:`, e);
      }
    }
  });
}
