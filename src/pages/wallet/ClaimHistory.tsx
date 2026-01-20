/**
 * ClaimHistory - 确权历史记录
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { getRightsDeclarationList, RightsDeclarationRecord } from '../../../services/rightsDeclaration';
import { getStoredToken } from '../../../services/client';
import { useNotification } from '../../../context/NotificationContext';
import { isSuccess, extractError } from '../../../utils/apiHelpers';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

const ClaimHistory: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();

    // ✅ 使用统一错误处理Hook（Toast模式）
    const { handleError } = useErrorHandler({ showToast: true, persist: false });

    const [history, setHistory] = useState<RightsDeclarationRecord[]>([]);
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

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const bottomRef = useInfiniteScroll(handleLoadMore, hasMore, loading);

    useEffect(() => {
        loadHistory(1, false);
    }, []);

    useEffect(() => {
        if (page > 1) {
            loadHistory(page, true);
        }
    }, [page]);

    const loadHistory = async (pageNum: number, append: boolean = false) => {
        loadMachine.send(LoadingEvent.LOAD);
        try {
            const token = getStoredToken();
            if (!token) {
                showToast('error', '登录过期', '请重新登录');
                loadMachine.send(LoadingEvent.ERROR);
                return;
            }

            const response = await getRightsDeclarationList({ page: pageNum, limit: 10 }, token);

            if (isSuccess(response) && response.data) {
                const list = response.data.list || [];
                const total = response.data.total || 0;

                if (append) {
                    setHistory(prev => [...prev, ...list]);
                } else {
                    setHistory(list);
                }

                setHasMore(pageNum * 10 < total);
                loadMachine.send(LoadingEvent.SUCCESS);
            } else {
                // ✅ 使用统一错误处理
                handleError(response, {
                    toastTitle: '加载失败',
                    customMessage: '获取历史记录失败',
                    context: { page: 'ClaimHistory' }
                });
                loadMachine.send(LoadingEvent.ERROR);
            }
        } catch (error: any) {
            // ✅ 使用统一错误处理
            handleError(error, {
                toastTitle: '加载失败',
                customMessage: '网络错误，请重试',
                context: { page: 'ClaimHistory' }
            });
            loadMachine.send(LoadingEvent.ERROR);
        } finally {
            // 状态机已处理成功/失败
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-500 border border-orange-100 flex items-center gap-1"><Clock size={12} /> 待审核</span>;
            case 'approved':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-50 text-green-500 border border-green-100 flex items-center gap-1"><CheckCircle2 size={12} /> 确权成功</span>;
            case 'rejected':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-500 border border-red-100 flex items-center gap-1"><AlertCircle size={12} /> 审核失败</span>;
            case 'cancelled':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1"><AlertCircle size={12} /> 已撤销</span>;
            default:
                return null;
        }
    };

    const getTypeLabel = (record: RightsDeclarationRecord) => {
        return record.voucher_type_text || '未知类型';
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-safe font-sans">
            {/* Header - White background, gray text, border bottom */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-gray-100">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">确权记录</h1>
                <div className="w-8"></div> {/* Spacer for center alignment */}
            </header>

            {/* List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-4"></div>
                        <p className="text-sm">加载中...</p>
                    </div>
                ) : history.length > 0 ? (
                    history.map((record) => (
                        <div
                            key={record.id}
                            onClick={() => navigate(`/claim-detail/${record.id}`)}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transition-transform"
                        >
                            {/* Header: ID/Type + Status */}
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                        <FileText size={16} />
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{getTypeLabel(record)}</span>
                                </div>
                                {getStatusBadge(record.status)}
                            </div>

                            {/* Content */}
                            <div className="flex justify-between items-end mb-1">
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>{record.create_time_text}</span>
                                    </div>
                                    {record.review_remark && record.status === 'rejected' && (
                                        <div className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded inline-block">
                                            驳回原因: {record.review_remark}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 mb-0.5">确权金额</div>
                                    <span className="font-mono font-bold text-gray-900 text-lg">
                                        ¥{Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

            {/* Infinite Scroll Sentinel */}
            <div ref={bottomRef} className="h-4" />
            {loading && hasMore && (
                <div className="py-4 text-center text-xs text-gray-400">加载中...</div>
            )}
        </div>
    );
};

export default ClaimHistory;
