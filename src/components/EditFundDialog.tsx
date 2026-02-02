import { useState, useEffect } from 'react';
import type { Fund } from '../types/index';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface EditFundDialogProps {
    open: boolean;
    onClose: () => void;
    fund: Fund | null;
    onUpdate: (fundId: string, updates: Partial<Fund>) => void;
}

export const EditFundDialog = ({ open, onClose, fund, onUpdate }: EditFundDialogProps) => {
    const [formData, setFormData] = useState({
        name: '',
        shares: '',
        costPrice: '',
        currentPrice: '',
        initialPrice: '',
    });
    const [tag, setTag] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (open && fund) {
            setFormData({
                name: fund.name,
                shares: fund.shares.toString(),
                costPrice: fund.costPrice.toString(),
                currentPrice: fund.currentPrice.toString(),
                initialPrice: fund.initialPrice?.toString() || '',
            });
            setTag(fund.tag || '');
            setErrors({});
        }
    }, [open, fund]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, boolean> = {
            name: !formData.name,
            shares: !formData.shares,
            costPrice: !formData.costPrice,
            currentPrice: !formData.currentPrice,
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(error => error)) {
            return;
        }

        const shares = parseFloat(formData.shares);
        const costPrice = parseFloat(formData.costPrice);
        const currentPrice = parseFloat(formData.currentPrice);
        const initialPrice = formData.initialPrice ? parseFloat(formData.initialPrice) : undefined;

        if (isNaN(shares) || isNaN(costPrice) || isNaN(currentPrice) || shares < 0 || costPrice < 0 || currentPrice < 0) {
            alert('请输入有效的数值');
            return;
        }

        if (fund) {
            onUpdate(fund.id, {
                name: formData.name,
                shares,
                costPrice,
                currentPrice,
                initialPrice,
                tag: tag.trim() || undefined,
            });
        }
        onClose();
    };


    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: false });
        }
    };

    if (!fund) return null;

    return (
        <Dialog open={open} onClose={onClose} title={`编辑基金 - ${fund.id}`}>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-400">
                        基金编号 (不可修改)
                    </label>
                    <Input
                        value={fund.id}
                        disabled
                        className="bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        基金名称 <span className={errors.name ? 'text-red-500' : ''}>*</span>
                    </label>
                    <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="例如：华夏成长混合"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            持有份额 <span className={errors.shares ? 'text-red-500' : ''}>*</span>
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.shares}
                            onChange={(e) => handleInputChange('shares', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            持仓成本价 <span className={errors.costPrice ? 'text-red-500' : ''}>*</span>
                        </label>
                        <Input
                            type="number"
                            step="0.0001"
                            value={formData.costPrice}
                            onChange={(e) => handleInputChange('costPrice', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            当前净值 <span className={errors.currentPrice ? 'text-red-500' : ''}>*</span>
                        </label>
                        <Input
                            type="number"
                            step="0.0001"
                            value={formData.currentPrice}
                            onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            初始净值 (可选)
                        </label>
                        <Input
                            type="number"
                            step="0.0001"
                            value={formData.initialPrice}
                            onChange={(e) => handleInputChange('initialPrice', e.target.value)}
                            placeholder="留空"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        标签 (可选)
                    </label>
                    <Input
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="输入标签"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        取消
                    </Button>
                    <Button type="submit">保存修改</Button>
                </div>
            </form>
        </Dialog>
    );
};
