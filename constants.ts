import { Artist, Product, Banner, Order } from './types';
import { MyCollectionItem } from './services/api';

export const ARTISTS: Artist[] = [
  {
    id: '1',
    name: '崔宏波',
    image: 'https://picsum.photos/seed/artist1/150/150',
    title: '国家一级美术师',
    bio: '崔宏波，当代著名山水画家。自幼酷爱丹青，师从多位名家。其作品风格独特，笔墨苍劲有力，意境深远。多次参加全国性美术展览并获奖，作品被多家博物馆及私人收藏家收藏。'
  },
  {
    id: '2',
    name: '李泽江',
    image: 'https://picsum.photos/seed/artist2/150/150',
    title: '中国美术家协会会员',
    bio: '李泽江，擅长花鸟画，尤精牡丹。其笔下的牡丹雍容华贵，艳而不俗。致力于传统水墨与现代审美的融合，形成了鲜明的个人艺术风格。'
  },
  {
    id: '3',
    name: '叶建波',
    image: 'https://picsum.photos/seed/artist3/150/150',
    title: '著名书法家',
    bio: '叶建波，书法家，书法理论家。工诸体，尤擅行草。其书法作品气势磅礴，行云流水，具有极高的艺术欣赏价值。'
  },
  {
    id: '4',
    name: '何加玉',
    image: 'https://picsum.photos/seed/artist4/150/150',
    title: '当代实力派画家',
    bio: '何加玉，专注于山水画创作三十余年。作品多取材于祖国大好河山，画面气象万千，展现了深厚的传统功力与创新精神。'
  },
  {
    id: '5',
    name: '张文轩',
    image: 'https://picsum.photos/seed/artist5/150/150',
    title: '新锐艺术家',
    bio: '张文轩，青年艺术家代表人物。作品风格前卫，色彩大胆，试图探索传统文化在当代语境下的新表达。'
  },
  {
    id: '6',
    name: '刘艺',
    image: 'https://picsum.photos/seed/artist6/150/150',
    title: '资深画家',
    bio: '刘艺，擅长人物画。其人物造型生动，神态逼真，笔墨简练而传神，深受藏家喜爱。'
  },
];

export const PRODUCTS: Product[] = [
  { id: '1', title: '《大吉祥》', artist: '高喜占', price: 9880.00, image: 'https://picsum.photos/seed/art1/300/300', category: 'painting' },
  { id: '2', title: '《果香》', artist: '高喜占', price: 9880.00, image: 'https://picsum.photos/seed/art2/300/300', category: 'painting' },
  { id: '3', title: '《冠群芳》', artist: '赵春雨', price: 9880.00, image: 'https://picsum.photos/seed/art3/300/300', category: 'painting' },
  { id: '4', title: '《古居图》', artist: '张成', price: 9880.00, image: 'https://picsum.photos/seed/art4/300/300', category: 'painting' },
  { id: '5', title: '《喜上眉梢》', artist: '王明', price: 5600.00, image: 'https://picsum.photos/seed/art5/300/300', category: 'painting' },
  { id: '6', title: '《旭日东升》', artist: '李华', price: 12000.00, image: 'https://picsum.photos/seed/art6/300/300', category: 'painting' },
];

export const BANNERS: Banner[] = [
  {
    id: '1',
    image: 'https://picsum.photos/seed/banner1/800/400',
    tag: '全国首张文化数字资产交易牌照',
    title: '文化商品数字化交易'
  },
  {
    id: '2',
    image: 'https://picsum.photos/seed/art_showcase/800/400',
    tag: '艺术鉴赏',
    title: '名家名作 限量发售'
  },
  {
    id: '3',
    image: 'https://picsum.photos/seed/tech_art/800/400',
    tag: '平台动态',
    title: '最新交易规则公告'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-20231115-01',
    productName: '《大吉祥》',
    productImage: 'https://picsum.photos/seed/art1/150/150',
    price: 9880.00,
    quantity: 1,
    total: 9880.00,
    status: '买入成功',
    date: '2023-11-15 10:30:00',
    type: 'product',
    subStatusIndex: 0
  },
  {
    id: 'ORD-20231114-02',
    productName: '《喜上眉梢》',
    productImage: 'https://picsum.photos/seed/art5/150/150',
    price: 5600.00,
    quantity: 1,
    total: 5600.00,
    status: '卖出成功',
    date: '2023-11-14 15:20:00',
    type: 'product',
    subStatusIndex: 1
  },
  {
    id: 'ORD-20231112-03',
    productName: '《旭日东升》',
    productImage: 'https://picsum.photos/seed/art6/150/150',
    price: 12000.00,
    quantity: 1,
    total: 12000.00,
    status: '寄售中',
    date: '2023-11-12 09:00:00',
    type: 'transaction',
    subStatusIndex: 1
  },
  {
    id: 'ORD-20231110-04',
    productName: '消费金兑换商品A',
    productImage: 'https://picsum.photos/seed/gift1/150/150',
    price: 200.00,
    quantity: 2,
    total: 400.00,
    status: '待收货',
    date: '2023-11-10 11:00:00',
    type: 'points',
    subStatusIndex: 2
  }
];

