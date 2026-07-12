// src/lib/agent/guardrails.ts
// Pagar keselamatan: SETIAP panggilan tool ditapis di sini sebelum dilaksana.
// Prinsip: input model tidak pernah dipercayai. Skop datang dari sesi, bukan model.

import type { AgentContext, ToolDef, ToolResult } from "./types";

export class GuardrailError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "GuardrailError";
  }
}

/**
 * Tapis kebenaran sebelum tool dilaksana.
 * 1) Peranan dibenarkan?  2) Skop data sah?  3) (untuk 'propose') log niat.
 */
export function authorizeToolCall(
  tool: ToolDef,
  input: Record<string, unknown>,
  ctx: AgentContext
): void {
  // (1) RBAC peringkat peranan
  if (!tool.allowedRoles.includes(ctx.peranan)) {
    throw new GuardrailError(
      `Peranan '${ctx.peranan}' tidak dibenarkan memanggil '${tool.name}'.`
    );
  }

  // (2) Skop data — pengguna tak boleh capai data luar skop, walau model "minta".
  // Pelajar: hanya data diri sendiri.
  if (ctx.peranan === "Pelajar") {
    const minta = input.pelajarId;
    if (minta && minta !== ctx.scope.pelajarId) {
      throw new GuardrailError(
        "Pelajar hanya boleh mengakses data sendiri."
      );
    }
  }

  // Guru: hanya unit dalam skop seliaan.
  if (ctx.peranan === "Guru" && !ctx.scope.isAdmin) {
    const unit = input.unitId;
    if (unit && !(ctx.scope.unitIds ?? []).includes(String(unit))) {
      throw new GuardrailError(
        "Unit ini di luar skop seliaan guru."
      );
    }
  }
}

/**
 * Untuk tool berisiko ('propose'): walaupun pengguna log masuk autonomi,
 * tindakan TIDAK ditulis terus. Sebaliknya kita pulangkan mesej yang jelas
 * bahawa ia menunggu kelulusan manusia. Pelaksana sebenar (di tools.ts)
 * mencipta rekod cadangan berstatus PENDING.
 */
export function wrapProposeResult(
  toolName: string,
  proposalId: string,
  butiran: string
): ToolResult {
  return {
    ok: true,
    proposalId,
    summary:
      `Cadangan '${toolName}' telah direkod (ID: ${proposalId}) dan menunggu ` +
      `kelulusan guru/admin. Tiada perubahan markah/rekod dibuat lagi. Butiran: ${butiran}`,
  };
}
