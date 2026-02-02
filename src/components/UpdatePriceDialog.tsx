import { useState } from 'react';
import type { Fund } from '../types/index';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface UpdatePriceDialogProps {
    open: boolean;
    onClose: () => void;
    fund: Fund | null;
    onUpdate: (fundId: string, price: number) => void;
}

export const UpdatePriceDialog = ({
    open,
    onClose,
    fund,
    onUpdate
}: UpdatePriceDialogProps) => {
    const [price, setPrice] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!price) {
            setError(true);
            return;
        }

        const newPrice = parseFloat(price);
        if (isNaN(newPrice) || newPrice <= 0) {
            alert('请输入有效的净值');
            return;
        }

        if (fund) {
            onUpdate(fund.id, newPrice);
        }
        setPrice('');
        setError(false);
        onClose();
    };

    if (!fund) return null;

    return (
        <Dialog open={open} onClose={onClose} title={`更新 ${fund.name} 净值`}>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <p className="text-sm text-gray-500 mb-2">当前净值：{fund.currentPrice.toFixed(4)}</p>
                    <label className="block text-sm font-medium mb-1">
                        新净值 <span className={error ? 'text-red-500' : ''}>*</span>
                    </label>
                    <Input
                        type="number"
                        step="0.0001"
                        value={price}
                        onChange={(e) => {
                            setPrice(e.target.value);
                            if (error) setError(false);
                        }}
                        placeholder="请输入新的净值"
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        取消
                    </Button>
                    <Button type="submit">更新</Button>
                </div>
            </form>
        </Dialog>
    );
};
