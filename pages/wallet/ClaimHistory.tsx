import React, { useState } from 'react';
import { ChevronLeft, Search, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface ClaimHistoryProps {
    onBack: () => void;
    onNavigate: (page: string) => void;
}

interface ClaimRecord {
    id: string;
    type: string;
    amount: number;
    status: 'audit' | 'success' | 'rejected';
    time: string;
    reason?: string;
}

const ClaimHistory: React.FC<ClaimHistoryProps> = ({ onBack, onNavigate }) => {
    // Mock Data
    const [history] = useState<ClaimRecord[]>([
        { id: '1', type: 'balance', amount: 5000.00, status: 'audit', time: '2023-10-27 10:00' },
        { id: '2', type: 'transfer', amount: 948.00, status: 'success', time: '2023-10-26 14:30' },
        { id: '3', type: 'other', amount: 3000.00, status: 'rejected', time: '2023-10-25 09:15', reason: '凭证模糊不清，无法识别' },
        { id: '4', type: 'balance', amount: 12000.00, status: 'success', time: '2023-10-20 11:20' },
        { id: '5', type: 'transfer', amount: 500.00, status: 'success', time: '2023-10-18 16:45' },
        { id: '6', type: 'balance', amount: 2000.00, status: 'rejected', time: '2023-10-15 09:30', reason: '账号信息不匹配' },
    ]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'audit':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-500 border border-orange-100 flex items-center gap-1"><Clock size={12} /> AI审计中</span>;
            case 'success':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-50 text-green-500 border border-green-100 flex items-center gap-1"><CheckCircle2 size={12} /> 确权成功</span>;
            case 'rejected':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-500 border border-red-100 flex items-center gap-1"><AlertCircle size={12} /> 审核失败</span>;
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

    return (
        <div className="min-h-screen bg-gray-50 pb-safe font-sans">
            {/* Header - White background, gray text, border bottom */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-gray-100">
                <button
                    onClick={onBack}
                    className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">确权记录</h1>
                <div className="w-8"></div> {/* Spacer for center alignment */}
            </header>

            {/* List */}
            <div className="p-4 space-y-3">
                {history.length > 0 ? (
                    history.map((record) => (
                        <div
                            key={record.id}
                            onClick={() => onNavigate(`claim-detail:${record.id}`)}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transition-transform"
                        >
                            {/* Header: ID/Type + Status */}
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                        <FileText size={16} />
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{getTypeLabel(record.type)}</span>
                                </div>
                                {getStatusBadge(record.status)}
                            </div>

                            {/* Content */}
                            <div className="flex justify-between items-end mb-1">
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>{record.time}</span>
                                    </div>
                                    {record.reason && (
                                        <div className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded inline-block">
                                            驳回原因: {record.reason}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 mb-0.5">确权金额</div>
                                    <span className="font-mono font-bold text-gray-900 text-lg">
                                        ¥{record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} />
                        </div>
                        <p className="text-sm">暂无确权记录</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClaimHistory;
