import { NextRequest, NextResponse } from "next/server";
import { chat, Message } from "@/agent/chain";

// 简单的频率限制（内存存储，生产环境用 Redis）
const requestLog = new Map<string, number[]>();
const RATE_LIMIT = 20; // 每分钟最多20次
const RATE_WINDOW = 60_000; // 1分钟窗口

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];
  const recent = requests.filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  requestLog.set(ip, recent);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 频率限制
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "请求太频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages } = body;

    // 输入校验
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "请求格式错误" },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "消息不能为空" },
        { status: 400 }
      );
    }

    // 校验最后一条消息
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.content || typeof lastMsg.content !== "string") {
      return NextResponse.json(
        { error: "消息内容不能为空" },
        { status: 400 }
      );
    }

    // 限制消息长度
    if (lastMsg.content.length > 500) {
      return NextResponse.json(
        { error: "消息太长了，请精简一下~" },
        { status: 400 }
      );
    }

    // 调用 Agent（带超时）
    const response = await Promise.race([
      chat(messages as Message[]),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("请求超时")), 45_000)
      ),
    ]);

    return NextResponse.json({ message: response });
  } catch (error: any) {
    console.error("Chat error:", error);

    // 区分不同错误类型
    if (error?.message === "请求超时") {
      return NextResponse.json(
        { error: "AI 思考时间太长了，请重试一下" },
        { status: 504 }
      );
    }

    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: "服务配置异常，请联系管理员" },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "AI 服务繁忙，请稍后再试" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "服务暂时出了点问题，请稍后再试~" },
      { status: 500 }
    );
  }
}
