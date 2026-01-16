/**
 * MyCollectionDetail 藏品详情页面包装�?
 * 已简�? 直接渲染组件，导航由组件内部处理
 */
import React from 'react';
import MyCollectionDetail from './MyCollectionDetail';
import { useAppStore } from '../../stores/appStore';

const MyCollectionDetailWrapper: React.FC = () => {
  const { selectedCollectionItem, setSelectedCollectionItem } = useAppStore();

  return (
    <MyCollectionDetail
      item={selectedCollectionItem}
      onSetSelectedItem={setSelectedCollectionItem}
    />
  );
};

export default MyCollectionDetailWrapper;
