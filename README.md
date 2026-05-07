# SmallBiz AI Agent — 小商家智能客服

让每个小店都拥有一个24小时在线的智能客服。

## 它能做什么

你是一家小店老板，每天重复回答顾客同样的问题：有没有货？怎么发货？能不能便宜点？

这个 Agent 帮你自动搞定：

- **自动回复常见问题** — 营业时间、退换货政策、物流查询
- **智能商品推荐** — 根据库存和顾客需求推荐替代品
- **订单查询** — 顾客报订单号，自动查状态
- **售后处理** — 引导退换货流程
- **转人工** — 遇到解决不了的问题，自动通知店主

## 适用场景

- 淘宝/拼多多小商家
- 线下门店（餐饮、零售、美容美发）
- 社区团购团长
- 本地服务商（家政、维修、教育）

## 技术栈

- **前端**: Next.js 14 + React
- **AI**: OpenAI API + LangChain
- **数据库**: SQLite（轻量，小商家够用）
- **部署**: Vercel / Railway

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/linming413589901/smallbiz-ai-agent.git
cd smallbiz-ai-agent

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 OpenAI API Key

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可体验。

## 项目结构

```
smallbiz-ai-agent/
├── src/
│   ├── app/              # Next.js 页面
│   ├── agent/            # Agent 核心逻辑
│   │   ├── tools/        # Agent 工具（查库存、查订单等）
│   │   ├── prompt.ts     # 系统提示词
│   │   └── chain.ts      # LangChain 链
│   ├── components/       # 前端组件
│   └── lib/              # 工具函数
├── data/                 # 示例数据（商品、FAQ）
├── public/               # 静态资源
└── docs/                 # 文档
```

## 路线图

- [x] 项目初始化
- [ ] 基础对话能力（接入LLM）
- [ ] FAQ 自动回复工具
- [ ] 商品库存查询工具
- [ ] 订单状态查询工具
- [ ] 前端聊天界面
- [ ] 微信接入
- [ ] 商家后台配置

## License

MIT

---

由 [SmallBiz AI Agent](https://github.com/linming413589901/smallbiz-ai-agent) 驱动
