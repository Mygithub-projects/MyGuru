import type { NextRequest } from "next/server";
import { requireGuruOrAdmin, fail } from "@/lib/api";
import { guruSeluruhSekolah } from "@/lib/workflow";
import { normalBahagian, skopAnalitikBahagian } from "@/lib/analitik";
import { eksportExcel, eksportPdf } from "@/lib/eksport";

export async function GET(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  const format = request.nextUrl.searchParams.get("format") ?? "excel";

  // Skop: guru biasa = unit seliaan; admin/penyelaras = semua.
  // ?bahagian=Uniform|Kelab|Sukan menapis lagi ke BU/KP/SP.
  const seluruh = !guru || guruSeluruhSekolah(guru);
  const { units } = await skopAnalitikBahagian(
    guru?.id ?? null,
    seluruh,
    normalBahagian(request.nextUrl.searchParams.get("bahagian")),
  );

  if (format === "pdf") {
    const pdf = await eksportPdf(units);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="analitik-ekokot6.pdf"`,
      },
    });
  }
  if (format === "excel") {
    const xlsx = await eksportExcel(units);
    return new Response(new Uint8Array(xlsx), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="analitik-ekokot6.xlsx"`,
      },
    });
  }
  return fail("Format tidak disokong (excel|pdf)", 422);
}
