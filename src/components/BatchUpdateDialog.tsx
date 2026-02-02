import { useState } from 'react';
import type { Fund } from '../types/index';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface BatchUpdateDialogProps {
    open: boolean;
    onClose: () => void;
    funds: Fund[];
    onUpdate: (updates: { fundId: string; price: number }[]) => void;
}

export const BatchUpdateDialog = ({ open, onClose, funds, onUpdate }: BatchUpdateDialogProps) => {
    const [prices, setPrices] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updates: { fundId: string; price: number }[] = [];

        for (const fund of funds) {
            const priceStr = prices[fund.id];
            if (priceStr) {
                const price = parseFloat(priceStr);
                if (!isNaN(price) && price > 0) {
                    updates.push({ fundId: fund.id, price });
                }
            }
        }

        if (updates.length === 0) {
            alert('请至少更新一只基金的净值');
            return;
        }

        onUpdate(updates);
        setPrices({});
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} title="批量更新净值" className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">为每只基金输入新的净值，留空则跳过</p>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                    {funds.map((fund) => (
                        <div key={fund.id} className="flex items-center gap-4 p-3 border rounded-md">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{fund.name}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500">当前净值：{fund.currentPrice.toFixed(4)}</p>
                                    <p className="text-[10px] text-gray-400">({fund.priceUpdatedAt.split('T')[0]})</p>
                                </div>
                            </div>
                            <Input
                                type="number"
                                step="0.0001"
                                value={prices[fund.id] || ''}
                                onChange={(e) => setPrices({ ...prices, [fund.id]: e.target.value })}
                                placeholder="新净值"
                                className="w-32"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        取消
                    </Button>
                    <Button type="submit">批量更新</Button>
                </div>
            </form>
        </Dialog>
    );
};
