import type { Statistics, Fund } from '../types/index';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Tag, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardProps {
    stats: Statistics;
    funds: Fund[];
}

export const Dashboard = ({ stats, funds }: DashboardProps) => {
    const isTotalProfit = stats.totalProfit >= 0;
    const isTodayProfit = stats.todayProfit >= 0;

    // 计算标签份额占比（按持仓金额）
    const calculateTagShares = () => {
        const tagAmountMap: Record<string, number> = {};
        let totalAmount = 0;

        funds.forEach(fund => {
            const fundAmount = fund.shares * fund.currentPrice; // 持仓金额
            totalAmount += fundAmount;

            if (fund.tag && fund.tag.trim()) {
                const tagName = fund.tag.trim();
                tagAmountMap[tagName] = (tagAmountMap[tagName] || 0) + fundAmount;
            } else {
                // 没有标签的基金归类为"未分类"
                tagAmountMap['未分类'] = (tagAmountMap['未分类'] || 0) + fundAmount;
            }
        });

        // 转换为百分比并生成图表数据
        const chartData = Object.entries(tagAmountMap).map(([tag, amount]) => ({
            name: tag,
            value: parseFloat(((amount / totalAmount) * 100).toFixed(2)),
            amount: parseFloat(amount.toFixed(2)),
        }));

        return chartData.sort((a, b) => b.value - a.value);
    };

    const tagChartData = calculateTagShares();
    
    // 图表颜色配置
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    // 计算涨跌对比数据（按标签维度）
    const calculateProfitLossData = () => {
        const tagDataMap: Record<string, { currentValue: number; lastValue: number }> = {};
        let totalProfit = 0;
        let totalLoss = 0;

        // 按标签分组，计算每个标签的当前持仓金额和昨日持仓金额
        // 只计算有有效 lastPrice 的基金（有昨日净值才能计算今日涨跌）
        funds.forEach(fund => {
            // 只处理有有效 lastPrice 的基金
            if (fund.lastPrice === undefined || fund.lastPrice <= 0 || fund.lastPrice === fund.currentPrice) {
                return; // 跳过没有昨日净值或净值没变化的基金
            }
            
            const tagName = fund.tag && fund.tag.trim() ? fund.tag.trim() : '未分类';
            
            if (!tagDataMap[tagName]) {
                tagDataMap[tagName] = {
                    currentValue: 0,
                    lastValue: 0
                };
            }
            
            // 基于当前净值计算当前持仓金额
            tagDataMap[tagName].currentValue += fund.shares * fund.currentPrice;
            
            // 基于昨日净值计算昨日持仓金额
            tagDataMap[tagName].lastValue += fund.shares * fund.lastPrice;
        });

        // 转换为数组并计算涨跌金额和收益率
        const profitTags: Array<{ name: string; profit: number; profitRate: number }> = [];
        const lossTags: Array<{ name: string; profit: number; profitRate: number }> = [];

        Object.entries(tagDataMap).forEach(([tagName, data]) => {
            // 涨跌金额 = 当前持仓金额 - 昨日持仓金额
            const profit = data.currentValue - data.lastValue;
            
            // 涨跌收益率 = 涨跌金额 / 昨日持仓金额 * 100
            const profitRate = data.lastValue > 0 
                ? (profit / data.lastValue) * 100 
                : 0;
            
            const chartData = {
                name: tagName,
                profit: profit,
                profitRate: profitRate
            };

            if (profit > 0) {
                profitTags.push(chartData);
                totalProfit += profit;
            } else if (profit < 0) {
                lossTags.push(chartData);
                totalLoss += Math.abs(profit);
            }
        });

        // 按收益绝对值排序
        profitTags.sort((a, b) => b.profit - a.profit);
        lossTags.sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));

        // 合并数据，涨的在上面（正数），跌的在下面（负数）
        const chartData: Array<{ name: string; profit: number; profitRate: number }> = [];
        
        // 先添加涨的（从大到小，显示在图表上方）
        profitTags.forEach(tag => {
            chartData.push(tag);
        });
        
        // 再添加跌的（从大到小，显示在图表下方，值为负数）
        lossTags.forEach(tag => {
            chartData.push(tag);
        });

        return {
            chartData,
            totalProfit,
            totalLoss,
            netProfit: totalProfit - totalLoss
        };
    };

    const profitLossData = calculateProfitLossData();

    return (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总市值</CardTitle>
                    <Wallet className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalValue, 2)}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总成本</CardTitle>
                    <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalCost, 2)}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">今日收益</CardTitle>
                    {isTodayProfit ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${isTodayProfit ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(stats.todayProfit, 2)}
                    </div>
                    <p className={`text-xs mt-1 ${isTodayProfit ? 'text-red-600' : 'text-green-600'}`}>
                        {formatPercent(stats.todayProfitRate)}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总收益</CardTitle>
                    {isTotalProfit ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${isTotalProfit ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(stats.totalProfit, 2)}
                    </div>
                    <p className={`text-xs mt-1 ${isTotalProfit ? 'text-red-600' : 'text-green-600'}`}>
                        {formatPercent(stats.totalProfitRate)}
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* 涨跌对比直方图 */}
        {profitLossData.chartData.length > 0 && (
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">基金涨跌对比</CardTitle>
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={profitLossData.chartData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    type="number" 
                                    tickFormatter={(value) => {
                                        const absValue = Math.abs(value);
                                        return formatCurrency(absValue, 2);
                                    }}
                                    domain={['auto', 'auto']}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={90}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            const value = payload[0].value as number;
                                            return (
                                                <div className="bg-white border border-gray-200 rounded-md p-3 shadow-lg">
                                                    <p className="font-medium">{data.name}</p>
                                                    <p className={`text-sm ${value >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {value >= 0 ? '收益' : '亏损'}: {formatCurrency(Math.abs(value), 2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        涨跌幅: {formatPercent(data.profitRate)}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="profit" 
                                    radius={[0, 4, 4, 0]}
                                >
                                    {profitLossData.chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.profit >= 0 ? '#ef4444' : '#10b981'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* 总收益显示 */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <div className="text-sm text-gray-600 mb-1">总收益</div>
                                <div className={`text-2xl font-bold ${profitLossData.netProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(profitLossData.netProfit, 2)}
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="text-right">
                                    <div className="text-sm text-gray-600 mb-1">上涨收益</div>
                                    <div className="text-lg font-semibold text-red-600">
                                        {formatCurrency(profitLossData.totalProfit, 2)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600 mb-1">下跌亏损</div>
                                    <div className="text-lg font-semibold text-green-600">
                                        {formatCurrency(profitLossData.totalLoss, 2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* 标签持仓金额占比图表 */}
        {tagChartData.length > 0 && (
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">板块持仓金额占比</CardTitle>
                    <Tag className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={tagChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {tagChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number | undefined) => value !== undefined ? `${value}%` : ''}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                                />
                                <Legend 
                                    formatter={(value) => {
                                        const data = tagChartData.find(d => d.name === value);
                                        return data ? `${value} (${formatCurrency(data.amount, 2)})` : value;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        )}
        </>
    );
};
