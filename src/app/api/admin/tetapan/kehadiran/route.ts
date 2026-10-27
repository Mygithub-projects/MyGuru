// Tetapan jumlah aktiviti kokurikulum penuh bagi setiap bahagian — Admin SAHAJA.
// Selepas disimpan, markah semua pelajar dikira semula di latar belakang.
import { after, type NextRequest } from "next/server";
import { z } from "zod";
import { requireRole, ok, fail } from "@/lib/api";
import { jumlahAktiviti, jumlahKeseluruhan, simpanJumlahAktiviti } from "@/lib/tetapan-kehadiran";
import { kiraSemulaSemuaPelajar } from "@/lib/kehadiran";
import { kohortDipilih } from "@/lib/kohort-pilihan";

const bil = z.number().int("Mesti nombor bulat").min(2, "Minimum 2 aktiviti").max(200, "Maksimum 200 aktiviti");
const schema = z.object({ Kelab: bil, Sukan: bil, Uniform: bil });

export async function GET() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  return ok(await jumlahAktiviti(await kohortDipilih()));
}

export async function PUT(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  // Tetapan berasingan setiap kohort (kohort dipilih di header); hanya pelajar kohort itu dikira semula.
  const kohort = await kohortDipilih();
  await simpanJumlahAktiviti(parsed.data, kohort);
  after(async () => {
    try {
      await kiraSemulaSemuaPelajar(kohort);
    } catch (e) {
      console.error("[tetapan kehadiran] kira semula gagal:", e);
    }
  });
  return ok(
    { ...parsed.data, jumlah: jumlahKeseluruhan(parsed.data) },
    `Jumlah aktiviti${kohort ? ` ${kohort}` : ""} disimpan. Markah pelajar sedang dikira semula.`,
  );
}
