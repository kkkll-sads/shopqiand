/**
 * ArtistWorksShowcase - 佳作鉴赏页面（艺术家作品展示）
 * 已迁移: 使用 React Router 导航
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import { LoadingSpinner, EmptyState, LazyImage } from '../../../components/common';
import {
  ArtistAllWorkItem,
  ArtistAllWorksListData,
  fetchArtistAllWorks,
  normalizeAssetUrl,
} from '../../../services/api';

/**
 * ArtistWorksShowcase 组件属性接口
 */
interface ArtistWorksShowcaseProps {
  onNavigateToArtist?: (artistId: number | string) => void;
}

/**
 * 随机打乱数组
 */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * ArtistWorksShowcase 佳作鉴赏页面组件
 */
const ArtistWorksShowcase: React.FC<ArtistWorksShowcaseProps> = ({
  onNavigateToArtist,
}) => {
  const navigate = useNavigate();
  const [works, setWorks] = useState<ArtistAllWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  /**
   * 加载页面数据
   */
  const loadPage = async (targetPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchArtistAllWorks({ page: targetPage, limit: 10 });
      const data: ArtistAllWorksListData | undefined = res.data;
      const list: ArtistAllWorkItem[] = data?.list ?? [];
      setTotal(data?.total ?? 0);

      // 随机挑选若干条展示
      const randomized = shuffleArray(list)
        .slice(0, limit)
        .map((item) => ({
          ...item,
          image: normalizeAssetUrl(item.image),
        }));
      setWorks(randomized);
      setPage(targetPage);
    } catch (e: any) {
      console.error('加载艺术佳作列表失败:', e);
      setError(e?.message || '加载佳作列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!isMounted) return;
      await loadPage(1);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * 换一批
   */
  const handleChangeBatch = async () => {
    const maxPage = total && limit ? Math.max(1, Math.ceil(total / limit)) : page + 1;
    let nextPage = page + 1;
    if (nextPage > maxPage) {
      nextPage = 1;
    }
    await loadPage(nextPage);
  };

  return (
    <PageContainer title="佳作鉴赏" onBack={() => navigate(-1)}>
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">精选艺术家佳作 · 随机展示</span>
        <button
          type="button"
          onClick={handleChangeBatch}
          className="text-xs text-blue-600 px-2 py-1 rounded-full border border-blue-100 bg-blue-50 active:bg-blue-100"
        >
          换一批
        </button>
      </div>

      {/* 加载状态 */}
      {loading && !works.length && <LoadingSpinner text="加载中..." />}

      {/* 错误状态 */}
      {error && !works.length && (
        <div className="text-center text-xs text-red-400 py-8">{error}</div>
      )}

      {/* 空状态 */}
      {!loading && !error && !works.length && (
        <EmptyState title="暂无作品数据" />
      )}

      {/* 作品列表 */}
      {works.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {works.map((work) => (
            <div
              key={work.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer flex flex-col"
              onClick={() => onNavigateToArtist?.(work.artist_id)}
            >
              <LazyImage
                src={work.image}
                alt={work.title}
                className="w-full aspect-[4/5]"
              />
              <div className="p-3 flex-1 flex flex-col">
                <div className="text-xs text-blue-600 font-medium truncate mb-1">
                  {work.artist_title
                    ? `${work.artist_name}｜${work.artist_title}`
                    : work.artist_name}
                </div>
                <div className="text-sm text-gray-900 font-semibold truncate mb-1">
                  {work.title}
                </div>
                {work.description && (
                  <div className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                    {work.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default ArtistWorksShowcase;
