import { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { fetchMarketData, MARKET_INDEXES } from '../utils/api';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface MarketPanelDialogProps {
    open: boolean;
    onClose: () => void;
}

export const MarketPanelDialog = ({ open, onClose }: MarketPanelDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        const codes = MARKET_INDEXES.map(i => i.code);
        const results = await fetchMarketData(codes);
        setData(results);
        setLoading(false);
    };

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} title="今日大盘概况" className="max-w-2xl">
            <div className="space-y-4">
                <div className="flex justify-end items-center mb-4">
                    <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        刷新
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.map((item) => {
                        // 如果 API 返回的名称为空，从 MARKET_INDEXES 中查找对应的名称
                        const displayName = item.name || MARKET_INDEXES.find(idx => idx.code === item.code)?.name || item.code;
                        
                        return (
                            <div key={item.code} className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{displayName}</p>
                                    <p className="text-xl font-bold">{item.points.toFixed(2)}</p>
                                </div>
                            <div className={`text-right ${item.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <div className="flex items-center justify-end gap-1 font-semibold">
                                    {item.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    <span>{item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%</span>
                                </div>
                                <p className="text-xs opacity-80">{item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}</p>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {data.length === 0 && !loading && (
                    <div className="py-12 text-center text-gray-400 border border-dashed rounded-lg">
                        <p>暂无数据，请确认网络连接或是否开启了跨域代理</p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-end mt-6">
                <Button onClick={onClose}>关闭</Button>
            </div>
        </Dialog>
    );
};
