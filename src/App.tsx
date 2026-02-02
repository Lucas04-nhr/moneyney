import { useState, useRef, useEffect } from 'react';
import type { Fund, Transaction } from './types/index';
import {
  getFunds,
  addFund,
  updateFund,
  deleteFund,
  clearFunds,
  getTransactions,
  addTransaction,
  updateTransaction,
  exportData,
  importData,
  DEMO_FUND_IDS
} from './utils/storage';
import { calculateStatistics, timestampToBeijingTime } from './utils/calculations';
import { checkAndUpdateYesterdayTotalValue } from './utils/storage';
import { Dashboard } from './components/Dashboard';
import { FundList } from './components/FundList';
import { AddFundDialog } from './components/AddFundDialog';
import { UpdatePriceDialog } from './components/UpdatePriceDialog';
import { TransactionDialog } from './components/TransactionDialog';
import { BatchUpdateDialog } from './components/BatchUpdateDialog';
import { TransactionListDialog } from './components/TransactionListDialog';
import { AIAnalysisDialog } from './components/AIAnalysisDialog';
import { InvestmentStrategyDialog } from './components/InvestmentStrategyDialog';
import { MarketPanelDialog } from './components/MarketPanelDialog';
import { EditFundDialog } from './components/EditFundDialog';
import { ImportJsonDialog } from './components/ImportJsonDialog';
import { Button } from './components/ui/Button';
import { ToastContainer, type Toast } from './components/ui/Toast';
import { Plus, Download, Upload, RefreshCw, Trash2, History, ChevronDown, BrainCircuit, Calculator, LineChart, Zap } from 'lucide-react';
import { fetchFundGZ } from './utils/api';

