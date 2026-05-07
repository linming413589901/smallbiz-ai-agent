import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 常见问题知识库（实际项目中从数据库读取）
const FAQ_DATA: Record<string, string> = {
  "营业时间": "我们每天 9:00-21:00 营业，节假日正常营业。",
  "退换货": "收到商品后7天内支持无理由退换，请保持商品完好并联系客服。",
  "发货": "下单后48小时内发货，默认顺丰快递，偏远地区3-5天到达。",
  "包邮": "满99元包邮，不满99元运费10元。",
  "支付": "支持微信支付、支付宝、货到付款。",
  "发票": "可以开电子发票，请在下单时备注。",
};

export const faqTool = tool(
  async ({ question }: { question: string }) => {
    const q = question.toLowerCase();
    for (const [key, answer] of Object.entries(FAQ_DATA)) {
      if (q.includes(key)) {
        return answer;
      }
    }
    return "这个问题我不太确定，让我帮您转接店主。";
  },
  {
    name: "faq_lookup",
    description: "查询常见问题（营业时间、退换货、发货、包邮、支付、发票等）",
    schema: z.object({
      question: z.string().describe("顾客的问题"),
    }),
  }
);
