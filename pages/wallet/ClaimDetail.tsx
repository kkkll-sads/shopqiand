import React, { useState, useEffect } from 'react';
import { ChevronLeft, Clock, CheckCircle2, AlertCircle, FileText, ImageIcon, Copy } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface ClaimDetailProps {
    id: string;
    onBack: () => void;
}

interface ClaimRecord {
    id: string;
    type: string;
    amount: number;
    status: 'audit' | 'success' | 'rejected';
    time: string;
    reason?: string;
    images?: string[];
}

// Reuse mock data for detail view
const MOCK_DATA: ClaimRecord[] = [
    { id: '1', type: 'balance', amount: 5000.00, status: 'audit', time: '2023-10-27 10:00', images: ['https://via.placeholder.com/300', 'https://via.placeholder.com/300'] },
    { id: '2', type: 'transfer', amount: 948.00, status: 'success', time: '2023-10-26 14:30', images: ['https://via.placeholder.com/300'] },
    { id: '3', type: 'other', amount: 3000.00, status: 'rejected', time: '2023-10-25 09:15', reason: '凭证模糊不清，无法识别', images: ['https://via.placeholder.com/300'] },
    { id: '4', type: 'balance', amount: 12000.00, status: 'success', time: '2023-10-20 11:20', images: ['https://via.placeholder.com/300'] },
    { id: '5', type: 'transfer', amount: 500.00, status: 'success', time: '2023-10-18 16:45', images: ['https://via.placeholder.com/300'] },
    { id: '6', type: 'balance', amount: 2000.00, status: 'rejected', time: '2023-10-15 09:30', reason: '账号信息不匹配', images: ['https://via.placeholder.com/300'] },
];

const ClaimDetail: React.FC<ClaimDetailProps> = ({ id, onBack }) => {
    const { showToast } = useNotification();
    const [record, setRecord] = useState<ClaimRecord | null>(null);

    useEffect(() => {
        // Simulate data fetch
        const found = MOCK_DATA.find(r => r.id === id);
        if (found) {
            setRecord(found);
        }
    }, [id]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', '复制成功');
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'audit':
                return {
                    label: 'AI系统审计中',
                    subLabel: '系统正在自动核对您的凭证，请耐心等待',
                    icon: <Clock size={40} className="text-orange-500" />,
                    bg: 'bg-orange-50',
                    text: 'text-orange-600'
                };
            case 'success':
                return {
                    label: '确权成功',
                    subLabel: '资产已发放至您的账户',
                    icon: <CheckCircle2 size={40} className="text-green-500" />,
                    bg: 'bg-green-50',
                    text: 'text-green-600'
                };
            case 'rejected':
                return {
                    label: '审核失败',
                    subLabel: '请查看下方原因并重新提交',
                    icon: <AlertCircle size={40} className="text-red-500" />,
                    bg: 'bg-red-50',
                    text: 'text-red-600'
                };
            default:
                return null;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'balance': return '余额截图';
            case 'transfer': return '转账记录';
            case 'other': return '其他凭证';
            default: return '未知类型';
        }
    };

    if (!record) return null;

    const statusConfig = getStatusConfig(record.status);

    return (
        <div className="min-h-screen bg-gray-50 pb-safe font-sans">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-gray-100">
                <button
                    onClick={onBack}
                    className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">详情</h1>
                <div className="w-8"></div>
            </header>

            <div className="p-4 space-y-4">
                {/* Status Card */}
                {statusConfig && (
                    <div className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 ${statusConfig.bg}`}>
                        <div className="mb-1">{statusConfig.icon}</div>
                        <h2 className={`text-xl font-bold ${statusConfig.text}`}>{statusConfig.label}</h2>
                        <p className={`text-sm opacity-80 ${statusConfig.text}`}>{statusConfig.subLabel}</p>
                    </div>
                )}

                {/* Amount Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center justify-center flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">确权金额</span>
                    <span className="text-3xl font-mono font-bold text-gray-900">
                        ¥{record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>

                {/* Rejection Reason */}
                {record.status === 'rejected' && record.reason && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={16} className="text-red-500" />
                            <span className="font-bold text-red-600 text-sm">驳回原因</span>
                        </div>
                        <p className="text-sm text-red-600/90 leading-relaxed bg-white/50 p-2 rounded-lg">
                            {record.reason}
                        </p>
                    </div>
                )}

                {/* Details List */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">凭证类型</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                            <FileText size={12} className="text-gray-400" />
                            <span className="text-gray-900 font-medium text-sm">{getTypeLabel(record.type)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">提交时间</span>
                        <span className="text-gray-900 font-medium font-mono text-sm">{record.time}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">记录编号</span>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium font-mono text-sm">#{record.id}</span>
                            <button onClick={() => copyToClipboard(record.id)} className="text-gray-400 hover:text-gray-600">
                                <Copy size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Evidence Images */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
                        <ImageIcon size={16} className="text-gray-400" />
                        <span className="font-bold text-gray-900 text-sm">凭证截图</span>
                        <span className="text-gray-400 text-xs ml-auto">共 {record.images?.length || 0} 张</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {record.images && record.images.map((img, idx) => (
                            <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <img src={img} alt={`Evidence ${idx}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Service Info */}
            <div className="text-center py-6 text-xs text-gray-400">
                如对结果有疑问，请联系在线客服
            </div>
        </div>
    );
};

export default ClaimDetail;
