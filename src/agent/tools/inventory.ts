import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 示例商品库存（实际项目中连接数据库）
const INVENTORY = [
  { id: 1, name: "经典白T恤", stock: 15, price: 89, category: "上衣" },
  { id: 2, name: "牛仔裤", stock: 8, price: 199, category: "裤子" },
  { id: 3, name: "帆布鞋", stock: 0, price: 159, category: "鞋子" },
  { id: 4, name: "运动鞋", stock: 12, price: 259, category: "鞋子" },
  { id: 5, name: "连帽卫衣", stock: 5, price: 169, category: "上衣" },
];

export const inventoryTool = tool(
  async ({ query }: { query: string }) => {
    const q = query.toLowerCase();

    // 搜索商品
    const results = INVENTORY.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.includes(q)
    );

    if (results.length === 0) {
      return "没有找到相关商品，您可以换个关键词试试。";
    }

    return results
      .map(
        (item) =>
          `${item.name} - ¥${item.price} - ${
            item.stock > 0 ? `有货(${item.stock}件)` : "暂时缺货"
          }`
      )
      .join("\n");
  },
  {
    name: "check_inventory",
    description: "查询商品库存和价格。输入商品名或类别（如T恤、鞋子）",
    schema: z.object({
      query: z.string().describe("商品名称或类别"),
    }),
  }
);
