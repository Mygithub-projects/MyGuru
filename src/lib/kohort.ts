// Kohort peperiksaan pelajar (cth "STPM 2027"). Kohort SEMASA = kohort
// dengan tahun terkini — tiada tetapan berasingan; import kohort baharu
// (cth STPM 2028) menjadikannya semasa secara automatik.
import { prisma } from "./prisma";

export const FORMAT_KOHORT = /^STPM \d{4}$/;

/** Normalkan input bebas ("stpm2028", "2028") ke "STPM 2028"; null jika tidak sah. */
export function normalKohort(v: unknown): string | null {
  const m = String(v ?? "").trim().toUpperCase().match(/^(?:STPM\s*)?(\d{4})$/);
  return m ? `STPM ${m[1]}` : null;
}

/** Senarai kohort yang wujud, terkini dahulu. */
export async function senaraiKohort(): Promise<string[]> {
  const rows = await prisma.pelajar.findMany({
    where: { kohort: { not: null } },
    distinct: ["kohort"],
    select: { kohort: true },
  });
  return rows.map((r) => r.kohort!).sort((a, b) => b.localeCompare(a, "ms", { numeric: true }));
}
