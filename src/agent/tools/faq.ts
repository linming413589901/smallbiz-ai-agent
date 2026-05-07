import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 常见问题知识库（实际项目中从数据库读取）
const FAQ_DATA: Record<string, string> = {
  营业时间: "我们每天 9:00-21:00 营业，节假日正常营业。",
  退换货: "收到商品后7天内支持无理由退换，请保持商品完好并联系客服。",
  发货: "下单后48小时内发货，默认顺丰快递，偏远地区3-5天到达。",
  包邮: "满99元包邮，不满99元运费10元。",
  支付: "支持微信支付、支付宝、货到付款。",
  发票: "可以开电子发票，请在下单时备注。",
  售后: "任何售后问题都可以联系我们，工作时间内30分钟内响应。",
  会员: "累计消费满500元自动成为会员，享受9折优惠。",
};

// 关键词别名映射，提高匹配命中率
const ALIASES: Record<string, string[]> = {
  营业时间: ["几点开门", "几点关门", "开门时间", "关门时间", "营业", "上班"],
  退换货: ["退货", "换货", "退款", "退换", "不要了"],
  发货: ["快递", "物流", "几天到", "什么时候发", "发货时间"],
  包邮: ["运费", "邮费", "免邮"],
  支付: ["付款", "怎么付", "能刷卡", "微信支付", "支付宝"],
  发票: ["开票", "报销"],
  售后: ["坏了", "质量问题", "有问题", "投诉"],
  会员: ["打折", "优惠", "折扣", "VIP"],
};

// 构建反向索引：关键词 -> FAQ key
function buildIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const [key, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      index.set(alias, key);
    }
    index.set(key, key); // 自身也加进去
  }
  return index;
}

const KEYWORD_INDEX = buildIndex();

export const faqTool = tool(
  async ({ question }: { question: string }) => {
    const q = question.toLowerCase();

    // 先精确匹配
    for (const [key, answer] of Object.entries(FAQ_DATA)) {
      if (q.includes(key)) {
        return answer;
      }
    }

    // 再用别名索引匹配
    const matched = Array.from(KEYWORD_INDEX.entries()).find(([keyword]) =>
      q.includes(keyword)
    );
    if (matched) {
      return FAQ_DATA[matched[1]];
    }

    return "这个问题我不太确定，让我帮您转接店主。";
  },
  {
    name: "faq_lookup",
    description:
      "查询常见问题（营业时间、退换货、发货、包邮、支付、发票、售后、会员等）",
    schema: z.object({
      question: z.string().describe("顾客的问题"),
    }),
  }
);
