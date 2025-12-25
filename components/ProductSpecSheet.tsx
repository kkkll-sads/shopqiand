import React, { useState } from 'react';
import { X, Minus, Plus, CheckCircle, CreditCard } from 'lucide-react';
import { Product } from '../types';
import { createOrder, buyShopOrder, payOrder, buyCollectionItem, bidBuy, AUTH_TOKEN_KEY, ShopOrderItem } from '../services/api';

interface ProductSpecSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: () => void;
}

const ProductSpecSheet: React.FC<ProductSpecSheetProps> = ({ isOpen, onClose, product, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<ShopOrderItem | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  // In a real app, specs would come from the product data.
  // Mocking a spec based on the screenshot.
  const [selectedSpec, setSelectedSpec] = useState(`${product.title} (${product.artist})`);

  // 判断商品类型：默认为藏品商品（兼容旧数据）
  const isShopProduct = product.productType === 'shop';

  if (!isOpen) return null;

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1) {
      setQuantity(newQty);
    }
  };

  const handleExchange = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setError('请先登录后再进行购买');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 将 product.id 转换为数字（如果后端需要）
      const productId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;

      if (isNaN(productId)) {
        throw new Error('商品ID格式错误');
      }

      // 根据商品类型选择不同的接口和支付方式
      // shop: 消费金商城，使用 buyShopOrder 接口（一步到位：创建订单并支付），使用消费金支付
      // collection: 藏品商城，使用 buyCollectionItem 接口，使用余额支付
      let response;

      if (isShopProduct) {
        // 消费金商城商品，使用 createOrder 接口创建订单
        const payType = 'score';
        const addressId = undefined;

        response = await createOrder({
          items: [
            {
              product_id: productId,
              quantity: quantity,
            },
          ],
          pay_type: payType,
          address_id: addressId,
          remark: '',
          token,
        });
      } else {
        // 藏品商品
        console.log('ProductSpecSheet purchase - product data:', {
          id: product.id,
          consignmentId: product.consignmentId,
          title: product.title,
          price: product.price
        });

        // 临时：强制ID=7的商品使用寄售购买
        const isConsignmentItem = product.consignmentId !== undefined ||
                                 String(product.id) === "7" ||
                                 Number(product.id) === 7;
        const consignmentId = product.consignmentId ||
                             (String(product.id) === "7" || Number(product.id) === 7 ? 19 : undefined);

        if (isConsignmentItem && consignmentId) {
          // 寄售商品：使用 bidBuy 接口的 consignment_id 参数
          console.log('Purchasing as consignment item with consignment_id:', consignmentId);
          response = await bidBuy({
            consignment_id: consignmentId,
            token,
          });
        } else {
          // 官方商品：使用 buyCollectionItem 接口
          const payType = 'money'; // 藏品使用余额支付
          response = await buyCollectionItem({
            item_id: productId,
            quantity: quantity,
            pay_type: payType,
            product_id_record: selectedSpec, // 使用选中的规格作为产品ID记录
            token,
          });
        }
      }

      // 检查响应
      if (response.code === 1 || response.code === 200 || response.code === 0) {
        // 成功
        if (isShopProduct) {
          // 消费金商城商品：创建订单成功，显示支付弹窗
          // 尝试从响应中获取订单信息
          let orderData: ShopOrderItem | null = null;

          if (response.data) {
            // 如果响应数据是订单对象
            if (typeof response.data === 'object' && 'id' in response.data) {
              orderData = response.data as ShopOrderItem;
            }
            // 如果响应数据包含订单ID（如 { order_id: 123 }）
            else if (typeof response.data === 'object' && 'order_id' in response.data) {
              orderData = {
                id: (response.data as any).order_id,
                order_no: (response.data as any).order_no || '',
                pay_type: 'score',
                total_score: (response.data as any).total_score || 0,
                items: [{
                  id: 0,
                  order_id: (response.data as any).order_id || 0,
                  product_id: productId,
                  product_name: product.title,
                  product_thumbnail: product.image,
                  price: 0,
                  score_price: product.price,
                  quantity: quantity,
                  subtotal: 0,
                  subtotal_score: product.price * quantity,
                  create_time: Date.now() / 1000,
                  is_physical: '0',
                  is_card_product: '0',
                }],
              } as ShopOrderItem;
            }
          }

          if (orderData && orderData.id) {
            // 订单已通过 createOrder 创建成功，显示支付弹窗
            setCreatedOrder(orderData);
            setShowPaymentModal(true);
          } else {
            // 如果没有订单数据，但创建成功，订单已在待支付列表中
            if (onSuccess) {
              onSuccess();
            }
            onClose();
            const successMessage = response.msg || '订单创建成功！订单已在待支付列表中，请前往支付';
            alert(successMessage);
          }
        } else {
          // 藏品商品：直接成功
          if (onSuccess) {
            onSuccess();
          }
          onClose();
          const successMessage = response.msg || '购买成功！';
          alert(successMessage);
        }
      } else {
        // 优先使用接口返回的错误消息
        const errorMsg = response.msg || response.message || (isShopProduct ? '兑换失败，请稍后重试' : '购买失败，请稍后重试');
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error(isShopProduct ? '兑换失败:' : '购买失败:', err);
      // 优先使用接口返回的错误消息，如果没有则使用错误对象的 message
      // 检查错误对象是否包含 response（某些情况下错误可能包含原始响应）
      const errorMsg = err.response?.msg || err.msg || err.message || (isShopProduct ? '兑换失败，请稍后重试' : '购买失败，请稍后重试');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayOrder = async () => {
    if (!createdOrder || !createdOrder.id) {
      setError('订单信息不完整，无法支付');
      return;
    }

    setIsPaying(true);
    setError(null);

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
      const response = await payOrder({
        id: createdOrder.id,
        token,
      });

      if (response.code === 1) {
        // 支付成功
        if (onSuccess) {
          onSuccess();
        }
        setShowPaymentModal(false);
        onClose();
        alert(response.msg || '支付成功！');
      } else {
        setError(response.msg || '支付失败，请稍后重试');
      }
    } catch (err: any) {
      console.error('支付失败:', err);
      const errorMsg = err.response?.msg || err.msg || err.message || '支付失败，请稍后重试';
      setError(errorMsg);
    } finally {
      setIsPaying(false);
    }
  };

  const handleClosePaymentModal = () => {
    // 订单已经通过 createOrder 创建，会在待支付列表中
    setShowPaymentModal(false);
    setCreatedOrder(null);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
    // 提示用户订单已在待支付列表中
    alert('订单已创建，您可以在"订单中心-消费金订单-待付款"中查看并支付');
  };

  const formatOrderPrice = (order: ShopOrderItem): string => {
    if (order.pay_type === 'score') {
      const totalScore = order.total_score
        ? (typeof order.total_score === 'string' ? parseFloat(order.total_score) : order.total_score)
        : 0;
      return `${totalScore} 消费金`;
    } else {
      const totalAmount = order.total_amount
        ? (typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount)
        : 0;
      return `¥ ${totalAmount.toFixed(2)}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Bottom Sheet */}
      <div className="bg-white w-full max-w-md rounded-t-2xl p-4 relative z-10 animate-in slide-in-from-bottom duration-300">
        {/* Header: Product Info */}
        <div className="flex gap-3 mb-6 relative">
          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 -mt-8 border-4 border-white shadow-sm">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 pt-1">
            <div className="text-orange-500 font-bold text-lg">
              {product.price.toFixed(2)} <span className="text-xs">{product.productType === 'shop' ? '消费金' : '元'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              已选: {selectedSpec}, {quantity}件
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 absolute right-0 top-0">
            <X size={20} />
          </button>
        </div>

        {/* Specs */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-800 mb-3">规格</div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-1.5 text-xs rounded-md transition-colors ${selectedSpec === `${product.title} (${product.artist})`
                ? 'bg-gray-100 text-gray-900 font-medium border border-gray-200'
                : 'bg-gray-50 text-gray-500 border border-transparent'
                }`}
              onClick={() => setSelectedSpec(`${product.title} (${product.artist})`)}
            >
              {product.title} ({product.artist})
            </button>
          </div>
        </div>

        {/* Quantity */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-sm font-medium text-gray-800">购买数量</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-medium text-gray-800">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleExchange}
          disabled={isLoading}
          className={`w-full bg-orange-600 text-white font-bold py-3 rounded-full shadow-lg shadow-orange-200 active:scale-[0.99] transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {isLoading
            ? (product.productType === 'shop' ? '兑换中...' : '购买中...')
            : (product.productType === 'shop' ? '立即兑换' : '立即购买')}
        </button>
      </div>

      {/* Payment Modal - 支付弹窗 */}
      {showPaymentModal && createdOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={handleClosePaymentModal}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">订单创建成功</h3>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-full"
                onClick={handleClosePaymentModal}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-blue-600" />
                </div>
              </div>

              {/* Order Info */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">订单已创建，请完成支付</p>
                {createdOrder.order_no && (
                  <p className="text-xs text-gray-500 font-mono">订单号: {createdOrder.order_no}</p>
                )}
              </div>

              {/* Price Info */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">订单总额</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatOrderPrice(createdOrder)}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              {createdOrder.items && createdOrder.items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-xs text-gray-600 mb-2">商品信息</div>
                  {createdOrder.items.map((item, index) => (
                    <div key={item.id || index} className="text-sm text-gray-800">
                      {item.product_name} x{item.quantity}
                    </div>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleClosePaymentModal}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg active:bg-gray-200 transition-colors"
              >
                稍后支付
              </button>
              <button
                onClick={handlePayOrder}
                disabled={isPaying}
                className={`flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg active:bg-blue-700 transition-colors shadow-sm ${isPaying ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isPaying ? '支付中...' : '立即付款'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecSheet;