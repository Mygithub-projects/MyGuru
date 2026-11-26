// Rekod Disahkan — senarai pengesahan yang boleh DIBATALKAN oleh pengguna semasa.
// Dikongsi oleh /guru/rekod-disahkan dan /admin/rekod-disahkan.
import Link from "next/link";
import { getT } from "@/lib/locale";
import { kohortDipilih } from "@/lib/kohort-pilihan";
import { JENIS_BATAL, LABEL_JENIS, pelakuPenuh, senaraiBolehBatal, type JenisBatal, type Pelaku } from "@/lib/batal-pengesahan";
import { RekodDisahkan } from "./RekodDisahkan";

export async function RekodDisahkanPage({ pelaku, jenis: jenisParam, basePath }: {
  pelaku: Pelaku;
  jenis?: string;
  basePath: string;
}) {
  const { locale } = await getT();
  const en = locale === "en";
  const jenis: JenisBatal = (JENIS_BATAL as readonly string[]).includes(jenisParam ?? "") ? (jenisParam as JenisBatal) : "butiran";
  const [rows, kohort] = await Promise.all([senaraiBolehBatal(pelaku, jenis), kohortDipilih()]);
  const penuh = pelakuPenuh(pelaku);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{en ? "Verified Records" : "Rekod Disahkan"}</h1>
        <p className="text-sm text-slate-500">
          {en
            ? "Cancel a verification to return the record to \"Pending\". The student's marks are recalculated and they are notified."
            : "Batalkan pengesahan untuk kembalikan rekod kepada \"Menunggu\". Markah pelajar dikira semula dan pelajar dimaklumkan."}
          {kohort ? ` · ${kohort}` : ""}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {penuh
            ? en ? "You can cancel every verification (Head of Co-curriculum / Admin)." : "Anda boleh membatalkan semua pengesahan (Ketua Unit Kokurikulum / Admin)."
            : en ? "Only records you verified are listed." : "Hanya rekod yang anda sahkan disenaraikan."}
        </p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {JENIS_BATAL.map((j) => (
          <Link key={j} href={`${basePath}?jenis=${j}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${j === jenis ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {LABEL_JENIS[j][en ? "en" : "ms"]}
          </Link>
        ))}
      </nav>
      <RekodDisahkan rows={rows} en={en} />
    </div>
  );
}
