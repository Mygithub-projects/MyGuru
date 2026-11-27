import type { NextRequest } from "next/server";
import { kemaskiniKomenLaporan } from "@/lib/laporan-komen";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return kemaskiniKomenLaporan(request, "projek", id);
}
