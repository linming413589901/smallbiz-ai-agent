"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

const QUICK_REPLIES = [
  "有什么优惠活动？",
  "查一下我的订单",
  "有没有T恤推荐？",
  "发货要几天？",
];

const MAX_INPUT_LENGTH = 500;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好呀~ 我是小美，有什么可以帮你的吗？😊",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;
    if (content.length > MAX_INPUT_LENGTH) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `消息太长了（最多${MAX_INPUT_LENGTH}字），请精简一下~`, error: true },
      ]);
      return;
    }

    setInput("");
    const newMessages = [...messages, { role: "user" as const, content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 服务器返回了具体错误信息
        throw new Error(data.error || "请求失败");
      }

      if (!data.message) {
        throw new Error("AI 没有返回回复");
      }

      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (err: any) {
      const errorMsg = err?.message || "服务暂时出了点问题";
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `${errorMsg}\n\n点击下方可重试 👇`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const retryLastMessage = () => {
    // 找到最后一条用户消息
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const lastUserMsg = messages[messages.length - 1 - lastUserIdx];
    // 移除最后的错误消息，重新发送
    setMessages(messages.slice(0, -1));
    sendMessage(lastUserMsg.content);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatar}>🏪</div>
        <div>
          <div style={styles.shopName}>小美潮流店</div>
          <div style={styles.status}>
            <span style={styles.dot} />
            在线
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div style={styles.msgAvatar}>🤖</div>
            )}
            <div
              style={{
                ...(msg.role === "user" ? styles.userBubble : styles.botBubble),
                ...(msg.error ? styles.errorBubble : {}),
                animation: "fadeIn 0.3s ease",
              }}
            >
              {msg.content}
              {/* 重试按钮 */}
              {msg.error && i === messages.length - 1 && (
                <button onClick={retryLastMessage} style={styles.retryBtn}>
                  🔄 重新发送
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
            <div style={styles.msgAvatar}>🤖</div>
            <div style={styles.typingBubble}>
              <span style={styles.typingDot}>●</span>
              <span style={{ ...styles.typingDot, animationDelay: "0.2s" }}>●</span>
              <span style={{ ...styles.typingDot, animationDelay: "0.4s" }}>●</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 1 && (
        <div style={styles.quickReplies}>
          {QUICK_REPLIES.map((text) => (
            <button
              key={text}
              onClick={() => sendMessage(text)}
              style={styles.quickBtn}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="输入你的问题..."
          style={styles.input}
          disabled={loading}
          maxLength={MAX_INPUT_LENGTH}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            ...styles.sendBtn,
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          {loading ? "..." : "发送"}
        </button>
      </div>

      <div style={styles.footer}>
        Powered by AI · 小商家智能客服 Demo
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: "0 auto",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f0f2f5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px",
    background: "#fff",
    borderBottom: "1px solid #e8e8e8",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#e8f5e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#333",
  },
  status: {
    fontSize: 12,
    color: "#52c41a",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#52c41a",
    display: "inline-block",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 12px",
  },
  messageRow: {
    display: "flex",
    marginBottom: 16,
    alignItems: "flex-end",
    gap: 8,
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#e3f2fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    flexShrink: 0,
  },
  userBubble: {
    maxWidth: "75%",
    padding: "10px 16px",
    borderRadius: "18px 18px 4px 18px",
    background: "#07c160",
    color: "#fff",
    fontSize: 15,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap" as const,
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  botBubble: {
    maxWidth: "75%",
    padding: "10px 16px",
    borderRadius: "18px 18px 18px 4px",
    background: "#fff",
    color: "#333",
    fontSize: 15,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap" as const,
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  errorBubble: {
    background: "#fff3f3",
    border: "1px solid #ffcdd2",
    color: "#c62828",
  },
  retryBtn: {
    display: "block",
    marginTop: 8,
    padding: "4px 12px",
    borderRadius: 12,
    border: "1px solid #c62828",
    background: "transparent",
    color: "#c62828",
    fontSize: 12,
    cursor: "pointer",
  },
  typingBubble: {
    padding: "12px 20px",
    borderRadius: "18px 18px 18px 4px",
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
    display: "flex",
    gap: 4,
  },
  typingDot: {
    fontSize: 8,
    color: "#999",
    animation: "bounce 1.4s ease infinite",
  },
  quickReplies: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    padding: "8px 16px",
  },
  quickBtn: {
    padding: "6px 14px",
    borderRadius: 16,
    border: "1px solid #07c160",
    background: "#fff",
    color: "#07c160",
    fontSize: 13,
    cursor: "pointer",
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    background: "#fff",
    borderTop: "1px solid #e8e8e8",
  },
  input: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: 20,
    border: "1px solid #e0e0e0",
    fontSize: 15,
    outline: "none",
    background: "#f5f5f5",
  },
  sendBtn: {
    padding: "10px 20px",
    borderRadius: 20,
    background: "#07c160",
    color: "#fff",
    border: "none",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },
  footer: {
    textAlign: "center" as const,
    padding: "8px",
    fontSize: 11,
    color: "#bbb",
    background: "#f0f2f5",
  },
};
