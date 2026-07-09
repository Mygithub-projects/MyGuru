// src/lib/agent/loop.ts
// Enjin agent (tool-use asli), dibina sebagai graf LangGraph sebenar (StateGraph):
//   START -> agent -(conditional: tool_use?)-> tools -> agent -> ... -> END
//                                          \-(tiada tool_use)-> END
// Guardrail RBAC dikuatkuasakan sebelum setiap tool dilaksana.
// Kontrak awam (runAgent) kekal sama — chat/route.ts tidak perlu berubah.

import type Anthropic from "@anthropic-ai/sdk";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { getClient, MODEL, type ChatMessage, type ChatTool } from "./llm";
import type { AgentContext, AgentTurn } from "./types";
import { toolsForContext, findTool } from "./tools";
import { systemPromptFor } from "./personas";
import { authorizeToolCall, GuardrailError } from "./guardrails";

const MAX_ITER = 8; // had pusingan tool untuk elak gelung tak berkesudahan

export interface AgentResult {
  reply: string;
  /** Cadangan yang dicipta semasa giliran ini (untuk UI papar baris gilir kelulusan). */
  proposals: { tool: string; proposalId: string; summary: string }[];
  toolTrace: { tool: string; ok: boolean }[];
}

const FALLBACK_REPLY =
  "Maaf, permintaan ini terlalu kompleks untuk diselesaikan dalam had pusingan. " +
  "Cuba pecahkan kepada langkah lebih kecil.";

type Proposal = AgentResult["proposals"][number];
type ToolTraceEntry = AgentResult["toolTrace"][number];

const ChatState = Annotation.Root({
  ctx: Annotation<AgentContext>(),
  messages: Annotation<ChatMessage[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  pendingToolUse: Annotation<Anthropic.ToolUseBlock[] | undefined>({
    reducer: (_a, b) => b,
    default: () => undefined,
  }),
  proposals: Annotation<Proposal[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  toolTrace: Annotation<ToolTraceEntry[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  iter: Annotation<number>({ reducer: (_a, b) => b, default: () => 0 }),
  reply: Annotation<string>({ reducer: (_a, b) => b, default: () => "" }),
});

type ChatStateType = typeof ChatState.State;

async function agentNode(state: ChatStateType) {
  const tools: ChatTool[] = toolsForContext(state.ctx).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as ChatTool["input_schema"],
  }));

  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: systemPromptFor(state.ctx),
    tools: tools.length ? tools : undefined,
    messages: state.messages,
  });

  if (res.stop_reason !== "tool_use") {
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return { reply: text, pendingToolUse: undefined };
  }

  const toolUseBlocks = res.content.filter(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );

  return {
    messages: [{ role: "assistant", content: res.content } as ChatMessage],
    pendingToolUse: toolUseBlocks,
  };
}

async function toolsNode(state: ChatStateType) {
  const blocks = state.pendingToolUse ?? [];
  const toolResults: Anthropic.ToolResultBlockParam[] = [];
  const toolTrace: ToolTraceEntry[] = [];
  const proposals: Proposal[] = [];

  for (const block of blocks) {
    const tool = findTool(block.name);
    const input = (block.input ?? {}) as Record<string, unknown>;

    if (!tool) {
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: `Tool '${block.name}' tidak wujud.`,
        is_error: true,
      });
      continue;
    }

    try {
      authorizeToolCall(tool, input, state.ctx);
      const result = await tool.execute(input, state.ctx);
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

  return {
    messages: [{ role: "user", content: toolResults } as ChatMessage],
    pendingToolUse: undefined,
    toolTrace,
    proposals,
    iter: state.iter + 1,
  };
}

async function maxIterNode() {
  return { reply: FALLBACK_REPLY };
}

function routeAfterAgent(state: ChatStateType): "tools" | typeof END {
  return state.pendingToolUse && state.pendingToolUse.length ? "tools" : END;
}

function routeAfterTools(state: ChatStateType): "agent" | "maxIter" {
  return state.iter >= MAX_ITER ? "maxIter" : "agent";
}

const chatGraph = new StateGraph(ChatState)
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addNode("maxIter", maxIterNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeAfterAgent, ["tools", END])
  .addConditionalEdges("tools", routeAfterTools, ["agent", "maxIter"])
  .addEdge("maxIter", END)
  .compile();

export async function runAgent(
  ctx: AgentContext,
  history: AgentTurn[],
  userMessage: string
): Promise<AgentResult> {
  const messages: ChatMessage[] = [
    ...history.map((h) => ({ role: h.role, content: h.content }) as ChatMessage),
    { role: "user", content: userMessage },
  ];

  const result = await chatGraph.invoke(
    {
      ctx,
      messages,
      pendingToolUse: undefined,
      proposals: [],
      toolTrace: [],
      iter: 0,
      reply: "",
    },
    { recursionLimit: 50 }
  );

  return { reply: result.reply, proposals: result.proposals, toolTrace: result.toolTrace };
}
