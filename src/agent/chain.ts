import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { SYSTEM_PROMPT } from "./prompt";
import { faqTool } from "./tools/faq";
import { inventoryTool } from "./tools/inventory";
import { orderTool } from "./tools/order";

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || "xiaomi/mimo-v2.5-pro",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL || "https://api.xiaomimimo.com/v1",
  },
  timeout: 30_000, // 30秒超时
  maxRetries: 2,   // 自动重试2次
});

// 绑定所有工具
const allTools = [faqTool, inventoryTool, orderTool];
const modelWithTools = model.bindTools(allTools);

// 工具名称 -> 工具实例的映射
const toolMap: Record<string, any> = {
  faq_lookup: faqTool,
  check_inventory: inventoryTool,
  query_order: orderTool,
};

export interface Message {
  role: "user" | "assistant";
  content: string;
}

// 重试辅助函数
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // 如果是认证错误（401/403），不重试
      if (err?.status === 401 || err?.status === 403) {
        throw err;
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

export async function chat(messages: Message[]): Promise<string> {
  // 输入校验
  if (!messages || messages.length === 0) {
    return "你好呀~ 有什么可以帮你的吗？😊";
  }

  // 截断过长的消息历史（保留最近20条）
  const recentMessages = messages.slice(-20);

  // 转换消息格式
  const lcMessages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...recentMessages.map((m) => {
      // 截断单条过长消息
      const content = m.content?.slice(0, 2000) || "";
      return m.role === "user"
        ? new HumanMessage(content)
        : new AIMessage(content);
    }),
  ];

  // 调用模型（带重试）
  let response = await withRetry(() => modelWithTools.invoke(lcMessages));

  // 处理工具调用（支持多轮）
  let maxRounds = 5;
  while (response.tool_calls && response.tool_calls.length > 0 && maxRounds-- > 0) {
    const toolResults: string[] = [];
    for (const toolCall of response.tool_calls) {
      const targetTool = toolMap[toolCall.name];
      if (targetTool) {
        try {
          const result = await Promise.race([
            targetTool.invoke(toolCall.args),
            new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error("工具调用超时")), 10_000)
            ),
          ]);
          toolResults.push(result);
        } catch (err: any) {
          console.error(`Tool ${toolCall.name} error:`, err.message);
          toolResults.push(`查询暂时不可用，请稍后再试`);
        }
      } else {
        toolResults.push(`未知工具: ${toolCall.name}`);
      }
    }

    // 把工具结果发回模型
    lcMessages.push(response);
    const { ToolMessage } = await import("@langchain/core/messages");
    for (let i = 0; i < response.tool_calls.length; i++) {
      lcMessages.push(
        new ToolMessage({
          content: toolResults[i],
          tool_call_id: response.tool_calls[i].id!,
        })
      );
    }

    response = await withRetry(() => modelWithTools.invoke(lcMessages));
  }

  // 处理空响应
  const content = response.content as string;
  if (!content || content.trim().length === 0) {
    return "抱歉，我没有理解您的意思，可以换个说法吗？";
  }

  return content;
}
