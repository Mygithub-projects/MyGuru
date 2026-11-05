// ===========================================================================
//  Kehadiran Guru — guru penasihat mengisi kehadiran sendiri bagi setiap
//  perjumpaan (SesiKehadiran) unit seliaannya; Admin menyemak (sahkan/tolak).
//  Hanya rekod "Hadir" yang DISAHKAN dikira dalam jumlah kehadiran guru.
// ===========================================================================
import { prisma } from "./prisma";
import { dbKohort } from "./prisma-kohort";
import { unitSeliaan } from "./workflow";
import type { Guru } from "@prisma/client";

export const STATUS_SEMAKAN_GURU = ["Pending", "Approved", "Rejected"] as const;
export type StatusSemakanGuru = (typeof STATUS_SEMAKAN_GURU)[number];

/** Bahagian PAJSK → singkatan paparan. */
export const BAHAGIAN_GURU = [
  { jenis: "Uniform", kod: "BU" },
  { jenis: "Sukan", kod: "SP" },
  { jenis: "Kelab", kod: "KP" },
] as const;

/** Guru boleh isi kehadiran sehingga hujung hari perjumpaan + tidak lebih awal dari hari itu. */
function sesiSudahBermula(tarikh: Date, kini = new Date()): boolean {
  // Benarkan isi pada hari perjumpaan (waktu Malaysia) atau selepasnya.
  const MYT = 8 * 3_600_000;
  const hariSesi = Math.floor((tarikh.getTime() + MYT) / 86_400_000);
  const hariKini = Math.floor((kini.getTime() + MYT) / 86_400_000);
  return hariKini >= hariSesi;
}

export interface SesiGuruRow {
  sesiId: string;
  jenisKoko: string;
  namaUnit: string;
  bilPerjumpaan: number;
  tarikh: string; // ISO
  bolehIsi: boolean;
  rekod: {
    id: string;
    statusHadir: boolean;
    catatan: string | null;
    statusSemakan: string;
    komenAdmin: string | null;
  } | null;
}

export interface RingkasanBahagian {
  jenis: string;
  kod: string;
  units: string[];
  jumlahPerjumpaan: number;
  hadirDisahkan: number;
  menunggu: number;
  belumIsi: number;
  tarikhHadir: string[]; // ISO, hadir & disahkan
}

/** Perjumpaan unit seliaan guru (kohort dipilih) + rekod kehadiran guru sendiri. */
export async function getKehadiranSaya(guru: Pick<Guru, "id">) {
  const db = await dbKohort();
  const units = await unitSeliaan(guru);
  if (units.length === 0) return { sesi: [] as SesiGuruRow[], ringkasan: [] as RingkasanBahagian[] };

  const sesi = await db.sesiKehadiran.findMany({
    where: { namaUnit: { in: units } },
    include: { kehadiranGuru: { where: { guruId: guru.id } } },
    orderBy: [{ tarikh: "desc" }, { namaUnit: "asc" }],
  });

  const rows: SesiGuruRow[] = sesi.map((s) => {
    const r = s.kehadiranGuru[0];
    return {
      sesiId: s.id,
      jenisKoko: s.jenisKoko,
      namaUnit: s.namaUnit,
      bilPerjumpaan: s.bilPerjumpaan,
      tarikh: s.tarikh.toISOString(),
      bolehIsi: sesiSudahBermula(s.tarikh) && r?.statusSemakan !== "Approved",
      rekod: r
        ? { id: r.id, statusHadir: r.statusHadir, catatan: r.catatan, statusSemakan: r.statusSemakan, komenAdmin: r.komenAdmin }
        : null,
    };
  });

  const units3 = await prisma.guruPenasihatKelab.findMany({
    where: { guruId: guru.id },
    select: { namaUnit: true, jenisKoko: true },
  });

  const ringkasan: RingkasanBahagian[] = BAHAGIAN_GURU.map((b) => {
    const dalam = rows.filter((r) => r.jenisKoko === b.jenis);
    const lepas = dalam.filter((r) => sesiSudahBermula(new Date(r.tarikh)));
    const hadirSah = dalam.filter((r) => r.rekod?.statusSemakan === "Approved" && r.rekod.statusHadir);
    return {
      jenis: b.jenis,
      kod: b.kod,
      units: units3.filter((u) => u.jenisKoko === b.jenis).map((u) => u.namaUnit),
      jumlahPerjumpaan: lepas.length,
      hadirDisahkan: hadirSah.length,
      menunggu: dalam.filter((r) => r.rekod?.statusSemakan === "Pending").length,
      belumIsi: lepas.filter((r) => !r.rekod || r.rekod.statusSemakan === "Rejected").length,
      tarikhHadir: hadirSah.map((r) => r.tarikh).sort(),
    };
  });

  return { sesi: rows, ringkasan };
}

