// Smoke check ringkas enjin PAJSK (model baharu §1). Untuk suite penuh: `npm test`.
import {
  markahKehadiran,
  markahJawatan,
  markahPenglibatan,
  markahPencapaian,
  markahProjekJawatan,
  markahProjekPeringkat,
  markahEkstra,
  gred,
  kiraSkor,
} from "../src/lib/pajsk";

let fail = 0;
function check(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
}

// §1.2 Kehadiran (skala 50, bundar ke bawah)
check("kehadiran 23/30 → 38.33", markahKehadiran(23, 30), 38.33);
check("kehadiran 30/30 → 50", markahKehadiran(30), 50);
check("kehadiran 15/30 → 25", markahKehadiran(15), 25);
check("kehadiran hadir>30 dihadkan → 50", markahKehadiran(40, 30), 50);

// §1.3 Jawatan (dua jadual)
check("jawatan Kelab/Sukan Setiausaha → 7", markahJawatan("Setiausaha", "KelabSukan"), 7);
check("jawatan Uniform Sarjan Mejar → 8", markahJawatan("Sarjan Mejar", "Uniform"), 8);
check("jawatan tak dikenali → 0", markahJawatan("Entah", "KelabSukan"), 0);

// §1.4–§1.7
check("penglibatan Negeri → 8", markahPenglibatan("Negeri"), 8);
check("pencapaian Kebangsaan Johan → 10", markahPencapaian("Kebangsaan", "Johan"), 10);
check("pencapaian tanpa kedudukan → 0", markahPencapaian("Negeri", null), 0);
check("projek jawatan Pengerusi → 10", markahProjekJawatan("Pengerusi Projek"), 10);
check("projek peringkat Daerah → 8", markahProjekPeringkat("Daerah"), 8);

// §1.8 Ekstra (MAX)
check("ekstra MAX(Pengawas, ARP Emas) → 10", markahEkstra(["Pengawas", "ARP Emas"]), 10);

// §1.9 Gred + kiraSkor
check("gred 59.9 → C", gred(59.9), "C");
const s = kiraSkor({
  markahKehadiran: 38.33,
  markahJawatan: 7,
  markahPenglibatan: 8,
  markahPencapaian: 6,
  markahEkstra: 5,
});
check("kiraSkor jumlahTeras → 59.33", s.jumlahTeras, 59.33);
check("kiraSkor gred → C", s.gred, "C");
check("kiraSkor jumlahDenganBonus → 64.33", s.jumlahDenganBonus, 64.33);

console.log(fail === 0 ? "\nSEMUA PASS ✅" : `\n${fail} GAGAL ❌`);
process.exit(fail === 0 ? 0 : 1);
