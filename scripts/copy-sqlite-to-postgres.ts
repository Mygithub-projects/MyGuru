// ===========================================================================
//  Salin SEMUA data dari SQLite (dev.db) -> PostgreSQL lokal (selari).
//  Prasyarat:
//    1. Postgres berjalan; POSTGRES_DATABASE_URL diset dalam .env.
//    2. Jadual dicipta: npx prisma db push --schema prisma/schema.postgres.prisma
//    3. Client PG dijana ke src/generated/prisma-pg (auto oleh db push/generate).
//  Jalankan: npm run db:copy-to-postgres
//
//  Klien SQLite lalai baca DATABASE_URL (fail dev.db); klien PG baca
//  POSTGRES_DATABASE_URL. FK dilonggarkan (session_replication_role=replica)
//  dalam satu transaksi supaya susunan tak jadi isu (perlu peranan superuser).
// ===========================================================================
import { PrismaClient as SqliteClient } from "@prisma/client";
import { PrismaClient as PgClient } from "../src/generated/prisma-pg";

const sqlite = new SqliteClient();
const pg = new PgClient();

// Susunan induk->anak (sandaran, walaupun FK dilonggarkan).
const ORDER = [
  "guru",
  "pelajar",
  "user",
  "guruPenasihatKelab",
  "tetapanMarkah",
  "tetapanSijil",
  "sesiKehadiran",
  "kokurikulum",
  "cadanganJawatan",
  "cadanganAgent",
  "logPertukaran",
  "kehadiran",
  "logImport",
  "notifikasi",
  "laporanMingguan",
  "laporanProjek",
  "pencapaian",
  "aktivitiLuar",
] as const;

async function main() {
  console.log("Salin SQLite -> PostgreSQL ...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = sqlite as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = pg as any;

  // Baca semua dahulu (elak baca dalam transaksi PG).
  const data: Record<string, unknown[]> = {};
  for (const m of ORDER) data[m] = await s[m].findMany();

  await pg.$transaction(
    async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = tx as any;
      await tx.$executeRawUnsafe(`SET session_replication_role = 'replica'`);
      for (const m of ORDER) {
        const rows = data[m];
        if (rows.length) {
          await t[m].createMany({ data: rows, skipDuplicates: true });
        }
        console.log(`  ${m}: ${rows.length}`);
      }
      await tx.$executeRawUnsafe(`SET session_replication_role = 'origin'`);
    },
    { timeout: 120_000 }
  );

  // Sahkan kiraan
  console.log("Pengesahan kiraan (SQLite -> Postgres):");
  for (const m of ORDER) {
    const a = await s[m].count();
    const b = await p[m].count();
    console.log(`  ${m}: ${a} -> ${b}${a === b ? " ✓" : "  ⚠ TIDAK PADAN"}`);
  }
  console.log("Selesai ✓");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await sqlite.$disconnect(); await pg.$disconnect(); });
