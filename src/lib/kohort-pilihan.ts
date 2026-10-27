// ===========================================================================
//  Kohort dipilih (Admin & Guru) — satu pemilih di header, disimpan dalam
//  cookie, dipakai oleh semua halaman supaya data dua kohort yang bertindan
//  (bulan 8–18) tidak bercampur. Pelajar sentiasa dalam kohort sendiri.
// ===========================================================================
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const COOKIE_KOHORT = "kohort";

/** Kohort aktif (belum diarkib), terkini dahulu. */
export async function senaraiKohortAktif(): Promise<string[]> {
  const rows = await prisma.kohort.findMany({ where: { status: "Aktif" }, select: { nama: true } });
  return rows.map((r) => r.nama).sort((a, b) => b.localeCompare(a, "ms", { numeric: true }));
}

/** Semua kohort berdaftar (aktif & tamat), terkini dahulu. */
export async function senaraiSemuaKohort(): Promise<{ nama: string; status: string }[]> {
  const rows = await prisma.kohort.findMany({ select: { nama: true, status: true } });
  return rows.sort((a, b) => b.nama.localeCompare(a.nama, "ms", { numeric: true }));
}

/** Kohort yang dipilih di header; lalai = kohort aktif tertua (yang paling hampir tamat). */
export async function kohortDipilih(): Promise<string | null> {
  const semua = await senaraiSemuaKohort();
  const pilih = (await cookies()).get(COOKIE_KOHORT)?.value;
  if (pilih && semua.some((k) => k.nama === pilih)) return pilih;
  const aktif = semua.filter((k) => k.status === "Aktif").map((k) => k.nama);
  return aktif.at(-1) ?? semua[0]?.nama ?? null;
}

/** Kohort seorang pelajar (null jika belum ditag). */
export async function kohortPelajar(pelajarId: string): Promise<string | null> {
  const p = await prisma.pelajar.findUnique({ where: { id: pelajarId }, select: { kohort: true } });
  return p?.kohort ?? null;
}
