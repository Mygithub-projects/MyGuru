// ===========================================================================
//  Ringkasan AI — guna API Claude untuk menjana naratif bahasa tabii ringkas
//  daripada KPI + cerapan. Aktif HANYA bila ANTHROPIC_API_KEY ditetapkan;
//  jika tidak, pulangkan null (pemanggil guna cerapan berasaskan peraturan).
// ===========================================================================
import Anthropic from "@anthropic-ai/sdk";
import type { KPI, Cerapan } from "./insights";
import type { Locale } from "./i18n";

// Model lalai mengikut garis panduan rasmi; boleh ditindih via AI_MODEL.
const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export function aiDiaktifkan(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function ringkasanAI(input: {
  skop: string;
  kpi: KPI[];
  cerapan: Cerapan[];
  locale?: Locale;
}): Promise<string | null> {
  if (!aiDiaktifkan()) return null;

  const client = new Anthropic(); // membaca ANTHROPIC_API_KEY dari env

  const data = [
    `Skop: ${input.skop}`,
    "KPI:",
    ...input.kpi.map((k) => `- ${k.label}: ${k.nilai}${k.delta ? ` (${k.delta})` : ""}`),
    "Cerapan automatik:",
    ...input.cerapan.map((c) => `- [${c.jenis}] ${c.teks}`),
  ].join("\n");

  const system =
    input.locale === "en"
      ? "You are a data analyst for a Malaysian school's co-curriculum programme. Based on the KPIs and " +
        "insights given, write a SHORT executive summary (2–3 sentences) in formal English for school " +
        "administrators. Focus on what the data means, important trends, and one recommended action if " +
        "appropriate. Don't just repeat the raw numbers; interpret them. Don't use Markdown formatting or " +
        "lists — plain paragraph only."
      : "Anda penganalisis data kokurikulum sekolah Malaysia. Berdasarkan KPI dan cerapan " +
        "yang diberi, tulis ringkasan eksekutif RINGKAS (2–3 ayat) dalam Bahasa Melayu rasmi " +
        "untuk pentadbir sekolah. Fokus pada maksud data, tren penting, dan satu cadangan " +
        "tindakan jika sesuai. Jangan ulang nombor secara mentah; tafsirkannya. Jangan guna " +
        "penanda Markdown atau senarai — perenggan sahaja.";

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: data }],
    });
    const teks = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return teks || null;
  } catch (e) {
    console.warn("[ai] ringkasanAI gagal:", e instanceof Error ? e.message : e);
    return null;
  }
}
