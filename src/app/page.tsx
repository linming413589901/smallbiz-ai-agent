"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好！有什么可以帮您的吗？😊",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("请求失败");

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "抱歉，服务暂时出了点问题，请稍后再试。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, height: "100vh", display: "flex", flexDirection: "column" }}>
      <h1 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16, textAlign: "center" }}>
        🏪 小商家智能客服
      </h1>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#f5f5f5", borderRadius: 12 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 16px",
                borderRadius: 16,
                background: msg.role === "user" ? "#007aff" : "#fff",
                color: msg.role === "user" ? "#fff" : "#333",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: "center", color: "#999", fontSize: 14 }}>
            正在输入...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="输入你的问题..."
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 24,
            border: "1px solid #ddd",
            fontSize: 16,
            outline: "none",
          }}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: 24,
            background: "#007aff",
            color: "#fff",
            border: "none",
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          发送
        </button>
      </div>

      <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "#999" }}>
        试试问：有没有T恤？/ 营业时间？/ 发货要几天？
      </div>
    </div>
  );
}
