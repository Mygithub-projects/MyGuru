import type { NextRequest } from "next/server";
import { requireRole, fail } from "@/lib/api";
import { eksportKehadiranExcel, eksportKehadiranPdf } from "@/lib/eksport";

export async function GET(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const sp = request.nextUrl.searchParams;
  const filter = { unit: sp.get("unit") || undefined, jenis: sp.get("jenis") || undefined };
  const format = sp.get("format") ?? "excel";

  if (format === "pdf") {
    const pdf = await eksportKehadiranPdf(filter);
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="kehadiran-perjumpaan.pdf"` },
    });
  }
  if (format === "excel") {
    const xlsx = await eksportKehadiranExcel(filter);
    return new Response(new Uint8Array(xlsx), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="kehadiran-perjumpaan.xlsx"`,
      },
    });
  }
  return fail("Format tidak disokong (excel|pdf)", 422);
}
