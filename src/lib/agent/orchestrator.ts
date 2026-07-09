// src/lib/agent/orchestrator.ts
// Orchestrator MyGuru AI, dibina sebagai graf LangGraph sebenar (StateGraph):
//   START -> planner -> dispatch -(conditional, Send per langkah sedia)-> subAgent -> dispatch -> ... -> synthesis -> END
//   1) RANCANG  — LLM pecahkan tugas kepada langkah (domain + arahan + kebergantungan)
//   2) HANTAR   — "dispatch" kira langkah yang sedia (dependsOn selesai) & Send() setiap satu
//                 secara selari ke node "subAgent"; langkah bergantung tunggu gelombang seterusnya
//   3) SINTESIS — LLM gabungkan semua output jadi satu ringkasan
//
// Guardrail RBAC dikuatkuasakan dalam setiap sub-agent (via runSession).
// Kontrak awam (runOrchestra) kekal sama — route.ts tidak perlu berubah.

import type Anthropic from "@anthropic-ai/sdk";
import { Annotation, Send, StateGraph, START, END } from "@langchain/langgraph";
import { getClient, MODEL } from "./llm";
import type {
  AgentContext,
  PlanStep,
  SubAgentResult,
  OrchestratorResult,
} from "./types";
import { subAgentFor } from "./subagents";
import { findTool } from "./tools";
import { runSession } from "./runner";

const PLANNER_PROMPT = `Anda ORCHESTRATOR MyGuru AI. Pecahkan permintaan pengguna kepada langkah-langkah
untuk sub-agent khusus. Sub-agent yang ada: markah, kehadiran, kelulusan, analitik, notifikasi.

Balas HANYA JSON (tiada teks lain, tiada markdown) dalam bentuk:
{"steps":[{"domain":"<domain>","task":"<arahan jelas>","dependsOn":[<indeks>]}]}

Guna hanya domain yang relevan. 'dependsOn' pilihan (senarai indeks langkah yang mesti siap dahulu).
Jika tugas mudah satu domain, pulangkan satu langkah sahaja.`;

async function buatPelan(userTask: string): Promise<PlanStep[]> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 800,
    system: PLANNER_PROMPT,
    messages: [{ role: "user", content: userTask }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim()
    .replace(/^```json\s*|\s*```$/g, "");
  try {
    const parsed = JSON.parse(text) as { steps: PlanStep[] };
    const valid = (parsed.steps ?? []).filter((s) => subAgentFor(s.domain));
    return valid.length ? valid : [{ domain: "analitik", task: userTask }];
  } catch {
    return [{ domain: "analitik", task: userTask }];
  }
}

