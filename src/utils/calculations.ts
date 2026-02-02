import type { Fund, Statistics } from '../types/index';

// 计算单个基金的市值
export const calculateFundValue = (fund: Fund): number => {
  return fund.shares * fund.currentPrice;
};

// 计算单个基金的成本
export const calculateFundCost = (fund: Fund): number => {
  return fund.shares * fund.costPrice;
};

// 计算单个基金的收益
export const calculateFundProfit = (fund: Fund): number => {
  return calculateFundValue(fund) - calculateFundCost(fund);
};

// 计算单个基金的收益率
export const calculateFundProfitRate = (fund: Fund): number => {
  const cost = calculateFundCost(fund);
  if (cost === 0) return 0;
  return (calculateFundProfit(fund) / cost) * 100;
};

// 计算涨跌幅（基于初始净值）
export const calculatePriceChange = (fund: Fund): { change: number; changeRate: number } => {
  if (!fund.initialPrice || fund.initialPrice === 0) {
    return { change: 0, changeRate: 0 };
  }
  const change = fund.currentPrice - fund.initialPrice;
  const changeRate = (change / fund.initialPrice) * 100;
  return { change, changeRate };
};

// 计算今日涨跌（基于上一次净值）
export const calculateDailyChange = (fund: Fund): { change: number; changeRate: number } | null => {
  if (fund.lastPrice === undefined || fund.lastPrice === 0 || fund.lastPrice === fund.currentPrice) {
    return null;
  }
  const change = fund.currentPrice - fund.lastPrice;
  const changeRate = (change / fund.lastPrice) * 100;
  return { change, changeRate };
};

// 计算统计数据
export const calculateStatistics = (funds: Fund[]): Statistics => {
  const totalValue = funds.reduce((sum, fund) => sum + calculateFundValue(fund), 0);
  const totalCost = funds.reduce((sum, fund) => sum + calculateFundCost(fund), 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitRate = totalCost === 0 ? 0 : (totalProfit / totalCost) * 100;

  // 计算昨日总市值（基于 lastPrice）
  const yesterdayTotalValue = funds.reduce((sum, fund) => {
    // 只计算有有效 lastPrice 的基金
    if (fund.lastPrice === undefined || fund.lastPrice <= 0) return sum;
    return sum + fund.lastPrice * fund.shares;
  }, 0);
  
  // 计算今日收益：基于 lastPrice 计算昨日总市值
  const todayProfit = funds.reduce((sum, fund) => {
    // 只计算有有效 lastPrice 的基金
    if (fund.lastPrice === undefined || fund.lastPrice <= 0) return sum;
    return sum + (fund.currentPrice - fund.lastPrice) * fund.shares;
  }, 0);

  // 计算今日收益率
  const todayProfitRate = yesterdayTotalValue === 0 ? 0 : (todayProfit / yesterdayTotalValue) * 100;

  return {
    totalValue,
    totalCost,
    totalProfit,
    totalProfitRate,
    todayProfit,
    todayProfitRate,
    fundCount: funds.length,
  };
};

// 格式化金额
export const formatCurrency = (amount: number, digits: number = 4): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
};

// 格式化百分比
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// 将 "2026-01-24 05:00" 格式（北京时间）转换为时间戳
export const beijingTimeToTimestamp = (beijingTime: string): number => {
  // 格式：2026-01-24 05:00
  const [datePart, timePart] = beijingTime.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // 创建 UTC 时间（北京时间 = UTC+8，所以减去 8 小时）
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 8, minutes, 0));
  return utcDate.getTime();
};

// 检查当前时间是否在下午3点之后（北京时间）
// 注意：这里假设用户所在时区与北京时间一致，或者用户系统时间已设置为北京时间
export const isAfter3PM = (): boolean => {
  const now = new Date();
  const hours = now.getHours(); // 获取本地时间的小时数
  return hours >= 15; // 15:00 即下午3点
};

// 将时间戳转换为 "2026-01-24 05:00" 格式（北京时间）
export const timestampToBeijingTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  // 获取 UTC 时间，然后加上 8 小时得到北京时间
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth();
  const utcDay = date.getUTCDate();
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  
  // 计算北京时间
  let beijingHours = utcHours + 8;
  let beijingYear = utcYear;
  let beijingMonth = utcMonth;
  let beijingDay = utcDay;
  
  if (beijingHours >= 24) {
    beijingHours -= 24;
    beijingDay++;
    const daysInMonth = new Date(utcYear, utcMonth + 1, 0).getDate();
    if (beijingDay > daysInMonth) {
      beijingDay = 1;
      beijingMonth++;
      if (beijingMonth > 11) {
        beijingMonth = 0;
        beijingYear++;
      }
    }
  }
  
  const year = String(beijingYear);
  const month = String(beijingMonth + 1).padStart(2, '0');
  const day = String(beijingDay).padStart(2, '0');
  const hours = String(beijingHours).padStart(2, '0');
  const minutes = String(utcMinutes).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 将 ISO 格式（如 "2026-01-23T15:00:00+08:00" 或 "2026-01-23T21:00:00.000Z"）转换为 "2026-01-24 05:00" 格式
export const isoToBeijingTime = (isoString: string): string => {
  const date = new Date(isoString);
  return timestampToBeijingTime(date.getTime());
};

// 格式化日期 (YYYY-MM-DD)，支持 "2026-01-24 05:00" 格式
export const formatDate = (dateString: string): string => {
  // 如果已经是 "YYYY-MM-DD HH:mm" 格式，直接提取日期部分
  if (dateString.includes(' ') && !dateString.includes('T')) {
    return dateString.split(' ')[0];
  }
  // 否则转换为北京时间格式再提取日期
  const beijingTime = isoToBeijingTime(dateString);
  return beijingTime.split(' ')[0];
};

// 判断是否为今天（基于本地日期），支持 "2026-01-24 05:00" 格式
export const isToday = (dateString: string): boolean => {
  let dateStr: string;
  // 如果已经是 "YYYY-MM-DD HH:mm" 格式，直接提取日期部分
  if (dateString.includes(' ') && !dateString.includes('T')) {
    dateStr = dateString.split(' ')[0];
  } else {
    // 否则转换为北京时间格式再提取日期
    dateStr = formatDate(dateString);
  }
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  return dateStr === todayStr;
};
