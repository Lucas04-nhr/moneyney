import type { Fund, Transaction } from '../types/index';
// import { isoToBeijingTime } from './calculations'; // 已注释：数据清洗代码已禁用

const FUNDS_STORAGE_KEY = 'moneyney-funds';
const TRANSACTIONS_STORAGE_KEY = 'moneyney-transactions';
const YESTERDAY_TOTAL_VALUE_KEY = 'moneyney-yesterday-total-value';
const TODAY_TOTAL_VALUE_KEY = 'moneyney-today-total-value';
const LAST_UPDATE_DATE_KEY = 'moneyney-last-update-date';

/** 示例基金代码列表（无数据时自动创建） */
export const DEMO_FUND_IDS = ['002834', '021483', '012365', '001092'];

// 清洗 priceUpdatedAt 字段，将 ISO 格式转换为 "2026-01-24 05:00" 格式
// 已注释：数据已清洗完成，不再需要清洗
// const cleanPriceUpdatedAt = (fund: Fund): Fund => {
//   if (fund.priceUpdatedAt) {
//     // 如果已经是 "YYYY-MM-DD HH:mm" 格式，不需要转换
//     if (fund.priceUpdatedAt.includes(' ') && !fund.priceUpdatedAt.includes('T')) {
//       return fund;
//     }
//     // 否则转换为北京时间格式
//     return {
//       ...fund,
//       priceUpdatedAt: isoToBeijingTime(fund.priceUpdatedAt)
//     };
//   }
//   return fund;
// };

// 清洗 investmentStrategy 字段
const cleanInvestmentStrategy = (strategy: any): { frequency: 'daily' | 'weekly' | 'monthly'; amount: number } | undefined => {
  if (!strategy) return undefined;
  
  let frequency: 'daily' | 'weekly' | 'monthly' = 'daily';
  let amount: number = 0;
  
  // 处理 frequency：支持中文和英文格式
  if (typeof strategy.frequency === 'string') {
    const freq = strategy.frequency;
    if (freq === '日定投' || freq === 'daily') {
      frequency = 'daily';
    } else if (freq === '周定投' || freq === 'weekly') {
      frequency = 'weekly';
    } else if (freq === '月定投' || freq === 'monthly') {
      frequency = 'monthly';
    }
  }
  
  // 处理 amount：支持字符串（带单位）和数字格式
  if (typeof strategy.amount === 'string') {
    // 移除 "元"、"¥" 等字符，提取数字
    const numStr = strategy.amount.replace(/[元¥,，]/g, '').trim();
    amount = parseFloat(numStr) || 0;
  } else if (typeof strategy.amount === 'number') {
    amount = strategy.amount;
  }
  
  return { frequency, amount };
};

// 获取所有基金
export const getFunds = (): Fund[] => {
  try {
    const data = localStorage.getItem(FUNDS_STORAGE_KEY);
    const funds = data ? JSON.parse(data) : [];
    
    // 清洗 investmentStrategy 字段（兼容旧格式数据）
    const cleanedFunds = funds.map((fund: Fund) => {
      if (fund.investmentStrategy) {
        const cleaned = cleanInvestmentStrategy(fund.investmentStrategy);
        if (cleaned) {
          return { ...fund, investmentStrategy: cleaned };
        }
      }
      return fund;
    });
    
    // 如果清洗后有变化，保存回存储
    const needsSave = cleanedFunds.some((fund: Fund, index: number) => {
      const oldStrategy = funds[index]?.investmentStrategy;
      const newStrategy = fund.investmentStrategy;
      if (!oldStrategy && !newStrategy) return false;
      if (!oldStrategy || !newStrategy) return true;
      return oldStrategy.frequency !== newStrategy.frequency || oldStrategy.amount !== newStrategy.amount;
    });
    
    if (needsSave) {
      saveFunds(cleanedFunds);
    }
    
    return cleanedFunds;
  } catch (error) {
    console.error('读取基金数据失败：', error);
    return [];
  }
};

// 保存所有基金
export const saveFunds = (funds: Fund[]): void => {
  try {
    localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(funds));
  } catch (error) {
    console.error('保存基金数据失败：', error);
  }
};

// 添加基金
export const addFund = (fund: Fund): void => {
  const funds = getFunds();
  funds.push(fund);
  saveFunds(funds);
};

// 更新基金
export const updateFund = (fundId: string, updates: Partial<Fund>): void => {
  const funds = getFunds();
  const index = funds.findIndex(f => f.id === fundId);
  if (index !== -1) {
    funds[index] = { ...funds[index], ...updates, updatedAt: new Date().toISOString() };
    saveFunds(funds);
  }
};

// 删除基金
export const deleteFund = (fundId: string): void => {
  const funds = getFunds();
  const filtered = funds.filter(f => f.id !== fundId);
  saveFunds(filtered);
};

// 清空所有基金
export const clearFunds = (): void => {
  localStorage.removeItem(FUNDS_STORAGE_KEY);
  localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
};

// 清理超过 3 天的交易记录
const cleanOldTransactions = (transactions: Transaction[]): Transaction[] => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoTime = threeDaysAgo.getTime();
  
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getTime() >= threeDaysAgoTime;
  });
};

