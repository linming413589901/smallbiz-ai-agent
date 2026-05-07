import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { SYSTEM_PROMPT } from "./prompt";
import { faqTool } from "./tools/faq";
import { inventoryTool } from "./tools/inventory";

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// 绑定工具
const modelWithTools = model.bindTools([faqTool, inventoryTool]);

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

  // 处理工具调用
  while (response.tool_calls && response.tool_calls.length > 0) {
    const toolResults = [];
    for (const toolCall of response.tool_calls) {
      let result: string;
      if (toolCall.name === "faq_lookup") {
        result = await faqTool.invoke(toolCall.args);
      } else if (toolCall.name === "check_inventory") {
        result = await inventoryTool.invoke(toolCall.args);
      } else {
        result = "未知工具";
      }
      toolResults.push(result);
    }

    // 把工具结果发回模型
    lcMessages.push(response);
    for (let i = 0; i < response.tool_calls.length; i++) {
      const { ToolMessage } = await import("@langchain/core/messages");
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
