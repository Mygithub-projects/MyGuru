import type { NextRequest } from "next/server";
import { requireSession, fail } from "@/lib/api";
import { bacaOprDariForm, janaOprPDF } from "@/lib/opr";
import { bacaPeserta, tagProjekPelajar } from "@/lib/projek";
import { JAWATAN_PERANAN } from "@/lib/projek-jawatan";

// POST: pratonton OPR (tidak disimpan). Pelajar semak PDF ini sebelum klik
// "Hantar untuk pengesahan" — penghantaran sebenar menjana semula OPR yang sama
// di /api/laporan/mingguan atau /api/laporan/projek.
// Mingguan: SU/NSU unit. Projek: pelajar yang di-tag SU/NSU bagi projek itu.
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  if (session.role !== "Pelajar" || !session.pelajarId) return fail("Hanya pelajar boleh menjana OPR", 403);

  const form = await request.formData();
  const pelajar = { id: session.pelajarId, subRole: session.subRole };

  let r: Awaited<ReturnType<typeof bacaOprDariForm>>;
  if (form.get("jenis") === "projek") {
    const tag = await tagProjekPelajar(session.pelajarId, String(form.get("projekId") ?? ""));
    if (!tag) return fail("Anda belum di-tag sebagai SU/NSU bagi projek ini", 403);
    form.set("jawatanProjek", JAWATAN_PERANAN[tag.peranan]);
    const p = await bacaPeserta(form, session.pelajarId, tag.projek);
    if ("ralat" in p) return fail(p.ralat, 422);
    r = await bacaOprDariForm(form, "Projek", pelajar, { nama: tag.projek.nama, peranan: tag.peranan, peserta: p.peserta });
  } else {
    if (!(session.subRole === "SU" || session.subRole === "NSU")) return fail("Hanya SU/NSU boleh menjana OPR mingguan", 403);
    r = await bacaOprDariForm(form, "Mingguan", pelajar);
  }
  if ("ralat" in r) return fail(r.ralat, 422);

  const pdf = await janaOprPDF(r.data);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="OPR-pratonton.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
