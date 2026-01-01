import React, { useState, useEffect } from 'react';
import { Copy, FileText, Calendar, CreditCard, Receipt, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from '../../components/common';
import { formatTime } from '../../utils/format';
import { useNotification } from '../../context/NotificationContext';
import SubPageLayout from '../../components/SubPageLayout';

import { getRechargeOrderDetail, RechargeOrderDetail as RechargeOrderDetailType } from '../../services/wallet';
import { extractData, isSuccess } from '../../utils/apiHelpers';

interface RechargeOrderDetailProps {
    orderId: string;
    onBack: () => void;
}

const RechargeOrderDetail: React.FC<RechargeOrderDetailProps> = ({ orderId, onBack }) => {
    const { showToast } = useNotification();
    const [order, setOrder] = useState<RechargeOrderDetailType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await getRechargeOrderDetail(orderId);
                if (isSuccess(res)) {
                    setOrder(extractData(res));
                } else {
                    showToast('error', '获取详情失败', res.msg || '请稍后重试');
                }
            } catch (error) {
                console.error('Fetch recharge detail failed:', error);
                showToast('error', '加载失败', '网络错误，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchDetail();
        }
    }, [orderId, showToast]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', '复制成功');
        }).catch(() => {
            showToast('error', '复制失败');
        });
    };

    const getStatusConfig = (status: number) => {
        const configs = {
            0: { text: '待审核', color: 'text-orange-600', bgColor: 'bg-gradient-to-r from-orange-400 to-orange-500', icon: Clock },
            1: { text: '已通过', color: 'text-green-600', bgColor: 'bg-gradient-to-r from-green-400 to-green-500', icon: CheckCircle },
            2: { text: '已拒绝', color: 'text-red-600', bgColor: 'bg-gradient-to-r from-red-400 to-red-500', icon: XCircle },
        } as const;
        return configs[status as keyof typeof configs] || configs[0];
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
                订单不存在
            </div>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    return (
        <SubPageLayout title="充值订单详情" onBack={onBack}>
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
                            {order.status === 0 && '您的充值申请正在审核中，请耐心等待'}
                            {order.status === 1 && '您的充值已到账，感谢您的使用'}
                            {order.status === 2 && order.audit_remark ? `拒绝原因：${order.audit_remark}` : '您的充值申请未通过审核'}
                        </div>
                    </div>
                </div>

                {/* 金额信息 */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-50">
                    <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2">充值金额</div>
                        <div className="text-4xl font-bold text-orange-600 font-mono">
                            ¥{order.amount}
                        </div>
                    </div>
                </div>

                {/* 订单信息 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                        <FileText size={16} className="text-orange-600" />
                        <span className="text-sm font-bold text-gray-700">订单信息</span>
                    </div>

                    {/* 订单号 */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 p-1 rounded-md">
                                <Receipt size={14} />
                            </span>
                            <span className="text-sm text-gray-600">订单号</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-gray-800">{order.order_no}</span>
                            <button
                                onClick={() => copyToClipboard(order.order_no)}
                                className="text-orange-600 hover:text-orange-700 active:scale-95 transition-transform"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>

                    {/* 支付方式 */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-600 p-1 rounded-md">
                                <CreditCard size={14} />
                            </span>
                            <span className="text-sm text-gray-600">支付方式</span>
                        </div>
                        <span className="text-sm text-gray-800">
                            {order.payment_type === 'online' ? '在线支付' : order.payment_type_text}
                        </span>
                    </div>

                    {/* 订单状态 */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-600 p-1 rounded-md">
                                <Calendar size={14} />
                            </span>
                            <span className="text-sm text-gray-600">订单状态</span>
                        </div>
                        <span className={`text-sm font-bold ${statusConfig.color}`}>
                            {order.status_text}
                        </span>
                    </div>
                </div>

                {/* 支付凭证 */}
                {order.payment_screenshot && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-50">
                            <ImageIcon size={16} className="text-orange-600" />
                            <span className="text-sm font-bold text-gray-700">支付凭证</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={order.payment_screenshot}
                                alt="支付凭证"
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                )}

                {/* 审核信息 */}
                {order.status !== 0 && order.audit_time > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-50">
                            <CheckCircle size={16} className="text-orange-600" />
                            <span className="text-sm font-bold text-gray-700">审核信息</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">审核时间</span>
                                <span className="text-gray-800">{order.audit_time_text || formatTime(order.audit_time)}</span>
                            </div>
                            {order.audit_remark && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">审核备注</span>
                                    <span className="text-gray-800">{order.audit_remark}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 时间信息 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>创建时间</span>
                        <span>{order.create_time_text || formatTime(order.create_time)}</span>
                    </div>
                    {order.update_time > order.create_time && (
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>更新时间</span>
                            <span>{formatTime(order.update_time)}</span>
                        </div>
                    )}
                </div>
            </div>
        </SubPageLayout>
    );
};

export default RechargeOrderDetail;
