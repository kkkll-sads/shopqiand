import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, DollarSign, Zap, Package, CheckCircle2, Clock, XCircle, Wallet, TrendingUp } from 'lucide-react';
import { fetchReservationDetail, ReservationDetailData } from '../../services/collection';
import { ReservationStatus } from '../../constants/statusEnums';
import { Route } from '../../router/routes';
import { isSuccess, extractData } from '../../utils/apiHelpers';
import { LoadingSpinner } from '../../components/common';

interface ReservationRecordDetailPageProps {
    reservationId: string | number;
    onBack: () => void;
    onNavigate: (route: Route) => void;
}

const ReservationRecordDetailPage: React.FC<ReservationRecordDetailPageProps> = ({ reservationId, onBack, onNavigate }) => {
    const [record, setRecord] = useState<ReservationDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetchReservationDetail(reservationId);
                if (isSuccess(response)) {
                    const data = extractData(response);
                    setRecord(data);
                } else {
                    setError(response.msg || '加载失败');
                }
            } catch (err) {
                console.error('加载预约详情失败:', err);
                setError('加载失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        loadDetail();
    }, [reservationId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !record) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center sticky top-0 z-10">
                    <button onClick={onBack} className="p-2 -ml-2 active:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="ml-2 text-lg font-bold text-gray-900">预约详情</h1>
                </header>
                <div className="p-4 text-center text-gray-500">
                    <XCircle size={48} className="mx-auto mb-2 text-red-400" />
                    <p>{error || '记录不存在'}</p>
                </div>
            </div>
        );
    }

    // Status badge rendering
    const getStatusBadge = () => {
        switch (record.status) {
            case ReservationStatus.PENDING:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700 border border-orange-200">
                        <Clock size={14} />
                        {record.status_text || '待撮合'}
                    </span>
                );
            case ReservationStatus.APPROVED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle2 size={14} />
                        {record.status_text || '已中签'}
                    </span>
                );
            case ReservationStatus.REFUNDED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        <XCircle size={14} />
                        {record.status_text || '未中签'}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        {record.status_text || '未知状态'}
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center sticky top-0 z-10">
                <button onClick={onBack} className="p-2 -ml-2 active:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="ml-2 text-lg font-bold text-gray-900">预约详情</h1>
            </header>

            <div className="p-4 space-y-4">
                {/* Status Card */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-gray-900">预约状态</h2>
                        {getStatusBadge()}
                    </div>
                    <div className="text-xs text-gray-500">
                        预约编号: #{record.id}
                    </div>
                </div>

                {/* Session & Zone Info */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar size={16} className="text-orange-500" />
                        场次信息
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">场次名称</span>
                            <span className="font-bold text-gray-900">{record.session_title || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">时间段</span>
                            <span className="font-medium text-gray-900">
                                {record.session_start_time} - {record.session_end_time}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">价格分区</span>
                            <span className="font-bold text-orange-600">{record.zone_name || '-'}</span>
                        </div>
                        {record.zone_min_price !== undefined && record.zone_max_price !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">分区范围</span>
                                <span className="font-medium text-gray-700">
                                    ¥{record.zone_min_price} - ¥{record.zone_max_price}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign size={16} className="text-green-500" />
                        金额详情
                    </h3>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 flex items-center gap-1.5">
                                <Wallet size={12} />
                                冻结金额
                            </span>
                            <span className="font-bold text-red-600 font-mono">
                                ¥{Number(record.freeze_amount || 0).toLocaleString()}
                            </span>
                        </div>
                        {record.status === ReservationStatus.APPROVED && record.actual_buy_price !== undefined && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center gap-1.5">
                                        <TrendingUp size={12} />
                                        实际购买价
                                    </span>
                                    <span className="font-bold text-green-600 font-mono">
                                        ¥{Number(record.actual_buy_price).toLocaleString()}
                                    </span>
                                </div>
                                {record.refund_diff !== undefined && Number(record.refund_diff) > 0 && (
                                    <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                                        <div className="flex justify-between items-center text-green-700">
                                            <span className="flex items-center gap-1.5 text-xs">
                                                <CheckCircle2 size={12} />
                                                退还差价
                                            </span>
                                            <span className="font-bold font-mono">
                                                ¥{Number(record.refund_diff).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Hashrate & Weight */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Zap size={16} className="text-yellow-500" />
                        算力信息
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">消耗算力</span>
                            <span className="font-bold text-gray-900">{record.power_used || 0}</span>
                        </div>
                        {record.base_hashrate_cost !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">基础算力</span>
                                <span className="font-bold text-gray-900">{record.base_hashrate_cost}</span>
                            </div>
                        )}
                        {record.extra_hashrate_cost !== undefined && Number(record.extra_hashrate_cost) > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">额外算力</span>
                                <span className="font-medium text-green-600">+{record.extra_hashrate_cost}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Item Info (if matched) */}
                {record.status === ReservationStatus.APPROVED && record.item_title && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Package size={16} className="text-blue-500" />
                            中签藏品
                        </h3>
                        <div className="flex gap-3">
                            {record.item_image && (
                                <img
                                    src={record.item_image}
                                    alt={record.item_title}
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                            )}
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 mb-1">{record.item_title}</div>
                                {record.match_order_id && (
                                    <div className="text-xs text-gray-500">订单编号: #{record.match_order_id}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        时间线
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">申购时间</span>
                            <span className="font-medium text-gray-700">{record.create_time}</span>
                        </div>
                        {record.match_time && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">撮合时间</span>
                                <span className="font-medium text-gray-700">{record.match_time}</span>
                            </div>
                        )}
                        {record.update_time && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">更新时间</span>
                                <span className="font-medium text-gray-700">{record.update_time}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationRecordDetailPage;
