import { requireRole } from "@/lib/api";
import { eksportRawDataExcel } from "@/lib/eksport";

/** Muat turun data mentah keseluruhan semua pelajar (Excel, 4 tab) — Admin sahaja. */
export async function GET() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const xlsx = await eksportRawDataExcel();
  const tarikh = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="raw-data-pelajar-${tarikh}.xlsx"`,
    },
  });
}
