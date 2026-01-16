/**
 * WithdrawOrderDetail - 提现订单详情页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, FileText, Calendar, CreditCard, Receipt, CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../../../components/common';
import { useNotification } from '../../../context/NotificationContext';
import SubPageLayout from '../../../components/SubPageLayout';
import { getMyWithdrawList, WithdrawRecordItem } from '../../../services/wallet';
import { isSuccess } from '../../../utils/apiHelpers';

const WithdrawOrderDetail: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();
    const { showToast } = useNotification();
    const [order, setOrder] = useState<WithdrawRecordItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!orderId) return;
            
            try {
                const res = await getMyWithdrawList({ page: 1, limit: 100 });
                if (isSuccess(res)) {
                    const list = res.data.data || [];
                    const found = list.find(item => String(item.id) === String(orderId));
                    if (found) {
                        setOrder(found);
                    } else {
                        showToast('error', '未找到订单信息');
                    }
                } else {
                    showToast('error', '获取详情失败', res.msg || '请稍后重试');
                }
            } catch (error) {
                console.error('Fetch withdraw detail failed:', error);
                showToast('error', '加载失败', '网络错误，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [orderId, showToast]);

    const copyToClipboard = async (text: string) => {
        if (!text || text.trim() === '') {
            showToast('error', '内容为空，无法复制');
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                showToast('success', '复制成功');
                return;
            } catch (err: any) {
                console.warn('Modern clipboard API failed:', err);
            }
        }

        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            textArea.setAttribute('readonly', '');

            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, text.length);

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                showToast('success', '复制成功');
                return;
            }
            throw new Error('execCommand failed');
        } catch (err: any) {
            console.error('Fallback copy failed:', err);
            showToast('error', '复制失败', '请手动复制');
        }
    };

    const getStatusConfig = (status: number) => {
        const configs = {
            0: { text: '待审核', color: 'text-orange-600', bgColor: 'bg-gradient-to-r from-orange-400 to-orange-500', icon: Clock },
            1: { text: '已通过', color: 'text-green-600', bgColor: 'bg-gradient-to-r from-green-400 to-green-500', icon: CheckCircle },
            2: { text: '已拒绝', color: 'text-red-600', bgColor: 'bg-gradient-to-r from-red-400 to-red-500', icon: XCircle },
            3: { text: '已打款', color: 'text-blue-600', bgColor: 'bg-gradient-to-r from-blue-400 to-blue-500', icon: CheckCircle },
            4: { text: '打款失败', color: 'text-gray-600', bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500', icon: AlertTriangle },
        } as const;
        return configs[status as keyof typeof configs] || configs[0];
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
                <div className="mb-4">订单不存在</div>
                <button onClick={() => navigate(-1)} className="text-blue-500 flex items-center gap-1">
                    <ArrowLeft size={16} /> 返回列表
                </button>
            </div>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    return (
        <SubPageLayout title="提现详情" onBack={() => navigate(-1)}>
            <div className="p-4 space-y-4 pb-safe">
                {/* 状态横幅 */}
                <div className={`${statusConfig.bgColor} rounded-xl p-6 text-white shadow-lg relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <StatusIcon size={28} className="opacity-90" />
                            <div className="text-2xl font-bold">{statusConfig.text}</div>
                        </div>
                        <div className="text-white/90 text-sm">
                            {order.status === 0 && '您的提现申请正在审核中，请耐心等待'}
                            {order.status === 1 && '您的提现申请审核已通过'}
                            {order.status === 2 && (order.audit_reason ? `拒绝原因：${order.audit_reason}` : '您的提现申请未通过审核')}
                            {order.status === 3 && '款项已打入您的账户，请注意查收'}
                            {order.status === 4 && '打款失败，请联系客服'}
                        </div>
                    </div>
                </div>

                {/* 金额信息 */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-50">
                    <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2">提现金额</div>
                        <div className="text-4xl font-bold text-gray-900 font-mono">
                            ¥{order.amount}
                        </div>
                        {Number(order.fee) > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                                手续费: ¥{order.fee} | 实际到账: ¥{order.actual_amount}
                            </div>
                        )}
                    </div>
                </div>

                {/* 订单信息 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                        <FileText size={16} className="text-orange-600" />
                        <span className="text-sm font-bold text-gray-700">提现信息</span>
                    </div>

                    {/* 订单号 */}
                    {order.order_no && (
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 p-1 rounded-md">
                                    <Receipt size={14} />
                                </span>
                                <span className="text-sm text-gray-600">单号</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-800">{order.order_no}</span>
                                <button
                                    onClick={() => copyToClipboard(order.order_no!)}
                                    className="text-orange-600 hover:text-orange-700 active:scale-95 transition-transform"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 提现账户 */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-600 p-1 rounded-md">
                                <CreditCard size={14} />
                            </span>
                            <span className="text-sm text-gray-600">提现账户</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-800">{order.account_type_text}</div>
                            <div className="text-xs text-gray-500">{order.account_name} {order.account_number}</div>
                            {order.bank_name && <div className="text-xs text-gray-400">{order.bank_name}</div>}
                        </div>
                    </div>

                    {/* 订单状态 */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-600 p-1 rounded-md">
                                <Calendar size={14} />
                            </span>
                            <span className="text-sm text-gray-600">状态</span>
                        </div>
                        <span className={`text-sm font-bold ${statusConfig.color}`}>
                            {order.status_text}
                        </span>
                    </div>
                </div>

                {/* 审核信息 */}
                {(order.audit_time || order.audit_time_text) && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-50">
                            <CheckCircle size={16} className="text-orange-600" />
                            <span className="text-sm font-bold text-gray-700">审核记录</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">审核时间</span>
                                <span className="text-gray-800">{order.audit_time_text || (order.audit_time ? formatTime(order.audit_time) : '-')}</span>
                            </div>
                            {order.audit_reason && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">审核备注</span>
                                    <span className="text-gray-800 text-right max-w-[70%]">{order.audit_reason}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 打款信息 */}
                {(order.pay_time || order.pay_time_text) && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-50">
                            <Receipt size={16} className="text-orange-600" />
                            <span className="text-sm font-bold text-gray-700">打款记录</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">打款时间</span>
                                <span className="text-gray-800">{order.pay_time_text || (order.pay_time ? formatTime(order.pay_time) : '-')}</span>
                            </div>
                            {order.pay_reason && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">备注</span>
                                    <span className="text-gray-800 text-right max-w-[70%]">{order.pay_reason}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 创建时间 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>申请时间</span>
                        <span>{order.create_time_text || formatTime(order.create_time)}</span>
                    </div>
                </div>
            </div>
        </SubPageLayout>
    );
};

export default WithdrawOrderDetail;
