"use client";
import { useEffect, useRef, useState } from "react";
import { OPEN_CHAT_EVENT } from "./shell/Sidebar";
import type { Dict } from "@/lib/i18n";

interface Turn {
  role: "user" | "assistant";
  content: string;
  proposals?: number;
  error?: boolean;
}

type AgentChatDict = Dict["chrome"]["agentChat"];

export function AgentChat({ role, t }: { role: string; t: AgentChatDict }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const roleKey = (role === "Guru" || role === "Admin" ? role : "Pelajar") as keyof AgentChatDict["greeting"];
  const greeting = t.greeting[roleKey];
  const suggestions = t.suggestions[roleKey];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");

    // Sejarah = giliran sebenar sebelum ini (tanpa nota cadangan/ralat).
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      if (res.status === 401) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: t.sessionExpired, error: true },
        ]);
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.error ?? t.genericError, error: true },
        ]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: json.reply || t.noAnswer,
          proposals: Array.isArray(json.proposals) ? json.proposals.length : 0,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t.networkError, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Butang terapung */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Tutup MyGuru AI" : "Buka MyGuru AI"}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-black/5 transition hover:bg-brand-hover"
      >
        <span className="text-lg leading-none">{open ? "✕" : "🤖"}</span>
        {!open && <span className="hidden sm:inline">MyGuru AI</span>}
      </button>

      {/* Panel sembang */}
      {open && (
        <div className="fixed bottom-20 right-4 left-4 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 sm:left-auto sm:w-96">
          <div className="flex items-center gap-2 bg-ink px-4 py-3 text-white">
            <span className="text-lg">🤖</span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">MyGuru AI</p>
              <p className="text-[11px] text-white/70">{t.subtitle}</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {/* Salam pembuka + cadangan soalan */}
            <Bubble role="assistant">{greeting}</Bubble>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-brand/40 hover:bg-brand-light"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} error={m.error}>
                {m.content}
                {m.proposals ? (
                  <span className="mt-1 block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    📋 {m.proposals} {t.proposalsSuffix}
                  </span>
                ) : null}
              </Bubble>
            ))}

            {loading && (
              <Bubble role="assistant">
                <span className="inline-flex gap-1">
                  <Dot /> <Dot /> <Dot />
                </span>
              </Bubble>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({
  role,
  error,
  children,
}: {
  role: "user" | "assistant";
  error?: boolean;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? "bg-brand text-white"
            : error
            ? "bg-red-50 text-red-700 ring-1 ring-red-200"
            : "bg-slate-100 text-slate-800"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />;
}
