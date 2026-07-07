"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function GeminiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi, I'm the SmalBlu Grant Assistant, powered by Gemini. Ask me things like \"what AI grants are open in the EU\" or \"help me write a budget justification for the UNDP fund.\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      // The browser never sees GEMINI_API_KEY - it only talks to our own
      // /api/gemini route, which holds the key server-side.
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", message: userMsg.text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply ?? data.error ?? "Something went wrong." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Network error reaching SmalBlu AI. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-[92vw] max-w-sm h-[420px] bg-surface border border-stroke rounded-3xl flex flex-col overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-4 border-b border-stroke flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium">SmalBlu AI</span>
            <span className="text-xs text-muted ml-auto">Gemini</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${
                  m.role === "user" ? "bg-text-primary text-bg ml-auto" : "bg-stroke/50 text-text-primary"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-muted px-3">SmalBlu AI is thinking…</div>}
          </div>
          <div className="p-3 border-t border-stroke flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about global grants…"
              className="flex-1 bg-bg border border-stroke rounded-full px-4 py-2 text-sm outline-none focus:border-white/30"
            />
            <button
              onClick={send}
              className="rounded-full w-9 h-9 flex items-center justify-center bg-text-primary text-bg shrink-0"
            >
              ↑
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative group rounded-full"
      >
        <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-70 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center gap-2 bg-bg text-text-primary rounded-full px-5 py-3.5 text-sm">
          {open ? "Close" : "Ask SmalBlu AI"}
        </span>
      </button>
    </div>
  );
}
