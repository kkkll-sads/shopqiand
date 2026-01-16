/**
 * ArtistShowcase - 艺术家风采页面
 * 已迁移: 使用 React Router 导航
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import { LoadingSpinner, EmptyState, LazyImage } from '../../../components/common';
import { Artist } from '../../../types';
import { ArtistApiItem, fetchArtists, normalizeAssetUrl } from '../../../services/api';

/**
 * ArtistShowcase 组件属性接口
 */
interface ArtistShowcaseProps {
  onArtistSelect?: (artistId: string) => void;
}

/**
 * ArtistShowcase 艺术家风采页面组件
 */
const ArtistShowcase: React.FC<ArtistShowcaseProps> = ({ onArtistSelect }) => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载艺术家数据
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchArtists();
        if (!isMounted) return;

        const list: ArtistApiItem[] = res.data?.list ?? [];
        const mapped: Artist[] = list.map((a) => ({
          id: String(a.id),
          name: a.name,
          image: normalizeAssetUrl(a.avatar),
          title: a.title,
          bio: a.description,
        }));
        setArtists(mapped);
      } catch (e) {
        console.error('加载艺术家列表失败:', e);
        setArtists([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PageContainer title="艺术家风采" onBack={() => navigate(-1)}>
      {/* 加载状态 */}
      {loading && <LoadingSpinner text="加载中..." />}

      {/* 空状态 */}
      {!loading && artists.length === 0 && (
        <EmptyState title="暂无艺术家数据" />
      )}

      {/* 艺术家网格列表 */}
      {!loading && artists.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-all duration-200 cursor-pointer group"
              onClick={() => onArtistSelect?.(artist.id)}
            >
              {/* 艺术家图片 */}
              <LazyImage
                src={artist.image}
                alt={artist.name}
                className="w-full aspect-[4/5]"
              />

              {/* 艺术家信息 */}
              <div className="p-3 flex flex-col items-center text-center flex-1 justify-center">
                {artist.title ? (
                  <span className="inline-block px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-medium rounded-full mb-1.5 max-w-full truncate">
                    {artist.title}
                  </span>
                ) : (
                  <div className="h-5 mb-1.5" />
                )}
                <span className="text-base font-bold text-gray-900 truncate w-full">
                  {artist.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default ArtistShowcase;
