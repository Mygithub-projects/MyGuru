import { requireGuruOrAdmin, ok } from "@/lib/api";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { getInsights } from "@/lib/insights";
import { ringkasanAI, aiDiaktifkan } from "@/lib/ai";
import { getLocale } from "@/lib/locale";

// Panggilan model boleh ambil masa — benarkan sehingga 60s di Vercel.
export const maxDuration = 60;

export async function GET() {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  if (!aiDiaktifkan()) {
    return ok({ ai: false, ringkasan: null }, "AI tidak dikonfigur");
  }

  let units: string[] | undefined = undefined;
  let skop = "Seluruh sekolah";
  if (guru && !guruSeluruhSekolah(guru)) {
    units = await unitSeliaan(guru);
    skop = `Unit seliaan: ${units.join(", ") || "tiada"}`;
  }

  const locale = await getLocale();
  const { kpi, cerapan } = await getInsights(units, locale);
  const ringkasan = await ringkasanAI({ skop, kpi, cerapan, locale });
  return ok({ ai: ringkasan != null, ringkasan });
}
