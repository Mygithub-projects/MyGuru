// Pratonton e-Cert — susun atur, saiz fon & warna sepadan tepat dengan lukisECert
// (src/lib/pdf.ts) — A4 landskap 842x595. Kedudukan y SVG = 595 - y_pdf.
const BRAND = "rgb(13,110,94)";
const DARK = "rgb(15,23,41)";
const GREY = "rgb(102,115,128)";
const FONT = "Helvetica, Arial, sans-serif";

export interface SijilPreviewProps {
  institusi: string;
  tajukSijil: string;
  namaPenandatangan: string;
  jawatanPenandatangan: string;
  teksCop: string;
  nama: string;
  barisIdentiti: string;
  ayat: string;
  namaAktiviti: string;
  barisPeringkat: string;
  tarikh: string;
  noSiri: string;
}

export function SijilPreview(p: SijilPreviewProps) {
  return (
    <svg viewBox="0 0 842 595" className="w-full rounded-lg" style={{ fontFamily: FONT }}>
      <rect x={0} y={0} width={842} height={595} fill="white" />
      <rect x={20} y={20} width={802} height={555} fill="none" stroke={BRAND} strokeWidth={3} />
      <rect x={28} y={28} width={786} height={539} fill="none" stroke={BRAND} strokeWidth={1} />

      <image href="/logo-kpm.jpeg" x={386} y={50} width={70} height={70} />

      <text x={421} y={145} textAnchor="middle" fontSize={16} fontWeight={700} fill={BRAND}>
        {(p.institusi || "").toUpperCase()}
      </text>
      <text x={421} y={175} textAnchor="middle" fontSize={22} fontWeight={700} fill={DARK}>
        {p.tajukSijil}
      </text>
      <text x={421} y={195} textAnchor="middle" fontSize={11} fill={GREY}>
        e-Cert · Sistem KoKurikulum
      </text>

      <text x={421} y={240} textAnchor="middle" fontSize={13} fill={GREY}>
        Dengan ini disahkan bahawa
      </text>
      <text x={421} y={275} textAnchor="middle" fontSize={26} fontWeight={700} fill={DARK}>
        {p.nama}
      </text>
      <text x={421} y={298} textAnchor="middle" fontSize={12} fill={GREY}>
        {p.barisIdentiti}
      </text>

      <text x={421} y={335} textAnchor="middle" fontSize={13} fill={GREY}>
        {p.ayat}
      </text>
      <text x={421} y={365} textAnchor="middle" fontSize={18} fontWeight={700} fill={BRAND}>
        {p.namaAktiviti}
      </text>
      <text x={421} y={388} textAnchor="middle" fontSize={13} fill={DARK}>
        {p.barisPeringkat}
      </text>

      <text x={80} y={505} fontSize={11} fill={DARK}>{p.tarikh}</text>
      <text x={80} y={523} fontSize={10} fill={GREY}>{p.noSiri}</text>

      <line x1={562} y1={485} x2={762} y2={485} stroke={GREY} strokeWidth={1} />
      {p.namaPenandatangan && (
        <text x={567} y={501} fontSize={10} fontWeight={700} fill={DARK}>{p.namaPenandatangan}</text>
      )}
      <text x={567} y={515} fontSize={9} fill={GREY}>{p.jawatanPenandatangan}</text>
      {p.teksCop && <text x={567} y={529} fontSize={8} fill={GREY}>{p.teksCop}</text>}

      <text x={421} y={545} textAnchor="middle" fontSize={8} fill={GREY}>
        Sahkan keaslian sijil ini melalui No. Siri di portal KoKurikulum.
      </text>
    </svg>
  );
}
