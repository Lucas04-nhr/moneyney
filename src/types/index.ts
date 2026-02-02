// 基金持仓数据类型
export interface Fund {
  id: string; // 基金编号（主键）
  name: string; // 基金名称
  shares: number; // 持有份额
  costPrice: number; // 持仓成本价（每份）
  currentPrice: number; // 当前净值
  lastPrice?: number; // 上一次更新的净值（用于计算今日涨跌）
  initialPrice?: number; // 初始净值（可选，用于计算涨跌）
  priceUpdatedAt: string; // 净值最后更新时间
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
  investmentStrategy?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    amount: number;
  };
  tag?: string; // 基金标签（单个）
  // 便于扩展的字段
  [key: string]: any;
}

// 交易记录类型
export interface Transaction {
  id: string;
  fundId: string;
  fundName?: string; // 冗余字段，方便在全局列表显示
  type: 'buy' | 'sell'; // 买入或卖出
  shares: number; // 交易份额
  price: number; // 交易时的净值
  amount: number; // 交易金额
  date: string; // 交易日期
  reverted?: boolean; // 是否已撤销
}

// 统计数据
export interface Statistics {
  totalValue: number; // 总市值
  totalCost: number; // 总成本
  totalProfit: number; // 总收益
  totalProfitRate: number; // 总收益率
  todayProfit: number; // 今日收益
  todayProfitRate: number; // 今日收益率
  fundCount: number; // 基金数量
}
