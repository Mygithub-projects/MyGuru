// src/lib/agent/llm.ts
// Klien LLM untuk lapisan agent — Anthropic Claude (tool-use asli: blok tool_use +
// blok tool_result). Sama penyedia seperti ringkasan AI di src/lib/ai.ts.

import type Anthropic from "@anthropic-ai/sdk";
import { buatKlienClaude, claudeDikonfigurasi, type KlienClaude } from "../claude-client";

// Lazy singleton: bina klien hanya pada penggunaan pertama supaya `next build`
// (yang menilai modul route) tidak gagal apabila ANTHROPIC_API_KEY belum
// ditetapkan — ralat auth ditangguh ke masa panggilan, ditangkap oleh route.
let _client: KlienClaude | null = null;

export function getClient(): KlienClaude {
  if (!_client) {
    _client = buatKlienClaude(); // Vertex AI (GCP) atau ANTHROPIC_API_KEY
  }
  return _client;
}

/** Adakah kunci Claude ditetapkan? Route boleh guna untuk gagal-anggun. */
export function llmDiaktifkan(): boolean {
  return claudeDikonfigurasi();
}

/**
 * Model Claude untuk loop agent. Sengaja BERASINGAN daripada AI_MODEL (ringkasan
 * di ai.ts) supaya loop tool-use boleh guna model lebih murah/pantas. Default
 * sonnet-4-6 (seimbang kos/kualiti untuk beban kerja sekolah). Tindih via env.
 */
export const MODEL = process.env.AGENT_MODEL || "claude-sonnet-4-6";

// Alias jenis ringkas supaya fail lain tidak perlu import dalam Anthropic.
export type ChatMessage = Anthropic.MessageParam;
export type ChatTool = Anthropic.Tool;
