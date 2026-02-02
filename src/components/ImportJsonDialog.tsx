import { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

interface ImportJsonDialogProps {
    open: boolean;
    onClose: () => void;
    onImport: (jsonString: string) => { success: boolean; message: string };
}

export const ImportJsonDialog = ({ open, onClose, onImport }: ImportJsonDialogProps) => {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!jsonText.trim()) {
            setError('请输入 JSON 数据');
            return;
        }

        try {
            // 验证 JSON 格式
            JSON.parse(jsonText);
            const result = onImport(jsonText);

            if (result.success) {
                setJsonText('');
                setError(null);
                onClose();
            } else {
                setError(result.message);
            }
        } catch (e) {
            setError('JSON 格式错误，请检查数据格式');
        }
    };

    const handleClose = () => {
        setJsonText('');
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} title="粘贴JSON数据导入" className="max-w-2xl">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        请粘贴 JSON 数据
                    </label>
                    <textarea
                        value={jsonText}
                        onChange={(e) => {
                            setJsonText(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder='例如：{"funds": [...], "transactions": [...]}'
                        className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        autoFocus
                    />
                    {error && (
                        <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        支持导入基金数据和交易记录，JSON 格式需包含 funds 和 transactions 字段
                    </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit}>
                        导入
                    </Button>
                </div>
            </div>
        </Dialog>
    );
};