async function sintesis(userTask: string, results: SubAgentResult[]): Promise<string> {
  const gabungan = results.map((r) => `### ${r.domain}\n${r.output}`).join("\n\n");
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1200,
    system:
      "Anda ORCHESTRATOR MyGuru AI. Gabungkan output sub-agent jadi satu jawapan padat, " +
      "jelas, dalam Bahasa Melayu. Nyatakan dengan jelas mana-mana cadangan yang menunggu " +
      "kelulusan manusia. Jangan reka maklumat di luar output yang diberi.",
    messages: [
      { role: "user", content: `Permintaan asal: ${userTask}\n\nOutput sub-agent:\n${gabungan}` },
    ],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

type IndexedResult = { index: number; result: SubAgentResult };
type Proposal = { tool: string; proposalId: string; summary: string };
type TaskInput = { step: PlanStep; index: number; konteksDep: string };

const OrchestraState = Annotation.Root({
  ctx: Annotation<AgentContext>(),
  userTask: Annotation<string>(),
  plan: Annotation<PlanStep[]>({ reducer: (_a, b) => b, default: () => [] }),
  completed: Annotation<number[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  stepResults: Annotation<IndexedResult[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  proposals: Annotation<Proposal[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  ringkasan: Annotation<string>({ reducer: (_a, b) => b, default: () => "" }),
  taskInput: Annotation<TaskInput | undefined>({
    reducer: (_a, b) => b,
    default: () => undefined,
  }),
});

type OrchestraStateType = typeof OrchestraState.State;

async function plannerNode(state: OrchestraStateType) {
  const plan = await buatPelan(state.userTask);
  return { plan };
}

/** Node pasif — logik sebenar hidup dalam `routeWaves` (conditional edge). */
async function dispatchNode() {
  return {};
}

function routeWaves(state: OrchestraStateType): "synthesis" | Send[] {
  const { plan, completed, stepResults } = state;
  if (completed.length >= plan.length) return "synthesis";

  const done = new Set(completed);
  const indexed = plan.map((step, index) => ({ step, index }));
  let sedia = indexed
    .filter(({ index }) => !done.has(index))
    .filter(({ step }) => (step.dependsOn ?? []).every((d) => done.has(d)));

  // Kebergantungan kitar/tidak dapat dipenuhi -> paksa jalankan satu baki sahaja.
  if (!sedia.length) {
    sedia = indexed.filter(({ index }) => !done.has(index)).slice(0, 1);
  }

  return sedia.map(({ step, index }) => {
    const konteksDep = (step.dependsOn ?? [])
      .map((i) => stepResults.find((r) => r.index === i)?.result)
      .filter((r): r is SubAgentResult => Boolean(r))
      .map((r) => `[${r.domain}] ${r.output}`)
      .join("\n");
    return new Send(step.domain, { ctx: state.ctx, taskInput: { step, index, konteksDep } });
  });
}

async function subAgentNode(state: OrchestraStateType) {
  const { ctx, taskInput } = state;
  if (!taskInput) return {};
  const { step, index, konteksDep } = taskInput;

  const def = subAgentFor(step.domain)!;
  const tools = def.toolNames
    .map((n) => findTool(n))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const arahan = konteksDep
    ? `${step.task}\n\nKonteks daripada langkah terdahulu:\n${konteksDep}`
    : step.task;

  const out = await runSession(ctx, def.systemPrompt, tools, [
    { role: "user", content: arahan },
  ]);

  const result: SubAgentResult = {
    domain: step.domain,
    task: step.task,
    ok: true,
    output: out.reply,
    proposals: out.proposals,
  };

  return {
    completed: [index],
    stepResults: [{ index, result }],
    proposals: out.proposals,
  };
}

async function synthesisNode(state: OrchestraStateType) {
  const ordered = [...state.stepResults].sort((a, b) => a.index - b.index).map((r) => r.result);
  const ringkasan = await sintesis(state.userTask, ordered);
  return { ringkasan };
}

const orchestraGraph = new StateGraph(OrchestraState)
  .addNode("planner", plannerNode)
  .addNode("dispatch", dispatchNode)
  .addNode("markah", subAgentNode)
  .addNode("kehadiran", subAgentNode)
  .addNode("kelulusan", subAgentNode)
  .addNode("analitik", subAgentNode)
  .addNode("notifikasi", subAgentNode)
  .addNode("synthesis", synthesisNode)
  .addEdge(START, "planner")
  .addEdge("planner", "dispatch")
  .addConditionalEdges("dispatch", routeWaves, [
    "markah",
    "kehadiran",
    "kelulusan",
    "analitik",
    "notifikasi",
    "synthesis",
  ])
  .addEdge("markah", "dispatch")
  .addEdge("kehadiran", "dispatch")
  .addEdge("kelulusan", "dispatch")
  .addEdge("analitik", "dispatch")
  .addEdge("notifikasi", "dispatch")
  .addEdge("synthesis", END)
  .compile();

/**
 * Entri utama orchestra. Menghormati kebergantungan (dependsOn) — langkah bebas
 * jalan selari dalam gelombang yang sama (via LangGraph Send); langkah bergantung
 * tunggu gelombang seterusnya.
 */
export async function runOrchestra(
  ctx: AgentContext,
  userTask: string
): Promise<OrchestratorResult> {
  const result = await orchestraGraph.invoke(
    {
      ctx,
      userTask,
      plan: [],
      completed: [],
      stepResults: [],
      proposals: [],
      ringkasan: "",
      taskInput: undefined,
    },
    { recursionLimit: 100 }
  );

  const stepResults = [...result.stepResults].sort((a, b) => a.index - b.index).map((r) => r.result);

  return {
    plan: result.plan,
    stepResults,
    ringkasan: result.ringkasan,
    proposals: result.proposals,
  };
}