// 获取交易记录（自动清理超过 3 天的记录）
export const getTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    const transactions = data ? JSON.parse(data) : [];
    // 清理超过 3 天的记录
    const cleanedTransactions = cleanOldTransactions(transactions);
    // 如果清理后有变化，保存回存储
    if (cleanedTransactions.length !== transactions.length) {
      saveTransactions(cleanedTransactions);
    }
    return cleanedTransactions;
  } catch (error) {
    console.error('读取交易记录失败：', error);
    return [];
  }
};

// 保存交易记录
export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('保存交易记录失败：', error);
  }
};

// 添加交易记录
export const addTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  transactions.unshift(transaction); // 新纪录在前面
  // 清理超过 3 天的记录
  const cleanedTransactions = cleanOldTransactions(transactions);
  saveTransactions(cleanedTransactions);
};

// 更新交易记录
export const updateTransaction = (transactionId: string, updates: Partial<Transaction>): void => {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    // 清理超过 3 天的记录
    const cleanedTransactions = cleanOldTransactions(transactions);
    saveTransactions(cleanedTransactions);
  }
};

// 导出数据
export const exportData = (): string => {
  const funds = getFunds();
  const transactions = getTransactions();
  
  // 导出时清洗字段，只保留导入时会用到的字段
  const cleanedFunds = funds.map((fund: Fund) => {
    return {
      id: fund.id,
      name: fund.name,
      shares: fund.shares,
      costPrice: fund.costPrice,
      currentPrice: fund.currentPrice,
      initialPrice: fund.initialPrice,
      priceUpdatedAt: fund.priceUpdatedAt,
      createdAt: fund.createdAt,
      investmentStrategy: fund.investmentStrategy,
      tag: fund.tag,
    };
  });
  
  return JSON.stringify({ funds: cleanedFunds, transactions }, null, 2);
};

// 导入数据
export const importData = (jsonString: string): { success: boolean; message: string } => {
  try {
    const data = JSON.parse(jsonString);
    if (data.funds && Array.isArray(data.funds)) {
      // 导入时不清洗，直接保存
      saveFunds(data.funds);
    }
    if (data.transactions && Array.isArray(data.transactions)) {
      saveTransactions(data.transactions);
    }
    return { success: true, message: '数据导入成功' };
  } catch {
    return { success: false, message: '数据格式错误，导入失败' };
  }
};

// 获取当前日期（YYYY-MM-DD格式）
const getCurrentDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 获取昨日总持仓金额
export const getYesterdayTotalValue = (): number | null => {
  try {
    const data = localStorage.getItem(YESTERDAY_TOTAL_VALUE_KEY);
    return data ? parseFloat(data) : null;
  } catch (error) {
    console.error('读取昨日总持仓金额失败：', error);
    return null;
  }
};

// 保存昨日总持仓金额
export const saveYesterdayTotalValue = (value: number): void => {
  try {
    localStorage.setItem(YESTERDAY_TOTAL_VALUE_KEY, value.toString());
  } catch (error) {
    console.error('保存昨日总持仓金额失败：', error);
  }
};

// 获取今日总持仓金额
export const getTodayTotalValue = (): number | null => {
  try {
    const data = localStorage.getItem(TODAY_TOTAL_VALUE_KEY);
    return data ? parseFloat(data) : null;
  } catch (error) {
    console.error('读取今日总持仓金额失败：', error);
    return null;
  }
};

// 保存今日总持仓金额
export const saveTodayTotalValue = (value: number): void => {
  try {
    localStorage.setItem(TODAY_TOTAL_VALUE_KEY, value.toString());
  } catch (error) {
    console.error('保存今日总持仓金额失败：', error);
  }
};

// 获取最后更新日期
export const getLastUpdateDate = (): string | null => {
  try {
    return localStorage.getItem(LAST_UPDATE_DATE_KEY);
  } catch (error) {
    console.error('读取最后更新日期失败：', error);
    return null;
  }
};

// 保存最后更新日期
export const saveLastUpdateDate = (date: string): void => {
  try {
    localStorage.setItem(LAST_UPDATE_DATE_KEY, date);
  } catch (error) {
    console.error('保存最后更新日期失败：', error);
  }
};

// 检查并更新昨日总持仓金额（如果日期变化，保存昨日总持仓金额）
// currentTotalValue: 更新后的当前总持仓金额
export const checkAndUpdateYesterdayTotalValue = (currentTotalValue: number): void => {
  const today = getCurrentDate();
  const lastUpdateDate = getLastUpdateDate();
  
  // 如果日期变化了，将"今日总持仓金额"保存为"昨日总持仓金额"
  if (lastUpdateDate && lastUpdateDate !== today) {
    const todayTotalValue = getTodayTotalValue();
    // 如果存在今日总持仓金额，将其保存为昨日总持仓金额
    // 如果不存在（可能是第一次跨日），则使用当前总持仓金额
    if (todayTotalValue !== null) {
      saveYesterdayTotalValue(todayTotalValue);
    }
  }
  
  // 更新今日总持仓金额为当前值
  saveTodayTotalValue(currentTotalValue);
  
  // 更新最后更新日期
  saveLastUpdateDate(today);
};
