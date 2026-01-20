/**
 * ReservationRecordDetailPage - 预约记录详情页面（现代化UI版）
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Zap, Package, CheckCircle2, Clock, XCircle, Wallet, TrendingUp, Sparkles, Award } from 'lucide-react';
import { fetchReservationDetail, ReservationDetailData } from '../../../services/collection';
import { ReservationStatus } from '../../../constants/statusEnums';
import { isSuccess, extractData } from '../../../utils/apiHelpers';
import { LoadingSpinner } from '../../../components/common';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

const ReservationRecordDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: reservationId } = useParams<{ id: string }>();
    const [record, setRecord] = useState<ReservationDetailData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
        initial: LoadingState.IDLE,
        transitions: {
            [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
            [LoadingState.LOADING]: {
                [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
                [LoadingEvent.ERROR]: LoadingState.ERROR,
            },
            [LoadingState.SUCCESS]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
            [LoadingState.ERROR]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
        },
    });
    const loading = loadMachine.state === LoadingState.LOADING;

    useEffect(() => {
        const loadDetail = async () => {
            try {
                loadMachine.send(LoadingEvent.LOAD);
                setError(null);
                const response = await fetchReservationDetail(reservationId);
                if (isSuccess(response)) {
                    const data = extractData(response);
                    setRecord(data);
                    loadMachine.send(LoadingEvent.SUCCESS);
                } else {
                    setError(response.msg || '加载失败');
                    loadMachine.send(LoadingEvent.ERROR);
                }
            } catch (err) {
                console.error('加载预约详情失败:', err);
                setError('加载失败，请稍后重试');
                loadMachine.send(LoadingEvent.ERROR);
            }
        };

        loadDetail();
    }, [reservationId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <LoadingSpinner text="加载详情..." />
            </div>
        );
    }

    if (error || !record) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center sticky top-0 z-10 shadow-lg">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:bg-white/20 rounded-full transition-colors">
                        <ArrowLeft size={22} className="text-white" />
                    </button>
                    <h1 className="ml-2 text-lg font-bold text-white">预约详情</h1>
                </header>
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle size={32} className="text-red-400" />
                    </div>
                    <p className="text-gray-500 text-sm">{error || '记录不存在'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-6 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium shadow-lg active:scale-95 transition-transform"
                    >
                        返回
                    </button>
                </div>
            </div>
        );
    }

    // Status config
    const getStatusConfig = () => {
        switch (record.status) {
            case ReservationStatus.PENDING:
                return {
                    icon: Clock,
                    gradient: 'from-amber-500 to-orange-500',
                    bg: 'from-amber-50 to-orange-50',
                    text: 'text-amber-600',
                    border: 'border-amber-200',
                    label: record.status_text || '待撮合'
                };
            case ReservationStatus.APPROVED:
                return {
                    icon: CheckCircle2,
                    gradient: 'from-emerald-500 to-green-500',
                    bg: 'from-emerald-50 to-green-50',
                    text: 'text-emerald-600',
                    border: 'border-emerald-200',
                    label: record.status_text || '已中签'
                };
            case ReservationStatus.REFUNDED:
                return {
                    icon: XCircle,
                    gradient: 'from-gray-400 to-gray-500',
                    bg: 'from-gray-50 to-slate-50',
                    text: 'text-gray-600',
                    border: 'border-gray-200',
                    label: record.status_text || '未中签'
                };
            default:
                return {
                    icon: Clock,
                    gradient: 'from-gray-400 to-gray-500',
                    bg: 'from-gray-50 to-slate-50',
                    text: 'text-gray-600',
                    border: 'border-gray-200',
                    label: record.status_text || '未知状态'
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center shadow-lg">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 -ml-2 active:bg-white/20 rounded-full transition-all"
                >
                    <ArrowLeft size={22} className="text-white" />
                </button>
                <h1 className="ml-2 text-lg font-bold text-white">预约详情</h1>
            </header>

            {/* 状态卡片 */}
            <div className="mx-4 mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center shadow-md`}>
                            <StatusIcon size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">预约状态</p>
                            <p className="text-lg font-bold text-gray-900">{statusConfig.label}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400">预约编号</p>
                        <p className="text-sm font-mono text-gray-600">#{record.id}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* 场次信息 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Calendar size={14} className="text-orange-600" />
                        </div>
                        场次信息
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">场次名称</span>
                            <span className="font-bold text-gray-900">{record.session_title || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">时间段</span>
                            <span className="font-medium text-gray-700">
                                {record.session_start_time} - {record.session_end_time}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">价格分区</span>
                            <span className="font-bold text-transparent bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text">
                                {record.zone_name || '-'}
                            </span>
                        </div>
                        {record.zone_min_price !== undefined && record.zone_max_price !== undefined && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-500">分区范围</span>
                                <span className="font-medium text-gray-700 font-mono">
                                    ¥{record.zone_min_price} - ¥{record.zone_max_price}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 金额详情 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                            <DollarSign size={14} className="text-green-600" />
                        </div>
                        金额详情
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 flex items-center gap-1.5">
                                <Wallet size={14} className="text-gray-400" />
                                冻结金额
                            </span>
                            <span className="font-bold text-rose-600 font-mono text-lg">
                                ¥{Number(record.freeze_amount || 0).toLocaleString()}
                            </span>
                        </div>
                        {record.status === ReservationStatus.APPROVED && record.actual_buy_price !== undefined && (
                            <>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 flex items-center gap-1.5">
                                        <TrendingUp size={14} className="text-gray-400" />
                                        实际购买价
                                    </span>
                                    <span className="font-bold text-emerald-600 font-mono text-lg">
                                        ¥{Number(record.actual_buy_price).toLocaleString()}
                                    </span>
                                </div>
                                {record.refund_diff !== undefined && Number(record.refund_diff) > 0 && (
                                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-emerald-700">
                                                <CheckCircle2 size={16} />
                                                <span className="font-medium">退还差价</span>
                                            </span>
                                            <span className="font-bold font-mono text-emerald-600 text-lg">
                                                +¥{Number(record.refund_diff).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* 算力信息 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Zap size={14} className="text-amber-600" />
                        </div>
                        算力信息
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 text-center border border-amber-100">
                            <p className="text-[10px] text-gray-500 mb-1">消耗算力</p>
                            <p className="text-xl font-black text-amber-600">{record.power_used || 0}</p>
                        </div>
                        {record.base_hashrate_cost !== undefined && (
                            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3 text-center border border-gray-100">
                                <p className="text-[10px] text-gray-500 mb-1">基础算力</p>
                                <p className="text-xl font-black text-gray-700">{record.base_hashrate_cost}</p>
                            </div>
                        )}
                        {record.extra_hashrate_cost !== undefined && Number(record.extra_hashrate_cost) > 0 && (
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 text-center border border-emerald-100">
                                <p className="text-[10px] text-gray-500 mb-1">额外算力</p>
                                <p className="text-xl font-black text-emerald-600">+{record.extra_hashrate_cost}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 中签藏品 */}
                {record.status === ReservationStatus.APPROVED && record.item_title && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Award size={14} className="text-orange-600" />
                            </div>
                            中签藏品
                        </h3>
                        <div className="flex gap-3 items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                            {record.item_image && (
                                <img
                                    src={record.item_image}
                                    alt={record.item_title}
                                    className="w-20 h-20 rounded-xl object-cover shadow-lg"
                                />
                            )}
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 mb-1">{record.item_title}</div>
                                {record.match_order_id && (
                                    <div className="text-xs text-gray-500">订单编号: #{record.match_order_id}</div>
                                )}
                                <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                                    <Sparkles size={12} />
                                    <span>恭喜获得此藏品</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 时间线 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Clock size={14} className="text-gray-600" />
                        </div>
                        时间线
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">申购时间</span>
                            <span className="font-medium text-gray-700">{record.create_time}</span>
                        </div>
                        {record.match_time && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">撮合时间</span>
                                <span className="font-medium text-gray-700">{record.match_time}</span>
                            </div>
                        )}
                        {record.update_time && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-500">更新时间</span>
                                <span className="font-medium text-gray-700">{record.update_time}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 底部按钮 */}
            {record.status === ReservationStatus.APPROVED && record.product_id && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 safe-area-bottom">
                    <button
                        onClick={() => navigate(`/product/${record.product_id}`, { state: { productType: 'collection' } })}
                        className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Award size={18} />
                        查看藏品证书
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReservationRecordDetailPage;
