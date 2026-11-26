// Rekod Disahkan — senarai pengesahan yang boleh DIBATALKAN oleh pengguna semasa.
// Dikongsi oleh /guru/rekod-disahkan dan /admin/rekod-disahkan.
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
  const pilihan = JENIS_BATAL.map((j) => ({ value: j, label: LABEL_JENIS[j][en ? "en" : "ms"] }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{en ? "Verified Records" : "Rekod Disahkan"}</h1>
        <p className="text-xs text-slate-500">
          {en
            ? "Cancel a verification to return it to \"Pending\"; marks are recalculated and the student is notified."
            : "Batal pengesahan untuk kembalikan rekod kepada \"Menunggu\"; markah dikira semula dan pelajar dimaklumkan."}
          {" "}
          {penuh
            ? en ? "You can cancel all verifications." : "Anda boleh membatalkan semua pengesahan."
            : en ? "Only records you verified are listed." : "Hanya rekod yang anda sahkan disenaraikan."}
          {kohort ? ` · ${kohort}` : ""}
        </p>
      </div>
      <RekodDisahkan key={jenis} rows={rows} en={en} jenis={jenis} pilihan={pilihan} basePath={basePath} />
    </div>
  );
}
