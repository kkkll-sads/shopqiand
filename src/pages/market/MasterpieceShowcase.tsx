/**
 * MasterpieceShowcase - 佳作鉴赏页面
 * 已迁移: 使用 React Router 导航
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner } from '@/components/common';
import GridShowcase from '@/components/common/GridShowcase';
import { normalizeAssetUrl, fetchShopProducts, ShopProductItem } from '@/services/api';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';

/**
 * MasterpieceShowcase 佳作鉴赏页面组件
 */
const MasterpieceShowcase: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ShopProductItem[]>([]);
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

  // 加载佳作数据
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        loadMachine.send(LoadingEvent.LOAD);
        const res = await fetchShopProducts({ page: 1, limit: 10 });
        if (!isMounted) return;

        const list = res.data?.list ?? [];
        // 取前12个作品展示
        setItems(list.slice(0, 12));
        loadMachine.send(LoadingEvent.SUCCESS);
      } catch (e) {
        errorLog('MasterpieceShowcase', '加载佳作鉴赏列表失败', e);
        loadMachine.send(LoadingEvent.ERROR);
      } finally {
        // 状态机已处理成功/失败
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // 转换为 GridShowcase 需要的格式
  const gridItems = items.map((product) => ({
    id: String(product.id),
    image: normalizeAssetUrl(product.thumbnail),
    title: product.name,
  }));

  return (
    <PageContainer title="佳作鉴赏" onBack={() => navigate(-1)} padding={false}>
      {loading ? (
        <div className="py-20">
          <LoadingSpinner text="加载中..." />
        </div>
      ) : (
        <GridShowcase items={gridItems} aspectRatio="portrait" />
      )}
    </PageContainer>
  );
};

export default MasterpieceShowcase;
