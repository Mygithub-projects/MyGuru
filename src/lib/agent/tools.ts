// src/lib/agent/tools.ts
// Tools dibahagi kepada READ (autonomi penuh) dan PROPOSE (cadang sahaja → kelulusan manusia).
// Setiap pelaksana membungkus fungsi sedia ada e-KokoT6 (pelajar.ts, guru.ts, insights.ts, dll).

import type { ToolDef, ToolResult, AgentContext } from "./types";
import { wrapProposeResult } from "./guardrails";

// ---- Modul sebenar e-KokoT6 ----
import { prisma } from "@/lib/prisma";
import { getPelajarProfil } from "@/lib/pelajar";
import { getGuruDashboard, countPendingGuru } from "@/lib/guru";
import { getInsights } from "@/lib/insights";
import {
  analitikKehadiran,
  analitikProjek,
  analitikLaporan,
  analitikDemografi,
} from "@/lib/analitik";

// =====================================================================
//  TOOLS READ-ONLY — agent guna bebas, tiada kesan sampingan
// =====================================================================

const getStudentMarks: ToolDef = {
  name: "getStudentMarks",
  description:
    "Dapatkan ringkasan markah PAJSK T6 semasa untuk seorang pelajar (kehadiran, jawatan, " +
    "penglibatan, pencapaian, projek, ekstra, jumlah, peratus & gred). Untuk peranan pelajar, " +
    "pelajarId diabaikan dan diri sendiri digunakan.",
  input_schema: {
    type: "object",
    properties: {
      pelajarId: { type: "string", description: "ID pelajar (guru/admin sahaja)." },
    },
  },
  risk: "read",
  allowedRoles: ["Pelajar", "Guru", "Admin"],
  async execute(input: { pelajarId?: string }, ctx: AgentContext): Promise<ToolResult> {
    const id = ctx.peranan === "Pelajar" ? ctx.scope.pelajarId : input.pelajarId;
    if (!id) return { ok: false, summary: "Tiada pelajarId diberi." };
    const profil = await getPelajarProfil(id);
    if (!profil) return { ok: false, summary: `Pelajar ${id} tidak dijumpai.` };
    const p = profil.pelajar;
    return {
      ok: true,
      summary:
        `Markah PAJSK T6 ${p.nama}: ${p.markahPajskT6 ?? 0}/100 markah ` +
        `(${p.peratusPajskT6 ?? 0}%, gred ${p.gredPajskT6 ?? "-"}).`,
      data: {
        nama: p.nama,
        markahT6: p.markahPajskT6,
        peratusT6: p.peratusPajskT6,
        gredT6: p.gredPajskT6,
        markah: profil.markah,
      },
    };
  },
};

const getAttendanceStats: ToolDef = {
  name: "getAttendanceStats",
  description: "Statistik kehadiran mengikut unit (peratus, jumlah rekod, hadir).",
  input_schema: {
    type: "object",
    properties: { unitId: { type: "string", description: "Nama unit kokurikulum." } },
    required: ["unitId"],
  },
  risk: "read",
  allowedRoles: ["Guru", "Admin"],
  async execute(input: { unitId: string }): Promise<ToolResult> {
    const semua = await analitikKehadiran([input.unitId]);
    const unit = semua.find((u) => u.namaUnit === input.unitId) ?? semua[0] ?? null;
    return {
      ok: true,
      summary: unit
        ? `Kehadiran ${unit.namaUnit}: ${unit.peratus}% (${unit.hadir}/${unit.jumlahRekod} rekod).`
        : `Tiada data kehadiran untuk unit ${input.unitId}.`,
      data: unit,
    };
  },
};

const getPendingItems: ToolDef = {
  name: "getPendingItems",
  description:
    "Senarai item menunggu semakan dalam skop guru/admin (pertukaran unit, " +
    "pencapaian, aktiviti luar, laporan, kehadiran, cadangan jawatan).",
  input_schema: { type: "object", properties: {} },
  risk: "read",
  allowedRoles: ["Guru", "Admin"],
  async execute(_input: unknown, ctx: AgentContext): Promise<ToolResult> {
    // Guru dengan rekod Guru: gunakan dashboard berskop.
    if (ctx.scope.guruId) {
      const guru = await prisma.guru.findUnique({ where: { id: ctx.scope.guruId } });
      if (guru) {
        const dash = await getGuruDashboard(guru);
        const counts = {
          pencapaian: dash.pencapaian.length,
          aktivitiLuar: dash.aktivitiLuar.length,
          pertukaran: dash.pertukaran.length,
          laporanMingguan: dash.laporanMingguan.length,
          laporanProjek: dash.laporanProjek.length,
          sesiKehadiran: dash.sesiKehadiran.length,
          cadanganJawatan: dash.cadanganJawatan.length,
        };
        const jumlah = Object.values(counts).reduce((a, b) => a + b, 0);
        return {
          ok: true,
          summary: `${jumlah} item menunggu semakan dalam skop anda.`,
          data: { counts, skopSeluruh: dash.skopSeluruh },
        };
      }
    }
    // Admin (atau guru tanpa rekod): kiraan seluruh sekolah.
    const jumlah = await countPendingGuru(null);
    return {
      ok: true,
      summary: `${jumlah} item menunggu semakan (seluruh sekolah).`,
      data: { jumlah },
    };
  },
};

