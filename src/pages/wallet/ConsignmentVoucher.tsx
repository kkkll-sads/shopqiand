/**
 * ConsignmentVoucher - 寄售券页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, FileText, ShoppingBag, Clock, Tag, Calendar } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { fetchProfile } from '@/services';
import { getStoredToken } from '@/services/client';
import { fetchConsignmentCoupons, ConsignmentCouponItem } from '@/services/consignment';
import { formatTime } from '@/utils/format';
import { isSuccess, extractError, extractData } from '@/utils/apiHelpers';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { UserInfo } from '@/types';
import { errorLog } from '@/utils/logger';

const ConsignmentVoucher: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<ConsignmentCouponItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
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
    const loadData = async () => {
      const token = getStoredToken();
      if (!token) {
        setError('请先登录');
        loadMachine.send(LoadingEvent.ERROR);
        return;
      }

      loadMachine.send(LoadingEvent.LOAD);
      setError(null);

      try {
        const profileResponse = await fetchProfile(token);
        const profileData = extractData(profileResponse);

        if (profileData?.userInfo) {
          setUserInfo(profileData.userInfo);
          setTotal(profileData.userInfo.consignment_coupon || 0);
        }

        const couponsResponse = await fetchConsignmentCoupons({
          page: 1,
          limit: 50,
          status: 1,
          token
        });

        if (isSuccess(couponsResponse) && couponsResponse.data) {
          setCoupons(couponsResponse.data.list || []);
          loadMachine.send(LoadingEvent.SUCCESS);
        } else {
          errorLog('ConsignmentVoucher', '获取寄售券列表失败', extractError(couponsResponse));
          loadMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        errorLog('ConsignmentVoucher', 'Failed to load data', err);
        setError(err?.message || '获取数据失败');
        loadMachine.send(LoadingEvent.ERROR);
      } finally {
        // 状态机已处理成功/失败
      }
    };

    loadData();
  }, []);

  return (
    <PageContainer title="寄售券" onBack={() => navigate(-1)}>
      {loading && <LoadingSpinner text="加载中..." />}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={24} />
                <div className="text-sm opacity-90">我的寄售券</div>
              </div>
              <div className="text-4xl font-bold mb-2">{total}</div>
              <div className="text-sm opacity-80">当前可用张数</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-2">
              使用说明
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>寄售券绑定到<span className="font-medium text-red-600">场次+价格区间</span>，需匹配对应场次才能使用</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>可用于同一区间或相邻区间寄售（允许跨一个区间）</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>寄售券有效期为<span className="font-medium text-red-600">30天</span>，过期自动失效</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>交易用户每次购买藏品都会获得一张寄售券</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>普通用户首次升级为交易用户时赠送一张寄售券</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>寄售时系统自动匹配可用寄售券，优先使用快过期的</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-red-500 pl-2">
              可用券列表
            </div>
            {coupons.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag size={48} className="text-gray-300" />}
                title="暂无可用寄售券"
              />
            ) : (
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex flex-col p-3 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <Tag size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800">
                            {coupon.price_zone || `价格区间 ${coupon.zone_id}`}
                          </div>
                          <div className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            场次ID: {coupon.session_id}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        未使用
                      </span>
                    </div>

                    <div className="border-t border-red-100 my-2 pt-2 flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>获取时间: {formatTime(coupon.create_time)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <Calendar size={12} />
                        <span>过期时间: {formatTime(coupon.expire_time)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default ConsignmentVoucher;
