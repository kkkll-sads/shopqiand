/**
 * MyCollectionDetail - 藏品详情页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import {
  MyCollectionItem,
  fetchProfile,
  fetchRealNameStatus,
  fetchUserCollectionDetail,
  getConsignmentCheck,
  toMining,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { UserInfo } from '@/types';
import { useNotification } from '@/context/NotificationContext';
import { LoadingSpinner } from '@/components/common';
import { isSuccess, extractData } from '@/utils/apiHelpers';
import { ConsignmentStatus } from '@/constants/statusEnums';
import { useAppStore } from '@/stores/appStore';
import { errorLog } from '@/utils/logger';
import { copyToClipboard } from '@/utils/clipboard';
import ConsignmentModal from './my-collection-detail/ConsignmentModal';
import MyCollectionBottomActions from './my-collection-detail/components/MyCollectionBottomActions';
import MyCollectionCertificateCard from './my-collection-detail/components/MyCollectionCertificateCard';
import MyCollectionDetailHeader from './my-collection-detail/components/MyCollectionDetailHeader';

interface MyCollectionDetailProps {
  item?: MyCollectionItem | null;
  onSetSelectedItem?: (item: MyCollectionItem) => void;
}

const MyCollectionDetail: React.FC<MyCollectionDetailProps> = ({ item: initialItem }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const clearListCache = useAppStore((state) => state.clearListCache);
  const selectedCollectionItem = useAppStore((state) => state.selectedCollectionItem);

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [item, setItem] = useState<any>(initialItem || selectedCollectionItem || null);
  const { showToast, showDialog } = useNotification();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showConsignmentModal, setShowConsignmentModal] = useState(false);
  const [consignmentCheckData, setConsignmentCheckData] = useState<any>(null);
  const [consignmentTicketCount, setConsignmentTicketCount] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hasConvertedToMining, setHasConvertedToMining] = useState(false);

  const handleCopy = async (text: string, successMsg: string = '复制成功') => {
    const success = await copyToClipboard(text);
    if (success) {
      showToast('success', successMsg);
    } else {
      showToast('error', '复制失败，请长按手动复制');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const token = getStoredToken();
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        const userCollectionId =
          initialItem?.user_collection_id ||
          initialItem?.id ||
          (id ? Number(id) : undefined);

        if (!userCollectionId) {
          return;
        }

        const detailRes = await fetchUserCollectionDetail(userCollectionId);
        const detailData = extractData(detailRes);
        if (detailData) {
          setItem(detailData);
        }

        const profileRes = await fetchProfile(token);
        const profileData = extractData(profileRes);
        let currentInfo = profileData?.userInfo || null;

        const realNameRes = await fetchRealNameStatus(token);
        const realNameData = extractData(realNameRes);
        if (realNameData) {
          if (currentInfo) {
            currentInfo = {
              ...currentInfo,
              real_name: realNameData.real_name || currentInfo.real_name,
              real_name_status: realNameData.real_name_status,
            };
          } else {
            currentInfo = {
              real_name: realNameData.real_name,
              real_name_status: realNameData.real_name_status,
            } as any;
          }
        }

        if (currentInfo) {
          setUserInfo(currentInfo);
          setConsignmentTicketCount(parseInt(String(currentInfo.consignment_coupon || 0)) || 0);
        }
      } catch (error) {
        errorLog('MyCollectionDetail', '加载数据失败', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [initialItem, id]);

  useEffect(() => {
    if (!showConsignmentModal) return;

    const loadCheck = async () => {
      const token = getStoredToken();
      if (!token) return;

      try {
        const collectionId =
          item?.user_collection_id ||
          item?.id ||
          initialItem?.user_collection_id ||
          initialItem?.id ||
          (id ? Number(id) : undefined);

        if (!collectionId) {
          setActionError('无法获取藏品ID');
          return;
        }

        const res = await getConsignmentCheck({ user_collection_id: collectionId, token });
        const checkData = extractData(res);
        setConsignmentCheckData(checkData ?? null);
      } catch (error) {
        errorLog('MyCollectionDetail', '加载寄售检查失败', error);
        setActionError('加载寄售检查失败');
      }
    };

    void loadCheck();
  }, [showConsignmentModal, item, initialItem, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-gray-400 gap-4">
        <Shield size={48} className="opacity-20" />
        <div>无法加载藏品信息</div>
        <button onClick={() => navigate(-1)} className="text-amber-600 font-bold">
          返回
        </button>
      </div>
    );
  }

  const title = item.name || item.item_title || item.title || '未命名藏品';
  const buyPrice = parseFloat(item.buy_price || item.price || '0');
  const currentValuation = buyPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleConsignmentSuccess = () => {
    setShowConsignmentModal(false);
    clearListCache('myCollection');
    setTimeout(() => navigate(-1), 1000);
  };

  const consignmentStatus = Number(item.consignment_status);
  const statusText = item.status_text || '';
  const consignmentStatusText = item.consignment_status_text || '';

  const isSold =
    consignmentStatus === 2 ||
    consignmentStatus === ConsignmentStatus.SOLD ||
    consignmentStatusText === '已售出' ||
    consignmentStatusText.includes('已售出') ||
    statusText === '已售出' ||
    statusText.includes('已售出');

  const isMining = item.mining_status === 1 || hasConvertedToMining;
  const showBottomActions = !isSold && !isMining;

  const handleSearchHash = (hash: string) => {
    if (!hash) {
      showToast('error', '无法获取存证哈希');
      return;
    }
    navigate(`/search?code=${hash}`);
  };

  const handleUpgradeNode = () => {
    showDialog({
      title: '升级为共识验证节点',
      description: '升级后每日获得Gas费分红，升级后将无法再进行寄售。确认升级吗？',
      confirmText: '确认升级',
      cancelText: '取消',
      onConfirm: async () => {
        const token = getStoredToken();
        if (!token) {
          showToast('warning', '请登录');
          return;
        }

        const collectionId =
          item?.user_collection_id ||
          item?.id ||
          initialItem?.user_collection_id ||
          initialItem?.id ||
          (id ? Number(id) : undefined);

        if (!collectionId) {
          showToast('error', '无法获取藏品ID');
          return;
        }

        setActionLoading(true);
        try {
          const res = await toMining({ user_collection_id: Number(collectionId), token });
          if (isSuccess(res)) {
            showToast('success', '升级成功', '您的资产已升级为验证节点，参与全网数据确权，每日获得Gas费分红。');
            setHasConvertedToMining(true);
            clearListCache('myCollection');
            setTimeout(() => navigate(-1), 1000);
          } else {
            showToast('error', '转换失败', res.msg || '操作失败');
          }
        } catch (error: any) {
          showToast('error', '转换失败', error.message || '系统错误');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <div
      className="min-h-screen bg-[#FDFBF7] text-gray-900 font-serif pb-24 relative overflow-hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />

      <MyCollectionDetailHeader onBack={() => navigate(-1)} />

      <MyCollectionCertificateCard
        item={item}
        title={title}
        onCopy={handleCopy}
        onSearchHash={handleSearchHash}
      />

      {showBottomActions && (
        <MyCollectionBottomActions
          currentValuation={currentValuation}
          onUpgradeNode={handleUpgradeNode}
          onConsignment={() => {
            setShowConsignmentModal(true);
            setActionError(null);
          }}
        />
      )}

      <ConsignmentModal
        visible={showConsignmentModal}
        item={item}
        initialItem={initialItem}
        routeId={id}
        userInfo={userInfo}
        consignmentCheckData={consignmentCheckData}
        consignmentTicketCount={consignmentTicketCount}
        actionError={actionError}
        actionLoading={actionLoading}
        onClose={() => setShowConsignmentModal(false)}
        onActionError={setActionError}
        onActionLoadingChange={setActionLoading}
        onConsignmentSuccess={handleConsignmentSuccess}
        showToast={showToast}
      />
    </div>
  );
};

export default MyCollectionDetail;
