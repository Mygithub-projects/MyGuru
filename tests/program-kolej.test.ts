import { describe, expect, it } from "vitest";
import { penglibatanUnit } from "../src/lib/skor-unit";
import { MARKAH_PERINGKAT_PROGRAM, PERINGKAT_PROGRAM } from "../src/lib/projek-jawatan";
import { markahPenglibatan } from "../src/lib/pajsk";

describe("penglibatanUnit (Program Kolej)", () => {
  it("ambil peringkat program jika lebih tinggi daripada unit", () => {
    expect(penglibatanUnit({ peringkatT6: "Sekolah", jenisKoko: "Kelab" }, [{ nama: "Hari Sukan", peringkat: "Negeri" }]))
      .toEqual({ peringkat: "Negeri (Hari Sukan)", markah: 8 });
  });
  it("kekal peringkat unit jika lebih tinggi", () => {
    expect(penglibatanUnit({ peringkatT6: "Kebangsaan", jenisKoko: "Sukan" }, [{ nama: "X", peringkat: "Sekolah" }]).markah).toBe(10);
  });
  it("unit Perkhidmatan tidak terjejas", () => {
    expect(penglibatanUnit({ peringkatT6: null, jenisKoko: "Perkhidmatan" }, [{ nama: "X", peringkat: "Negeri" }]).markah).toBe(0);
  });
  it("jadual markah UI sepadan dengan markahPenglibatan()", () => {
    for (const p of PERINGKAT_PROGRAM) expect(MARKAH_PERINGKAT_PROGRAM[p]).toBe(markahPenglibatan(p));
  });
});
