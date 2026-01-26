/**
 * RechargeOrderDetail - 充值订单详情页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, FileText, Calendar, CreditCard, Receipt, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import { formatTime } from '@/utils/format';
import { useNotification } from '@/context/NotificationContext';
import PageContainer from '@/layouts/PageContainer';
import { getRechargeOrderDetail, RechargeOrderDetail as RechargeOrderDetailType } from '@/services/wallet';
import { extractData, isSuccess } from '@/utils/apiHelpers';
import { useLoadingMachine, LoadingEvent, LoadingState } from '@/hooks';
import { errorLog } from '@/utils/logger';
import { copyToClipboard } from '@/utils/clipboard';
import { getRechargeOrderStatusConfig } from '@/constants/statusEnums';

const RechargeOrderDetail: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();
    const { showToast } = useNotification();
    const [order, setOrder] = useState<RechargeOrderDetailType | null>(null);
    const loadMachine = useLoadingMachine();
    const loading = loadMachine.state === LoadingState.LOADING;

    useEffect(() => {
        const fetchDetail = async () => {
            if (!orderId) return;
            
            try {
                loadMachine.send(LoadingEvent.LOAD);
                const res = await getRechargeOrderDetail(orderId);
                if (isSuccess(res)) {
                    setOrder(extractData(res));
                    loadMachine.send(LoadingEvent.SUCCESS);
                } else {
                    showToast('error', '获取详情失败', res.msg || '请稍后重试');
                    loadMachine.send(LoadingEvent.ERROR);
                }
            } catch (error) {
                errorLog('RechargeOrderDetail', '获取充值详情失败', error);
                showToast('error', '加载失败', '网络错误，请稍后重试');
                loadMachine.send(LoadingEvent.ERROR);
            } finally {
                // 状态机已处理成功/失败
            }
        };

        fetchDetail();
    }, [orderId, showToast]);

    const handleCopy = async (text: string) => {
        if (!text || text.trim() === '') {
            showToast('error', '内容为空，无法复制');
            return;
        }
        const success = await copyToClipboard(text);
        if (success) {
            showToast('success', '复制成功');
        } else {
            showToast('error', '复制失败', '请手动复制');
        }
    };

    // 获取状态图标组件
    const getStatusIcon = (iconName: string) => {
        switch (iconName) {
            case 'check-circle': return CheckCircle;
            case 'x-circle': return XCircle;
            default: return Clock;
        }
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

    const statusConfig = getRechargeOrderStatusConfig(order.status);
    const StatusIcon = getStatusIcon(statusConfig.iconName);

    return (
        <PageContainer title="充值订单详情" onBack={() => navigate(-1)}>
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
                            {order.status === 2 && (order.audit_remark ? `拒绝原因：${order.audit_remark}` : '您的充值申请未通过审核')}
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
                                onClick={() => handleCopy(order.order_no)}
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
                            {order.payment_type_text || (order.payment_type === 'online' ? '在线支付' : order.payment_type)}
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
        </PageContainer>
    );
};

export default RechargeOrderDetail;
