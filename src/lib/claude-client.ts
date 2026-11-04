// src/lib/claude-client.ts
// Kilang klien Claude tunggal untuk seluruh app.
//
// Dua mod (dipilih automatik daripada env):
//   1. Vertex AI (GCP DELIMa) — jika ANTHROPIC_VERTEX_PROJECT_ID ditetapkan.
//      Kelayakan melalui Application Default Credentials (ADC): di VM GCE,
//      akaun servis VM digunakan terus (tiada fail kunci). Secara tempatan,
//      jalankan `gcloud auth application-default login` atau tetapkan
//      GOOGLE_APPLICATION_CREDENTIALS ke fail JSON akaun servis.
//      Rantau: CLOUD_ML_REGION (lalai "global").
//   2. API Anthropic terus — jika ANTHROPIC_API_KEY ditetapkan.
// Vertex diutamakan jika kedua-duanya ada.

import Anthropic from "@anthropic-ai/sdk";
import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";

/** Antara muka minimum yang digunakan app (Vertex tiada `batches`). */
export type KlienClaude = Pick<AnthropicVertex, "messages">;

export function gunaVertex(): boolean {
  return !!process.env.ANTHROPIC_VERTEX_PROJECT_ID?.trim();
}

/** Adakah sebarang kelayakan Claude dikonfigurasi? */
export function claudeDikonfigurasi(): boolean {
  return gunaVertex() || !!process.env.ANTHROPIC_API_KEY?.trim();
}

export function buatKlienClaude(): KlienClaude {
  if (gunaVertex()) {
    return new AnthropicVertex({
      projectId: process.env.ANTHROPIC_VERTEX_PROJECT_ID!.trim(),
      region: process.env.CLOUD_ML_REGION?.trim() || "global",
    });
  }
  return new Anthropic(); // membaca ANTHROPIC_API_KEY dari env
}
