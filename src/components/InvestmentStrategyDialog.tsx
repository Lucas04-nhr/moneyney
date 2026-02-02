import { useState, useEffect } from 'react';
import type { Fund } from '../types/index';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { Calculator, CheckCircle2 } from 'lucide-react';
import { isAfter3PM } from '../utils/calculations';

interface InvestmentStrategyDialogProps {
    open: boolean;
    onClose: () => void;
    funds: Fund[];
    onUpdateStrategies: (strategies: { fundId: string; frequency: 'daily' | 'weekly' | 'monthly'; amount: number }[]) => void;
    onExecuteInvestment: (fundIds: string[]) => void;
}

export const InvestmentStrategyDialog = ({ open, onClose, funds, onUpdateStrategies, onExecuteInvestment }: InvestmentStrategyDialogProps) => {
    const [localStrategies, setLocalStrategies] = useState<Record<string, { frequency: 'daily' | 'weekly' | 'monthly', amount: string }>>({});
    const [selectedFunds, setSelectedFunds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) {
            const initial: Record<string, { frequency: 'daily' | 'weekly' | 'monthly', amount: string }> = {};
            const selected = new Set<string>();
            funds.forEach(fund => {
                initial[fund.id] = {
                    frequency: fund.investmentStrategy?.frequency || 'daily',
                    amount: fund.investmentStrategy?.amount?.toString() || '0'
                };
                // 默认全选
                selected.add(fund.id);
            });
            setLocalStrategies(initial);
            setSelectedFunds(selected);
        }
    }, [open, funds]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updates = funds.map(fund => ({
            fundId: fund.id,
            frequency: localStrategies[fund.id].frequency,
            amount: parseFloat(localStrategies[fund.id].amount) || 0
        }));
        onUpdateStrategies(updates);
        onClose();
    };

    const updateField = (fundId: string, field: 'frequency' | 'amount', value: any) => {
        setLocalStrategies(prev => ({
            ...prev,
            [fundId]: {
                ...prev[fundId],
                [field]: value
            }
        }));
    };

    const toggleFundSelection = (fundId: string) => {
        setSelectedFunds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fundId)) {
                newSet.delete(fundId);
            } else {
                newSet.add(fundId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedFunds.size === funds.length) {
            setSelectedFunds(new Set());
        } else {
            setSelectedFunds(new Set(funds.map(f => f.id)));
        }
    };

    const handleExecuteInvestment = () => {
        if (!isAfter3PM()) {
            return; // 时间检查在按钮的 disabled 属性中处理
        }
        const selectedIds = Array.from(selectedFunds);
        onExecuteInvestment(selectedIds);
    };

    const canExecute = isAfter3PM();

    return (
        <Dialog open={open} onClose={onClose} title="定投规划" className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <p className="text-sm text-gray-500 mb-4 px-1">配置每只基金的自动定投计划，数据将同步保存至本地。</p>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {funds.length > 0 && (
                        <div className="flex items-center justify-between mb-2 px-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedFunds.size === funds.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">全选</span>
                            </label>
                        </div>
                    )}
                    {funds.map((fund) => (
                        <div key={fund.id} className="p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={selectedFunds.has(fund.id)}
                                    onChange={() => toggleFundSelection(fund.id)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                                />
                                <div className="flex items-center justify-between flex-1 min-w-0">
                                    <div className="min-w-0">
                                        <h4 className="font-semibold truncate text-gray-800">{fund.name}</h4>
                                        <p className="text-xs text-gray-400">{fund.id}</p>
                                    </div>
                                    <div className="flex bg-gray-50 p-1 rounded-md border border-gray-100">
                                        {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                                            <button
                                                key={f}
                                                type="button"
                                                className={`px-3 py-1 text-xs rounded transition-all ${
                                                    localStrategies[fund.id]?.frequency === f
                                                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                                onClick={() => updateField(fund.id, 'frequency', f)}
                                            >
                                                {f === 'daily' ? '日定投' : f === 'weekly' ? '周定投' : '月定投'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-7"
                                        placeholder="定投金额"
                                        value={localStrategies[fund.id]?.amount || ''}
                                        onChange={(e) => updateField(fund.id, 'amount', e.target.value)}
                                    />
                                </div>
                                <div className="text-xs text-gray-400 w-24">
                                    {localStrategies[fund.id]?.amount && parseFloat(localStrategies[fund.id]?.amount) > 0 ? (
                                        <span>预计{localStrategies[fund.id].frequency === 'daily' ? '每日' : localStrategies[fund.id].frequency === 'weekly' ? '每周' : '每月'}投入</span>
                                    ) : (
                                        <span>未开启定投</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {funds.length === 0 && (
                        <div className="py-20 text-center text-gray-400">
                            <Calculator className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>暂无基金，请先添加基金后再配置定投策略</p>
                        </div>
                    )}
                </div>

                {/* 统计信息 */}
                {funds.length > 0 && (() => {
                    const TRADING_DAYS_PER_MONTH = 20; // 每月平均交易日约20天
                    const TRADING_WEEKS_PER_MONTH = 4; // 每月约4个交易周
                    
                    let monthlyTotal = 0;
                    let monthlyCount = 0;
                    
                    funds.forEach(fund => {
                        const strategy = localStrategies[fund.id];
                        if (strategy && parseFloat(strategy.amount) > 0) {
                            const amount = parseFloat(strategy.amount);
                            if (strategy.frequency === 'daily') {
                                monthlyTotal += amount * TRADING_DAYS_PER_MONTH; // 日定投：每月20个交易日
                                monthlyCount += TRADING_DAYS_PER_MONTH;
                            } else if (strategy.frequency === 'weekly') {
                                monthlyTotal += amount * TRADING_WEEKS_PER_MONTH; // 周定投：每月4个交易周
                                monthlyCount += TRADING_WEEKS_PER_MONTH;
                            } else if (strategy.frequency === 'monthly') {
                                monthlyTotal += amount; // 月定投：每月1次
                                monthlyCount += 1;
                            }
                        }
                    });
                    
                    return (
                        <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 rounded-lg mt-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="px-2">
                                    <p className="text-xs text-gray-500 mb-2">预估月定投总金额</p>
                                    <p className="text-lg font-semibold text-blue-600 mb-1">
                                        ¥{monthlyTotal.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-gray-400">按交易日估算</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-xs text-gray-500 mb-2">预估月定投次数</p>
                                    <p className="text-lg font-semibold text-gray-700 mb-1">
                                        {monthlyCount} 次
                                    </p>
                                    <p className="text-[10px] text-gray-400">按交易日估算</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="flex justify-between items-center gap-3 pt-6 mt-4 border-t border-gray-100">
                    <Tooltip 
                        content={!canExecute ? '仅下午3点后可执行定投' : selectedFunds.size === 0 ? '请至少选择一只基金' : ''}
                        disabled={canExecute && selectedFunds.size > 0}
                    >
                        <Button 
                            type="button" 
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleExecuteInvestment}
                            disabled={selectedFunds.size === 0 || !canExecute}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            生效今日定投
                        </Button>
                    </Tooltip>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>取消</Button>
                        <Button type="submit" disabled={funds.length === 0}>保存配置</Button>
                    </div>
                </div>
            </form>
        </Dialog>
    );
};
