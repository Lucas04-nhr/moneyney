import type { Fund } from '../types/index';
import {
    calculateFundValue,
    calculateFundCost,
    calculateFundProfit,
    calculateFundProfitRate,
    formatCurrency,
    formatPercent,
    formatDate,
    isToday,
    isAfter3PM
} from '../utils/calculations';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { Edit, Trash2, History } from 'lucide-react';

interface FundListProps {
    funds: Fund[];
    onUpdatePrice: (fund: Fund) => void;
    onEdit: (fund: Fund) => void;
    onTransaction: (fund: Fund) => void;
    onDelete: (fundId: string) => void;
    onViewHistory: (fundId: string) => void;
}

export const FundList = ({ funds, onUpdatePrice, onEdit, onTransaction, onDelete, onViewHistory }: FundListProps) => {
    if (funds.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-gray-500">暂无基金数据，请添加您的第一只基金</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {funds.map((fund) => {
                const value = calculateFundValue(fund);
                const cost = calculateFundCost(fund);
                const profit = calculateFundProfit(fund);
                const profitRate = calculateFundProfitRate(fund);
                const isProfit = profit >= 0;

                return (
                    <Card key={fund.id}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold">{fund.name}</h3>
                                        {fund.tag && (
                                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                                                {fund.tag}
                                            </span>
                                        )}
                                        <span className="text-sm text-gray-500">({fund.id})</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500">持有份额</p>
                                            <p className="font-medium">{fund.shares.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">成本价</p>
                                            <p className="font-medium">{formatCurrency(fund.costPrice)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">当前净值</p>
                                            <p className="font-medium">{formatCurrency(fund.currentPrice)}</p>
                                            <div className="flex flex-col gap-0.5">
                                                {fund.gszzl !== undefined && fund.gszzl !== null && fund.gszzl !== '' && (
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <span className="text-[10px] text-gray-400">今日：</span>
                                                        {(() => {
                                                            // gszzl 是字符串格式，如 "1.3" 或 "-0.7"，表示百分比
                                                            const changeRate = parseFloat(fund.gszzl);
                                                            const isPositive = !isNaN(changeRate) && changeRate >= 0;
                                                            // 今日收益金额 = 持有份额 × (当前净值 - dwjz)，dwjz 存于 lastPrice
                                                            const dwjz = fund.lastPrice;
                                                            const todayAmount = dwjz !== undefined && dwjz > 0
                                                                ? fund.shares * (fund.currentPrice - dwjz)
                                                                : null;
                                                            return (
                                                                <>
                                                                    <p className={`text-[10px] font-medium ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                                                                        {!isNaN(changeRate) ? formatPercent(changeRate) : '--'}
                                                                    </p>
                                                                    {todayAmount !== null && (
                                                                        <>
                                                                            <span className="text-[10px] text-gray-400">·</span>
                                                                            <p className={`text-[10px] font-medium ${(todayAmount >= 0) ? 'text-red-600' : 'text-green-600'}`}>
                                                                                {formatCurrency(todayAmount, 2)}
                                                                            </p>
                                                                        </>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <p className="text-[10px] text-gray-400">
                                                        {formatDate(fund.priceUpdatedAt)}
                                                    </p>
                                                    {isToday(fund.priceUpdatedAt) ? (
                                                        <span className="text-[10px] text-green-500 font-medium">
                                                            (今日数据已更新)
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-orange-500 font-medium">
                                                            (今日数据未更新)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">持仓金额</p>
                                            <p className="font-medium">{formatCurrency(value, 2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">持仓成本</p>
                                            <p className="font-medium">{formatCurrency(cost, 2)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">收益</p>
                                            <p className={`font-semibold ${isProfit ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(profit, 2)} ({formatPercent(profitRate)})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onUpdatePrice(fund)}
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        更新净值
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(fund)}
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        编辑信息
                                    </Button>
                                    <Tooltip 
                                        content={!isAfter3PM() ? '仅下午3点后可进行买卖操作' : ''}
                                        disabled={isAfter3PM()}
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onTransaction(fund)}
                                            disabled={!isAfter3PM()}
                                        >
                                            买卖操作
                                        </Button>
                                    </Tooltip>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onViewHistory(fund.id)}
                                    >
                                        <History className="h-4 w-4 mr-1" />
                                        交易记录
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onDelete(fund.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        删除
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
