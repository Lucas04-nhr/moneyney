import type { Transaction } from '../types/index';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { formatCurrency, formatDate } from '../utils/calculations';
import { RotateCcw, History } from 'lucide-react';

interface TransactionListDialogProps {
    open: boolean;
    onClose: () => void;
    transactions: Transaction[];
    title: string;
    onToggleRevert: (id: string) => void;
}

export const TransactionListDialog = ({
    open,
    onClose,
    transactions,
    title,
    onToggleRevert
}: TransactionListDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose} title={title} className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-1">
                {transactions.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>暂无交易记录</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((t) => (
                            <div 
                                key={t.id} 
                                className={`p-4 border rounded-lg flex items-center justify-between transition-opacity ${t.reverted ? 'opacity-40 bg-gray-50' : 'bg-white'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            t.reverted 
                                                ? 'bg-gray-200 text-gray-500' 
                                                : t.type === 'buy' 
                                                    ? 'bg-red-100 text-red-600' 
                                                    : 'bg-green-100 text-green-600'
                                        }`}>
                                            {t.reverted ? '已撤销' : (t.type === 'buy' ? '买入' : '卖出')}
                                        </span>
                                        <span className="font-semibold truncate">{t.fundName}</span>
                                        <span className="text-xs text-gray-400">({t.fundId})</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                                        <div>
                                            <span className="text-gray-500 mr-1">金额:</span>
                                            <span className="font-medium">{formatCurrency(t.amount, 2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 mr-1">份额:</span>
                                            <span className="font-medium">{t.shares.toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 mr-1">成交价:</span>
                                            <span className="font-medium">{formatCurrency(t.price)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 mr-1">日期:</span>
                                            <span className="font-medium">{formatDate(t.date)}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onToggleRevert(t.id)}
                                    title={t.reverted ? '恢复交易' : '撤销交易'}
                                    className="ml-4 h-8 w-8 p-0"
                                >
                                    <RotateCcw className={`h-4 w-4 ${t.reverted ? 'text-blue-500' : 'text-gray-400'}`} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex justify-end pt-4 mt-2 border-t">
                <Button onClick={onClose}>关闭</Button>
            </div>
        </Dialog>
    );
};
