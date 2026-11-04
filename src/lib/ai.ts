// ===========================================================================
//  Ringkasan AI — guna API Claude untuk menjana naratif bahasa tabii ringkas
//  daripada KPI + cerapan. Aktif HANYA bila Claude dikonfigurasi (Vertex/API key);
//  jika tidak, pulangkan null (pemanggil guna cerapan berasaskan peraturan).
// ===========================================================================
import type Anthropic from "@anthropic-ai/sdk";
import { buatKlienClaude, claudeDikonfigurasi } from "./claude-client";
import type { KPI, Cerapan } from "./insights";
import type { Locale } from "./i18n";
import type { KehadiranPerjumpaan } from "./analitik";

// Label bahagian untuk data kehadiran (jenisKoko -> singkatan rasmi).
const BAHAGIAN: { jenis: string; ms: string; en: string }[] = [
  { jenis: "Kelab", ms: "KP (Kelab/Persatuan)", en: "KP (Clubs/Societies)" },
  { jenis: "Sukan", ms: "SP (Sukan/Permainan)", en: "SP (Sports/Games)" },
  { jenis: "Uniform", ms: "BU (Badan Beruniform)", en: "BU (Uniformed Bodies)" },
];

// Model lalai mengikut garis panduan rasmi; boleh ditindih via AI_MODEL.
const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export function aiDiaktifkan(): boolean {
  return claudeDikonfigurasi();
}

export async function ringkasanAI(input: {
  skop: string;
  kpi: KPI[];
  cerapan: Cerapan[];
  gredA: number;
  jumlahPelajar: number;
  kehadiranPerjumpaan: Record<string, KehadiranPerjumpaan[]>;
  locale?: Locale;
}): Promise<string | null> {
  if (!aiDiaktifkan()) return null;

  const client = buatKlienClaude(); // Vertex AI (GCP) atau ANTHROPIC_API_KEY

  const data = [
    `Skop: ${input.skop}`,
    "KPI:",
    ...input.kpi.map((k) => `- ${k.label}: ${k.nilai}${k.delta ? ` (${k.delta})` : ""}`),
    "Cerapan automatik:",
    ...input.cerapan.map((c) => `- [${c.jenis}] ${c.teks}`),
    `Bilangan pelajar gred A (PAJSK T6): ${input.gredA} daripada ${input.jumlahPelajar} pelajar`,
    "Kehadiran setiap perjumpaan mengikut bahagian (hadir/jumlah rekod, peratus):",
    ...BAHAGIAN.map((b) => {
      const senarai = input.kehadiranPerjumpaan[b.jenis] ?? [];
      const label = input.locale === "en" ? b.en : b.ms;
      return senarai.length
        ? `- ${label}: ` + senarai.map((p) => `#${p.bil} ${p.hadir}/${p.total} (${p.peratus}%)`).join(", ")
        : `- ${label}: tiada rekod`;
    }),
  ].join("\n");

  const system =
    input.locale === "en"
      ? "You are a data analyst for a Malaysian school's co-curriculum programme. Write in formal English " +
        "for school administrators, in plain text with NO Markdown (no #, *, or bold). Use exactly this layout:\n" +
        "1) A short paragraph (2–3 sentences) interpreting the data: important trends and one recommended action.\n" +
        "2) One line stating the number of grade A students, e.g. 'Grade A: 45 of 300 students (15%).'\n" +
        "3) The heading line 'Attendance per meeting:' followed by one line each for KP, SP and BU, listing every " +
        "meeting in order as '#1 40/50 (80%), #2 …'. Copy the figures exactly as given; do not round, " +
        "invent or omit meetings. If a section has no records, write 'no records'."
      : "Anda penganalisis data kokurikulum sekolah Malaysia. Tulis dalam Bahasa Melayu rasmi untuk " +
        "pentadbir sekolah, teks biasa TANPA Markdown (tiada #, * atau huruf tebal). Ikut susunan ini tepat:\n" +
        "1) Satu perenggan ringkas (2–3 ayat) mentafsir data: tren penting dan satu cadangan tindakan.\n" +
        "2) Satu baris menyatakan bilangan pelajar gred A, cth. 'Gred A: 45 daripada 300 pelajar (15%).'\n" +
        "3) Baris tajuk 'Kehadiran setiap perjumpaan:' diikuti satu baris setiap satu untuk KP, SP dan BU, " +
        "menyenaraikan setiap perjumpaan mengikut turutan sebagai '#1 40/50 (80%), #2 …'. Salin angka " +
        "tepat seperti diberi; jangan bundarkan, reka atau tinggalkan mana-mana perjumpaan. Jika bahagian " +
        "tiada rekod, tulis 'tiada rekod'.";

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
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
