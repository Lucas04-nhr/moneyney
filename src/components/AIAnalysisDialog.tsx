import { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Copy, Check } from 'lucide-react';

interface AIAnalysisDialogProps {
    open: boolean;
    onClose: () => void;
    data: string;
}

const PRESET_PROMPTS = [
    {
        id: 'overview',
        name: '综合资产评估',
        prompt: '请根据以下基金持仓数据，分析我的投资组合。重点关注：1. 资产配置是否均衡；2. 各基金的盈亏表现；3. 给出后续的操作建议。'
    },
    {
        id: 'risk',
        name: '风险压力测试',
        prompt: '请分析这组持仓的风险点。计算平均波动可能带来的影响，并指出哪几只基金可能存在较大的下行风险，建议如何进行风险对冲。'
    },
    {
        id: 'strategy',
        name: '定投/加仓策略',
        prompt: '根据当前的成本价和当前净值，分析哪些基金目前处于估值低位适合补仓，哪些基金涨幅过快建议止盈，请制定一份详细的后续加仓计划。'
    },
    {
        id: 'dailyChange',
        name: '今日涨跌分析',
        prompt: '请深度解析今日持仓数据、涨跌情况与定投策略，量化分析整体盈亏及板块异动，并基于回撤控制目标给出具体的操作建议与风险提示。'
    }
];

export const AIAnalysisDialog = ({ open, onClose, data }: AIAnalysisDialogProps) => {
    const [prompt, setPrompt] = useState(PRESET_PROMPTS[0].prompt);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const fullContent = `${prompt}\n\n以下是我的持仓数据：\n${data}`;
        navigator.clipboard.writeText(fullContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onClose={onClose} title="投资分析" className="max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-6 p-1">
                {/* 提示词配置 */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center gap-2">
                        1. 选择分析方案
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_PROMPTS.map((p) => (
                            <Button
                                key={p.id}
                                variant={prompt === p.prompt ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPrompt(p.prompt)}
                            >
                                {p.name}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold">
                        2. 自定义 提示词
                    </label>
                    <textarea
                        className="w-full min-h-[100px] p-3 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="请输入你想要问 AI 的问题..."
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center justify-between">
                        <span>3. 待分析的持仓数据 </span>
                        <span className="text-[10px] text-gray-400 font-normal">包含基金信息、份额、成本及盈亏</span>
                    </label>
                    <div className="relative">
                        <pre className="w-full bg-gray-950 text-gray-100 p-4 rounded-md text-xs overflow-x-auto leading-relaxed max-h-[300px]">
                            {data}
                        </pre>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-2 border-t">
                <Button variant="outline" onClick={onClose}>
                    关闭
                </Button>
                <Button onClick={handleCopy} className="min-w-[120px]">
                    {copied ? (
                        <>
                            <Check className="h-4 w-4 mr-2" />
                            已复制
                        </>
                    ) : (
                        <>
                            <Copy className="h-4 w-4 mr-2" />
                            复制全文
                        </>
                    )}
                </Button>
            </div>
        </Dialog>
    );
};
