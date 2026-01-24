/**
 * 藏品列表组件
 */
import React from 'react';
import { FileText, ShoppingBag } from 'lucide-react';
import { SkeletonCollectionList } from '../../../../../components/common';
import { MyCollectionItem } from '../../../../../services/api';
import CollectionItem from './CollectionItem';

interface CollectionListProps {
  items: MyCollectionItem[];
  activeTab: string;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isEmpty: boolean;
  isFilterEmpty: boolean;
  bottomRef: React.RefObject<HTMLDivElement>;
  onItemSelect?: (item: MyCollectionItem) => void;
}

export const CollectionList: React.FC<CollectionListProps> = ({
  items,
  activeTab,
  loading,
  error,
  hasMore,
  isEmpty,
  isFilterEmpty,
  bottomRef,
  onItemSelect,
}) => {
  // 首次加载中
  if (loading && items.length === 0) {
    return <SkeletonCollectionList count={5} />;
  }

  // 错误状态
  if (error) {
    return (
      <div className="py-16 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-red-400" />
        </div>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  // 空数据状态
  if (isEmpty) {
    return (
      <div className="py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={32} className="text-gray-300" />
        </div>
        <p className="text-sm text-gray-400">暂无藏品</p>
      </div>
    );
  }

  // 筛选后无数据
  if (isFilterEmpty) {
    return (
      <div className="py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={32} className="text-gray-300" />
        </div>
        <p className="text-sm text-gray-400">未找到符合筛选条件的藏品</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="space-y-3">
        {items
          .filter((i) => !!i)
          .map((item, index) => (
            <div
              key={item.id || item.user_collection_id || `item-${item.item_id}-${index}`}
              style={{
                animation: index < 10 ? `fadeInUp 0.25s ease-out ${index * 0.03}s both` : undefined,
              }}
            >
              <CollectionItem item={item} activeTab={activeTab} onItemSelect={onItemSelect} />
            </div>
          ))}
      </div>
      <div ref={bottomRef} className="h-4" />
      {loading && hasMore && (
        <div className="w-full mt-4">
          <SkeletonCollectionList count={2} />
        </div>
      )}
    </>
  );
};

export default CollectionList;
