// ===========================================================================
//  Projek pelbagai unit — guru tag SU/NSU projek; SU/NSU hantar laporan (OPR)
//  dan pilih peserta + jawatan. Markah projek (jawatan + peringkat) peserta
//  dikira dari laporan yang DILULUSKAN melalui gabungProjek().
// ===========================================================================
import type { LaporanProjek, ProjekPeserta } from "@prisma/client";
import { prisma } from "./prisma";
import { JAWATAN_PERANAN, JAWATAN_PESERTA, JAWATAN_PROJEK, PERANAN_PELAPOR } from "./projek-jawatan";

/** Include Prisma: penyertaan pelajar dalam laporan projek yang diluluskan. */
export const INCLUDE_PESERTA_LULUS = {
  where: { laporan: { statusPengesahan: "Approved" } },
  include: { laporan: true },
} as const;

type PesertaDenganLaporan = ProjekPeserta & { laporan: LaporanProjek };

/**
 * Gabung laporan projek milik pelajar (sebagai SU/NSU) dengan penyertaannya
 * sebagai peserta. Setiap penyertaan menjadi rekod "maya" bagi setiap unit
 * kredit, dengan jawatan peserta — supaya kiraan sedia ada (skorUnit,
 * kiraSemulaT6, eksport, rumusan) terus berfungsi tanpa diubah.
 * Laporan yang sama tidak dikira dua kali bagi pelajar yang sama.
 */
export function gabungProjek(
  milik: LaporanProjek[],
  peserta: PesertaDenganLaporan[] | undefined,
  unitPelajar: { namaUnitT6: string | null; jenisKoko: string }[] = [],
): LaporanProjek[] {
  const out = [...milik];
  const milikIds = new Set(milik.map((m) => m.id));
  for (const p of peserta ?? []) {
    if (milikIds.has(p.laporanId)) continue;
    for (const unit of p.unitKredit) {
      out.push({
        ...p.laporan,
        jawatanProjek: p.jawatan,
        namaUnit: unit,
        jenisKoko: unitPelajar.find((k) => k.namaUnitT6 === unit)?.jenisKoko ?? p.laporan.jenisKoko,
      });
    }
  }
  return out;
}

/** Unit penerima markah: unit peserta dalam projek; jika tiada, semua unit peserta. */
export function unitKredit(unitPeserta: string[], unitProjek: string[]): string[] {
  const dalam = unitPeserta.filter((u) => unitProjek.includes(u));
  return dalam.length ? dalam : unitPeserta;
}

/**
 * Projek yang pelajar ini di-tag sebagai SU/NSU (boleh isi laporan), beserta
 * semua tag projek itu (AJK teras yang ditetapkan guru — dipapar terkunci).
 */
export async function projekDiTag(pelajarId: string) {
  return prisma.projekTag.findMany({
    where: { pelajarId, peranan: { in: [...PERANAN_PELAPOR] } },
    include: {
      projek: {
        include: { tag: { include: { pelajar: { select: { id: true, nama: true, kelasT6: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Calon peserta: semua pelajar aktif sekohort (nama + kelas). */
export async function calonPeserta(kohort: string | null) {
  return prisma.pelajar.findMany({
    where: { ...(kohort ? { kohort } : {}), NOT: { user: { statusAktif: false } } },
    select: { id: true, nama: true, kelasT6: true },
    orderBy: [{ kelasT6: "asc" }, { nama: "asc" }],
  });
}


export interface PesertaSah {
  pelajarId: string;
  nama: string;
  kelas: string | null;
  jawatan: string;
  unitKredit: string[];
}

/**
 * Tag SU/NSU pelajar ini bagi projek (null jika tiada / peranan lain — tidak
 * boleh menghantar laporan). Pengerusi & Naib Pengerusi tidak mengisi laporan.
 */
export async function tagProjekPelajar(pelajarId: string, projekId: string) {
  if (!projekId) return null;
  const tag = await prisma.projekTag.findUnique({
    where: { projekId_pelajarId: { projekId, pelajarId } },
    include: { projek: true },
  });
  return tag && PERANAN_PELAPOR.includes(tag.peranan) ? tag : null;
}

/**
 * Senarai peserta muktamad: AJK teras yang di-tag guru (Pengerusi, Naib
 * Pengerusi, SU, NSU — jawatan dari tag, tidak boleh diubah pelajar) + peserta
 * lain dari medan `peserta` (JSON [{pelajarId, jawatan}]) yang dipilih SU/NSU
 * dengan jawatan JAWATAN_PESERTA sahaja. Penghantar sendiri dikecualikan
 * (jawatannya = jawatanProjek laporan). Unit kredit ditetapkan di sini.
 */
export async function bacaPeserta(
  form: FormData,
  penghantarId: string,
  projek: { id: string; kohort: string; units: string[] },
): Promise<{ peserta: PesertaSah[] } | { ralat: string }> {
  let mentah: unknown;
  try {
    mentah = JSON.parse(String(form.get("peserta") ?? "[]"));
  } catch {
    return { ralat: "Senarai peserta tidak sah" };
  }
  if (!Array.isArray(mentah)) return { ralat: "Senarai peserta tidak sah" };
  const jawatanSah = new Set<string>(JAWATAN_PESERTA);
  const tags = await prisma.projekTag.findMany({ where: { projekId: projek.id }, select: { pelajarId: true, peranan: true } });
  const pilih = new Map<string, string>();
  for (const x of mentah) {
    const id = typeof x?.pelajarId === "string" ? x.pelajarId : "";
    const jawatan = typeof x?.jawatan === "string" ? x.jawatan : "";
    if (!id || id === penghantarId) continue;
    if (!jawatanSah.has(jawatan)) return { ralat: `Jawatan peserta tidak sah: ${jawatan || "(kosong)"}` };
    pilih.set(id, jawatan);
  }
  // AJK teras dari guru menimpa apa-apa pilihan pelajar bagi orang yang sama.
  for (const t of tags) {
    if (t.pelajarId !== penghantarId) pilih.set(t.pelajarId, JAWATAN_PERANAN[t.peranan] ?? "Ahli");
  }
  if (pilih.size > 500) return { ralat: "Terlalu ramai peserta" };
  if (pilih.size === 0) return { peserta: [] };

  const rows = await prisma.pelajar.findMany({
    where: { id: { in: [...pilih.keys()] }, ...(projek.kohort ? { kohort: projek.kohort } : {}) },
    select: { id: true, nama: true, kelasT6: true, kokurikulum: { select: { namaUnitT6: true } } },
  });
  if (rows.length !== pilih.size) return { ralat: "Sebahagian peserta tidak sah atau bukan dari kohort projek" };

  return {
    peserta: rows
      .map((r) => ({
        pelajarId: r.id,
        nama: r.nama,
        kelas: r.kelasT6,
        jawatan: pilih.get(r.id)!,
        unitKredit: unitKredit(
          r.kokurikulum.map((k) => k.namaUnitT6).filter((u): u is string => !!u),
          projek.units,
        ),
      }))
      .sort((a, b) => JAWATAN_PROJEK.indexOf(a.jawatan as never) - JAWATAN_PROJEK.indexOf(b.jawatan as never) || a.nama.localeCompare(b.nama)),
  };
}
