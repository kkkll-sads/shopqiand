import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Crown,
  Layers,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import {
  getCardProducts,
  getMyCards,
  buyCard,
  type CardProduct,
  type MyCard,
  type CardProductsData,
} from '@/services/membershipCard';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { errorLog } from '@/utils/logger';

// ─── Tab 定义 ───
const TABS = [
  { key: 'products', label: '可购产品' },
  { key: 'my-cards', label: '我的卡包' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

// ─── 等级颜色映射 ───
const LEVEL_STYLES: Record<number, { bg: string; text: string; border: string; icon: React.FC<any> }> = {
  1: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Shield },
  2: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Star },
  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Crown },
};

const getLevelStyle = (level: number) =>
  LEVEL_STYLES[level] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Shield };

// ─── 状态映射 ───
const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  1: { label: '有效', cls: 'bg-green-50 text-green-700 border-green-200' },
  0: { label: '已停用', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  2: { label: '已过期', cls: 'bg-red-50 text-red-500 border-red-200' },
};

// ─── 产品卡片 ───
const ProductCard: React.FC<{
  product: CardProduct;
  minPayRatio: number;
  onBuy: (p: CardProduct) => void;
  buying: boolean;
}> = ({ product, onBuy, buying }) => {
  const style = getLevelStyle(product.level);
  const Icon = style.icon;

  return (
    <div className={`bg-white rounded-xl border ${style.border} shadow-sm overflow-hidden`}>
      {/* 头部 */}
      <div className={`${style.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon size={18} className={style.text} />
          <h3 className={`text-sm font-bold ${style.text}`}>{product.name}</h3>
        </div>
        <span className={`text-[10px] font-medium ${style.text} ${style.bg} border ${style.border} rounded-full px-2 py-0.5`}>
          {product.level_text}
        </span>
      </div>

      {/* 信息 */}
      <div className="px-4 py-3 space-y-2 text-[13px]">
        <div className="flex justify-between">
          <span className="text-gray-500">周期</span>
          <span className="text-gray-900 font-medium">{product.cycle_type_text}（{product.valid_days}天）</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">每次抵扣</span>
          <span className="text-gray-900 font-bold tabular-nums">¥{product.deduct_amount_per_use}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">每日限次</span>
          <span className="text-gray-900 font-medium">{product.daily_limit} 次/天</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">最低手续费</span>
          <span className="text-gray-900 tabular-nums">¥{product.min_fee}</span>
        </div>
      </div>

      {/* 底部 */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <span className="text-red-600 text-lg font-bold tabular-nums">¥{product.price}</span>
        </div>
        <button
          onClick={() => onBuy(product)}
          disabled={buying}
          className="px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-bold active:bg-red-600 transition-colors disabled:opacity-50"
        >
          {buying ? '购买中...' : '立即购买'}
        </button>
      </div>
    </div>
  );
};

// ─── 我的卡片 ───
const MyCardItem: React.FC<{ card: MyCard }> = ({ card }) => {
  const style = getLevelStyle(
    card.level_text === '标准版' ? 1 : card.level_text === '高级版' ? 2 : card.level_text === '尊享版' ? 3 : 1
  );
  const Icon = style.icon;
  const statusInfo = STATUS_MAP[card.status] || STATUS_MAP[0];

  return (
    <div className={`bg-white rounded-xl border ${card.is_active ? style.border : 'border-gray-200'} shadow-sm overflow-hidden`}>
      {/* 头部 */}
      <div className={`${card.is_active ? style.bg : 'bg-gray-50'} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon size={18} className={card.is_active ? style.text : 'text-gray-400'} />
          <h3 className={`text-sm font-bold ${card.is_active ? style.text : 'text-gray-400'}`}>
            {card.card_name}
          </h3>
        </div>
        <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${statusInfo.cls}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* 详情 */}
      <div className="px-4 py-3 space-y-2 text-[13px]">
        <div className="flex justify-between">
          <span className="text-gray-500">等级</span>
          <span className="text-gray-900 font-medium">{card.level_text} · {card.cycle_type_text}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">有效期</span>
          <span className="text-gray-700 text-[12px] font-mono truncate max-w-[180px]">
            {card.start_time_text} ~ {card.end_time_text}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">每次抵扣</span>
          <span className="text-gray-900 font-bold tabular-nums">¥{card.deduct_amount_per_use}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">今日使用</span>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-900 tabular-nums">{card.today_usage}/{card.daily_limit}</span>
            {card.today_remaining > 0 && (
              <span className="text-[10px] text-green-600 font-medium">
                剩余{card.today_remaining}次
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 底部标签 */}
      <div className="px-4 pb-3 flex items-center justify-between text-[11px]">
        <span className={`tabular-nums ${card.remaining_days <= 7 ? 'text-red-500' : 'text-gray-400'}`}>
          {card.remaining_days > 0 ? `剩余 ${card.remaining_days} 天` : '已到期'}
        </span>
        <span className="text-gray-400">
          {card.source === 'purchase' ? '购买获得' : '系统发放'}
        </span>
      </div>
    </div>
  );
};

// ─── 购买确认弹窗 ───
const BuyConfirmModal: React.FC<{
  visible: boolean;
  product: CardProduct | null;
  minPayRatio: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (supplyChainAmount: number, pendingActivationAmount: number) => void;
}> = ({ visible, product, minPayRatio, loading, onClose, onConfirm }) => {
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    if (product && minPayRatio > 0) {
      setRatio(minPayRatio);
    } else {
      setRatio(1);
    }
  }, [product, minPayRatio]);

  if (!visible || !product) return null;

  const supplyChainAmount = Math.round(product.price * ratio * 100) / 100;
  const pendingActivationAmount = Math.round((product.price - supplyChainAmount) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">确认购买</h3>
        </div>

        <div className="px-5 divide-y divide-gray-50">
          <div className="py-2.5 flex justify-between text-[13px]">
            <span className="text-gray-500">卡名称</span>
            <span className="text-gray-900 font-bold">{product.name}</span>
          </div>
          <div className="py-2.5 flex justify-between text-[13px]">
            <span className="text-gray-500">等级</span>
            <span className="text-gray-900 font-medium">{product.level_text}</span>
          </div>
          <div className="py-2.5 flex justify-between text-[13px]">
            <span className="text-gray-500">售价</span>
            <span className="text-red-600 font-bold tabular-nums">¥{product.price}</span>
          </div>

          {/* 支付比例调整 */}
          <div className="py-3">
            <div className="flex justify-between text-[13px] mb-2">
              <span className="text-gray-500">专项金比例</span>
              <span className="text-gray-900 font-bold tabular-nums">
                {Math.round(ratio * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={minPayRatio * 100}
              max={100}
              value={ratio * 100}
              onChange={(e) => setRatio(Number(e.target.value) / 100)}
              className="w-full h-1.5 accent-red-500 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
              <span>专项金: ¥{supplyChainAmount}</span>
              <span>算力: {pendingActivationAmount}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 active:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(supplyChainAmount, pendingActivationAmount)}
            disabled={loading}
            className="flex-1 h-11 flex items-center justify-center rounded-xl bg-red-500 text-sm font-bold text-white active:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              '确认购买'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── 空状态 ───
const EmptyState: React.FC<{ icon: React.FC<any>; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
      <Icon size={28} className="text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

// ─── 主页面 ───
const MyCardPacks: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<TabKey>('products');
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);

  // 产品数据
  const [productsData, setProductsData] = useState<CardProductsData | null>(null);
  const [myCards, setMyCards] = useState<MyCard[]>([]);

  // 购买弹窗
  const [buyTarget, setBuyTarget] = useState<CardProduct | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await getCardProducts(token || undefined);
      if (isSuccess(res)) {
        setProductsData(extractData(res) || null);
      } else {
        showToast('error', '加载失败', extractError(res, '获取产品列表失败'));
      }
    } catch (e: any) {
      errorLog('MyCardPacks', '加载产品失败', e);
      showToast('error', '加载失败', e?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const loadMyCards = async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await getMyCards(token || undefined);
      if (isSuccess(res)) {
        const data = extractData(res);
        setMyCards(data?.list || []);
      } else {
        showToast('error', '加载失败', extractError(res, '获取卡包列表失败'));
      }
    } catch (e: any) {
      errorLog('MyCardPacks', '加载卡包失败', e);
      showToast('error', '加载失败', e?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      void loadProducts();
    } else {
      void loadMyCards();
    }
  }, [activeTab]);

  const handleBuy = (product: CardProduct) => {
    setBuyTarget(product);
  };

  const handleConfirmBuy = async (supplyChainAmount: number, pendingActivationAmount: number) => {
    if (!buyTarget) return;
    setBuying(true);
    try {
      const res = await buyCard({
        card_product_id: buyTarget.id,
        pay_supply_chain_amount: supplyChainAmount,
        pay_pending_activation_amount: pendingActivationAmount,
      });
      if (isSuccess(res)) {
        showToast('success', '购买成功', `已成功购买 ${buyTarget.name}`);
        setBuyTarget(null);
        // 刷新数据
        void loadProducts();
        void loadMyCards();
      } else {
        showToast('error', '购买失败', extractError(res, '购买权益卡失败'));
      }
    } catch (e: any) {
      errorLog('MyCardPacks', '购买失败', e);
      showToast('error', '购买失败', e?.message || '网络错误');
    } finally {
      setBuying(false);
    }
  };

  const products = productsData?.list || [];
  const minPayRatio = productsData?.min_pay_ratio ?? 1;
  const enabled = productsData?.enabled ?? 1;

  return (
    <div className="min-h-screen bg-gray-50 max-w-[480px] mx-auto pb-safe">
      {/* 顶栏 */}
      <header className="bg-white border-b border-gray-100 flex items-center h-12 px-4 sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-700 active:bg-gray-50 rounded transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-center pr-8 text-base font-bold text-gray-900">我的卡包</h1>
      </header>

      {/* Tab 切换 */}
      <div className="bg-white border-b border-gray-100 flex sticky top-12 z-10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-red-600'
                : 'text-gray-500 active:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
          </div>
        ) : activeTab === 'products' ? (
          enabled === 0 ? (
            <EmptyState icon={Layers} text="权益卡功能暂未开放" />
          ) : products.length === 0 ? (
            <EmptyState icon={Sparkles} text="暂无可购产品" />
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  minPayRatio={minPayRatio}
                  onBuy={handleBuy}
                  buying={buying}
                />
              ))}
            </div>
          )
        ) : myCards.length === 0 ? (
          <EmptyState icon={Zap} text="暂无持有的权益卡" />
        ) : (
          <div className="space-y-3">
            {myCards.map((c) => (
              <MyCardItem key={c.id} card={c} />
            ))}
          </div>
        )}
      </div>

      {/* 购买弹窗 */}
      <BuyConfirmModal
        visible={!!buyTarget}
        product={buyTarget}
        minPayRatio={minPayRatio}
        loading={buying}
        onClose={() => setBuyTarget(null)}
        onConfirm={handleConfirmBuy}
      />
    </div>
  );
};

export default MyCardPacks;
