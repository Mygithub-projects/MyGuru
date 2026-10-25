// Pratonton e-Cert — susun atur dari src/lib/ecert-layout.ts, sama dengan lukisECert
// (src/lib/pdf.ts) — A4 potret 595x842 atas templat; y diukur dari atas.
import { ECERT, ECERT_NOTA } from "@/lib/ecert-layout";

const warna = (c: readonly number[]) => `rgb(${c.map((v) => Math.round(v * 255)).join(",")})`;
const MERAH = warna(ECERT.warna.merah);
const EMAS = warna(ECERT.warna.emas);
const GELAP = warna(ECERT.warna.gelap);
const KELABU = warna(ECERT.warna.kelabu);
const FONT = "Helvetica, Arial, sans-serif";
const { w: W, y: Y, lebarTeks } = ECERT;

export interface SijilPreviewProps {
  institusi: string;
  tajukSijil: string;
  namaPenandatangan: string;
  jawatanPenandatangan: string;
  teksCop: string;
  tandatangan?: string | null;
  nama: string;
  barisIdentiti: string;
  ayat: string;
  namaAktiviti: string;
  barisPeringkat: string;
  tarikh: string;
  noSiri: string;
}

/** Teks berpusat; dimampatkan jika anggaran lebar melebihi lebarTeks (PDF mengecilkan saiz fon). */
function Teks({ y, size, bold, fill, children }: { y: number; size: number; bold?: boolean; fill: string; children: string }) {
  const anggaran = children.length * size * (bold ? 0.62 : 0.52);
  return (
    <text x={W / 2} y={y} textAnchor="middle" fontSize={size} fontWeight={bold ? 700 : 400} fill={fill}
      {...(anggaran > lebarTeks ? { textLength: lebarTeks, lengthAdjust: "spacingAndGlyphs" } : {})}>
      {children}
    </text>
  );
}

export function SijilPreview(p: SijilPreviewProps) {
  const garis = ECERT.garisTtdLebar / 2;
  return (
    <svg viewBox={`0 0 ${W} ${ECERT.h}`} className="w-full rounded-lg ring-1 ring-slate-200" style={{ fontFamily: FONT }}>
      <rect x={0} y={0} width={W} height={ECERT.h} fill="white" />
      <image href={ECERT.latar} x={0} y={0} width={W} height={ECERT.h} preserveAspectRatio="none" />

      <Teks y={Y.institusi} size={13} bold fill={MERAH}>{(p.institusi || "").toUpperCase()}</Teks>
      <Teks y={Y.tajuk} size={22} bold fill={GELAP}>{p.tajukSijil}</Teks>
      <Teks y={Y.subtajuk} size={10} fill={KELABU}>e-Cert · Sistem KoKurikulum</Teks>
      <line x1={W / 2 - 60} y1={Y.garis} x2={W / 2 + 60} y2={Y.garis} stroke={EMAS} strokeWidth={1} />

      <Teks y={Y.disahkan} size={12} fill={KELABU}>Dengan ini disahkan bahawa</Teks>
      <Teks y={Y.nama} size={22} bold fill={GELAP}>{p.nama}</Teks>
      <Teks y={Y.identiti} size={11} fill={KELABU}>{p.barisIdentiti}</Teks>

      <Teks y={Y.ayat} size={12} fill={KELABU}>{p.ayat}</Teks>
      <Teks y={Y.aktiviti} size={17} bold fill={MERAH}>{p.namaAktiviti}</Teks>
      <Teks y={Y.peringkat} size={12} fill={GELAP}>{p.barisPeringkat}</Teks>

      {p.tandatangan && (
        <image href={p.tandatangan} x={W / 2 - ECERT.ttd.maksW / 2} y={Y.ttdBawah - ECERT.ttd.maksH}
          width={ECERT.ttd.maksW} height={ECERT.ttd.maksH} preserveAspectRatio="xMidYMax meet" />
      )}
      <line x1={W / 2 - garis} y1={Y.garisTtd} x2={W / 2 + garis} y2={Y.garisTtd} stroke={KELABU} strokeWidth={0.8} />
      {p.namaPenandatangan && <Teks y={Y.namaTtd} size={10} bold fill={GELAP}>{p.namaPenandatangan}</Teks>}
      <Teks y={Y.jawatan} size={9} fill={KELABU}>{p.jawatanPenandatangan}</Teks>
      {p.teksCop && <Teks y={Y.cop} size={8} fill={KELABU}>{p.teksCop}</Teks>}

      <Teks y={Y.tarikh} size={9} fill={GELAP}>{`${p.tarikh}   ·   ${p.noSiri}`}</Teks>
      <Teks y={Y.nota} size={7} fill={KELABU}>{ECERT_NOTA}</Teks>
    </svg>
  );
}
