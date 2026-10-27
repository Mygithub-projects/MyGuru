// ===========================================================================
//  Klien Prisma berskop kohort — menambah syarat kohort secara automatik pada
//  setiap BACAAN data pelajar (findMany/findFirst/count/groupBy/aggregate),
//  supaya paparan Admin & Guru tidak mencampurkan dua kohort yang bertindan.
//  Tulisan (create/update/delete) dan findUnique tidak disentuh.
// ===========================================================================
import { prisma } from "./prisma";
import { kohortDipilih } from "./kohort-pilihan";

type Syarat = (kohort: string) => Record<string, unknown>;
const ikutPelajar: Syarat = (k) => ({ pelajar: { kohort: k } });
const ikutSetiausaha: Syarat = (k) => ({ setiausaha: { kohort: k } });

const SYARAT: Record<string, Syarat> = {
  Pelajar: (k) => ({ kohort: k }),
  Kokurikulum: ikutPelajar,
  Kehadiran: ikutPelajar,
  Pencapaian: ikutPelajar,
  AktivitiLuar: ikutPelajar,
  LogPertukaran: ikutPelajar,
  CadanganJawatan: ikutPelajar,
  LaporanMingguan: ikutSetiausaha,
  LaporanProjek: ikutSetiausaha,
  SesiKehadiran: (k) => ({ kohort: k }),
};
const BACAAN = new Set(["findMany", "findFirst", "findFirstOrThrow", "count", "groupBy", "aggregate"]);

/** Sentiasa klien terlanjut (jenis seragam); tiada kohort = tiada syarat tambahan. */
export function prismaKohort(kohort: string | null) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const syarat = SYARAT[model];
          if (kohort && syarat && BACAAN.has(operation)) {
            const a = args as { where?: object };
            a.where = a.where ? { AND: [a.where, syarat(kohort)] } : syarat(kohort);
          }
          return query(args);
        },
      },
    },
  });
}

/** Klien berskop kohort yang dipilih di header (Admin & Guru). */
export async function dbKohort() {
  return prismaKohort(await kohortDipilih());
}
