// src/lib/agent/approval.ts
// Pelaksana kelulusan untuk CadanganAgent. Inilah "separuh manusia" corak agentik:
// apabila guru/admin MELULUSKAN satu cadangan, tindakan sebenar baru dijalankan —
// dengan GUNA SEMULA fungsi workflow sedia ada (bukan logik baharu). Menolak hanya
// menanda status; tiada rekod rasmi berubah.

import type { CadanganAgent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  prosesPertukaran,
  sahkanPencapaian,
  sahkanAktivitiLuar,
  kiraSemulaT6,
  janaNoSiri,
} from "@/lib/workflow";

export type TindakanCadangan = "Approve" | "Reject";

/**
 * Cari pelajarId yang berkaitan dengan satu cadangan — untuk semakan skop guru
 * di lapisan API (bolehGuruAksesPelajar). Null jika tidak dapat diselesaikan.
 */
export async function pelajarIdRujukan(c: CadanganAgent): Promise<string | null> {
  switch (c.jenis) {
    case "RECALC":
      return c.rujukanId; // rujukanId = pelajarId
    case "UNIT_TRANSFER": {
      const log = await prisma.logPertukaran.findUnique({ where: { id: c.rujukanId } });
      return log?.pelajarId ?? null;
    }
    case "ACHIEVEMENT": {
      const pen = await prisma.pencapaian.findUnique({ where: { id: c.rujukanId } });
      if (pen) return pen.pelajarId;
      const akt = await prisma.aktivitiLuar.findUnique({ where: { id: c.rujukanId } });
      return akt?.pelajarId ?? null;
    }
    case "ECERT": {
      const akt = await prisma.aktivitiLuar.findUnique({ where: { id: c.rujukanId } });
      return akt?.pelajarId ?? null;
    }
    default:
      return null;
  }
}

/** Laksana tindakan hiliran sebenar bagi cadangan yang DILULUSKAN. */
async function laksanaTindakan(
  c: CadanganAgent,
  guruId: string | null,
  komen?: string
): Promise<string> {
  switch (c.jenis) {
    case "RECALC": {
      const hasil = await kiraSemulaT6(c.rujukanId);
      if (!hasil) throw new Error("Pelajar tidak dijumpai untuk pengiraan semula.");
      return `Markah PAJSK T6 dikira semula: ${hasil.jumlahTeras}/100 markah (${hasil.peratus}%, gred ${hasil.gred}).`;
    }

    case "UNIT_TRANSFER": {
      // keputusan cadangan: LULUS | TOLAK → status pertukaran sebenar
      const status = c.keputusan === "TOLAK" ? "Reject" : "Approved";
      await prosesPertukaran({ logId: c.rujukanId, status, guruId, komen });
      return `Permohonan pertukaran unit di-${status === "Approved" ? "luluskan" : "tolak"}.`;
    }

    case "ACHIEVEMENT": {
      // keputusan cadangan: SAHKAN | KUIRI
      const status = c.keputusan === "KUIRI" ? "Kuiri" : "Approved";
      const pen = await prisma.pencapaian.findUnique({ where: { id: c.rujukanId } });
      if (pen) {
        await sahkanPencapaian({ pencapaianId: c.rujukanId, status, komen });
        return `Pencapaian "${pen.namaPencapaian}" di-${status === "Approved" ? "sahkan" : "kuiri"}.`;
      }
      const akt = await prisma.aktivitiLuar.findUnique({ where: { id: c.rujukanId } });
      if (akt) {
        await sahkanAktivitiLuar({ aktivitiId: c.rujukanId, status, komen });
        return `Aktiviti luar "${akt.namaAktiviti}" di-${status === "Approved" ? "sahkan" : "kuiri"}.`;
      }
      throw new Error("Item pencapaian/aktiviti luar tidak dijumpai.");
    }

    case "ECERT": {
      const akt = await prisma.aktivitiLuar.findUnique({ where: { id: c.rujukanId } });
      if (!akt) throw new Error("Aktiviti luar tidak dijumpai.");
      if (akt.statusPengesahan !== "Approved") {
        throw new Error("Aktiviti belum diluluskan — e-Cert tidak boleh dijana.");
      }
      if (!akt.noSiriECert) {
        await prisma.aktivitiLuar.update({
          where: { id: akt.id },
          data: { noSiriECert: janaNoSiri(akt.pelajarId, akt.id), tarikhJanaECert: new Date() },
        });
      }
      return `e-Cert sedia dijana di /api/pelajar/${akt.pelajarId}/ecert/${akt.id}.`;
    }

    default:
      throw new Error(`Jenis cadangan tidak dikenali: ${c.jenis}`);
  }
}

/**
 * Proses satu CadanganAgent. Approve → laksana tindakan hiliran + tanda Approved.
 * Reject → tanda Reject sahaja. Idempoten: menolak cadangan bukan-Pending.
 */
export async function prosesCadanganAgent(input: {
  id: string;
  tindakan: TindakanCadangan;
  diprosesOleh: string; // User.id pemproses
  guruId: string | null; // null bila Admin tanpa rekod Guru
  komen?: string;
}): Promise<{ cadangan: CadanganAgent; hasil: string }> {
  const c = await prisma.cadanganAgent.findUnique({ where: { id: input.id } });
  if (!c) throw new Error("Cadangan tidak dijumpai.");
  if (c.status !== "Pending") throw new Error("Cadangan ini telah pun diproses.");

  let hasil: string;
  if (input.tindakan === "Reject") {
    hasil = "Cadangan ditolak — tiada perubahan rekod dibuat.";
  } else {
    hasil = await laksanaTindakan(c, input.guruId, input.komen);
  }

  const cadangan = await prisma.cadanganAgent.update({
    where: { id: input.id },
    data: {
      status: input.tindakan === "Approve" ? "Approved" : "Reject",
      diprosesOleh: input.diprosesOleh,
      tarikhProses: new Date(),
      komen: input.komen,
    },
  });

  return { cadangan, hasil };
}
