/**
 * ArtistDetail - 艺术家详情页面
 * 已迁移: 使用 React Router 导航
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import { LoadingSpinner, EmptyState, LazyImage } from '../../../components/common';
import { Artist, Product } from '../../../types';
import {
  normalizeAssetUrl,
  fetchArtistDetail,
  fetchArtists,
  ArtistDetailData,
  ArtistWorkItem,
  ArtistListData,
} from '../../../services/api';
import { extractError, isSuccess } from '../../../utils/apiHelpers';

/**
 * ArtistDetail 组件属性接口
 */
interface ArtistDetailProps {
  onProductSelect?: (product: Product) => void;
}

/**
 * ArtistDetail 艺术家详情页面组件
 */
const ArtistDetail: React.FC<ArtistDetailProps> = ({ onProductSelect }) => {
  const navigate = useNavigate();
  const { id: artistId } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [works, setWorks] = useState<ArtistWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载艺术家详情
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        let targetId: string | number | undefined = artistId;

        // 兜底：如果没有传入 artistId，从列表接口取第一个
        if (!targetId) {
          try {
            const listRes = await fetchArtists({ page: 1, limit: 1 });
            const data: ArtistListData | undefined = listRes.data;
            const first = data?.list?.[0];
            if (first) {
              targetId = first.id;
            } else {
              setError('未找到任何艺术家数据');
              return;
            }
          } catch (e) {
            console.error('兜底获取艺术家列表失败:', e);
            setError('未找到有效的艺术家ID');
            return;
          }
        }

        const res = await fetchArtistDetail(targetId);
        if (!isMounted) return;

        if (!isSuccess(res) || !res.data) {
          setError(extractError(res, '艺术家数据加载失败'));
          return;
        }

        const data: ArtistDetailData = res.data;
        setArtist({
          id: String(data.id),
          name: data.name,
          image: normalizeAssetUrl(data.image),
          title: data.title,
          bio: data.bio,
        });
        setWorks(
          (data.works || []).map((w) => ({
            ...w,
            image: normalizeAssetUrl(w.image),
          }))
        );
      } catch (e: any) {
        console.error('加载艺术家详情失败:', e);
        setError(e?.message || '加载艺术家详情失败');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [artistId]);

  return (
    <PageContainer title="艺术家详情" onBack={() => navigate(-1)}>
      {/* 加载状态 */}
      {loading && !artist && <LoadingSpinner text="加载中..." />}

      {/* 错误状态 */}
      {error && !artist && (
        <div className="text-center text-xs text-red-400 py-8">{error}</div>
      )}

      {/* 艺术家信息 */}
      {artist && (
        <>
          {/* 个人信息卡片 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-gray-50 shadow-inner">
              <LazyImage
                src={artist.image}
                alt={artist.name}
                className="w-full h-full"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{artist.name}</h2>
            {artist.title && (
              <span className="inline-block bg-orange-50 text-orange-600 text-xs px-3 py-1 rounded-full font-medium mb-4">
                {artist.title}
              </span>
            )}

            <div className="w-full h-px bg-gray-100 mb-4" />

            <div className="text-left w-full">
              <h3 className="font-bold text-sm text-gray-800 mb-2 border-l-4 border-orange-500 pl-2">
                艺术家简介
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                {artist.bio || '暂无简介'}
              </p>
            </div>
          </div>

          {/* 代表作品 */}
          <div className="mb-4">
            <div className="flex items-center mb-3 px-1">
              <h3 className="font-bold text-gray-800 text-base border-l-4 border-orange-500 pl-2">
                代表作品
              </h3>
            </div>

            {works.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {works.map((work) => (
                  <div
                    key={work.id}
                    className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer"
                    onClick={() => {
                      if (onProductSelect && work.price !== undefined) {
                        onProductSelect({
                          id: String(work.id),
                          title: work.title,
                          artist: artist?.name || '',
                          image: work.image,
                          price: work.price,
                          productType: 'shop',
                        } as Product);
                      }
                    }}
                  >
                    <LazyImage
                      src={work.image}
                      alt={work.title}
                      className="w-full aspect-square"
                    />
                    <div className="p-2">
                      <div className="text-sm text-gray-800 font-medium truncate">
                        {work.title}
                      </div>
                      {work.price !== undefined && (
                        <div className="text-red-500 text-sm font-bold mt-1">
                          {work.price.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-gray-400">消费金</span>
                        </div>
                      )}
                      {work.description && !work.price && (
                        <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                          {work.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="暂无代表作品数据" />
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default ArtistDetail;