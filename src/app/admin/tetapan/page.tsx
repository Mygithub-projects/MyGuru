import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TetapanClient } from "./TetapanClient";

export default async function TetapanPage() {
  const items = await prisma.tetapanMarkah.findMany({
    orderBy: [{ kategori: "asc" }, { nilaiMarkah: "desc" }],
  });
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Tetapan Formula Markah</h1>
        <p className="text-sm text-slate-500">
          Konfigur nilai markah jawatan & peringkat supaya selaras pekeliling PAJSK semasa.
        </p>
      </div>
      <TetapanClient
        items={items.map((i) => ({ id: i.id, kategori: i.kategori, namaItem: i.namaItem, nilaiMarkah: i.nilaiMarkah }))}
      />
    </div>
  );
}
