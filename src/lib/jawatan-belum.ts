// ===========================================================================
//  Jejak pelajar yang jawatan T6 belum ditetapkan / butiran belum disahkan,
//  dikumpul ikut unit bersama GKP (Ketua Guru Penasihat) & PGKP (Penolong
//  Ketua GP) unit itu — supaya Admin boleh memaklumkan guru yang betul.
// ===========================================================================
import { prisma } from "./prisma";
import { dbKohort } from "./prisma-kohort";
import { notify } from "./notifikasi";

export interface GuruUnitRingkas {
  id: string;
  nama: string;
  email: string;
  peranan: string; // KetuaPenasihat | PenolongKetuaGP | Penasihat
}

export interface PelajarBelum {
  id: string;
  nama: string;
  noIc: string;
  kelasT6: string | null;
  jawatanT6: string | null;
  tiadaJawatan: boolean;
  belumSah: boolean; // statusButiran masih Pending
  cadanganPending: string | null; // jawatan dicadang SU, menunggu pengesahan guru
}

export interface UnitBelum {
  namaUnit: string;
  jenisKoko: string;
  jumlahAhli: number;
  bilTiadaJawatan: number;
  bilBelumSah: number;
  bilCadangan: number;
  gkp: GuruUnitRingkas[]; // KetuaPenasihat + PenolongKetuaGP
  penasihat: GuruUnitRingkas[]; // guru penasihat biasa (sandaran jika tiada GKP/PGKP)
  pelajar: PelajarBelum[]; // hanya yang ada isu
}

const PERANAN_GKP = ["KetuaPenasihat", "PenolongKetuaGP"];

export const tiadaJawatan = (j: string | null | undefined) => !j || j.trim() === "" || j.trim() === "-";

/** Data untuk paparan Admin (kohort dipilih sahaja). Unit tanpa isu tidak dipulangkan. */
export async function dataJawatanBelum(
  dbArg?: Awaited<ReturnType<typeof dbKohort>>,
): Promise<UnitBelum[]> {
  const db = dbArg ?? (await dbKohort());
  const [koko, cadangan, penasihat] = await Promise.all([
    db.kokurikulum.findMany({
      where: { namaUnitT6: { not: null }, pelajar: { statusAktif: true } },
      select: {
        pelajarId: true,
        jenisKoko: true,
        namaUnitT6: true,
        jawatanT6: true,
        pelajar: { select: { nama: true, noIc: true, kelasT6: true, statusButiran: true } },
      },
    }),
    db.cadanganJawatan.findMany({
      where: { status: "Pending" },
      select: { pelajarId: true, jenisKoko: true, jawatanBaru: true },
    }),
    prisma.guruPenasihatKelab.findMany({
      where: { guru: { statusAktif: true } },
      select: { namaUnit: true, peranan: true, guru: { select: { id: true, nama: true, email: true } } },
    }),
  ]);

  const cadanganMap = new Map(cadangan.map((c) => [`${c.pelajarId}|${c.jenisKoko}`, c.jawatanBaru]));
  const guruIkutUnit = new Map<string, GuruUnitRingkas[]>();
  for (const p of penasihat) {
    const senarai = guruIkutUnit.get(p.namaUnit) ?? [];
    senarai.push({ ...p.guru, peranan: p.peranan });
    guruIkutUnit.set(p.namaUnit, senarai);
  }

  const units = new Map<string, UnitBelum>();
  for (const k of koko) {
    const namaUnit = k.namaUnitT6!;
    const kunci = `${k.jenisKoko}|${namaUnit}`;
    let u = units.get(kunci);
    if (!u) {
      const guru = guruIkutUnit.get(namaUnit) ?? [];
      u = {
        namaUnit,
        jenisKoko: k.jenisKoko,
        jumlahAhli: 0,
        bilTiadaJawatan: 0,
        bilBelumSah: 0,
        bilCadangan: 0,
        gkp: guru
          .filter((g) => PERANAN_GKP.includes(g.peranan))
          .sort((a, b) => PERANAN_GKP.indexOf(a.peranan) - PERANAN_GKP.indexOf(b.peranan)),
        penasihat: guru.filter((g) => !PERANAN_GKP.includes(g.peranan)),
        pelajar: [],
      };
      units.set(kunci, u);
    }
    u.jumlahAhli++;
    const tiada = tiadaJawatan(k.jawatanT6);
    const belumSah = k.pelajar.statusButiran !== "Approved";
    const cad = cadanganMap.get(`${k.pelajarId}|${k.jenisKoko}`) ?? null;
    if (tiada) u.bilTiadaJawatan++;
    if (belumSah) u.bilBelumSah++;
    if (cad) u.bilCadangan++;
    if (tiada || belumSah || cad) {
      u.pelajar.push({
        id: k.pelajarId,
        nama: k.pelajar.nama,
        noIc: k.pelajar.noIc,
        kelasT6: k.pelajar.kelasT6,
        jawatanT6: k.jawatanT6,
        tiadaJawatan: tiada,
        belumSah,
        cadanganPending: cad,
      });
    }
  }

  return [...units.values()]
    .filter((u) => u.pelajar.length > 0)
    .map((u) => ({ ...u, pelajar: u.pelajar.sort((a, b) => a.nama.localeCompare(b.nama)) }))
    .sort((a, b) => b.bilTiadaJawatan - a.bilTiadaJawatan || b.bilBelumSah - a.bilBelumSah || a.namaUnit.localeCompare(b.namaUnit));
}

