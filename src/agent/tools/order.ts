import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 示例订单数据（实际项目中连接数据库）
const ORDERS = [
  {
    orderId: "ORD20260501001",
    customer: "张三",
    items: ["经典白T恤 x2", "牛仔裤 x1"],
    total: 377,
    status: "已发货",
    express: "顺丰 SF1234567890",
    createdAt: "2026-05-01",
  },
  {
    orderId: "ORD20260502002",
    customer: "李四",
    items: ["运动鞋 x1"],
    total: 259,
    status: "待发货",
    express: "",
    createdAt: "2026-05-02",
  },
  {
    orderId: "ORD20260503003",
    customer: "王五",
    items: ["连帽卫衣 x1", "帆布鞋 x1"],
    total: 328,
    status: "已签收",
    express: "中通 ZT9876543210",
    createdAt: "2026-05-03",
  },
  {
    orderId: "ORD20260505004",
    customer: "赵六",
    items: ["经典白T恤 x1"],
    total: 89,
    status: "已发货",
    express: "圆通 YT1122334455",
    createdAt: "2026-05-05",
  },
  {
    orderId: "ORD20260506005",
    customer: "张三",
    items: ["帆布鞋 x1"],
    total: 159,
    status: "已退款",
    express: "",
    createdAt: "2026-05-06",
  },
];

export const orderTool = tool(
  async ({ orderId, customer }: { orderId?: string; customer?: string }) => {
    let results = ORDERS;

    // 按订单号查询
    if (orderId) {
      results = results.filter((o) =>
        o.orderId.toLowerCase().includes(orderId.toLowerCase())
      );
    }

    // 按客户名查询
    if (customer) {
      results = results.filter((o) => o.customer.includes(customer));
    }

    if (results.length === 0) {
      return "没有找到相关订单，请确认订单号或联系人姓名。";
    }

    return results
      .map(
        (o) =>
          `订单号: ${o.orderId}\n` +
          `商品: ${o.items.join(", ")}\n` +
          `金额: ¥${o.total}\n` +
          `状态: ${o.status}${o.express ? `\n快递: ${o.express}` : ""}\n` +
          `下单时间: ${o.createdAt}`
      )
      .join("\n---\n");
  },
  {
    name: "query_order",
    description:
      "查询订单状态、物流信息。可按订单号或客户姓名查询。至少提供一个参数。",
    schema: z.object({
      orderId: z
        .string()
        .optional()
        .describe("订单号，如 ORD20260501001"),
      customer: z.string().optional().describe("客户姓名"),
    }),
  }
);
