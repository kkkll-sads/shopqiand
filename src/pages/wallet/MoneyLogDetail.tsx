/**
 * MoneyLogDetail - 资金明细详情页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FileText, Calendar, Hash, Package, Receipt, TrendingUp, Copy, Check } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner, LazyImage } from '@/components/common';
import { getMoneyLogDetail, MoneyLogDetailData } from '@/services/wallet';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { useNotification } from '@/context/NotificationContext';
import { formatAmount, formatTime } from '@/utils/format';
import { getBalanceTypeLabel } from '@/constants/balanceTypes';
import { getStoredToken } from '@/services/client';
import { normalizeAssetUrl } from '@/services/config';
import { BizTypeMap, BizType } from '@/constants/statusEnums';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';
import MoneyLogBreakdownCard from './components/asset/MoneyLogBreakdownCard';

const MoneyLogDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const flowNo = searchParams.get('flowNo') || undefined;

  const { showToast } = useNotification();
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<MoneyLogDetailData | null>(null);
  const [copiedFlowNo, setCopiedFlowNo] = useState<boolean>(false);
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

  const handleCopyFlowNo = (text: string) => {
    if (!text || text === '-') return;

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        width: 2em;
        height: 2em;
        padding: 0;
        border: none;
        outline: none;
        box-shadow: none;
        background: transparent;
        color: transparent;
        z-index: -1;
      `;
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('contenteditable', 'true');

      document.body.appendChild(textArea);

      const range = document.createRange();
      range.selectNodeContents(textArea);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      textArea.setSelectionRange(0, text.length);
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (success) {
        setCopiedFlowNo(true);
        showToast('success', '复制成功');
        setTimeout(() => setCopiedFlowNo(false), 2000);
      } else {
        showToast('error', '复制失败', '请长按流水号手动复制');
      }
    } catch (err) {
      errorLog('MoneyLogDetail', 'Copy failed', err);
      showToast('error', '复制失败', '请长按流水号手动复制');
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id, flowNo]);

  const loadDetail = async () => {
    const token = getStoredToken();
    if (!token) {
      setError('请先登录');
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    if (!id && !flowNo) {
      setError('缺少必要参数');
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    loadMachine.send(LoadingEvent.LOAD);
    setError(null);

    try {
      const res = await getMoneyLogDetail({
        id: id ? Number(id) : undefined,
        flow_no: flowNo,
        token,
      });

      const data = extractData(res);
      if (isSuccess(res) && data) {
        setDetail(data);
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        setError(extractError(res, '获取资金明细详情失败'));
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (e: any) {
      errorLog('MoneyLogDetail', '加载失败', e);
      setError(e?.message || '加载数据失败');
      loadMachine.send(LoadingEvent.ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  if (loading) {
    return (
      <PageContainer title="资金明细详情" onBack={() => navigate(-1)}>
        <LoadingSpinner text="加载中..." />
      </PageContainer>
    );
  }

  if (error || !detail) {
    return (
      <PageContainer title="资金明细详情" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">{error || '数据不存在'}</span>
        </div>
      </PageContainer>
    );
  }

  const amountVal = Number(detail.amount);
  const isPositive = amountVal > 0;
  const accountTypeLabel = detail.account_type ? getBalanceTypeLabel(detail.account_type) : '未知类型';

  return (
    <PageContainer title="资金明细详情" onBack={() => navigate(-1)}>
      <div className="space-y-4">
        {/* 金额卡片 */}
        <div className={`bg-gradient-to-br ${isPositive ? 'from-green-500 to-green-600' : 'from-gray-600 to-gray-700'} rounded-2xl p-6 text-white shadow-lg`}>
          <div className="text-center mb-4">
            <div className="text-sm opacity-90 mb-2">变动金额</div>
            <div className="text-4xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
              {isPositive ? '+' : ''}{Math.abs(amountVal).toFixed(2)} 元
            </div>
          </div>
          <div className="flex justify-between items-center text-sm opacity-90">
            <span>变动前: {formatAmount(detail.before_value)}</span>
            <span className="text-lg">→</span>
            <span>变动后: {formatAmount(detail.after_value)}</span>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Receipt className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-gray-900 text-base">基本信息</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm">流水号</span>
              </div>
              <button
                onClick={() => handleCopyFlowNo(detail.flow_no || '')}
                className="flex items-center gap-1.5 text-sm font-mono text-gray-900 hover:text-red-600 active:scale-95 transition-all px-2 py-1 -mr-2 rounded-md hover:bg-red-50"
                title="点击复制"
              >
                <span>{detail.flow_no || '-'}</span>
                {copiedFlowNo ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            </div>

            {detail.batch_no && (
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">批次号</span>
                </div>
                <span className="text-sm font-mono text-gray-900">{detail.batch_no}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm">账户类型</span>
              </div>
              <span className="text-sm text-gray-900">{accountTypeLabel}</span>
            </div>

            {detail.biz_type && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">业务类型</span>
                <span className="text-sm text-gray-900">
                  {BizTypeMap[detail.biz_type as BizType] || detail.biz_type}
                </span>
              </div>
            )}

            {detail.biz_id && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">业务ID</span>
                <span className="text-sm font-mono text-gray-900">{detail.biz_id}</span>
              </div>
            )}

            <div className="flex justify-between items-start py-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">创建时间</span>
              </div>
              <span className="text-sm text-gray-900 text-right">
                {detail.create_time_text || formatTime(detail.create_time)}
              </span>
            </div>
          </div>
        </div>

        {/* 备注说明 */}
        {detail.memo && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-red-600" />
              <h2 className="font-semibold text-gray-900 text-base">备注说明</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.memo}</p>
          </div>
        )}

        {/* 商品信息快照 */}
        {(detail.title_snapshot || detail.image_snapshot) && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-red-600" />
              <h2 className="font-semibold text-gray-900 text-base">商品信息</h2>
            </div>
            <div className="flex gap-3">
              {detail.image_snapshot && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <LazyImage
                    src={normalizeAssetUrl(detail.image_snapshot)}
                    alt={detail.title_snapshot || '商品图片'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {detail.title_snapshot && (
                <div className="flex-1 flex items-center">
                  <p className="text-sm text-gray-700">{detail.title_snapshot}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {detail.breakdown && typeof detail.breakdown === 'object' && (
          <MoneyLogBreakdownCard breakdown={detail.breakdown} />
        )}
      </div>
    </PageContainer>
  );
};

export default MoneyLogDetail;
