import { useState } from 'react';
import type { Fund } from '../types/index';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { isAfter3PM } from '../utils/calculations';

interface TransactionDialogProps {
    open: boolean;
    onClose: () => void;
    fund: Fund | null;
    onTransaction: (fundId: string, type: 'buy' | 'sell', shares: number, price: number) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const TransactionDialog = ({ open, onClose, fund, onTransaction, showToast }: TransactionDialogProps) => {
    const [type, setType] = useState<'buy' | 'sell'>('buy');
    const [shares, setShares] = useState('');
    const [price, setPrice] = useState('');
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    if (!fund) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors = {
            shares: !shares,
            price: !price,
        };
        setErrors(newErrors);

        if (newErrors.shares || newErrors.price) {
            return;
        }

        const sharesNum = parseFloat(shares);
        const priceNum = parseFloat(price);

        if (isNaN(sharesNum) || isNaN(priceNum) || sharesNum <= 0 || priceNum <= 0) {
            showToast('请输入有效的数值', 'error');
            return;
        }

        if (type === 'sell' && sharesNum > fund.shares) {
            showToast('卖出份额不能超过持有份额', 'error');
            return;
        }

        onTransaction(fund.id, type, sharesNum, priceNum);

        // 重置表单
        setType('buy');
        setShares('');
        setPrice('');
        setErrors({});
        onClose();
    };

    const handleInputChange = (field: string, value: string) => {
        if (field === 'shares') setShares(value);
        if (field === 'price') setPrice(value);
        if (errors[field]) {
            setErrors({ ...errors, [field]: false });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title={`${fund.name} - 买卖操作`}>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <p className="text-sm text-gray-500 mb-2">当前持有份额：{fund.shares.toFixed(2)}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">操作类型 *</label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={type === 'buy' ? 'default' : 'outline'}
                            onClick={() => setType('buy')}
                        >
                            买入
                        </Button>
                        <Button
                            type="button"
                            variant={type === 'sell' ? 'default' : 'outline'}
                            onClick={() => setType('sell')}
                        >
                            卖出
                        </Button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        交易份额 <span className={errors.shares ? 'text-red-500' : ''}>*</span>
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        value={shares}
                        onChange={(e) => handleInputChange('shares', e.target.value)}
                        placeholder="请输入交易份额"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        交易净值 <span className={errors.price ? 'text-red-500' : ''}>*</span>
                    </label>
                    <Input
                        type="number"
                        step="0.0001"
                        value={price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="请输入交易时的净值"
                    />
                </div>

                {shares && price && !isNaN(parseFloat(shares)) && !isNaN(parseFloat(price)) && (
                    <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">
                            <span className="font-medium">交易金额：</span>
                            {(parseFloat(shares) * parseFloat(price)).toFixed(2)} 元
                        </p>
                        {type === 'buy' && (
                            <p className="text-sm mt-1">
                                <span className="font-medium">交易后持有份额：</span>
                                {(fund.shares + parseFloat(shares)).toFixed(2)}
                            </p>
                        )}
                        {type === 'sell' && (
                            <p className="text-sm mt-1">
                                <span className="font-medium">交易后持有份额：</span>
                                {(fund.shares - parseFloat(shares)).toFixed(2)}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        取消
                    </Button>
                    <Tooltip 
                        content={!isAfter3PM() ? '仅下午3点后可进行买卖操作' : ''}
                        disabled={isAfter3PM()}
                    >
                        <Button 
                            type="submit"
                            disabled={!isAfter3PM()}
                        >
                            {type === 'buy' ? '买入' : '卖出'}
                        </Button>
                    </Tooltip>
                </div>
            </form>
        </Dialog>
    );
};