const getAnalytics: ToolDef = {
  name: "getAnalytics",
  description:
    "Analitik agregat: kehadiran ikut unit, status projek, pematuhan laporan, demografi. " +
    "Guru = skop unit; Admin = skop penuh.",
  input_schema: {
    type: "object",
    properties: {
      jenis: {
        type: "string",
        enum: ["kehadiran", "projek", "laporan", "demografi"],
      },
    },
    required: ["jenis"],
  },
  risk: "read",
  allowedRoles: ["Guru", "Admin"],
  async execute(input: { jenis: string }, ctx: AgentContext): Promise<ToolResult> {
    const units = ctx.scope.isAdmin ? undefined : ctx.scope.unitIds;

    // Kehadiran: ditapis ikut unit seliaan (selamat untuk guru).
    if (input.jenis === "kehadiran") {
      const data = await analitikKehadiran(units);
      return { ok: true, summary: `Analitik kehadiran (${data.length} unit).`, data };
    }

    // Analitik seluruh sekolah (projek/laporan/demografi) tidak menerima penapis
    // unit. Untuk guru berskop-unit, kembali kepada cerapan berskop demi privasi.
    if (!ctx.scope.isAdmin) {
      const { kpi, cerapan } = await getInsights(units);
      return {
        ok: true,
        summary: `Analitik berskop '${input.jenis}': ${kpi.length} KPI, ${cerapan.length} cerapan.`,
        data: { kpi, cerapan },
      };
    }

    switch (input.jenis) {
      case "projek": {
        const data = await analitikProjek();
        return { ok: true, summary: "Analitik projek/program disediakan.", data };
      }
      case "laporan": {
        const data = await analitikLaporan();
        return { ok: true, summary: "Analitik laporan disediakan.", data };
      }
      case "demografi": {
        const data = await analitikDemografi();
        return { ok: true, summary: "Analitik demografi (agregat) disediakan.", data };
      }
      default: {
        const { kpi, cerapan } = await getInsights(units);
        return {
          ok: true,
          summary: `Analitik '${input.jenis}': ${kpi.length} KPI, ${cerapan.length} cerapan.`,
          data: { kpi, cerapan },
        };
      }
    }
  },
};

const explainPajskFormula: ToolDef = {
  name: "explainPajskFormula",
  description:
    "Terangkan formula PAJSK (§1) dalam bahasa mudah: Kehadiran 50 + Jawatan 10 + " +
    "Penglibatan 10 + Pencapaian 10 + Projek Jawatan 10 + Projek Peringkat 10 = 100, " +
    "campur Ekstra Kurikulum 10 (bonus). Gred A–E.",
  input_schema: { type: "object", properties: {} },
  risk: "read",
  allowedRoles: ["Pelajar", "Guru", "Admin"],
  async execute(): Promise<ToolResult> {
    return {
      ok: true,
      summary:
        "Formula PAJSK (100 markah teras): Kehadiran (50, = FLOOR(hadir/30×100)×0.5, bundar " +
        "ke bawah) + Jawatan (10) + Penglibatan (10) + Pencapaian (10) + Projek Jawatan (10) " +
        "+ Projek Peringkat (10). Ekstra Kurikulum (10) ialah bonus berasingan. Gred: " +
        "A 80–100, B 60–79.9, C 40–59.9, D 20–39.9, E ≤19.9.",
    };
  },
};

// =====================================================================
//  TOOLS PROPOSE — agent CADANG sahaja; manusia luluskan.
//  Pelaksana mencipta rekod CadanganAgent berstatus "Pending",
//  TIDAK menulis terus ke markah/sijil/rekod rasmi.
// =====================================================================

const proposeUnitTransferApproval: ToolDef = {
  name: "proposeUnitTransferApproval",
  description:
    "Cadangkan kelulusan/penolakan satu permohonan pertukaran unit. Hanya mencipta " +
    "cadangan — guru/admin mesti sahkan dalam UI sebelum apa-apa perubahan berlaku.",
  input_schema: {
    type: "object",
    properties: {
      permohonanId: { type: "string" },
      keputusan: { type: "string", enum: ["LULUS", "TOLAK"] },
      justifikasi: { type: "string", description: "Sebab cadangan, untuk semakan guru." },
    },
    required: ["permohonanId", "keputusan", "justifikasi"],
  },
  risk: "propose",
  allowedRoles: ["Guru", "Admin"],
  async execute(
    input: { permohonanId: string; keputusan: string; justifikasi: string },
    ctx: AgentContext
  ): Promise<ToolResult> {
    const cad = await prisma.cadanganAgent.create({
      data: {
        jenis: "UNIT_TRANSFER",
        rujukanId: input.permohonanId,
        keputusan: input.keputusan,
        justifikasi: input.justifikasi,
        dicadangOleh: "AGENT",
        untukSemakan: ctx.userId,
        status: "Pending",
      },
    });
    return wrapProposeResult(
      "proposeUnitTransferApproval",
      cad.id,
      `${input.keputusan} bagi permohonan ${input.permohonanId} — ${input.justifikasi}`
    );
  },
};