/** Guru isi / kemas kini kehadiran sendiri untuk satu perjumpaan. */
export async function isiKehadiranGuru(input: {
  guruId: string;
  sesiId: string;
  statusHadir: boolean;
  catatan?: string | null;
}) {
  const sesi = await prisma.sesiKehadiran.findUnique({ where: { id: input.sesiId } });
  if (!sesi) throw new Error("Perjumpaan tidak dijumpai");

  const units = await unitSeliaan({ id: input.guruId });
  if (!units.includes(sesi.namaUnit)) throw new Error("Perjumpaan ini bukan untuk unit seliaan anda");
  if (!sesiSudahBermula(sesi.tarikh)) throw new Error("Kehadiran hanya boleh diisi pada atau selepas tarikh perjumpaan");

  const catatan = input.catatan?.trim() || null;
  if (!input.statusHadir && !catatan) throw new Error("Sila nyatakan sebab tidak hadir");

  const sedia = await prisma.kehadiranGuru.findUnique({
    where: { guruId_sesiId: { guruId: input.guruId, sesiId: input.sesiId } },
  });
  if (sedia?.statusSemakan === "Approved") throw new Error("Kehadiran ini telah disahkan Admin dan tidak boleh diubah");

  const data = {
    statusHadir: input.statusHadir,
    catatan,
    statusSemakan: "Pending",
    disemakOlehId: null,
    tarikhSemak: null,
    komenAdmin: null,
  };
  return prisma.kehadiranGuru.upsert({
    where: { guruId_sesiId: { guruId: input.guruId, sesiId: input.sesiId } },
    update: data,
    create: { guruId: input.guruId, sesiId: input.sesiId, ...data },
  });
}

/** Admin sahkan / tolak satu atau lebih rekod kehadiran guru. */
export async function semakKehadiranGuru(input: {
  ids: string[];
  status: "Approved" | "Rejected";
  komen?: string | null;
  adminUserId: string;
}) {
  return prisma.kehadiranGuru.updateMany({
    where: { id: { in: input.ids } },
    data: {
      statusSemakan: input.status,
      komenAdmin: input.komen?.trim() || null,
      disemakOlehId: input.adminUserId,
      tarikhSemak: new Date(),
    },
  });
}

/** Ringkasan semua guru penasihat (kohort dipilih) — untuk halaman Admin. */
export async function ringkasanKehadiranSemuaGuru() {
  const db = await dbKohort();
  const [penasihat, sesi, rekod] = await Promise.all([
    prisma.guruPenasihatKelab.findMany({
      where: { guru: { statusAktif: true } },
      include: { guru: { select: { id: true, nama: true } } },
    }),
    db.sesiKehadiran.findMany({ select: { id: true, namaUnit: true, jenisKoko: true, tarikh: true } }),
    db.kehadiranGuru.findMany({ select: { guruId: true, sesiId: true, statusHadir: true, statusSemakan: true } }),
  ]);

  const sesiLepas = sesi.filter((s) => sesiSudahBermula(s.tarikh));
  const rekodMap = new Map(rekod.map((r) => [`${r.guruId}|${r.sesiId}`, r]));
  const guruMap = new Map<string, {
    guruId: string; nama: string;
    bahagian: Record<string, { hadir: number; jumlah: number }>;
    menunggu: number; belumIsi: number;
  }>();

  for (const p of penasihat) {
    if (!guruMap.has(p.guruId)) {
      guruMap.set(p.guruId, {
        guruId: p.guruId, nama: p.guru.nama,
        bahagian: Object.fromEntries(BAHAGIAN_GURU.map((b) => [b.jenis, { hadir: 0, jumlah: 0 }])),
        menunggu: 0, belumIsi: 0,
      });
    }
    const g = guruMap.get(p.guruId)!;
    for (const s of sesiLepas.filter((x) => x.namaUnit === p.namaUnit)) {
      const r = rekodMap.get(`${p.guruId}|${s.id}`);
      const b = g.bahagian[s.jenisKoko];
      if (b) {
        b.jumlah += 1;
        if (r?.statusSemakan === "Approved" && r.statusHadir) b.hadir += 1;
      }
      if (r?.statusSemakan === "Pending") g.menunggu += 1;
      if (!r || r.statusSemakan === "Rejected") g.belumIsi += 1;
    }
  }
  return [...guruMap.values()].sort((a, b) => a.nama.localeCompare(b.nama, "ms"));
}