/**
 * Hantar peringatan (notifikasi dalam-app + e-mel jika SMTP aktif) kepada GKP &
 * PGKP setiap unit yang dipilih. Jika unit tiada GKP/PGKP, guru penasihat unit
 * itu dimaklumkan sebagai sandaran. Pulangkan bilangan guru yang dimaklumkan.
 */
export async function hantarPeringatanJawatan(namaUnit: string[] | null) {
  const semua = await dataJawatanBelum();
  const sasaran = namaUnit ? semua.filter((u) => namaUnit.includes(u.namaUnit)) : semua;

  // Gabung mesej ikut guru supaya seorang guru yang menyelia beberapa unit terima satu notifikasi.
  const ikutGuru = new Map<string, string[]>();
  let unitTanpaGuru = 0;
  for (const u of sasaran) {
    const penerima = u.gkp.length > 0 ? u.gkp : u.penasihat;
    if (penerima.length === 0) { unitTanpaGuru++; continue; }
    const butir: string[] = [];
    if (u.bilTiadaJawatan) butir.push(`${u.bilTiadaJawatan} belum ditetapkan jawatan`);
    if (u.bilBelumSah) butir.push(`${u.bilBelumSah} butiran belum disahkan`);
    if (u.bilCadangan) butir.push(`${u.bilCadangan} cadangan jawatan menunggu`);
    const baris = `• ${u.namaUnit} (${u.jenisKoko}): ${butir.join(", ")}`;
    for (const g of penerima) ikutGuru.set(g.id, [...(ikutGuru.get(g.id) ?? []), baris]);
  }

  const users = await prisma.user.findMany({
    where: { guruId: { in: [...ikutGuru.keys()] }, statusAktif: true },
    select: { id: true, guruId: true },
  });
  await Promise.all(
    users.map((u) =>
      notify({
        userId: u.id,
        tajuk: "Peringatan: kemaskini & sahkan jawatan ahli",
        mesej: `Admin memaklumkan ahli unit anda yang masih perlu tindakan:\n${(ikutGuru.get(u.guruId!) ?? []).join("\n")}\nSila tetapkan jawatan dan sahkan butiran di Senarai Ahli.`,
        jenis: "kuiri",
        pautan: "/guru/ahli",
      }),
    ),
  );
  return { bilGuru: users.length, bilUnit: sasaran.length - unitTanpaGuru, unitTanpaGuru };
}
