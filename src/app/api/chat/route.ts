import { NextRequest, NextResponse } from "next/server";
import { chat, Message } from "@/agent/chain";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const response = await chat(messages as Message[]);
    return NextResponse.json({ message: response });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "服务暂时不可用" },
      { status: 500 }
    );
  }
}
