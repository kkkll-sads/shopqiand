/**
 * MoneyLogDetail - 资金明细详情页面
 * 
 * 显示资金明细记录的详细信息
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Hash, Package, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner, LazyImage } from '../../components/common';
import { getMoneyLogDetail, MoneyLogDetailData } from '../../services/wallet';
import { isSuccess, extractData, extractError } from '../../utils/apiHelpers';
import { formatAmount, formatTime } from '../../utils/format';
import { getBalanceTypeLabel } from '../../constants/balanceTypes';
import { AUTH_TOKEN_KEY } from '../../constants/storageKeys';
import { normalizeAssetUrl } from '../../services/config';

interface MoneyLogDetailProps {
  id?: number | string;
  flowNo?: string;
  onBack: () => void;
}

const MoneyLogDetail: React.FC<MoneyLogDetailProps> = ({ id, flowNo, onBack }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<MoneyLogDetailData | null>(null);

  useEffect(() => {
    loadDetail();
  }, [id, flowNo]);

  const loadDetail = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setError('请先登录');
      setLoading(false);
      return;
    }

    if (!id && !flowNo) {
      setError('缺少必要参数');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getMoneyLogDetail({
        id,
        flow_no: flowNo,
        token,
      });

      const data = extractData(res);
      if (isSuccess(res) && data) {
        setDetail(data);
      } else {
        setError(extractError(res, '获取资金明细详情失败'));
      }
    } catch (e: any) {
      console.error('[MoneyLogDetail] 加载失败:', e);
      setError(e?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="资金明细详情" onBack={onBack}>
        <LoadingSpinner text="加载中..." />
      </PageContainer>
    );
  }

  if (error || !detail) {
    return (
      <PageContainer title="资金明细详情" onBack={onBack}>
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
    <PageContainer title="资金明细详情" onBack={onBack}>
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
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900 text-base">基本信息</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm">流水号</span>
              </div>
              <span className="text-sm font-mono text-gray-900">{detail.flow_no || '-'}</span>
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
                  {(() => {
                    const bizTypeMap: Record<string, string> = {
                      sign_in: '签到',
                      withdraw: '提现',
                      deposit: '充值',
                      transfer: '转账',
                      payment: '支付',
                      refund: '退款',
                      reward: '奖励',
                      purchase: '购买',
                      sale: '销售',
                      matching_official_seller: '官方卖家匹配',
                      blind_box_diff_refund: '盲盒差价退款',
                    };
                    return bizTypeMap[detail.biz_type] || detail.biz_type;
                  })()}
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
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900 text-base">备注说明</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.memo}</p>
          </div>
        )}

        {/* 商品信息快照 */}
        {(detail.title_snapshot || detail.image_snapshot) && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-blue-600" />
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

        {/* 详细信息 */}
        {detail.breakdown && typeof detail.breakdown === 'object' && Object.keys(detail.breakdown).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900 text-base">详细信息</h2>
            </div>
            <div className="space-y-2">
              {Object.entries(detail.breakdown).map(([key, value]) => {
                // 字段名中文映射
                const fieldNameMap: Record<string, string> = {
                  sign_date: '签到日期',
                  sign_record_id: '签到记录ID',
                  reward_money: '奖励金额',
                  activity_id: '活动ID',
                  activity_name: '活动名称',
                  reward_score: '奖励积分',
                  reward_type: '奖励类型',
                  referrer_reward: '推荐人奖励',
                  daily_reward: '每日奖励',
                  total_reward: '累计奖励',
                  sign_days: '签到天数',
                  streak: '连续签到天数',
                };

                const displayKey = fieldNameMap[key] || key;

                return (
                  <div key={key} className="flex justify-between items-center py-1.5 text-sm">
                    <span className="text-gray-600">{displayKey}</span>
                    <span className="text-gray-900 font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default MoneyLogDetail;



