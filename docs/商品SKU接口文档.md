# 商城商品 API 接口文档

版本: v1.0  
更新日期: 2026-01-20  
基础路径: `/api/shopProduct`

---

## 目录

- [一、通用说明](#一通用说明)
- [二、商品列表接口](#二商品列表接口)
- [三、商品详情接口](#三商品详情接口)
- [四、商品分类接口](#四商品分类接口)
- [五、热销商品接口](#五热销商品接口)
- [六、最新商品接口](#六最新商品接口)
- [七、商品评价列表](#七商品评价列表)
- [八、商品评价摘要](#八商品评价摘要)
- [九、提交商品评价](#九提交商品评价)
- [十、点赞/取消点赞评价](#十点赞取消点赞评价)
- [十一、上传评价图片](#十一上传评价图片)

---

## 一、通用说明

### 1.1 请求格式

- **请求方式**: 支持 `GET` 和 `POST`
- **Content-Type**: `application/json` 或 `application/x-www-form-urlencoded`
- **字符编码**: UTF-8

### 1.2 响应格式

所有接口统一返回格式：

```json
{
    "code": 1,           // 1=成功, 0=失败
    "message": "success", // 提示信息
    "data": {}          // 数据内容
}
```

### 1.3 认证说明

- **无需登录**: `index`, `detail`, `categories`, `sales`, `latest`, `reviews`, `reviewSummary`
- **需要登录**: `submitReview`, `likeReview`, `uploadReviewImage`
- **登录方式**: 在请求头中携带 `token` 或通过 `Cookie` 传递

### 1.4 图片URL说明

- **OSS图片**: 返回完整HTTPS URL（如：`https://xxx.oss-cn-hongkong.aliyuncs.com/xxx.jpg`）
- **本地图片**: 返回相对路径，前端需拼接域名（如：`/uploads/xxx.jpg`）

### 1.5 价格字段说明

| 字段 | 说明 | 显示规则 |
|------|------|----------|
| `price` | 余额支付价格 | 为0时不显示 |
| `score_price` | 积分价格 | 为0时不显示 |
| `green_power_amount` | 消费金支付金额 | 为0时不显示 |
| `balance_available_amount` | 可用余额支付金额 | 为0时不显示 |

### 1.6 购买方式说明

| 值 | 说明 |
|----|------|
| `money` | 仅支持余额购买 |
| `score` | 仅支持积分兑换 |
| `both` | 支持余额和积分两种方式 |

---

## 二、商品列表接口

### 接口信息

- **接口路径**: `GET /api/shopProduct/index`
- **接口说明**: 获取商品列表，支持分页、分类筛选、关键词搜索、价格排序
- **是否需要登录**: 否

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| limit | int | 否 | 10 | 每页数量（最大50） |
| category | string | 否 | - | 商品分类 |
| purchase_type | string | 否 | - | 购买方式：money/score/both |
| keyword | string | 否 | - | 搜索关键词（匹配商品名称） |
| price_order | string | 否 | - | 价格排序：asc升序/desc降序 |

### 响应字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| list | array | 商品列表 |
| list[].id | int | 商品ID |
| list[].name | string | 商品名称 |
| list[].thumbnail | string | 商品缩略图URL |
| list[].category | string | 商品分类 |
| list[].price | float | 商品价格（余额） |
| list[].green_power_amount | float | 消费金支付金额 |
| list[].balance_available_amount | float | 可用余额支付金额 |
| list[].score_price | int | 积分价格 |
| list[].stock | int | 库存数量 |
| list[].sales | int | 销量 |
| list[].purchase_type | string | 购买方式 |
| list[].is_physical | string | 是否实物商品：1是/0否 |
| total | int | 总记录数 |
| page | int | 当前页码 |
| limit | int | 每页数量 |

### 请求示例

```bash
GET /api/shopProduct/index?page=1&limit=10&category=电子产品&keyword=手机&price_order=asc
```

### 响应示例

```json
{
    "code": 1,
    "message": "success",
    "data": {
        "list": [
            {
                "id": 1,
                "name": "iPhone 15 Pro",
                "thumbnail": "https://xxx.oss-cn-hongkong.aliyuncs.com/product/1.jpg",
                "category": "电子产品",
                "price": 6999.00,
                "green_power_amount": 699.90,
                "balance_available_amount": 349.95,
                "score_price": 0,
                "stock": 100,
                "sales": 256,
                "purchase_type": "both",
                "is_physical": "1"
            }
        ],
        "total": 50,
        "page": 1,
        "limit": 10
    }
}
```

---

## 三、商品详情接口

### 接口信息

- **接口路径**: `GET /api/shopProduct/detail`
- **接口说明**: 获取商品详细信息，包括图片、描述、规格、SKU等
- **是否需要登录**: 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 商品ID |

### 响应字段

#### 基础信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 商品ID |
| name | string | 商品名称 |
| thumbnail | string | 商品缩略图URL |
| images | array | 商品轮播图列表 |
| detail_images | array | 商品详情图列表 |
| description | string | 商品描述（支持HTML） |
| category | string | 商品分类 |
| price | float | 商品价格（余额） |
| green_power_amount | float | 消费金支付金额 |
| balance_available_amount | float | 可用余额支付金额 |
| score_price | int | 积分价格 |
| stock | int | 库存数量 |
| sales | int | 销量 |
| purchase_type | string | 购买方式 |
| is_physical | string | 是否实物商品：0=虚拟，1=实物 |
| is_card_product | string | 是否卡密商品：0=否，1=是（仅虚拟商品） |

#### 多规格SKU信息（has_sku = "1" 时返回）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| has_sku | string | 是否多规格："0"单规格，"1"多规格 |
| sku_specs | array | 规格列表 |
| sku_specs[].id | int | 规格ID |
| sku_specs[].name | string | 规格名称（如：颜色、尺寸） |
| sku_specs[].values | array | 规格值列表 |
| sku_specs[].values[].id | int | 规格值ID |
| sku_specs[].values[].value | string | 规格值（如：红色、M） |
| sku_specs[].values[].image | string | 规格图片URL（可选） |
| skus | array | SKU列表 |
| skus[].id | int | SKU ID（**购买时需传此ID**） |
| skus[].spec_value_ids | string | 规格值ID组合 |
| skus[].spec_value_names | string | 规格值名称组合（用于显示） |
| skus[].sku_code | string | SKU编码 |
| skus[].price | float | 销售价格 |
| skus[].original_price | float | 原价/划线价（可选） |
| skus[].stock | int | 库存数量 |
| skus[].image | string | SKU图片URL（可选） |
| price_range | object | 价格范围 |
| price_range.min | float | 最低价格 |
| price_range.max | float | 最高价格 |

#### 其他信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| specs | array | 商品规格参数（JSON数组） |
| specs[].name | string | 规格名称 |
| specs[].value | string | 规格值 |
| delivery_info | object | 配送信息（可选） |
| delivery_info.free_shipping | bool | 是否包邮 |
| delivery_info.delivery_time | string | 预计送达时间 |
| delivery_info.support_same_day | bool | 是否支持当日达 |
| after_sale | object | 售后服务（可选） |
| after_sale.return_policy | string | 退货政策 |
| after_sale.warranty | string | 保修政策 |
| after_sale.exchange_policy | string | 换货政策 |

### 请求示例

```bash
GET /api/shopProduct/detail?id=1
```

### 响应示例（单规格商品）

```json
{
    "code": 1,
    "message": "success",
    "data": {
        "id": 1,
        "name": "iPhone 15 Pro",
        "thumbnail": "https://xxx.oss-cn-hongkong.aliyuncs.com/product/1.jpg",
        "images": [
            "https://xxx.oss-cn-hongkong.aliyuncs.com/product/1-1.jpg",
            "https://xxx.oss-cn-hongkong.aliyuncs.com/product/1-2.jpg"
        ],
        "detail_images": [
            "https://xxx.oss-cn-hongkong.aliyuncs.com/product/1-detail-1.jpg"
        ],
        "description": "<p>商品详细描述</p>",
        "category": "电子产品",
        "price": 6999.00,
        "green_power_amount": 699.90,
        "balance_available_amount": 349.95,
        "score_price": 0,
        "stock": 100,
        "sales": 256,
        "purchase_type": "both",
        "is_physical": "1",
        "is_card_product": "0",
        "has_sku": "0",
        "sku_specs": [],
        "skus": [],
        "price_range": null,
        "specs": [
            { "name": "颜色", "value": "深空黑色" },
            { "name": "存储", "value": "256GB" }
        ],
        "delivery_info": {
            "free_shipping": true,
            "delivery_time": "1-3个工作日",
            "support_same_day": false
        },
        "after_sale": {
            "return_policy": "7天无理由退货",
            "warranty": "1年官方保修",
            "exchange_policy": "15天内可换货"
        }
    }
}
```

### 响应示例（多规格商品）

```json
{
    "code": 1,
    "message": "success",
    "data": {
        "id": 2,
        "name": "多规格商品",
        "price": 99.00,
        "has_sku": "1",
        "sku_specs": [
            {
                "id": 1,
                "name": "颜色",
                "values": [
                    { "id": 1, "value": "红色", "image": "" },
                    { "id": 2, "value": "蓝色", "image": "" }
                ]
            },
            {
                "id": 2,
                "name": "尺寸",
                "values": [
                    { "id": 3, "value": "S", "image": "" },
                    { "id": 4, "value": "M", "image": "" }
                ]
            }
        ],
        "skus": [
            {
                "id": 1,
                "spec_value_ids": "1,3",
                "spec_value_names": "红色 / S",
                "sku_code": "RED-S",
                "price": 99.00,
                "original_price": 129.00,
                "stock": 50,
                "image": ""
            },
            {
                "id": 2,
                "spec_value_ids": "1,4",
                "spec_value_names": "红色 / M",
                "sku_code": "RED-M",
                "price": 109.00,
                "original_price": 139.00,
                "stock": 100,
                "image": ""
            }
        ],
        "price_range": {
            "min": 99.00,
            "max": 109.00
        }
    }
}
```

---

## 四、商品分类接口

### 接口信息

- **接口路径**: `GET /api/shopProduct/categories`
- **接口说明**: 获取所有商品分类列表
- **是否需要登录**: 否

### 请求参数

无

### 响应字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| list | array | 分类列表（字符串数组） |

### 请求示例

```bash
GET /api/shopProduct/categories
```

### 响应示例

```json
{
    "code": 1,
    "message": "success",
    "data": {
        "list": [
            "电子产品",
            "服装配饰",
            "食品饮料",
            "家居用品"
        ]
    }
}
```

---

## 五、热销商品接口

### 接口信息

- **接口路径**: `GET /api/shopProduct/sales`
- **接口说明**: 获取热销商品列表（按销量排序）
- **是否需要登录**: 否

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| limit | int | 否 | 10 | 每页数量（最大50） |
| category | string | 否 | - | 商品分类 |
| purchase_type | string | 否 | - | 购买方式：money/score/both |
| keyword | string | 否 | - | 搜索关键词 |
| price_order | string | 否 | - | 价格排序：asc升序/desc降序 |

### 响应字段

与[商品列表接口](#二商品列表接口)相同

### 请求示例

```bash
GET /api/shopProduct/sales?page=1&limit=10
```

### 响应示例

```json
{
    "code": 1,
    "message": "success",
    "data": {
        "list": [
            {
                "id": 1,
                "name": "热销商品",
                "sales": 1000,
                "price": 99.00
            }
        ],
        "total": 50,
        "page": 1,
        "limit": 10
    }
}
```

---

## 六、最新商品接口

### 接口信息

- **接口路径**: `GET /api/shopProduct/latest`
- **接口说明**: 获取最新上架商品列表（按创建时间排序）
- **是否需要登录**: 否

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| limit | int | 否 | 10 | 每页数量（最大50） |
| category | string | 否 | - | 商品分类 |
| purchase_type | string | 否 | - | 购买方式：money/score/both |
| keyword | string | 否 | - | 搜索关键词 |
| price_order | string | 否 | - | 价格排序：asc升序/desc降序 |

### 响应字段

与[商品列表接口](#二商品列表接口)相同

### 请求示例

```bash
GET /api/shopProduct/latest?page=1&limit=10
```

---

## 七、商品评价列表

### 接口信息

- **接口路径**: `GET /api/shopProduct/reviews`
- **接口说明**: 获取商品评价列表，支持筛选（全部/有图/追评）
- **是否需要登录**: 否

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| product_id | int | 是 | - | 商品ID |
| page | int | 否 | 1 | 页码 |
| limit | int | 否 | 10 | 每页数量（最大50） |
| filter | string | 否 | all | 筛选类型：all全部/with_media有图/follow_up追评 |

### 响应字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| list | array | 评价列表 |
| list[].id | int | 评价ID |
| list[].user_id | int | 用户ID |
| list[].user_name | string | 用户名（匿名时显示"匿名用户"） |
| list[].user_avatar | string | 用户头像URL |
| list[].rating | int | 评分（1-5） |
| list[].content | string | 评价内容 |
| list[].images | array | 评价图片列表 |
| list[].video | string | 评价视频URL |
| list[].likes | int | 点赞数 |
| list[].is_liked | bool | 当前用户是否已点赞（需登录） |
| list[].has_reply | bool | 是否有商家回复 |
| list[].reply_content | string | 商家回复内容 |
| list[].reply_time | int | 商家回复时间（时间戳） |
| list[].follow_up_content | string | 追评内容 |
| list[].follow_up_time | int | 追评时间（时间戳） |
| list[].create_time | int | 评价时间（时间戳） |
| total | int | 总记录数 |
| page | int | 当前页码 |
| limit | int | 每页数量 |
| good_rate | int | 好评率（百分比，rating>=4为好评） |
| stats | object | 统计数据 |
| stats.all | int | 全部评价数 |
| stats.with_media | int | 有图/视频评价数 |
| stats.follow_up | int | 追评数 |

### 请求示例

```bash
GET /api/shopProduct/reviews?product_id=1&page=1&limit=10&filter=with_media
```

### 响应示例

```json
{
    "code": 1,
    "message": "success",
    "data": {
        "list": [
            {
                "id": 1,
                "user_id": 123,
                "user_name": "张三",
                "user_avatar": "https://xxx.com/avatar.jpg",
                "rating": 5,
                "content": "商品质量很好，非常满意！",
                "images": [
                    "https://xxx.com/review/1.jpg"
                ],
                "video": "",
                "likes": 10,
                "is_liked": false,
                "has_reply": true,
                "reply_content": "感谢您的支持！",
                "reply_time": 1704067200,
                "follow_up_content": "",
                "follow_up_time": 0,
                "create_time": 1703980800
            }
        ],
        "total": 50,
        "page": 1,
        "limit": 10,
        "good_rate": 95,
        "stats": {
            "all": 50,
            "with_media": 20,
            "follow_up": 5
        }
    }
}
```

---

## 八、商品评价摘要

### 接口信息

- **接口路径**: `GET /api/shopProduct/reviewSummary`
- **接口说明**: 获取商品评价摘要（用于商品详情页展示）
- **是否需要登录**: 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| product_id | int | 是 | 商品ID |

### 响应字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| total | int | 总评价数 |
| good_rate | int | 好评率（百分比） |
| with_media_count | int | 有图/视频评价数 |
| follow_up_count | int | 追评数 |
| preview | array | 最新3条评价预览 |

### 请求示例

```bash
GET /api/shopProduct/reviewSummary?product_id=1
```

### 响应示例

```json
{
    "code": 1,
    "message": "success",
    "data": {
        "total": 50,
        "good_rate": 95,
        "with_media_count": 20,
        "follow_up_count": 5,
        "preview": [
            {
                "id": 1,
                "user_name": "张三",
                "rating": 5,
                "content": "商品质量很好！",
                "create_time": 1703980800
            }
        ]
    }
}
```

---

## 九、提交商品评价

### 接口信息

- **接口路径**: `POST /api/shopProduct/submitReview`
- **接口说明**: 提交商品评价（仅限已完成的订单）
- **是否需要登录**: 是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_id | int | 是 | 订单ID |
| product_id | int | 是 | 商品ID |
| rating | int | 是 | 评分（1-5） |
| content | string | 是 | 评价内容（最多500字） |
| images | string | 否 | 图片URL数组JSON字符串 |
| video | string | 否 | 视频URL |
| is_anonymous | string | 否 | 是否匿名：1是/0否 |

### 响应字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| review_id | int | 评价ID |

### 请求示例

```bash
POST /api/shopProduct/submitReview
Content-Type: application/json

{
    "order_id": 123,
    "product_id": 1,
    "rating": 5,
    "content": "商品质量很好，非常满意！",
    "images": "[\"https://xxx.com/img1.jpg\", \"https://xxx.com/img2.jpg\"]",
    "is_anonymous": "0"
}
```

### 响应示例

```json
{
    "code": 1,
    "message": "评价提交成功",
    "data": {
        "review_id": 1
    }
}
```

### 错误提示

| 错误信息 | 说明 |
|---------|------|
| 请先登录 | 未登录 |
| 订单ID不能为空 | 缺少订单ID |
| 订单不存在 | 订单不存在或不属于当前用户 |
| 只能评价已完成的订单 | 订单状态不是已完成 |
| 您已经评价过此商品 | 该订单商品已评价 |

---

## 十、点赞/取消点赞评价

### 接口信息

- **接口路径**: `POST /api/shopProduct/likeReview`
- **接口说明**: 点赞或取消点赞商品评价
- **是否需要登录**: 是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| review_id | int | 是 | 评价ID |
| action | string | 是 | 操作：like(点赞)/unlike(取消) |

### 响应字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| likes | int | 当前点赞数 |
| is_liked | bool | 当前用户是否已点赞 |

### 请求示例

```bash
POST /api/shopProduct/likeReview
Content-Type: application/json

{
    "review_id": 1,
    "action": "like"
}
```

### 响应示例

```json
{
    "code": 1,
    "message": "success",
    "data": {
        "likes": 11,
        "is_liked": true
    }
}
```

---

## 十一、上传评价图片

### 接口信息

- **接口路径**: `POST /api/shopProduct/uploadReviewImage`
- **接口说明**: 上传评价图片（用于评价时上传图片）
- **是否需要登录**: 是
- **Content-Type**: `multipart/form-data`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | 图片文件 |

### 响应字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| url | string | 图片URL |

### 请求示例

```bash
POST /api/shopProduct/uploadReviewImage
Content-Type: multipart/form-data

file: [图片文件]
```

### 响应示例

```json
{
    "code": 1,
    "message": "上传成功",
    "data": {
        "url": "https://xxx.oss-cn-hongkong.aliyuncs.com/review/xxx.jpg"
    }
}
```

---

## 附录

### A. 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 请求失败 |
| 1 | 请求成功 |
| 401 | 未登录或登录已过期 |

### B. 前端对接建议

1. **商品列表页**
   - 使用 `index` 接口获取商品列表
   - 支持下拉刷新和上拉加载更多
   - 实现分类筛选、关键词搜索、价格排序

2. **商品详情页**
   - 使用 `detail` 接口获取商品详情
   - 多规格商品需实现规格选择器
   - 使用 `reviewSummary` 接口展示评价摘要
   - 使用 `reviews` 接口展示评价列表

3. **评价功能**
   - 评价前先调用 `uploadReviewImage` 上传图片
   - 提交评价时传递图片URL数组
   - 支持点赞/取消点赞评价

4. **SKU选择**
   - 多规格商品必须选择完整规格
   - 根据选中的规格值匹配SKU
   - 购买时传递 `sku_id` 参数

### C. 注意事项

1. 所有价格字段为0时，前端应隐藏对应支付方式
2. 图片URL需根据返回格式判断是OSS还是本地存储
3. 多规格商品购买时必须传递 `sku_id`
4. 评价功能仅限已完成的订单
5. 分页参数 `limit` 最大值为50

---

*文档结束*
