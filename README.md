
# moneyney 📈

**moneyney** 是一款轻量级的个人基金持仓管理助手。基于 React 18 与 Tailwind CSS 构建，旨在通过简洁直观的界面，帮助投资者轻松完成持仓录入、净值同步、收益分析及定投规划。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vitejs.dev/)

## ✨ 核心特性

- 📊 **多维数据看板**：实时统计总市值、总成本、今日收益及累计盈亏。
- 🔄 **自动净值同步**：接入天天基金、新浪财经等多方接口，**一键获取最新净值与估值**。
- 🧩 **板块持仓分析**：支持自定义标签分类，通过饼图与条形图直观展示资产配置。
- 💸 **交易记录管理**：完整的买入/卖出流水追踪，支持加权平均成本计算与操作撤销。
- 📅 **智能定投规划**：预设各基金定投策略，支持一键执行批量申购。
- 🔐 **隐私与安全**：数据完全存储于用户浏览器 **LocalStorage**，无服务端存储，保障金融数据私密性。
- 📤 **数据备份恢复**：支持标准 JSON 格式的导出与导入，方便跨设备迁移或 AI 辅助分析。

## 🛠️ 技术栈

- **Core**: React 18 / TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## 🚀 快速开始

### 1. 克隆并安装

```bash
git clone https://github.com/your-username/moneyney.git
cd moneyney
pnpm install
```

### 2. 开发环境运行

```bash
pnpm dev
```

### 3. 构建发布

```bash
pnpm build
```

## 📖 使用提示

1. **快速录入**：输入基金代码后点击“获取信息”，录入基金名称及历史净值。
2. **收益对标**：内置大盘指数查询功能，方便对比持仓表现与市场基准。
3. **数据备份**：由于数据存储在本地浏览器缓存，建议定期使用“导出”功能保存备份文件。

## 📄 开源协议

根据 [MIT License](LICENSE) 许可授权。