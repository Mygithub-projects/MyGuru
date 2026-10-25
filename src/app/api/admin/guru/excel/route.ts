import type { NextRequest } from "next/server";
import { requireRole, ok, fail } from "@/lib/api";
import { loadWorkbookFromBuffer } from "@/lib/import";
import { eksportGuruExcel, pratontonImportGuru, laksanaImportGuru } from "@/lib/guru-excel";

/** Muat turun maklumat semua guru (Excel pergi-balik) — Admin sahaja. */
export async function GET() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const xlsx = await eksportGuruExcel();
  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="maklumat-guru.xlsx"`,
    },
  });
}

/**
 * Muat naik fail maklumat guru. mod "pratonton" (lalai) = senarai perubahan
 * tanpa tulisan; mod "laksana" = tulis baris baru/berubah (baris ralat dilangkau).
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const form = await request.formData();
  const file = form.get("fail");
  const mod = String(form.get("mod") ?? "pratonton");
  if (!(file instanceof File) || file.size === 0) return fail("Sila pilih fail Excel", 422);

  try {
    const wb = await loadWorkbookFromBuffer(await file.arrayBuffer());
    if (mod === "laksana") {
      const h = await laksanaImportGuru(wb);
      return ok(h, `Selesai: ${h.baru} guru baru, ${h.ubah} dikemas kini${h.ralat ? `, ${h.ralat} baris ralat dilangkau` : ""}.`);
    }
    return ok(await pratontonImportGuru(wb), "Pratonton");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Fail tidak dapat dibaca", 422);
  }
}
