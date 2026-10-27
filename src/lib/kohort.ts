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

/** Kohort selepas yang terkini (cth STPM 2027 → STPM 2028); tahun depan jika tiada. */
export function kohortSeterusnya(senarai: string[], tahunKini = new Date().getFullYear()): string {
  const tahun = senarai.map((k) => Number(k.slice(-4))).filter(Number.isFinite);
  return `STPM ${(tahun.length ? Math.max(...tahun) : tahunKini) + 1}`;
}

/** Tempoh kohort dalam sistem (bulan) & bulan kohort baharu masuk. */
export const TEMPOH_KOHORT_BULAN = 18;
export const BULAN_KOHORT_BAHARU = 8;

/** Tambah bulan kalendar (tarikh dihadkan ke hujung bulan sasaran). */
export function tambahBulan(d: Date, n: number): Date {
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const hari = Math.min(d.getUTCDate(), new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate());
  r.setUTCDate(hari);
  return r;
}

/** Bulan ke berapa kohort berada (1 = bulan pertama), tarikh jangka tamat & fasa. */
export function kitaranKohort(tarikhMula: Date, kini = new Date()) {
  const bulan =
    (kini.getUTCFullYear() - tarikhMula.getUTCFullYear()) * 12 +
    (kini.getUTCMonth() - tarikhMula.getUTCMonth()) +
    (kini.getUTCDate() >= tarikhMula.getUTCDate() ? 1 : 0);
  const bulanKe = Math.max(1, bulan);
  const jangkaTamat = tambahBulan(tarikhMula, TEMPOH_KOHORT_BULAN);
  const jangkaKohortBaharu = tambahBulan(tarikhMula, BULAN_KOHORT_BAHARU - 1);
  const fasa: "awal" | "sediaBaharu" | "patutTamat" =
    kini >= jangkaTamat ? "patutTamat" : bulanKe >= BULAN_KOHORT_BAHARU ? "sediaBaharu" : "awal";
  return { bulanKe: Math.min(bulanKe, TEMPOH_KOHORT_BULAN), jangkaTamat, jangkaKohortBaharu, fasa };
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
