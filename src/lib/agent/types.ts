// src/lib/agent/types.ts
// Jenis teras untuk MyGuru AI — lapisan agentik e-KokoT6.

import type { Role, SubRole } from "@/lib/enums";

/**
 * Peranan RBAC sistem e-KokoT6: "Pelajar" | "Guru" | "Admin".
 * Alias kepada `Role` supaya kod agent kekal selari dengan terminologi sistem.
 */
export type Peranan = Role;

/** Konteks pengguna yang log masuk — diterbit dari sesi (JWT), BUKAN dari input model. */
export interface AgentContext {
  userId: string;
  peranan: Peranan;          // peringkat RBAC sebenar (dari session.role)
  subRole?: SubRole | null;  // "Pelajar" | "SU" | "NSU"
  /** Untuk guru: senarai unit/kelas dalam skop seliaan. Untuk pelajar: id pelajar sendiri. */
  scope: {
    pelajarId?: string;       // jika pelajar
    guruId?: string;          // jika guru — id rekod Guru (untuk dashboard pending)
    unitIds?: string[];       // jika guru — had skop seliaan (nama unit)
    isAdmin?: boolean;        // admin penuh ATAU guru skop-sekolah (Penyelaras/KUPP/Pen.SU)
  };
}

/** Klasifikasi risiko menentukan sama ada tool dilaksana terus atau jadi cadangan. */
export type RiskLevel = "read" | "propose";
//  read    -> dilaksana terus (autonomi penuh, tiada kesan sampingan)
//  propose -> agent hanya CADANG; tindakan masuk baris gilir kelulusan manusia

export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  risk: RiskLevel;
  /** Peranan yang dibenarkan memanggil tool ini (lapisan pertama RBAC). */
  allowedRoles: Peranan[];
  /**
   * Pelaksana sebenar. Untuk 'propose', ini cipta rekod cadangan, BUKAN menulis terus.
   * Diisytihar sebagai kaedah (method) supaya parameter input boleh ditaip khusus
   * per-tool (cth { pelajarId?: string }) — input model disahkan oleh guardrail dahulu.
   */
  execute(input: Record<string, unknown>, ctx: AgentContext): Promise<ToolResult>;
}

export interface ToolResult {
  ok: boolean;
  /** Teks dihantar balik ke model sebagai tool_result. */
  summary: string;
  /** Data berstruktur untuk UI (pilihan). */
  data?: unknown;
  /** Jika tool 'propose': id cadangan yang menunggu kelulusan manusia. */
  proposalId?: string;
}

export interface AgentTurn {
  role: "user" | "assistant";
  content: string;
}

// =====================================================================
//  ORKESTRASI (agent orchestra)
//  Beberapa sub-agent khusus diselaras oleh satu orchestrator.
//  Digunakan untuk tugas pelbagai-domain / kelompok, BUKAN chat interaktif.
// =====================================================================

/** Domain pakar setiap sub-agent. */
export type AgentDomain =
  | "markah"        // pengiraan PAJSK (model 100 markah + gred)
  | "kehadiran"     // sesi, QR check-in, markah kehadiran (skala 50)
  | "kelulusan"     // nilai item menunggu, rangka cadangan
  | "analitik"      // agregat, laporan
  | "notifikasi";   // e-mel / Telegram

/** Definisi satu sub-agent: domain + tools dibenarkan + arahan khusus. */
export interface SubAgentDef {
  domain: AgentDomain;
  description: string;
  /** Nama tool (dari ALL_TOOLS) yang sub-agent ini boleh guna. Subset, bukan semua. */
  toolNames: string[];
  systemPrompt: string;
}

/** Satu langkah dalam pelan orchestrator. */
export interface PlanStep {
  domain: AgentDomain;
  task: string;            // arahan bahasa asli untuk sub-agent
  dependsOn?: number[];    // indeks langkah lain yang mesti siap dahulu
}

/** Hasil seorang sub-agent menyiapkan satu langkah. */
export interface SubAgentResult {
  domain: AgentDomain;
  task: string;
  ok: boolean;
  output: string;
  proposals: { tool: string; proposalId: string; summary: string }[];
}

/** Hasil akhir orchestrator. */
export interface OrchestratorResult {
  plan: PlanStep[];
  stepResults: SubAgentResult[];
  /** Sintesis akhir digabung dari semua sub-agent. */
  ringkasan: string;
  proposals: { tool: string; proposalId: string; summary: string }[];
}