const proposeAchievementVerification: ToolDef = {
  name: "proposeAchievementVerification",
  description:
    "Cadangkan pengesahan/kuiri satu pencapaian atau aktiviti luar pelajar berdasarkan " +
    "eviden. Cadangan sahaja — guru sahkan sebelum markah berubah / e-Cert diaktifkan.",
  input_schema: {
    type: "object",
    properties: {
      itemId: { type: "string" },
      tindakan: { type: "string", enum: ["SAHKAN", "KUIRI"] },
      justifikasi: { type: "string" },
    },
    required: ["itemId", "tindakan", "justifikasi"],
  },
  risk: "propose",
  allowedRoles: ["Guru", "Admin"],
  async execute(
    input: { itemId: string; tindakan: string; justifikasi: string },
    ctx: AgentContext
  ): Promise<ToolResult> {
    const cad = await prisma.cadanganAgent.create({
      data: {
        jenis: "ACHIEVEMENT",
        rujukanId: input.itemId,
        keputusan: input.tindakan,
        justifikasi: input.justifikasi,
        dicadangOleh: "AGENT",
        untukSemakan: ctx.userId,
        status: "Pending",
      },
    });
    return wrapProposeResult(
      "proposeAchievementVerification",
      cad.id,
      `${input.tindakan} item ${input.itemId} — ${input.justifikasi}`
    );
  },
};

const recalculateMarks: ToolDef = {
  name: "recalculateMarks",
  description:
    "Cadangkan pengiraan semula markah PAJSK T6 selepas perubahan data. Mencipta cadangan " +
    "sahaja — markah hanya dikira & disimpan rasmi selepas guru/admin meluluskan cadangan.",
  input_schema: {
    type: "object",
    properties: { pelajarId: { type: "string" } },
    required: ["pelajarId"],
  },
  risk: "propose",
  allowedRoles: ["Guru", "Admin"],
  async execute(input: { pelajarId: string }, ctx: AgentContext): Promise<ToolResult> {
    const cad = await prisma.cadanganAgent.create({
      data: {
        jenis: "RECALC",
        rujukanId: input.pelajarId,
        justifikasi: "Cadangan kira semula markah PAJSK T6 selepas perubahan data.",
        dicadangOleh: "AGENT",
        untukSemakan: ctx.userId,
        status: "Pending",
      },
    });
    return wrapProposeResult(
      "recalculateMarks",
      cad.id,
      `Pengiraan semula untuk pelajar ${input.pelajarId} (menunggu kelulusan).`
    );
  },
};

const generateECert: ToolDef = {
  name: "generateECert",
  description:
    "Cadangkan penjanaan e-Cert untuk pelajar. e-Cert hanya boleh dijana selepas item " +
    "berstatus Approved — cadangan ini menunggu sahkan akhir admin/guru.",
  input_schema: {
    type: "object",
    properties: { pelajarId: { type: "string" }, aktivitiId: { type: "string" } },
    required: ["pelajarId", "aktivitiId"],
  },
  risk: "propose",
  allowedRoles: ["Guru", "Admin"],
  async execute(
    input: { pelajarId: string; aktivitiId: string },
    ctx: AgentContext
  ): Promise<ToolResult> {
    const cad = await prisma.cadanganAgent.create({
      data: {
        jenis: "ECERT",
        rujukanId: input.aktivitiId,
        justifikasi: `Jana e-Cert untuk pelajar ${input.pelajarId}, aktiviti ${input.aktivitiId}.`,
        dicadangOleh: "AGENT",
        untukSemakan: ctx.userId,
        status: "Pending",
      },
    });
    return wrapProposeResult(
      "generateECert",
      cad.id,
      `e-Cert untuk pelajar ${input.pelajarId}, aktiviti ${input.aktivitiId}.`
    );
  },
};

// =====================================================================
//  Pendaftaran
// =====================================================================

export const ALL_TOOLS: ToolDef[] = [
  getStudentMarks,
  getAttendanceStats,
  getPendingItems,
  getAnalytics,
  explainPajskFormula,
  proposeUnitTransferApproval,
  proposeAchievementVerification,
  recalculateMarks,
  generateECert,
];

/** Tools yang dibenarkan untuk konteks pengguna tertentu (lapisan kedua RBAC). */
export function toolsForContext(ctx: AgentContext): ToolDef[] {
  return ALL_TOOLS.filter((t) => t.allowedRoles.includes(ctx.peranan));
}

export function findTool(name: string): ToolDef | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}