function App() {
  const [funds, setFunds] = useState<Fund[]>(() => getFunds());
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showBatchUpdateDialog, setShowBatchUpdateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showImportJsonDialog, setShowImportJsonDialog] = useState(false);
  const [showAIAnalysisDialog, setShowAIAnalysisDialog] = useState(false);
  const [showInvestmentStrategyDialog, setShowInvestmentStrategyDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarketDialog, setShowMarketDialog] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showSyncDropdown, setShowSyncDropdown] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [historyFilterFundId, setHistoryFilterFundId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const syncDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
      if (syncDropdownRef.current && !syncDropdownRef.current.contains(event.target as Node)) {
        setShowSyncDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 无基金时自动创建示例基金（002834、021483）并请求接口填充数据，复用“基金列表为空”判断
  useEffect(() => {
    if (getFunds().length > 0) return;

    const createDemoFunds = async () => {
      const now = new Date().toISOString();
      for (const fundId of DEMO_FUND_IDS) {
        const tag = fundId === '021483' ? '示例-红利' : fundId === '012365' ? '示例-科技' : fundId === '001092' ? '示例-生物' : '示例';
        try {
          const data = await fetchFundGZ(fundId);
          const price = data?.dwjz ? parseFloat(data.dwjz) : 1;
          const validPrice = !isNaN(price) && price > 0 ? price : 1;

          const demoFund: Fund = {
            id: fundId,
            name: data?.name || '示例基金',
            shares: 1000,
            costPrice: validPrice,
            currentPrice: data?.gsz ? parseFloat(data.gsz) || validPrice : validPrice,
            lastPrice: validPrice,
            priceUpdatedAt: data?.gztime || timestampToBeijingTime(Date.now()),
            createdAt: now,
            updatedAt: now,
            investmentStrategy: { frequency: 'daily', amount: 0 },
            tag,
          };
          if (data?.gszzl !== undefined && data.gszzl !== null && data.gszzl !== '') {
            demoFund.gszzl = data.gszzl;
          }
          addFund(demoFund);
        } catch (e) {
          console.error(`创建示例基金 ${fundId} 失败：`, e);
          const fallback: Fund = {
            id: fundId,
            name: '示例基金',
            shares: 1000,
            costPrice: 1,
            currentPrice: 1,
            priceUpdatedAt: timestampToBeijingTime(Date.now()),
            createdAt: now,
            updatedAt: now,
            investmentStrategy: { frequency: 'daily', amount: 0 },
            tag,
          };
          addFund(fallback);
        }
      }
      setFunds(getFunds());
    };

    createDemoFunds();
  }, []);

  // 添加基金
  const handleAddFund = (fundData: Omit<Fund, 'createdAt' | 'updatedAt'>) => {
    const newFund: Fund = {
      id: fundData.id,
      name: fundData.name,
      shares: fundData.shares,
      costPrice: fundData.costPrice,
      currentPrice: fundData.currentPrice,
      initialPrice: fundData.initialPrice,
      priceUpdatedAt: fundData.priceUpdatedAt,
      investmentStrategy: fundData.investmentStrategy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addFund(newFund);
    setFunds([...getFunds()]);
  };

  // 更新净值
  const handleUpdatePrice = (fundId: string, price: number) => {
    const fund = funds.find(f => f.id === fundId);
    if (!fund || fund.currentPrice === price) return; // 价格没变，不更新

    // 使用当前北京时间
    const now = new Date();
    const beijingTime = timestampToBeijingTime(now.getTime());

    updateFund(fundId, {
      lastPrice: fund.currentPrice,
      currentPrice: price,
      priceUpdatedAt: beijingTime
    });
    
    // 计算更新后的总持仓金额并更新记录
    const updatedFunds = getFunds();
    const currentTotalValue = updatedFunds.reduce((sum, f) => sum + f.shares * f.currentPrice, 0);
    checkAndUpdateYesterdayTotalValue(currentTotalValue);
    
    setFunds([...updatedFunds]);
  };

  // 批量更新净值
  const handleBatchUpdate = (updates: { fundId: string; price: number }[]) => {
    // 使用当前北京时间
    const now = new Date();
    const beijingTime = timestampToBeijingTime(now.getTime());

    updates.forEach(({ fundId, price }) => {
      const fund = funds.find(f => f.id === fundId);
      if (!fund || fund.currentPrice === price) return; // 价格没变，不更新

      updateFund(fundId, {
        lastPrice: fund.currentPrice,
        currentPrice: price,
        priceUpdatedAt: beijingTime
      });
    });
    
    // 计算更新后的总持仓金额并更新记录
    const updatedFunds = getFunds();
    const currentTotalValue = updatedFunds.reduce((sum, f) => sum + f.shares * f.currentPrice, 0);
    checkAndUpdateYesterdayTotalValue(currentTotalValue);
    
    setFunds([...updatedFunds]);
  };

  // 更新定投策略
  const handleUpdateStrategies = (updates: { fundId: string; frequency: 'daily' | 'weekly' | 'monthly'; amount: number }[]) => {
    updates.forEach(({ fundId, frequency, amount }) => {
      updateFund(fundId, {
        investmentStrategy: { frequency, amount }
      });
    });
    setFunds([...getFunds()]);
  };

  // 执行今日定投
  const handleExecuteInvestment = async (fundIds: string[]) => {
    if (fundIds.length === 0) return;

    // 先更新所有基金的净值（如果基金列表不为空）
    if (funds.length > 0) {
      showToast('正在更新基金净值...', 'info');
      await handleSyncAllNAV();
    }
    
    // 重新获取更新后的基金数据
    const currentFunds = getFunds();

    // 预检查：如果存在任何问题，直接拦截，不执行定投
    for (const fundId of fundIds) {
      const fund = currentFunds.find(f => f.id === fundId);

      // 检查基金是否存在
      if (!fund) {
        showToast(`${fundId}: 基金不存在，定投已取消`, 'error');
        return;
      }

      const strategy = fund.investmentStrategy;
      // 未配置定投金额直接跳过，不检查
      if (!strategy || strategy.amount <= 0) {
        continue;
      }

      // 检查是否为日定投
      if (strategy.frequency !== 'daily') {
        showToast(`${fund.name}: 仅支持日定投，定投已取消`, 'error');
        return;
      }

      // 检查定投金额是否过小
      const amount = strategy.amount;
      const price = fund.currentPrice;
      const shares = amount / price;
      if (shares <= 0) {
        showToast(`${fund.name}: 定投金额过小，定投已取消`, 'error');
        return;
      }
    }

    // 所有检查通过，执行定投操作
    let successCount = 0;
    fundIds.forEach(fundId => {
      const fund = currentFunds.find(f => f.id === fundId);
      if (!fund) return;

      const strategy = fund.investmentStrategy;
      // 未配置定投金额直接跳过
      if (!strategy || strategy.amount <= 0) {
        return;
      }

      // 执行买入操作（使用更新后的最新净值）
      const amount = strategy.amount;
      const price = fund.currentPrice;
      const shares = amount / price;

      if (shares > 0) {
        handleTransaction(fundId, 'buy', shares, price);
        successCount++;
      }
    });

    // 显示成功结果
    if (successCount > 0) {
      showToast(`定投成功：${successCount}只基金`, 'success');
    }
  };

  // 编辑基金信息
  const handleUpdateFundInfo = (fundId: string, updates: Partial<Fund>) => {
    updateFund(fundId, updates);
    setFunds([...getFunds()]);
  };

  // 一键同步基金净值
  const handleSyncAllNAV = async () => {
    if (funds.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    await Promise.all(funds.map(async (fund) => {
      try {
        const data = await fetchFundGZ(fund.id);
        if (data && data.gsz && data.gztime) {
          const newPrice = parseFloat(data.gsz);
          // 使用接口返回的 dwjz（单位净值）作为 lastPrice
          const dwjz = data.dwjz ? parseFloat(data.dwjz) : null;

          // 无论 gztime 和 priceUpdatedAt 谁大谁小，只要接口返回了 gztime 都算同步成功
          // priceUpdatedAt 替换为 gztime 对应的时间
          if (fund.currentPrice !== newPrice) {
            // 价格有变化：更新 lastPrice（使用 dwjz）、currentPrice、priceUpdatedAt 和 gszzl
            const updateData: any = {
              currentPrice: newPrice,
              priceUpdatedAt: data.gztime,
              gszzl: data.gszzl // 保存涨跌幅字段
            };
            
            // 如果有 dwjz，使用 dwjz 作为 lastPrice；否则使用当前 currentPrice
            if (dwjz !== null && !isNaN(dwjz) && dwjz > 0) {
              updateData.lastPrice = dwjz;
            } else {
              // 如果没有 dwjz，使用当前 currentPrice 作为 lastPrice（兼容旧数据）
              updateData.lastPrice = fund.currentPrice;
            }
            
            updateFund(fund.id, updateData);
            successCount++;
          } else {
            // 价格没变：更新 lastPrice（使用 dwjz）、priceUpdatedAt 和 gszzl
            const updateData: any = {
              priceUpdatedAt: data.gztime,
              gszzl: data.gszzl // 即使价格没变，也要更新涨跌幅字段
            };
            
            // 如果有 dwjz，使用 dwjz 作为 lastPrice
            if (dwjz !== null && !isNaN(dwjz) && dwjz > 0) {
              updateData.lastPrice = dwjz;
            }
            
            updateFund(fund.id, updateData);
            successCount++;
          }
        } else {
          console.error(`基金 ${fund.name}(${fund.id}) 接口返回数据异常:`, data);
          failCount++;
        }
      } catch (e) {
        console.error(`基金 ${fund.name}(${fund.id}) 同步发生错误:`, e);
        failCount++;
      }
    }));

    // 计算更新后的总持仓金额并更新记录
    const updatedFunds = getFunds();
    const currentTotalValue = updatedFunds.reduce((sum, f) => sum + f.shares * f.currentPrice, 0);
    checkAndUpdateYesterdayTotalValue(currentTotalValue);
    
    setFunds([...updatedFunds]);
    setIsSyncing(false);

    if (successCount > 0) {
      showToast(`同步完成！成功：${successCount}只，失败：${failCount}只`, 'success');
    } else {
      showToast('同步失败，请检查网络或跨域设置。', 'error');
    }
  };

  // 买卖操作
  const handleTransaction = (fundId: string, type: 'buy' | 'sell', shares: number, price: number) => {
    const fund = funds.find(f => f.id === fundId);
    if (!fund) return;

    let newShares: number;
    let newCostPrice: number;

    if (type === 'buy') {
      // 买入：计算新的成本价（加权平均）
      const oldCost = fund.shares * fund.costPrice;
      const newCost = shares * price;
      newShares = fund.shares + shares;
      newCostPrice = (oldCost + newCost) / newShares;
    } else {
      // 卖出：份额减少，成本价不变
      newShares = fund.shares - shares;
      newCostPrice = fund.costPrice;
    }

    // 更新基金（不更新当前净值）
    updateFund(fundId, {
      shares: newShares,
      costPrice: newCostPrice,
    });

    // 记录交易
    const transaction: Transaction = {
      id: `${Date.now()}-${Math.random()}`,
      fundId,
      fundName: fund.name,
      type,
      shares,
      price,
      amount: shares * price,
      date: new Date().toISOString(),
      reverted: false,
    };
    addTransaction(transaction);

    setFunds([...getFunds()]);
  };

  // 撤销/恢复交易
  const handleToggleRevertTransaction = (transactionId: string) => {
    const transactions = getTransactions();
    const transaction = transactions.find((t: Transaction) => t.id === transactionId);
    if (!transaction) return;

    const fund = getFunds().find(f => f.id === transaction.fundId);
    if (!fund) {
      showToast('无法执行此操作：关联基金已删除', 'error');
      return;
    }

    const isReverting = !transaction.reverted; // 如果当前是正常，则是要撤销；如果是已撤销，则是要恢复

    let newShares: number;
    let newCostPrice: number;

    if (isReverting) {
      // 撤销逻辑：反向操作
      if (transaction.type === 'buy') {
        // 撤销买入：减少份额，重新计算成本价
        newShares = fund.shares - transaction.shares;
        if (newShares <= 0) {
          newCostPrice = fund.initialPrice || 0;
        } else {
          // 原成本 = (当前总成本 - 交易成本) / 剩余份额
          const currentTotalCost = fund.shares * fund.costPrice;
          const transactionCost = transaction.shares * transaction.price;
          newCostPrice = (currentTotalCost - transactionCost) / newShares;
        }
      } else {
        // 撤销卖出：增加份额，成本价不变
        newShares = fund.shares + transaction.shares;
        newCostPrice = fund.costPrice;
      }
    } else {
      // 恢复逻辑：重新执行交易
      if (transaction.type === 'buy') {
        const oldCost = fund.shares * fund.costPrice;
        const newCost = transaction.shares * transaction.price;
        newShares = fund.shares + transaction.shares;
        newCostPrice = (oldCost + newCost) / newShares;
      } else {
        newShares = fund.shares - transaction.shares;
        newCostPrice = fund.costPrice;
      }
    }

    // 检查非法状态（比如份额变成负数）
    if (newShares < 0) {
      showToast('操作失败：撤销后份额将小于0', 'error');
      return;
    }

    // 更新基金
    updateFund(fund.id, {
      shares: newShares,
      costPrice: newCostPrice,
    });

    // 更新交易状态
    updateTransaction(transactionId, { reverted: isReverting });

    setFunds([...getFunds()]);
  };

  // 删除基金
  const handleDeleteFund = (fundId: string) => {
    if (confirm('确定要删除这只基金吗？')) {
      deleteFund(fundId);
      setFunds([...getFunds()]);
    }
  };

  // 清空数据
  const handleClearData = () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      clearFunds();
      setFunds([]);
      showToast('数据已清空', 'success');
    }
  };

  // 导出数据
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneyney-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  // 生成带注释的 AI 分析数据
  const generateAIData = () => {
    const data = JSON.parse(exportData());
    const stats = calculateStatistics(funds);
    const aiFriendlyData = {
      // 字段含义说明
      _fieldDescriptions: {
        id: '基金编号',
        name: '基金名称',
        shares: '当前持有份额',
        costPrice: '持仓成本均价 (单份)',
        currentPrice: '最新单位净值 (当前市价)',
        marketValue: '当前持仓总市值',
        totalCost: '持仓总成本',
        profit: '当前账面累计盈亏金额',
        profitRate: '当前收益率',
        todayChangeRate: '今日涨跌幅 (百分比，正数表示上涨，负数表示下跌)',
        investmentStrategy: '定投规划策略',
      },
      // 整体持仓统计（所有金额保留两位小数）
      summary: {
        totalValue: parseFloat(stats.totalValue.toFixed(2)),
        totalCost: parseFloat(stats.totalCost.toFixed(2)),
        totalProfit: parseFloat(stats.totalProfit.toFixed(2)),
        totalProfitRate: parseFloat(stats.totalProfitRate.toFixed(2)),
        todayProfit: parseFloat(stats.todayProfit.toFixed(2)),
        todayProfitRate: parseFloat(stats.todayProfitRate.toFixed(2)),
        fundCount: stats.fundCount,
      },
      // 各基金详细持仓（所有金额保留两位小数）
      funds: data.funds.map((f: Fund) => {
        // 从原始 funds 数据中获取 gszzl（因为导出时被清洗掉了）
        const originalFund = funds.find(fund => fund.id === f.id);
        const todayChangeRate = originalFund?.gszzl ? parseFloat(originalFund.gszzl) : null;
        
        return {
          id: f.id,
          name: f.name,
          shares: parseFloat(f.shares.toFixed(2)),
          costPrice: parseFloat(f.costPrice.toFixed(2)),
          currentPrice: parseFloat(f.currentPrice.toFixed(2)),
          initialPrice: f.initialPrice ? parseFloat(f.initialPrice.toFixed(2)) : null,
          marketValue: parseFloat((f.shares * f.currentPrice).toFixed(2)),
          totalCost: parseFloat((f.shares * f.costPrice).toFixed(2)),
          profit: parseFloat(((f.currentPrice - f.costPrice) * f.shares).toFixed(2)),
          profitRate: ((f.currentPrice - f.costPrice) / f.costPrice * 100).toFixed(2) + '%',
          todayChangeRate: todayChangeRate !== null ? `${todayChangeRate >= 0 ? '+' : ''}${todayChangeRate.toFixed(2)}%` : '暂无数据',
          priceUpdatedAt: f.priceUpdatedAt,
          investmentStrategy: f.investmentStrategy ? {
            frequency: f.investmentStrategy.frequency === 'daily' ? '日定投' : f.investmentStrategy.frequency === 'weekly' ? '周定投' : '月定投',
            amount: f.investmentStrategy.amount.toFixed(2) + '元'
          } : '未配置定投策略'
        };
      })
    };
    return JSON.stringify(aiFriendlyData, null, 2);
  };

  // 从文件导入数据
  const handleImportFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const result = importData(text);
        if (result.success) {
          setFunds([...getFunds()]);
          showToast('数据导入成功！', 'success');
        } else {
          showToast(result.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 从粘贴的 JSON 导入数据
  const handleImportFromPaste = (jsonString: string) => {
    const result = importData(jsonString);
    if (result.success) {
      setFunds([...getFunds()]);
      showToast('数据导入成功！', 'success');
    } else {
      showToast(result.message, 'error');
    }
    return result;
  };

  const stats = calculateStatistics(funds);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">moneyney</h1>
          <p className="text-gray-600">管理您的基金投资组合</p>
        </div>

        {/* 操作按钮栏 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative" ref={addDropdownRef}>
            <Button onClick={() => setShowAddDropdown(!showAddDropdown)}>
              <Plus className="h-4 w-4 mr-2" />
              新增基金
              <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
            </Button>

            {showAddDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setShowAddDialog(true);
                    setShowAddDropdown(false);
                  }}
                >
                  <Plus className="h-4 w-4 text-blue-500" />
                  手动添加
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                  onClick={() => {
                    handleImportFromFile();
                    setShowAddDropdown(false);
                  }}
                >
                  <Upload className="h-4 w-4 text-green-500" />
                  从文件导入
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                  onClick={() => {
                    setShowImportJsonDialog(true);
                    setShowAddDropdown(false);
                  }}
                >
                  <Upload className="h-4 w-4 text-blue-500" />
                  粘贴 JSON 数据
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={syncDropdownRef}>
            <Button
              variant="default"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              onClick={() => setShowSyncDropdown(!showSyncDropdown)}
              disabled={funds.length === 0 || isSyncing}
            >
              <Zap className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse text-yellow-300' : ''}`} />
              {isSyncing ? '同步中...' : '净值同步'}
              <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
            </Button>

            {showSyncDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    handleSyncAllNAV();
                    setShowSyncDropdown(false);
                  }}
                >
                  <Zap className="h-4 w-4 text-yellow-500" />
                  一键自动同步
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                  onClick={() => {
                    setShowBatchUpdateDialog(true);
                    setShowSyncDropdown(false);
                  }}
                >
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  批量手动更新
                </button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setShowMarketDialog(true)}
          >
            <LineChart className="h-4 w-4 mr-2" />
            大盘查询
          </Button>
          {false && (
            <Button
              variant="outline"
              onClick={() => setShowInvestmentStrategyDialog(true)}
              disabled={funds.length === 0}
            >
              <Calculator className="h-4 w-4 mr-2" />
              定投规划
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setHistoryFilterFundId(null);
              setShowHistoryDialog(true);
            }}
          >
            <History className="h-4 w-4 mr-2" />
            交易记录
          </Button>

          <div className="relative" ref={exportDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              <Download className="h-4 w-4 mr-2" />
              导出数据
              <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
            </Button>

            {showExportDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setShowAIAnalysisDialog(true);
                    setShowExportDropdown(false);
                  }}
                >
                  <BrainCircuit className="h-4 w-4 text-purple-500" />
                  让 AI 分析
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 text-blue-500" />
                  下载 JSON
                </button>
              </div>
            )}
          </div>

          <Button
            variant="destructive"
            onClick={handleClearData}
            disabled={funds.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清空数据
          </Button>
        </div>

        {/* 看板 */}
        <Dashboard stats={stats} funds={funds} />

        {/* 基金列表 */}
        <FundList
          funds={funds}
          onUpdatePrice={(fund) => {
            setSelectedFund(fund);
            setShowUpdateDialog(true);
          }}
          onEdit={(fund) => {
            setSelectedFund(fund);
            setShowEditDialog(true);
          }}
          onTransaction={(fund) => {
            setSelectedFund(fund);
            setShowTransactionDialog(true);
          }}
          onDelete={handleDeleteFund}
          onViewHistory={(fundId) => {
            setHistoryFilterFundId(fundId);
            setShowHistoryDialog(true);
          }}
        />

        {/* 对话框 */}
        <AddFundDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddFund}
        />

        <UpdatePriceDialog
          open={showUpdateDialog}
          onClose={() => {
            setShowUpdateDialog(false);
            setSelectedFund(null);
          }}
          fund={selectedFund}
          onUpdate={handleUpdatePrice}
        />

        <TransactionDialog
          open={showTransactionDialog}
          onClose={() => {
            setShowTransactionDialog(false);
            setSelectedFund(null);
          }}
          fund={selectedFund}
          onTransaction={handleTransaction}
          showToast={showToast}
        />

        <BatchUpdateDialog
          open={showBatchUpdateDialog}
          onClose={() => setShowBatchUpdateDialog(false)}
          funds={funds}
          onUpdate={handleBatchUpdate}
        />

        <TransactionListDialog
          open={showHistoryDialog}
          onClose={() => {
            setShowHistoryDialog(false);
            setHistoryFilterFundId(null);
          }}
          title={historyFilterFundId ? `${funds.find(f => f.id === historyFilterFundId)?.name || ''} 交易记录` : "全部交易记录"}
          transactions={historyFilterFundId
            ? getTransactions().filter((t: Transaction) => t.fundId === historyFilterFundId)
            : getTransactions()
          }
          onToggleRevert={handleToggleRevertTransaction}
        />

        <AIAnalysisDialog
          open={showAIAnalysisDialog}
          onClose={() => setShowAIAnalysisDialog(false)}
          data={generateAIData()}
        />

        <InvestmentStrategyDialog
          open={showInvestmentStrategyDialog}
          onClose={() => setShowInvestmentStrategyDialog(false)}
          funds={funds}
          onUpdateStrategies={handleUpdateStrategies}
          onExecuteInvestment={handleExecuteInvestment}
        />

        <MarketPanelDialog
          open={showMarketDialog}
          onClose={() => setShowMarketDialog(false)}
        />

        <EditFundDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedFund(null);
          }}
          fund={selectedFund}
          onUpdate={handleUpdateFundInfo}
        />

        <ImportJsonDialog
          open={showImportJsonDialog}
          onClose={() => setShowImportJsonDialog(false)}
          onImport={handleImportFromPaste}
        />

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </div>
  );
}

export default App;
