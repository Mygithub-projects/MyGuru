// ===========================================================================
//  URL fail muat naik — selamat untuk komponen klien (tiada import pelayan).
//  Semua fail dicapai melalui route peribadi /api/fail/[nama]. Nilai lama di
//  DB ("/uploads/x" atau URL awam S3 ".../uploads/x") dipetakan ikut nama
//  fail, jadi rekod sedia ada tidak perlu dimigrasi.
// ===========================================================================

/** Format nama fail yang dijana oleh simpanFail(): `<prefix>-<12 hex>.<ext>`. */
export const NAMA_FAIL_SAH = /^[a-z]+-[0-9a-f]{12}\.[a-z]+$/;

/** Petakan nilai lampiran tersimpan (baru atau lama) ke URL route peribadi. */
export function urlFail(simpanan: string | null | undefined): string | null {
  if (!simpanan) return null;
  const nama = simpanan.split("/").pop() ?? "";
  return NAMA_FAIL_SAH.test(nama) ? `/api/fail/${nama}` : null;
}
