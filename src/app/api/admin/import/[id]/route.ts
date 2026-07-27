import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { applyPajskRows, applyPelajarBaruRows } from "@/lib/import-run";
import { kiraSemulaT6 } from "@/lib/workflow";
import type { PajskRow, PelajarBaruRow } from "@/lib/import";

// POST — SAHKAN import pratonton: tulis ke DB. Cabang ikut `log.jenis`:
//  - "pajsk": tulis markah/unit + kira semula markah pelajar yang disentuh
//    (§6). Amaran recalc besar-besaran dipaparkan di UI dahulu.
//  - "pelajarbaru": cipta Pelajar+User sahaja (tiada unit/markah untuk
//    dikira semula).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const log = await prisma.logImport.findUnique({ where: { id } });
  if (!log) return fail("Rekod import tidak dijumpai", 404);
  if (log.status !== "Preview") return fail("Import ini telah pun diproses atau dibatalkan.", 409);

  if (log.jenis === "pelajarbaru") {
    let rows: PelajarBaruRow[];
    try {
      rows = JSON.parse(log.payloadJson) as PelajarBaruRow[];
    } catch {
      return fail("Data import rosak — sila muat naik semula.", 400);
    }

    const hasil = await applyPelajarBaruRows(rows);

    await prisma.logImport.update({
      where: { id },
      data: { status: "Applied", appliedAt: new Date(), jumlah: hasil.jumlah, ralatCount: hasil.ralat.length },
    });

    return ok(
      { hasil, direcalc: 0 },
      `Import disahkan: ${hasil.berjaya}/${hasil.jumlah} pelajar baharu dicipta.`
    );
  }

  let rows: PajskRow[];
  try {
    rows = JSON.parse(log.payloadJson) as PajskRow[];
  } catch {
    return fail("Data import rosak — sila muat naik semula.", 400);
  }

  const hasil = await applyPajskRows(rows);

  // Kira semula markah pelajar yang disentuh berdasarkan data baharu.
  const ids = hasil.pelajarIds ?? [];
  for (const pid of ids) await kiraSemulaT6(pid);

  await prisma.logImport.update({
    where: { id },
    data: {
      status: "Applied",
      appliedAt: new Date(),
      jumlah: hasil.jumlah,
      ralatCount: hasil.ralat.length,
    },
  });

  return ok(
    { hasil, direcalc: ids.length },
    `Import disahkan: ${hasil.berjaya}/${hasil.jumlah} rekod ditulis; ${ids.length} pelajar dikira semula.`
  );
}

// DELETE — batalkan pratonton yang belum disahkan.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const log = await prisma.logImport.findUnique({ where: { id }, select: { status: true } });
  if (!log) return fail("Rekod import tidak dijumpai", 404);
  if (log.status !== "Preview") return fail("Hanya pratonton belum disahkan boleh dibatalkan.", 409);

  await prisma.logImport.update({ where: { id }, data: { status: "Batal" } });
  return ok({ id }, "Pratonton import dibatalkan.");
}