/**
 * 我的购买藏品模拟数据
 * JSON数据结构示例：
 * {
 *   "code": 1,
 *   "msg": "success",
 *   "data": {
 *     "list": [
 *       {
 *         "id": 1,
 *         "item_id": 101,
 *         "title": "《大吉祥》",
 *         "image": "/uploads/collection/item1.jpg",
 *         "price": "9880.00",
 *         "buy_time": 1700000000,
 *         "buy_time_text": "2023-11-15 10:30:00",
 *         "delivery_status": 0,
 *         "delivery_status_text": "未提货",
 *         "consignment_status": 0,
 *         "consignment_status_text": "未寄售"
 *       }
 *     ],
 *     "total": 10,
 *     "per_page": 10,
 *     "current_page": 1,
 *     "last_page": 1,
 *     "has_more": false
 *   }
 * }
 */
export const MOCK_MY_COLLECTIONS: MyCollectionItem[] = [
  {
    id: 1,
    item_id: 101,
    title: '《大吉祥》',
    image: 'https://picsum.photos/seed/art1/300/300',
    price: '9880.00',
    buy_time: 1700000000,
    buy_time_text: '2023-11-15 10:30:00',
    delivery_status: 0,
    delivery_status_text: '未提货',
    consignment_status: 0,
    consignment_status_text: '未寄售',
  },
  {
    id: 2,
    item_id: 102,
    title: '《果香》',
    image: 'https://picsum.photos/seed/art2/300/300',
    price: '9880.00',
    buy_time: 1699900000,
    buy_time_text: '2023-11-14 15:20:00',
    delivery_status: 1,
    delivery_status_text: '已提货',
    consignment_status: 2,
    consignment_status_text: '寄售中',
  },
  {
    id: 3,
    item_id: 103,
    title: '《冠群芳》',
    image: 'https://picsum.photos/seed/art3/300/300',
    price: '9880.00',
    buy_time: 1699800000,
    buy_time_text: '2023-11-13 09:15:00',
    delivery_status: 1,
    delivery_status_text: '已提货',
    consignment_status: 4,
    consignment_status_text: '已售出',
  },
  {
    id: 4,
    item_id: 104,
    title: '《古居图》',
    image: 'https://picsum.photos/seed/art4/300/300',
    price: '9880.00',
    buy_time: 1699700000,
    buy_time_text: '2023-11-12 14:45:00',
    delivery_status: 0,
    delivery_status_text: '未提货',
    consignment_status: 1,
    consignment_status_text: '待寄售',
  },
  {
    id: 5,
    item_id: 105,
    title: '《喜上眉梢》',
    image: 'https://picsum.photos/seed/art5/300/300',
    price: '5600.00',
    buy_time: 1699600000,
    buy_time_text: '2023-11-11 11:30:00',
    delivery_status: 1,
    delivery_status_text: '已提货',
    consignment_status: 3,
    consignment_status_text: '寄售失败',
  },
  {
    id: 6,
    item_id: 106,
    title: '《旭日东升》',
    image: 'https://picsum.photos/seed/art6/300/300',
    price: '12000.00',
    buy_time: 1699500000,
    buy_time_text: '2023-11-10 16:20:00',
    delivery_status: 0,
    delivery_status_text: '未提货',
    consignment_status: 2,
    consignment_status_text: '寄售中',
  },
];