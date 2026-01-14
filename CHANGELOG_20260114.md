# 更新日志 - 2026年01月14日

## 1. 前端服务修复

### 问题
- 前端页面无法访问 (http://23.248.226.82:5657/)
- 构建产物文件名不匹配

### 解决方案
- 重新构建项目 (`npm run build`)
- 验证静态资源文件完整性
- 重新加载 Nginx 配置

### 影响文件
- `dist/index.html`
- `dist/assets/*.js`
- `dist/assets/*.css`

---

## 2. 我的藏品 - 矿机分类支持

### 需求
根据 API 文档，`/api/collectionItem/myCollection` 接口支持 `status=mining` 参数用于获取矿机（权益节点）数据。

### 实现内容

#### 2.1 更新"权益节点"标签页使用 `status=mining`

**文件**: `pages/wallet/MyCollection.tsx`

**修改前**:
```typescript
if (activeTab === 'hold' || activeTab === 'dividend') {
    const res = await getMyCollection({ page, token, status: 'holding' });
    // 前端过滤逻辑
    const filteredList = list.filter(item => {
        if (activeTab === 'hold') {
            return dStatus === 0 && cStatus === 0;
        } else {
            return miningStatus === 1 || dStatus === 1;
        }
    });
}
```

**修改后**:
```typescript
if (activeTab === 'hold') {
    // 持仓中：使用 status=holding
    const res = await getMyCollection({ page, token, status: 'holding' });
    // 直接使用后端返回数据，无需前端过滤
}

if (activeTab === 'dividend') {
    // 权益节点（矿机）：使用 status=mining
    const res = await getMyCollection({ page, token, status: 'mining' });
    // 直接使用后端返回数据
}
```

**优化点**:
- 移除复杂的前端过滤逻辑
- 完全依赖后端 API 的 `status` 参数
- 提升性能，减少不必要的计算
- 代码更简洁，易于维护

#### 2.2 API 参数映射

| 标签页 | API status 参数 | 说明 |
|--------|----------------|------|
| 持仓中 | `holding` | 待寄售/持有中 |
| 寄售中 | `consigned` | 寄售中 |
| 已流转 | `sold` | 已售出 |
| 权益节点 | `mining` | 矿机中 |

### 影响文件
- `pages/wallet/MyCollection.tsx` (第143-174行)

---

## 3. 预约申购 - 数量选择功能

### 需求
根据 API 文档，`/api/collectionItem/bidBuy` 接口支持 `quantity` 参数（1-100），需要在预约页面添加数量选择器。

### 实现内容

#### 3.1 API 接口更新

**文件**: `services/collection.ts`

##### 更新 `BidBuyParams` 接口
```typescript
export interface BidBuyParams {
    session_id: number | string;      // 场次ID（必填）
    zone_id: number | string;         // 价格分区ID（必填）
    package_id: number | string;      // 资产包ID（必填）
    extra_hashrate?: number;          // 额外加注算力（默认0）
    quantity?: number;                // 申购数量（默认1，最大100）✨ 新增
    token?: string;                   // 用户登录Token
}
```

##### 更新 `BidBuyResult` 接口
```typescript
export interface BidBuyResult {
    reservation_id?: number;          // 预约记录ID（单个）
    reservation_ids?: number[];       // 预约记录ID列表（批量）✨ 新增
    quantity?: number;                // 申购数量 ✨ 新增
    freeze_amount?: number;           // 冻结金额（单个）
    total_freeze_amount?: number;     // 总冻结金额 ✨ 新增
    power_used?: number;              // 消耗的算力（单个）
    total_power_used?: number;        // 总消耗算力 ✨ 新增
    single_freeze_amount?: number;    // 单个冻结金额 ✨ 新增
    single_power_used?: number;       // 单个消耗算力 ✨ 新增
    weight?: number;                  // 获得的权重（每个）
    zone_name?: string;               // 分区名称
    package_id?: number;              // 资产包ID
    package_name?: string;            // 资产包名称
    message?: string;                 // 提示信息
}
```

##### 更新 `bidBuy` 函数
```typescript
const quantity = params.quantity ?? 1;
if (quantity < 1 || quantity > 100) {
    throw new Error('申购数量必须在1-100之间');
}
formData.append('quantity', String(quantity));
```

#### 3.2 预约页面更新

**文件**: `pages/market/ReservationPage.tsx`

##### 添加状态管理
```typescript
const [quantity, setQuantity] = useState(1);
```

##### 更新计算逻辑
```typescript
// 算力需求 = (基础算力 + 额外算力) × 数量
const totalRequiredHashrate = (baseHashrate + extraHashrate) * quantity;

// 冻结金额 = 单价 × 数量
const frozenAmount = zoneMaxPrice * quantity;
```

##### 添加数量选择器 UI
```tsx
{/* Quantity Selector */}
<div className="mb-6 pb-6 border-b border-gray-100">
    <div className="flex justify-between text-sm text-gray-600 mb-3">
        <span>申购数量</span>
        <span className="text-xs text-gray-400">最多100份</span>
    </div>

    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
        <div className="flex-1 text-center font-mono font-bold text-lg">
            {quantity}
        </div>
        <button onClick={() => setQuantity(Math.min(100, quantity + 1))}>+</button>
    </div>
</div>
```

##### 更新确认弹窗
```tsx
<div className="space-y-4 mb-8">
    {/* 申购数量 */}
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span className="text-gray-500 text-sm">申购数量</span>
        <span className="font-bold text-gray-900 font-mono">{quantity} 份</span>
    </div>
    
    {/* 消耗算力 */}
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span className="text-gray-500 text-sm">消耗算力</span>
        <div className="text-right">
            <div className="font-bold text-gray-900 font-mono">
                {totalRequiredHashrate.toFixed(0)}
            </div>
            <div className="text-[10px] text-gray-400">
                单份 {baseHashrate + extraHashrate} × {quantity}
            </div>
        </div>
    </div>
    
    {/* 冻结金额 */}
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span className="text-gray-500 text-sm">冻结金额</span>
        <div className="text-right">
            <div className="font-bold text-gray-900 font-mono">
                ¥{frozenAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400">
                单份 ¥{zoneMaxPrice.toLocaleString()} × {quantity}
            </div>
        </div>
    </div>
</div>
```

##### 更新 API 调用
```typescript
const response = await bidBuy({
    session_id: ensuredSessionId,
    zone_id: ensuredZoneId,
    package_id: ensuredPackageId,
    extra_hashrate: extraHashrate,
    quantity: quantity,  // ✨ 新增
});
```

### 功能特性
- ✅ 数量选择器：支持 1-100 份申购
- ✅ 实时计算：自动计算总算力需求和总冻结金额
- ✅ UI 优化：与额外算力选择器风格一致
- ✅ 明细显示：确认弹窗显示单份和总计信息
- ✅ 参数验证：后端接口验证数量范围
- ✅ API 集成：完整支持批量申购返回数据结构

### 影响文件
- `services/collection.ts` (第524-590行)
- `pages/market/ReservationPage.tsx` (第54, 90, 96, 347-352, 447-469, 572-591行)

---

## 4. 取消订单 - 原因填写功能

### 需求
根据 API 文档，`/api/shopOrder/cancel` 接口支持 `cancel_reason` 参数，需要在取消订单时添加原因填写功能。

### 实现内容

#### 4.1 API 接口更新

**文件**: `services/shop.ts`

##### 更新 `cancelOrder` 函数
```typescript
export async function cancelOrder(params: { 
    id: number | string; 
    cancel_reason?: string;  // ✨ 新增
    token?: string 
}): Promise<ApiResponse> {
    const token = params.token ?? getStoredToken();
    const payload = new FormData();
    payload.append('order_id', String(params.id));
    
    // 添加取消原因（如果提供）
    if (params.cancel_reason) {
        payload.append('cancel_reason', params.cancel_reason);
    }

    return authedFetch(API_ENDPOINTS.shopOrder.cancel, {
        method: 'POST', body: payload, token
    });
}
```

#### 4.2 订单详情页更新

**文件**: `pages/market/OrderDetail.tsx`

##### 添加状态管理
```typescript
const [showCancelModal, setShowCancelModal] = useState(false);
const [cancelReason, setCancelReason] = useState('');
const [cancelLoading, setCancelLoading] = useState(false);
```

##### 更新取消订单逻辑
```typescript
const handleCancelOrder = async (id: number) => {
    // 显示取消原因输入模态框
    setShowCancelModal(true);
    setCancelReason('');
};

const submitCancelOrder = async (id: number, reason?: string) => {
    try {
        setCancelLoading(true);
        const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
        const response = await cancelOrder({ 
            id, 
            cancel_reason: reason,  // ✨ 传递取消原因
            token 
        });
        if (isSuccess(response)) {
            showToast('success', response.msg || '订单取消成功');
            setShowCancelModal(false);
            loadOrder();
        } else {
            handleOperationError(response, {
                toastTitle: '取消失败',
                customMessage: '订单取消失败',
                context: { orderId: id }
            });
        }
    } catch (error) {
        handleOperationError(error, {
            toastTitle: '取消失败',
            customMessage: '网络请求失败',
            context: { orderId: id }
        });
    } finally {
        setCancelLoading(false);
    }
};
```

##### 添加取消原因模态框
```tsx
{/* Cancel Order Modal */}
{showCancelModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             onClick={() => !cancelLoading && setShowCancelModal(false)}>
        </div>
        
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10">
            <h3 className="text-xl font-bold text-center mb-2">取消订单</h3>
            <p className="text-sm text-gray-500 text-center mb-6">请填写取消原因</p>

            <div className="mb-6">
                <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="请输入取消原因（必填）"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-orange-200 
                               focus:border-orange-400 resize-none"
                    rows={4}
                    disabled={cancelLoading}
                />
                <div className="text-xs text-gray-400 mt-2">
                    {cancelReason.length}/200 字
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelLoading}
                    className="flex-1 py-3 rounded-lg border border-gray-200 
                               text-gray-600 font-bold hover:bg-gray-50 
                               disabled:opacity-50"
                >
                    取消
                </button>
                <button
                    onClick={() => {
                        if (!cancelReason.trim()) {
                            showToast('warning', '请填写取消原因');
                            return;
                        }
                        if (order?.id) {
                            submitCancelOrder(Number(order.id), cancelReason.trim());
                        }
                    }}
                    disabled={cancelLoading || !cancelReason.trim()}
                    className="flex-1 py-3 rounded-lg bg-[#8B0000] text-white 
                               font-bold hover:bg-[#A00000] disabled:opacity-50 
                               flex justify-center items-center"
                >
                    {cancelLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 
                                        border-t-white rounded-full animate-spin" />
                    ) : (
                        '确认取消'
                    )}
                </button>
            </div>
        </div>
    </div>
)}
```

### 功能特性
- ✅ 必填原因：所有订单取消都需要填写原因
- ✅ 表单验证：确保取消原因不为空
- ✅ 字数统计：显示输入字数（最多200字）
- ✅ 加载状态：提交时显示加载动画，防止重复提交
- ✅ 错误处理：完善的错误提示和处理
- ✅ API 集成：完整支持后端 `cancel_reason` 参数
- ✅ 用户体验：模态框可点击背景关闭（非加载状态）

### 影响文件
- `services/shop.ts` (第244-261行)
- `pages/market/OrderDetail.tsx` (第22-24, 148-201, 579-628行)

---

## 技术改进总结

### 1. 代码简化
- 移除了"我的藏品"页面的复杂前端过滤逻辑
- 完全依赖后端 API 参数进行数据筛选
- 减少了不必要的计算和状态管理

### 2. 性能优化
- 减少前端数据处理，提升渲染性能
- 批量申购支持，减少 API 调用次数

### 3. 用户体验
- 预约申购支持批量操作，提升效率
- 取消订单流程更规范，便于后台审核
- 统一的 UI 设计风格

### 4. 代码质量
- TypeScript 类型定义完善
- 错误处理机制健全
- 代码注释清晰

---

## 测试建议

### 1. 我的藏品
- [ ] 测试"持仓中"标签页数据正确性
- [ ] 测试"权益节点"标签页显示矿机数据
- [ ] 测试"寄售中"和"已流转"标签页
- [ ] 测试筛选器功能

### 2. 预约申购
- [ ] 测试数量选择器（1-100）
- [ ] 测试算力和金额计算准确性
- [ ] 测试批量申购提交
- [ ] 测试余额和算力不足提示

### 3. 取消订单
- [ ] 测试取消原因必填验证
- [ ] 测试字数限制（200字）
- [ ] 测试取消成功后页面刷新
- [ ] 测试加载状态和错误处理

---

## 部署说明

### 前端构建
```bash
cd /www/wwwroot/qingduan
npm run build
```

### Nginx 重载
```bash
nginx -s reload
```

### 验证部署
- 访问: http://23.248.226.82:5657/
- 检查静态资源加载
- 测试新功能

---

## 相关文档

- API 文档: `/api/collectionItem/myCollection`
- API 文档: `/api/collectionItem/bidBuy`
- API 文档: `/api/shopOrder/cancel`

---

**更新时间**: 2026年01月14日
**更新人员**: AI Assistant
**版本**: v1.0.0
