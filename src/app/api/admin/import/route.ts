import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { loadWorkbookFromBuffer, parsePajskWorksheet, parsePelajarBaruWorksheet } from "@/lib/import";
import { jalankanImportGuru, diffPajsk, diffPelajarBaru } from "@/lib/import-run";

// GET — histori/audit import (§6): siapa, bila, versi mana, status.
export async function GET() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const sejarah = await prisma.logImport.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, jenis: true, namaFail: true, status: true, dimuatOlehId: true,
      jumlah: true, baharu: true, berubah: true, ralatCount: true, createdAt: true, appliedAt: true,
    },
  });
  return ok(sejarah);
}

// POST — muat naik fail.
//  - jenis "pajsk": PRATONTON sahaja (parse + diff), simpan LogImport(Preview).
//    Tiada tulisan ke rekod pelajar sehingga disahkan (POST /api/admin/import/[id]).
//  - jenis "pelajarbaru": PRATONTON juga (Nama/Kelas/No.IC sahaja, tiada
//    unit/markah) — pelajar daftar unit sendiri selepas log masuk pertama.
//  - jenis "guru": import terus (tiada perubahan besar-besaran markah).
export async function POST(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const form = await request.formData();
  const jenis = String(form.get("jenis") ?? "");
  const file = form.get("fail");
  if (!(file instanceof File) || file.size === 0) return fail("Sila pilih fail Excel", 422);
  if (!["pajsk", "guru", "pelajarbaru"].includes(jenis)) return fail("Jenis import tidak sah", 422);

  try {
    const wb = await loadWorkbookFromBuffer(await file.arrayBuffer());

    if (jenis === "guru") {
      const hasil = await jalankanImportGuru(wb);
      return ok({ mod: "terus", hasil }, `Import guru selesai: ${hasil.berjaya}/${hasil.jumlah} rekod`);
    }

    if (jenis === "pelajarbaru") {
      const rows = parsePelajarBaruWorksheet(wb.worksheets[0]);
      const diff = await diffPelajarBaru(rows);
      const log = await prisma.logImport.create({
        data: {
          jenis: "pelajarbaru",
          namaFail: file.name || "pelajar-baharu.xlsx",
          status: "Preview",
          dimuatOlehId: session.userId,
          jumlah: diff.jumlah,
          baharu: diff.baharu,
          berubah: diff.berubah,
          ralatCount: diff.ralat.length,
          payloadJson: JSON.stringify(rows),
          diffJson: JSON.stringify(diff),
        },
      });
      return ok(
        { mod: "pratonton", logId: log.id, diff },
        `Pratonton: ${diff.baharu} baharu, ${diff.berubah} berubah, ${diff.sama} tiada perubahan.`
      );
    }

    // pajsk → pratonton diff
    const rows = parsePajskWorksheet(wb.worksheets[0]);
    const diff = await diffPajsk(rows);
    const log = await prisma.logImport.create({
      data: {
        jenis: "pajsk",
        namaFail: file.name || "DUMM-PAJSK.xlsx",
        status: "Preview",
        dimuatOlehId: session.userId,
        jumlah: diff.jumlah,
        baharu: diff.baharu,
        berubah: diff.berubah,
        ralatCount: diff.ralat.length,
        payloadJson: JSON.stringify(rows),
        diffJson: JSON.stringify(diff),
      },
    });
    return ok(
      { mod: "pratonton", logId: log.id, diff },
      `Pratonton: ${diff.baharu} baharu, ${diff.berubah} berubah, ${diff.sama} tiada perubahan.`
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat memproses fail", 400);
  }
}
