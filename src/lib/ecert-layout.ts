// ===========================================================================
//  Susun atur e-Cert — A4 potret (595x842) di atas templat public/templat-ecert.jpg.
//  Dikongsi oleh lukisECert (src/lib/pdf.ts) dan SijilPreview supaya pratonton
//  sepadan tepat dengan PDF. Semua kedudukan y diukur dari ATAS halaman
//  (sama seperti SVG); PDF menukarnya kepada `h - y`.
//  Logo kolej sudah ada dalam templat — tidak dilukis semula.
// ===========================================================================
export const ECERT = {
  w: 595,
  h: 842,
  latar: "/templat-ecert.jpg",
  /** Lebar maksimum teks berpusat — kekal dalam ruang putih templat. */
  lebarTeks: 400,
  warna: {
    merah: [0.62, 0.07, 0.09],
    emas: [0.6, 0.45, 0.13],
    gelap: [0.06, 0.09, 0.16],
    kelabu: [0.4, 0.45, 0.5],
  },
  y: {
    institusi: 205,
    tajuk: 240,
    subtajuk: 258,
    garis: 272,
    disahkan: 310,
    nama: 343,
    identiti: 362,
    ayat: 400,
    aktiviti: 428,
    peringkat: 450,
    ttdBawah: 546, // tepi bawah imej tandatangan
    garisTtd: 552,
    namaTtd: 566,
    jawatan: 578,
    cop: 589,
    tarikh: 614,
    nota: 627,
  },
  /** Kotak maksimum imej tandatangan pengesah (dipusatkan atas garisan). */
  ttd: { maksW: 170, maksH: 55 },
  garisTtdLebar: 180,
} as const;

export const ECERT_NOTA = "Sahkan keaslian sijil ini melalui No. Siri di portal KoKurikulum.";
