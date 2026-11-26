import { describe, expect, it, vi } from "vitest";
vi.mock("../src/lib/prisma", () => ({ prisma: {} }));
vi.mock("../src/lib/prisma-kohort", () => ({ dbKohort: async () => ({}) }));
vi.mock("../src/lib/kohort-pilihan", () => ({ kohortDipilih: async () => null }));
vi.mock("../src/lib/workflow", () => ({ kiraSemulaT6: async () => undefined }));
vi.mock("../src/lib/notifikasi", () => ({ notify: async () => null, notifyPelajar: async () => null }));
import { bolehBatal, pelakuPenuh } from "../src/lib/batal-pengesahan";

const guru = (id: string, jawatanKoko = "GuruPenasihat") => ({ guru: { id, jawatanKoko }, userId: `U-${id}` });
const admin = { guru: null, userId: "U-admin" };

describe("Batal pengesahan — siapa dibenarkan", () => {
  it("Admin & Ketua Unit Kokurikulum boleh batal semua, termasuk rekod tanpa pengesah", () => {
    expect(pelakuPenuh(admin)).toBe(true);
    expect(bolehBatal(admin, { guruId: "G9" })).toBe(true);
    expect(bolehBatal(guru("K", "KetuaUnitKoko"), { guruId: null })).toBe(true);
  });
  it("guru yang mengesahkan boleh batal (guruId atau userId)", () => {
    expect(bolehBatal(guru("G1"), { guruId: "G1" })).toBe(true);
    expect(bolehBatal(guru("G1"), { userId: "U-G1" })).toBe(true);
  });
  it("guru lain — termasuk Ketua GP & Penyelaras — tidak boleh", () => {
    expect(bolehBatal(guru("G2"), { guruId: "G1" })).toBe(false);
    expect(bolehBatal(guru("G2", "KetuaGP"), { guruId: "G1" })).toBe(false);
    expect(bolehBatal(guru("G2", "Penyelaras"), { userId: "U-G1" })).toBe(false);
    expect(bolehBatal(guru("G2"), { guruId: null })).toBe(false);
  });
});
