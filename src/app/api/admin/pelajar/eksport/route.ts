import { requireRole } from "@/lib/api";
import { eksportPelajarRosterExcel } from "@/lib/eksport";

/** Muat turun roster penuh semua pelajar T6 (nama, markah, 3 unit) — Admin sahaja. */
export async function GET() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const xlsx = await eksportPelajarRosterExcel();
  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="roster-pelajar-t6.xlsx"`,
    },
  });
}
