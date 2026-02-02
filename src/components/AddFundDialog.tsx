import { useState } from 'react';
import type { Fund } from '../types/index';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { fetchFundGZ } from '../utils/api';
import { timestampToBeijingTime } from '../utils/calculations';

interface AddFundDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (fund: Omit<Fund, 'createdAt' | 'updatedAt'>) => void;
}

export const AddFundDialog = ({ open, onClose, onAdd }: AddFundDialogProps) => {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        shares: '',
        costPrice: '',
        initialPrice: '',
    });
    const [priceDateType, setPriceDateType] = useState<'yesterday' | 'today' | 'custom'>('yesterday');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 只验证必填字段：基金编号和份额
        const newErrors: Record<string, boolean> = {
            id: !formData.id.trim(),
            shares: !formData.shares.trim(),
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(error => error)) {
            return;
        }

        const shares = parseFloat(formData.shares);
        if (isNaN(shares) || shares <= 0) {
            alert('请输入有效的份额');
            setErrors({ ...newErrors, shares: true });
            return;
        }

        // 当前净值：如果有填写则使用，否则使用成本价，如果都没有则报错
        const currentPrice = formData.costPrice 
            ? parseFloat(formData.costPrice)
            : (formData.initialPrice ? parseFloat(formData.initialPrice) : null);
        
        if (currentPrice === null || isNaN(currentPrice) || currentPrice <= 0) {
            alert('请填写当前净值或持仓成本价');
            return;
        }

        // 成本价：如果有填写则使用，否则使用当前净值
        const costPrice = formData.initialPrice ? parseFloat(formData.initialPrice) : currentPrice;
        if (isNaN(costPrice) || costPrice <= 0) {
            alert('请输入有效的成本价');
            return;
        }

        // 基金名称：如果有填写则使用，否则使用基金编号
        const fundName = formData.name.trim() || formData.id.trim();

        // 计算 priceUpdatedAt
        let updatedAtDate: Date;
        if (priceDateType === 'today') {
            updatedAtDate = new Date();
        } else if (priceDateType === 'yesterday') {
            updatedAtDate = new Date();
            updatedAtDate.setDate(updatedAtDate.getDate() - 1);
        } else {
            updatedAtDate = new Date(customDate);
            // 保持当前的小时分钟秒，或者设为 0
            const now = new Date();
            updatedAtDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        }

        const beijingTime = timestampToBeijingTime(updatedAtDate.getTime());

        onAdd({
            id: formData.id.trim(),
            name: fundName,
            shares,
            costPrice: costPrice,
            currentPrice: currentPrice,
            initialPrice: costPrice,
            priceUpdatedAt: beijingTime,
            investmentStrategy: { frequency: 'daily', amount: 0 }
        });

        // 重置表单
        setFormData({
            id: '',
            name: '',
            shares: '',
            costPrice: '',
            initialPrice: '',
        });
        setPriceDateType('yesterday');
        setErrors({});
        setLoadError('');
        onClose();
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: false });
        }
        if (loadError) {
            setLoadError('');
        }
    };

    // 获取基金信息
    const handleFetchFundInfo = async () => {
        if (!formData.id.trim()) {
            setErrors({ ...errors, id: true });
            return;
        }

        setIsLoading(true);
        setLoadError('');

        try {
            const data = await fetchFundGZ(formData.id.trim());
            if (data && data.name) {
                // 自动填充基金名称
                setFormData(prev => ({
                    ...prev,
                    name: data.name
                }));

                // 如果有 dwjz（单位净值），自动填充为当前净值（默认是昨日净值）
                if (data.dwjz) {
                    const dwjz = parseFloat(data.dwjz);
                    if (!isNaN(dwjz) && dwjz > 0) {
                        setFormData(prev => ({
                            ...prev,
                            costPrice: dwjz.toString(),
                            // 如果没有填写初始价格，也使用 dwjz
                            initialPrice: prev.initialPrice || dwjz.toString()
                        }));
                    }
                }
            } else {
                setLoadError('未找到该基金信息，请检查基金编号是否正确');
            }
        } catch (error) {
            console.error('获取基金信息失败:', error);
            setLoadError('获取基金信息失败，请检查网络连接');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title="添加基金">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <label className="block text-sm font-medium mb-1">
                        基金编号 <span className={errors.id ? 'text-red-500' : ''}>*</span>
                    </label>
                    <div className="flex gap-2">
                        <Input
                            value={formData.id}
                            onChange={(e) => handleInputChange('id', e.target.value)}
                            placeholder="例如：000001"
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleFetchFundInfo}
                            disabled={isLoading || !formData.id.trim()}
                        >
                            {isLoading ? '获取中...' : '获取信息'}
                        </Button>
                    </div>
                    {loadError && (
                        <p className="text-xs text-red-500 mt-1">{loadError}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        基金名称 <span className="text-gray-400 text-xs">(可选)</span>
                    </label>
                    <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder='点击"获取信息"自动填充，或手动输入'
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
                            placeholder="例如：1000.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            当前净值 <span className="text-gray-400 text-xs">(可选)</span>
                        </label>
                        <Input
                            type="number"
                            step="0.0001"
                            value={formData.costPrice}
                            onChange={(e) => handleInputChange('costPrice', e.target.value)}
                            placeholder='点击"获取信息"自动填充昨日净值'
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">净值所属日期</label>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={priceDateType === 'yesterday' ? 'default' : 'outline'}
                                onClick={() => setPriceDateType('yesterday')}
                                className="flex-1"
                            >
                                昨日
                            </Button>
                            <Button
                                type="button"
                                variant={priceDateType === 'today' ? 'default' : 'outline'}
                                onClick={() => setPriceDateType('today')}
                                className="flex-1"
                            >
                                今日
                            </Button>
                            <Button
                                type="button"
                                variant={priceDateType === 'custom' ? 'default' : 'outline'}
                                onClick={() => setPriceDateType('custom')}
                                className="flex-1"
                            >
                                自定义
                            </Button>
                        </div>
                        {priceDateType === 'custom' && (
                            <Input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="w-full"
                            />
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">持仓成本价（可选）</label>
                    <Input
                        type="number"
                        step="0.0001"
                        value={formData.initialPrice}
                        onChange={(e) => handleInputChange('initialPrice', e.target.value)}
                        placeholder="留空则使用当前净值"
                    />
                    <p className="text-xs text-gray-500 mt-1">买入该基金时的成本价</p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        取消
                    </Button>
                    <Button type="submit">添加</Button>
                </div>
            </form>
        </Dialog>
    );
};
