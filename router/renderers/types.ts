import { Product, NewsItem } from '../../types';
import { MyCollectionItem } from '../../services/api';
import { Tab } from '../../types';
import { NavigateFn, GoBackFn } from '../navigation';
import { Route } from '../routes';

export interface RouteRenderContext {
  navigate: NavigateFn;
  goBack: GoBackFn;
  setActiveTab: (tab: Tab) => void;
  handleLogout: () => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  selectedCollectionItem: MyCollectionItem | null;
  setSelectedCollectionItem: (item: MyCollectionItem | null) => void;
  handleProductSelect: (product: Product, origin?: Route['origin']) => void;
  newsList: NewsItem[];
  handleMarkAllRead: () => void;
  isRealNameVerified: boolean;
}


