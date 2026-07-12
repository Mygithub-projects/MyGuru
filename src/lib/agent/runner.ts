// src/lib/agent/runner.ts
// Runner teras boleh guna semula: jalankan satu sesi agent dengan toolset & prompt
// yang ditentukan pemanggil. Dikongsi oleh agent interaktif DAN sub-agent orchestra.
// Guardrail RBAC tetap dikuatkuasakan di sini — pengasingan tool TIDAK menggantikan RBAC.

import type Anthropic from "@anthropic-ai/sdk";
import { getClient, MODEL, type ChatMessage, type ChatTool } from "./llm";
import type { AgentContext, ToolDef } from "./types";
import { authorizeToolCall, GuardrailError } from "./guardrails";

export { MODEL };
const MAX_ITER = 8;

export interface RunOutput {
  reply: string;
  proposals: { tool: string; proposalId: string; summary: string }[];
  toolTrace: { tool: string; ok: boolean }[];
}

/**
 * Jalankan satu sesi agent.
 * @param ctx          konteks pengguna (RBAC/skop) — dari sesi, bukan model
 * @param systemPrompt prompt untuk sesi ini (dihantar via param `system` Claude)
 * @param availableTools subset tools yang dibenarkan untuk sesi ini
 * @param turns        sejarah + mesej baharu (user/assistant)
 */
export async function runSession(
  ctx: AgentContext,
  systemPrompt: string,
  availableTools: ToolDef[],
  turns: ChatMessage[]
): Promise<RunOutput> {
  const tools: ChatTool[] = availableTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as ChatTool["input_schema"],
  }));
  const byName = new Map(availableTools.map((t) => [t.name, t]));

  const messages: ChatMessage[] = [...turns];

  const proposals: RunOutput["proposals"] = [];
  const toolTrace: RunOutput["toolTrace"] = [];

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      tools: tools.length ? tools : undefined,
      messages,
    });

    if (res.stop_reason !== "tool_use") {
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { reply: text, proposals, toolTrace };
    }

    messages.push({ role: "assistant", content: res.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      const tool = byName.get(block.name);
      const input = (block.input ?? {}) as Record<string, unknown>;

      // Tool di luar subset sub-agent ini -> ditolak (pengasingan domain).
      if (!tool) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Tool '${block.name}' tiada dalam skop agent ini.`,
          is_error: true,
        });
        continue;
      }

      try {
        authorizeToolCall(tool, input, ctx); // RBAC + skop, tidak boleh dipintas
        const result = await tool.execute(input, ctx);
        toolTrace.push({ tool: tool.name, ok: result.ok });
        if (result.proposalId) {
          proposals.push({ tool: tool.name, proposalId: result.proposalId, summary: result.summary });
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify({ summary: result.summary, data: result.data ?? null }),
        });
      } catch (e) {
        const msg = e instanceof GuardrailError ? e.message : "Ralat melaksana tool.";
        toolTrace.push({ tool: tool.name, ok: false });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `RALAT: ${msg}`,
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  return {
    reply: "Had pusingan dicapai sebelum tugas selesai.",
    proposals,
    toolTrace,
  };
}
