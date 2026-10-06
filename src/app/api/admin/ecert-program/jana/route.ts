import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole, fail } from "@/lib/api";
import { janaECertProgramPDF } from "@/lib/pdf";
import { getTetapanSijil } from "@/lib/tetapan-sijil";
import { muridT6IkutNoKp, moeTersedia } from "@/lib/moe-murid";
import { PERINGKAT_PROGRAM, formatNoSiri } from "@/lib/ecert-program";

// Mod TANPA SIMPAN: jana PDF e-Cert program terus (tiada rekod dalam DB).
// Digunakan selagi jadual ProgramECert/PesertaProgram belum dicipta.
// No. Siri = nomborMula, nomborMula+1, ... (ikut susunan nama) — TIDAK disemak
// sama ada pernah digunakan; admin bertanggungjawab memilih nombor mula.
const schema = z.object({
  namaProgram: z.string().trim().min(3).max(150),
  tarikh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah"),
  peringkat: z.enum(PERINGKAT_PROGRAM),
  tempat: z.string().trim().max(150).optional(),
  tahunSiri: z.number().int().min(2020).max(2100),
  nomborMula: z.number().int().min(1).max(99999),
  noKp: z.array(z.string().min(6).max(20)).min(1, "Pilih sekurang-kurangnya seorang pelajar").max(500),
  peranan: z.string().trim().min(2).max(60).default("Peserta"),
  namaPenandatangan: z.string().trim().max(120).optional(),
  jawatanPenandatangan: z.string().trim().max(120).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  if (!moeTersedia()) return fail("Sambungan data murid MOE belum dikonfigurasi (MOE_DATABASE_URL)", 503);

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const d = parsed.data;

  // Butiran pelajar diambil semula dari vw_murid ikut No. KP — bukan dari klien.
  const murid = (await muridT6IkutNoKp([...new Set(d.noKp)])).sort((a, b) => a.nama.localeCompare(b.nama));
  if (murid.length === 0) return fail("Tiada murid T6 sepadan dengan No. KP dipilih", 404);

  const [y, m, h] = d.tarikh.split("-").map(Number);
  const pdf = await janaECertProgramPDF({
    namaProgram: d.namaProgram,
    peringkat: d.peringkat,
    tarikh: `${h}/${m}/${y}`,
    tempat: d.tempat || null,
    peserta: murid.map((x, i) => ({
      nama: x.nama,
      noKp: x.noKp,
      namaSekolah: x.namaSekolah,
      peranan: d.peranan,
      noSiri: formatNoSiri(d.tahunSiri, d.nomborMula + i),
    })),
    ...(await getTetapanSijil()),
    // Penandatangan khusus program mengatasi Templat e-Cert (jika diisi).
    ...(d.namaPenandatangan ? { namaPenandatangan: d.namaPenandatangan } : {}),
    ...(d.jawatanPenandatangan ? { jawatanPenandatangan: d.jawatanPenandatangan } : {}),
  });

  const fail_ = d.namaProgram.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "program";
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="eCert-${fail_}.pdf"`,
    },
  });
}
