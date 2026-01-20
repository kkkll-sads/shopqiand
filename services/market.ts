/**
 * market.ts - 市场服务聚合模块
 * 
 * 此文件重新导出所有市场相关的服务，保持向后兼容性。
 * 
 * 实际实现已拆分到：
 * - shop.ts: 商品与订单服务
 * - collection.ts: 藏品与艺术家服务
 * - consignment.ts: 寄售与提货服务
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

// 商品与订单服务
export {
    // 商品类型
    type ShopProductItem,
    type ShopProductListData,
    type FetchShopProductsParams,
    type ShopProductDetailData,
    type ShopProductCategoriesData,
    // SKU 相关类型（新增）
    type SkuSpecValue,
    type SkuSpec,
    type Sku,
    type PriceRange,
    // 商品接口
    fetchShopProducts,
    fetchShopProductDetail,
    fetchShopProductCategories,
    fetchShopProductsBySales,
    fetchShopProductsByLatest,
    fetchShopProductShare,
    type ShopProductShareData,
    // 订单类型
    type ShopOrderItemDetail,
    type ShopOrderItem,
    type FetchShopOrderParams,
    type CreateOrderItem,
    type CreateOrderParams,
    type BuyShopOrderParams,
    // 订单接口
    fetchPendingPayOrders,
    fetchPendingShipOrders,
    fetchPendingConfirmOrders,
    fetchCompletedOrders,
    confirmOrder,
    payOrder,
    deleteOrder,
    getOrderDetail,
    createOrder,
    buyShopOrder,
} from './shop';

// 藏品与艺术家服务
export {
    // 专场类型
    type CollectionSessionItem,
    // 专场接口
    fetchCollectionSessions,
    fetchCollectionSessionDetail,
    // 藏品类型
    type CollectionItem,
    type CollectionItemDetailData,
    type MyCollectionItem,
    // 藏品接口
    fetchCollectionItems,
    fetchCollectionItemDetail,
    fetchCollectionItemsBySession,
    fetchMyCollectionDetail,
    getMyCollection,
    fetchMyCollectionList,
    fetchMatchingPool,
    cancelBid,
    bidBuy,
    // 撮合池类型
    type MatchingPoolStatus,
    type MatchingPoolItem,
    type FetchMatchingPoolParams,
    type MatchingPoolListData,
    type CancelBidParams,
    type CancelBidResult,
    type BidBuyParams,
    type BidBuyResult,
    // 盲盒预约记录类型
    type ReservationStatus,
    type ReservationItem,
    type FetchReservationsParams,
    type ReservationsListData,
    // 盲盒预约记录接口
    fetchReservations,
    // 艺术家类型
    type ArtistItem,
    type ArtistWorkItem,
    type ArtistDetailData,
    type ArtistAllWorkItem,
    type ArtistAllWorksListData,
    type ArtistApiItem,
    type ArtistListData,
    // 艺术家接口
    fetchArtistList,
    fetchArtistDetail,
    fetchArtistAllWorks,
    fetchArtists,
} from './collection';

// 寄售与提货服务
export {
    // 寄售类型
    type ConsignmentItem,
    type ConsignmentListData,
    type TradeListItem,
    type TradeListData,
    type FetchTradeListParams,
    type MyConsignmentItem,
    type FetchMyConsignmentListParams,
    type MyConsignmentListData,
    type CancelConsignmentParams,
    type ConsignmentDetailData,
    type DeliverParams,
    type PurchaseRecordItem,
    // 提货类型
    type DeliveryStatus,
    type FetchDeliveryListParams,
    type DeliveryListData,
    // 寄售接口
    consignCollectionItem,
    cancelConsignment,
    getConsignmentList,
    getTradeList,
    getMyConsignmentList,
    getConsignmentDetail,
    // 提货接口
    deliverCollectionItem,
    applyDelivery,
    getDeliveryList,
    // 购买记录接口
    getPurchaseRecords,
} from './consignment';
