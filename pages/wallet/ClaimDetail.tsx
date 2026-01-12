import React, { useState, useEffect } from 'react';
import { ChevronLeft, Clock, CheckCircle2, AlertCircle, FileText, ImageIcon, Copy } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { getRightsDeclarationDetail, RightsDeclarationDetail } from '../../services/rightsDeclaration';
import { AUTH_TOKEN_KEY } from '../../constants/storageKeys';
import { isSuccess, extractError } from '../../utils/apiHelpers';

interface ClaimDetailProps {
    id: string;
    onBack: () => void;
}

const ClaimDetail: React.FC<ClaimDetailProps> = ({ id, onBack }) => {
    const { showToast } = useNotification();
    const [record, setRecord] = useState<RightsDeclarationDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetail();
    }, [id]);

    const loadDetail = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                showToast('error', '登录过期', '请重新登录');
                return;
            }

            const response = await getRightsDeclarationDetail(parseInt(id), token);
            if (isSuccess(response) && response.data) {
                setRecord(response.data.detail);
            } else {
                showToast('error', '加载失败', extractError(response, '获取详情失败'));
            }
        } catch (error: any) {
            console.error('加载详情失败:', error);
            showToast('error', '加载失败', '网络错误，请重试');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', '复制成功');
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    label: '待审核',
                    subLabel: '系统正在审核您的凭证，请耐心等待',
                    icon: <Clock size={40} className="text-orange-500" />,
                    bg: 'bg-orange-50',
                    text: 'text-orange-600'
                };
            case 'approved':
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
            case 'cancelled':
                return {
                    label: '已撤销',
                    subLabel: '您已撤销此确权申请',
                    icon: <AlertCircle size={40} className="text-gray-500" />,
                    bg: 'bg-gray-50',
                    text: 'text-gray-600'
                };
            default:
                return null;
        }
    };

    const getTypeLabel = (record: RightsDeclarationDetail) => {
        return record.voucher_type_text || '未知类型';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-safe font-sans flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
            </div>
        );
    }

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
                        ¥{Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>

                {/* Rejection Reason */}
                {record.status === 'rejected' && record.review_remark && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={16} className="text-red-500" />
                            <span className="font-bold text-red-600 text-sm">驳回原因</span>
                        </div>
                        <p className="text-sm text-red-600/90 leading-relaxed bg-white/50 p-2 rounded-lg">
                            {record.review_remark}
                        </p>
                    </div>
                )}

                {/* Details List */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">凭证类型</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                            <FileText size={12} className="text-gray-400" />
                            <span className="text-gray-900 font-medium text-sm">{getTypeLabel(record)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">提交时间</span>
                        <span className="text-gray-900 font-medium font-mono text-sm">{record.create_time_text}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">记录编号</span>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium font-mono text-sm">#{record.id}</span>
                            <button onClick={() => copyToClipboard(record.id.toString())} className="text-gray-400 hover:text-gray-600">
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
                        <span className="text-gray-400 text-xs ml-auto">共 {record.images_array?.length || 0} 张</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {record.images_array && record.images_array.map((img, idx) => (
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
