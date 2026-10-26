import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/api";
import { eksportBorangRumusan, isBahagian } from "@/lib/rumusan";

/**
 * Borang Rumusan Markah keseluruhan (Admin) — helaian RINGKASAN + satu helaian
 * setiap unit. Penapis pilihan: ?bahagian=Kelab|Sukan|Uniform|Perkhidmatan & ?kelas=6AK1
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const q = request.nextUrl.searchParams;
  const bahagian = q.get("bahagian");
  const kelas = q.get("kelas")?.trim() || undefined;
  const xlsx = await eksportBorangRumusan(
    { bahagian: isBahagian(bahagian) ? bahagian : undefined, kelas },
    { ringkasan: true },
  );

  const bahagianNama = isBahagian(bahagian) ? bahagian.toLowerCase() : "semua";
  const kelasNama = kelas ? `-${kelas.replace(/[^A-Za-z0-9]+/g, "")}` : "";
  const tarikh = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rumusan-markah-${bahagianNama}${kelasNama}-${tarikh}.xlsx"`,
    },
  });
}
