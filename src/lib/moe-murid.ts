// ===========================================================================
//  Carian murid T6 dari pangkalan data MOE (private.vw_murid) — BACA SAHAJA.
//  Sambungan berasingan daripada Prisma (pengguna view_reader) melalui
//  MOE_DATABASE_URL. Digunakan oleh e-Cert Program untuk memilih peserta.
// ===========================================================================
import { Pool } from "pg";

export interface MuridT6 {
  idMoeis: string | null;
  nama: string;
  noKp: string;
  kodSekolah: string | null;
  namaSekolah: string | null;
  namaKelas: string | null;
}

let _pool: Pool | null = null;
function pool(): Pool {
  if (_pool) return _pool;
  const url = process.env.MOE_DATABASE_URL;
  if (!url) throw new Error("MOE_DATABASE_URL tidak ditetapkan dalam .env");
  _pool = new Pool({ connectionString: url, max: 3, statement_timeout: 15000 });
  return _pool;
}

export function moeTersedia(): boolean {
  return !!process.env.MOE_DATABASE_URL;
}

/**
 * Cari murid T6 ikut nama, No. KP atau sekolah (tidak peka huruf).
 * Minimum 3 aksara untuk mengelak imbasan seluruh jadual.
 */
export async function cariMuridT6(q: string, sekolah?: string, had = 50): Promise<MuridT6[]> {
  const kata = q.trim();
  const sek = sekolah?.trim() ?? "";
  if (kata.length < 3 && sek.length < 3) return [];

  const syarat: string[] = ["kodtingkatan = 'T6'"];
  const nilai: unknown[] = [];
  if (kata.length >= 3) {
    nilai.push(`%${kata}%`);
    syarat.push(`(names ILIKE $${nilai.length} OR nokp LIKE $${nilai.length})`);
  }
  if (sek.length >= 3) {
    nilai.push(`%${sek}%`);
    syarat.push(`(nama_sekolah ILIKE $${nilai.length} OR kod_sekolah ILIKE $${nilai.length})`);
  }
  nilai.push(Math.min(Math.max(had, 1), 200));

  const { rows } = await pool().query(
    `SELECT id_pelajar_moeis, kod_sekolah, nama_sekolah, names, namakelas, nokp
       FROM private.vw_murid
      WHERE ${syarat.join(" AND ")}
      ORDER BY names
      LIMIT $${nilai.length}`,
    nilai
  );
  return rows.map((r) => ({
    idMoeis: r.id_pelajar_moeis != null ? String(r.id_pelajar_moeis) : null,
    nama: String(r.names ?? "").trim(),
    noKp: String(r.nokp ?? "").trim(),
    kodSekolah: r.kod_sekolah ?? null,
    namaSekolah: r.nama_sekolah ?? null,
    namaKelas: r.namakelas ?? null,
  }));
}

/** Dapatkan rekod murid T6 tepat ikut No. KP (untuk sahkan pilihan di pelayan). */
export async function muridT6IkutNoKp(noKp: string[]): Promise<MuridT6[]> {
  if (noKp.length === 0) return [];
  const { rows } = await pool().query(
    `SELECT id_pelajar_moeis, kod_sekolah, nama_sekolah, names, namakelas, nokp
       FROM private.vw_murid
      WHERE kodtingkatan = 'T6' AND nokp = ANY($1::text[])`,
    [noKp]
  );
  return rows.map((r) => ({
    idMoeis: r.id_pelajar_moeis != null ? String(r.id_pelajar_moeis) : null,
    nama: String(r.names ?? "").trim(),
    noKp: String(r.nokp ?? "").trim(),
    kodSekolah: r.kod_sekolah ?? null,
    namaSekolah: r.nama_sekolah ?? null,
    namaKelas: r.namakelas ?? null,
  }));
}
