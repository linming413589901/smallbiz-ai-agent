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

export async function chat(messages: Message[]): Promise<string> {
  // 转换消息格式
  const lcMessages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...messages.map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    ),
  ];

  // 调用模型
  let response = await modelWithTools.invoke(lcMessages);

  // 处理工具调用（支持多轮）
  let maxRounds = 5; // 防止死循环
  while (response.tool_calls && response.tool_calls.length > 0 && maxRounds-- > 0) {
    const toolResults: string[] = [];
    for (const toolCall of response.tool_calls) {
      const targetTool = toolMap[toolCall.name];
      if (targetTool) {
        const result = await targetTool.invoke(toolCall.args);
        toolResults.push(result);
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

    response = await modelWithTools.invoke(lcMessages);
  }

  return response.content as string;
}
