# API接口更新汇总（2025-12-26 至 2025-12-27）

**统计时间：** 2025-12-27 18:30  
**版本号：** v2.5  
**涵盖日期：** 2025-12-26 ~ 2025-12-27

---

## 📊 更新统计

### 总体统计
- **新增接口**：4个
- **更新接口**：12个
- **已优化接口**：1个（资金明细）✅
- **废弃接口**：2个
- **数据库表变更**：7个表
- **前端影响**：高（需要对接）

### 影响范围
| 模块 | 新增 | 更新 | 优化 | 废弃 |
|------|------|------|------|------|
| 用户模块 | 2 | 1 | 1 | 0 |
| 藏品模块 | 0 | 6 | 0 | 2 |
| 寄售模块 | 0 | 3 | 0 | 0 |
| 旧资产模块 | 2 | 0 | 0 | 0 |

---

## 🆕 新增接口清单

### 1. 短信验证码重置交易密码
**接口：** `POST /api/User/resetPayPasswordBySms`  
**功能：** 用户忘记支付密码时，通过手机验证码重置  
**添加日期：** 2025-12-26

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `mobile` | string | 是 | 手机号 |
| `captcha` | string | 是 | 短信验证码（测试环境可用 888888） |
| `new_pay_password` | string | 是 | 新支付密码（6-32位） |

#### 响应示例
```json
{
  "code": 1,
  "msg": "支付密码重置成功",
  "data": null
}
```

---

### 2. 查询旧资产解锁状态
**接口：** `GET /api/Account/checkOldAssetsUnlockStatus`  
**功能：** 查询用户的旧资产解锁条件和状态  
**添加日期：** 2025-12-27

#### 请求参数
无需参数（登录后自动识别用户）

#### 响应参数
| 字段 | 类型 | 说明 |
|------|------|------|
| `unlock_status` | int | 解锁状态（0=未解锁，1=已解锁，兼容旧版） |
| `unlocked_count` | int | 🆕 已解锁次数 |
| `available_quota` | int | 🆕 可用解锁资格 |
| `required_gold` | float | 每次解锁需要的待激活金（1000.00） |
| `current_gold` | float | 当前待激活金余额 |
| `can_unlock` | boolean | 是否可以解锁 |
| `unlock_conditions` | object | 解锁条件详情 |

#### unlock_conditions 对象
| 字段 | 类型 | 说明 |
|------|------|------|
| `has_transaction` | boolean | 是否完成过交易 |
| `transaction_count` | int | 交易次数 |
| `direct_referrals_count` | int | 直推用户总数 |
| `qualified_referrals` | int | 有交易记录的直推用户数 |
| `unlocked_count` | int | 🆕 已解锁次数 |
| `available_quota` | int | 🆕 可用解锁资格 |
| `is_qualified` | boolean | 是否满足解锁条件 |
| `messages` | array | 状态说明信息列表 |

#### 响应示例
```json
{
  "code": 1,
  "msg": "查询成功",
  "data": {
    "unlock_status": 1,
    "unlocked_count": 2,
    "available_quota": 1,
    "required_gold": 1000.00,
    "current_gold": 3500.00,
    "can_unlock": true,
    "unlock_conditions": {
      "has_transaction": true,
      "transaction_count": 15,
      "direct_referrals_count": 12,
      "qualified_referrals": 9,
      "unlocked_count": 2,
      "available_quota": 1,
      "is_qualified": true,
      "messages": [
        "✓ 已完成交易（15笔）",
        "直推用户总数：12个",
        "✓ 有交易记录的直推用户：9个",
        "已解锁次数：2次",
        "可获得资格：3次（每3个交易直推=1次）",
        "✓ 剩余可用资格：1次"
      ]
    }
  }
}
```

---

### 3. 执行旧资产解锁
**接口：** `POST /api/Account/unlockOldAssets`  
**功能：** 执行旧资产解锁操作，消耗待激活金，发放旧资产包藏品和寄售券  
**添加日期：** 2025-12-27

#### 请求参数
无需参数（登录后自动识别用户）

#### 响应参数
| 字段 | 类型 | 说明 |
|------|------|------|
| `unlock_count` | int | 🆕 当前解锁次数（累计） |
| `consumed_gold` | float | 消耗的待激活金（1000.00） |
| `reward_item_id` | int | 🆕 获得的藏品ID |
| `reward_item_title` | string | 🆕 获得的藏品名称 |
| `reward_item_price` | float | 🆕 藏品价值（1000.00） |
| `user_collection_id` | int | 🆕 用户藏品记录ID |
| `reward_consignment_coupon` | int | 获得的寄售券数量（1） |
| `remaining_quota` | int | 🆕 剩余可用解锁资格 |
| `unlock_conditions` | object | 本次解锁时的条件详情 |
| `message` | string | 🆕 友好提示信息 |

#### 响应示例
```json
{
  "code": 1,
  "msg": "旧资产解锁成功",
  "data": {
    "unlock_count": 3,
    "consumed_gold": 1000.00,
    "reward_item_id": 1234,
    "reward_item_title": "旧资产包",
    "reward_item_price": 1000.00,
    "user_collection_id": 5678,
    "reward_consignment_coupon": 1,
    "remaining_quota": 0,
    "message": "已发放旧资产包（价值1000元）和寄售券x1，请前往"我的藏品"寄售变现"
  }
}
```

---

### 4. 获取用户寄售券列表
**接口：** `GET /api/user/consignmentCoupons`  
**功能：** 获取当前登录用户的寄售券列表  
**添加日期：** 2025-12-26

#### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码，默认1 |
| `limit` | int | 否 | 每页数量，默认50，最大100 |
| `status` | int | 否 | 状态过滤：1=可用，0=已使用 |

#### 响应示例
```json
{
  "code": 1,
  "msg": "",
  "data": {
    "list": [
      {
        "id": 1,
        "session_id": 5,
        "zone_id": 2,
        "price_zone": "1000-2000",
        "expire_time": 1735344000,
        "expire_time_text": "2024-12-28 00:00:00",
        "status": 1,
        "status_text": "可用",
        "create_time_text": "2024-12-27 10:00:00",
        "session_title": "第5场",
        "zone_name": "1000-2000元区"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 50,
    "available_count": 5
  }
}
```

---

## 🔄 更新接口清单

### 1. 藏品详情接口
**接口：** `GET /api/CollectionItem/detail` & `GET /api/CollectionItem/originalDetail`  
**更新日期：** 2025-12-26

#### 新增返回字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `supplier_name` | string | 供应商名称（固定值） |
| `tx_hash` | string | 存证指纹（MD5） |
| `asset_code` | string | 确权编号（格式：37-DATA-COLLECTION-00000001） |
| `type` | string | 详情类型：market（市场）/ my（我的） |

#### 删除字段
- ❌ `fingerprint` - 已废弃，替换为 `tx_hash`

#### 场景说明
- **market模式**：返回脱敏占位信息（tx_hash=null，status=申购中）
- **my模式**：返回真实持仓，生成/回填完整信息（status=已持仓）

---

### 2. 盲盒预约接口（重大变更）
**接口：** `POST /api/collectionItem/bidBuy`  
**更新日期：** 2025-12-26

#### ⚠️ 重大变更
- ❌ 移除寄售购买模式（`consignment_id`）
- ❌ 移除竞价模式（`item_id + power_used`）
- ✅ 只保留盲盒预约模式

#### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `session_id` | int | 是 | 场次ID |
| `zone_id` | int | 是 | 价格分区ID |
| `extra_hashrate` | float | 否 | 额外加注算力（0-50） |

#### 新增返回字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `reservation_id` | int | 预约记录ID |
| `freeze_amount` | float | 冻结金额 |
| `power_used` | float | 消耗算力 |
| `weight` | int | 权重 |
| `zone_id` | int | 分区ID |
| `zone_name` | string | 分区名称 |
| `session_id` | int | 场次ID |
| `message` | string | 提示信息 |

#### 响应示例
```json
{
  "code": 1,
  "msg": "盲盒预约成功！等待撮合结果",
  "data": {
    "reservation_id": 123,
    "freeze_amount": 1500.00,
    "power_used": 10.0,
    "weight": 150,
    "zone_id": 2,
    "zone_name": "1000元区",
    "session_id": 5,
    "message": "预约并冻结成功，等待撮合。中签后将匹配1000元区内商品。"
  }
}
```

---

### 3. 藏品寄售申请
**接口：** `POST /api/collectionItem/consign`  
**更新日期：** 2025-12-26 & 2025-12-27

#### 后端变更
1. 自动根据价格和场次归类到资产包
2. **旧资产包特殊处理**：
   - 检测 `is_old_asset_package=1` 标记
   - 随机混入对应场次价格分区的资产包
   - 如无可用资产包，自动创建新资产包

#### 手续费调整
- 从 `service_fee_balance`（确权金）扣除
- 不足提示"确权金不足"

#### 前端影响
- 无需传额外参数
- 后端自动处理资产包归类

---

### 4. 场次藏品列表
**接口：** `GET /api/collectionItem/bySession`  
**更新日期：** 2025-12-26

#### 新增功能
1. **交易时间校验**：进入列表前校验场次是否在交易时间内
2. **资产包归类显示**：同资产包的藏品合并为一条记录

#### 新增返回字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `package_name` | string | 资产包名称 |
| `stock` | int | 累加的库存总数 |

#### 变更说明
- 商品按 `package_name + zone_id + title` 分组
- `price` 显示最低价
- 只显示有库存的藏品（`stock > 0`）

---

### 5. 撮合池列表
**接口：** `GET /api/collectionItem/matchingPool`  
**更新日期：** 2025-12-26

#### 修复内容
- 修复 `status: cancelled` 时显示错误的问题
- 修复SQL字段歧义错误

#### 新增返回字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `session_title` | string | 场次名称 |
| `zone_name` | string | 价格分区名称 |

---

### 6. 寄售资格检查
**接口：** `GET /api/collectionItem/consignmentCheck`  
**更新日期：** 2025-12-26

#### 变更内容
- 支持 `consignment_unlock_hours = 0`（购买后立即可寄售）
- 返回字段 `unlock_hours` 可能为 `0`

#### 前端适配
- 兼容"0小时"或"立即"的文案显示

---

### 7. 用户信息接口
**接口：** `GET /api/Account/getInfo`  
**更新日期：** 2025-12-27

#### 字段变更说明
| 字段 | 说明 | 变更 |
|------|------|------|
| `money` | 总资产 | ⚠️ 改为派生值（只读） |
| `balance_available` | 可用余额 | ✅ 核心字段 |
| `withdrawable_money` | 可提现余额 | ✅ 核心字段 |
| `score` | 消费金 | ✅ 核心字段 |
| `service_fee_balance` | 确权金 | ✅ 核心字段 |
| `pending_activation_gold` | 待激活金 | ⚪ 独立字段 |

#### 重要说明
- `money` 不再可直接修改，由系统自动计算
- 公式：`money = balance_available + withdrawable_money + score + service_fee_balance`

---

### 8. 找回登录密码
**接口：** `POST /api/Account/retrievePassword`  
**更新日期：** 2025-12-26

#### 变更内容
- 新增通用测试验证码 `888888` 支持

---

### 9. 购买记录接口
**接口：** `GET /api/collectionItem/purchaseRecords`  
**更新日期：** 2025-12-26

#### 新增返回字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `consignment_coupon` | int | 用户可用寄售券总数 |

---

### 10. 资金明细接口（已优化）✅
**更新日期：** 2025-12-26 & 2025-12-27

#### 数据库变更
- `ba_user_money_log` 表新增 `field_type` 字段（2025-12-26）

#### 字段类型枚举
- `money` - 可用金额（已改为派生值）
- `withdrawable_money` - 可提现金额
- `balance_available` - 可用余额
- `service_fee_balance` - 确权金
- `static_income` - 拓展提现
- `pending_activation_gold` - 待激活确权金
- `score` - 消费金

#### 接口优化：`GET /api/Account/allLog`

**优化目的：** 提升资金分类精确度，适配新财务架构

**新增返回字段：**
| 字段 | 类型 | 说明 |
|------|------|------|
| `field_type` | string | 精确字段类型（从 user_money_log.field_type 获取，比 type 更准确） |

**优化内容：**
1. ✅ 查询 `user_money_log` 时增加 `field_type` 精确筛选
2. ✅ 返回数据中新增 `field_type` 字段
3. ✅ 提升与后台资金明细的一致性
4. ✅ 适配新财务架构（四个真实余额池）

**响应示例：**
```json
{
  "code": 1,
  "msg": "",
  "data": {
    "list": [
      {
        "id": 123,
        "type": "balance_available",
        "field_type": "balance_available",  // 🆕 新增字段
        "amount": 100.00,
        "before_value": 1000.00,
        "after_value": 1100.00,
        "remark": "充值",
        "create_time": 1703664000
      }
    ],
    "total": 50,
    "per_page": 10,
    "current_page": 1
  }
}
```

**兼容性：**
- ✅ 完全向下兼容，旧版前端无需修改
- ✅ 新版前端可选择性使用 `field_type` 优化显示
- ✅ 接口请求参数完全不变

**前端影响：**
- 🟢 低优先级 - 可选更新
- 不影响现有功能，可在后续版本使用新字段
- 建议用于精确分类显示和高级筛选功能

**详细说明：** 见 `docs/API接口更新补充_资金明细接口.md`

---

### 11. 藏品管理字段更新
**更新日期：** 2025-12-26

#### 数据库变更（`ba_collection_item`）
| 字段 | 类型 | 说明 | 变更 |
|------|------|------|------|
| `session_id` | int | 关联场次ID | 🆕 新增 |
| `zone_id` | int | 价格分区ID | 🆕 新增 |
| `core_enterprise` | varchar(255) | 核心企业 | 🆕 新增 |
| `farmer_info` | varchar(255) | 关联农户 | 🆕 新增 |
| `asset_code` | varchar(50) | 确权编号 | 🆕 新增 |
| `tx_hash` | varchar(64) | 存证指纹 | 🆕 新增 |
| `owner_id` | int | 当前持有人 | 🆕 新增 |
| `fingerprint` | varchar(64) | 存证指纹 | ❌ 删除 |
| `artist` | varchar(100) | 艺术家 | ❌ 删除 |
| `description` | text | 描述 | ❌ 删除 |

---

### 12. 寄售券字段调整
**更新日期：** 2025-12-26

#### 数据库变更（`ba_user_consignment_coupon`）
| 字段 | 类型 | 说明 | 变更 |
|------|------|------|------|
| `session_id` | int | 绑定场次ID | 🆕 新增 |
| `zone_id` | int | 绑定价格区间ID | 🆕 新增 |

---

## ❌ 废弃接口清单

### 1. 寄售购买模式
**废弃日期：** 2025-12-26

**废弃方式：**
- `POST /api/collectionItem/bidBuy` 参数 `consignment_id`
- 原因：统一采用盲盒预约模式

---

### 2. 寄售竞价模式
**废弃日期：** 2025-12-26

**废弃方式：**
- `POST /api/collectionItem/bidBuy` 参数 `item_id + power_used`
- 原因：统一采用盲盒预约模式

---

## 📊 数据库变更汇总

### 新增表
| 表名 | 说明 | 添加日期 |
|------|------|---------|
| `ba_asset_package` | 资产包管理表 | 2025-12-26 |
| `ba_user_consignment_coupon` | 寄售券明细表 | 2025-12-26 |
| `ba_user_old_assets_unlock` | 旧资产解锁记录表 | 2025-12-27 |

### 修改表
| 表名 | 变更字段 | 说明 |
|------|---------|------|
| `ba_collection_item` | +7字段, -3字段 | 详见上文 |
| `ba_collection_consignment` | +2字段 | package_id, package_name |
| `ba_trade_reservations` | +5字段 | zone_id, product_id, power_used, match_order_id, match_time |
| `ba_user` | +1字段 | old_assets_unlock_count |
| `ba_user_collection` | +1字段 | is_old_asset_package |
| `ba_user_money_log` | +1字段 | field_type |
| `ba_price_zone_config` | 规则调整 | 每500元一个分区 |

---

## 🎯 前端对接优先级

### 🔴 高优先级（必须更新）

#### 1. 盲盒预约流程重构
- **影响页面**：藏品列表、预约页面
- **变更内容**：
  - 移除寄售购买和竞价模式
  - 新增场次+分区选择
  - 参数从 `item_id` 改为 `session_id + zone_id`
- **工作量**：3天

#### 2. 藏品详情字段更新
- **影响页面**：藏品详情页
- **变更内容**：
  - `fingerprint` → `tx_hash`
  - 新增 `supplier_name`, `asset_code`
  - 区分 market/my 两种模式
- **工作量**：1天

#### 3. 旧资产解锁功能
- **影响页面**：个人中心、旧资产管理
- **变更内容**：
  - 新增解锁状态查询页面
  - 新增解锁执行按钮
  - 显示解锁次数和可用资格
  - 解锁后跳转到"我的藏品"
- **工作量**：2天

---

### 🟡 中优先级（建议更新）

#### 4. 寄售券列表页面
- **影响页面**：个人中心
- **变更内容**：
  - 新增寄售券列表页面
  - 显示绑定的场次和价格分区
  - 显示过期时间和状态
- **工作量**：1天

#### 5. 资金字段显示调整
- **影响页面**：个人中心、资金明细
- **变更内容**：
  - 明确区分四个真实余额池
  - 说明 `money` 为派生值
  - 优化资金明细筛选
- **工作量**：0.5天

---

### 🟢 低优先级（可选更新）

#### 6. 场次列表资产包归类
- **影响页面**：藏品列表
- **变更内容**：
  - 同资产包的藏品合并显示
  - 显示资产包名称
- **工作量**：0.5天

#### 7. 资金明细接口优化
- **影响页面**：资金明细页面
- **变更内容**：
  - 使用新增的 `field_type` 字段
  - 更精确的资金分类显示
  - 根据字段类型显示不同图标/颜色
- **工作量**：0.5天
- **说明**：不影响现有功能，可选择性使用

---

## 📝 接口测试清单

### 必测接口（9个）
- [ ] `POST /api/User/resetPayPasswordBySms` - 重置支付密码
- [ ] `GET /api/Account/checkOldAssetsUnlockStatus` - 查询解锁状态
- [ ] `POST /api/Account/unlockOldAssets` - 执行解锁
- [ ] `GET /api/user/consignmentCoupons` - 寄售券列表
- [ ] `POST /api/collectionItem/bidBuy` - 盲盒预约（新参数）
- [ ] `GET /api/CollectionItem/detail` - 藏品详情（新字段）
- [ ] `POST /api/collectionItem/consign` - 寄售申请（新逻辑）
- [ ] `GET /api/Account/getInfo` - 用户信息（字段变化）
- [ ] `GET /api/Account/allLog` - 资金明细（新增field_type字段）✅

### 建议测试（5个）
- [ ] `GET /api/collectionItem/bySession` - 场次列表（归类显示）
- [ ] `GET /api/collectionItem/matchingPool` - 撮合池列表（新字段）
- [ ] `GET /api/collectionItem/consignmentCheck` - 寄售检查（支持0小时）
- [ ] `GET /api/collectionItem/purchaseRecords` - 购买记录（寄售券数）
- [ ] `POST /api/Account/retrievePassword` - 找回密码（测试验证码）

---

## 🚀 升级建议

### 分阶段发布

#### 第一阶段（核心功能）- 预计3天
1. 盲盒预约流程重构
2. 藏品详情字段更新
3. 资金字段显示调整

#### 第二阶段（增强功能）- 预计2天
1. 旧资产解锁功能
2. 寄售券列表页面

#### 第三阶段（优化功能）- 预计1天
1. 场次列表资产包归类
2. 资金明细接口优化（可选）
3. 其他细节优化

---

## 📞 技术支持

**后端负责人：** 技术团队  
**文档维护：** 技术团队  
**更新日期：** 2025-12-27 18:30

---

## 附录：完整接口清单

### 用户模块
| 接口 | 方法 | 类型 | 说明 |
|------|------|------|------|
| `/api/User/resetPayPasswordBySms` | POST | 🆕 新增 | 重置支付密码 |
| `/api/user/consignmentCoupons` | GET | 🆕 新增 | 寄售券列表 |
| `/api/Account/getInfo` | GET | 🔄 更新 | 用户信息（字段变化） |
| `/api/Account/retrievePassword` | POST | 🔄 更新 | 找回密码（测试验证码） |
| `/api/Account/allLog` | GET | ✅ 已优化 | 资金明细（新增field_type字段） |

### 旧资产模块
| 接口 | 方法 | 类型 | 说明 |
|------|------|------|------|
| `/api/Account/checkOldAssetsUnlockStatus` | GET | 🆕 新增 | 查询解锁状态 |
| `/api/Account/unlockOldAssets` | POST | 🆕 新增 | 执行解锁 |

### 藏品模块
| 接口 | 方法 | 类型 | 说明 |
|------|------|------|------|
| `/api/CollectionItem/detail` | GET | 🔄 更新 | 藏品详情（新字段） |
| `/api/CollectionItem/originalDetail` | GET | 🔄 更新 | 原始详情（新字段） |
| `/api/collectionItem/bidBuy` | POST | 🔄 更新 | 盲盒预约（重构） |
| `/api/collectionItem/bySession` | GET | 🔄 更新 | 场次列表（归类） |
| `/api/collectionItem/matchingPool` | GET | 🔄 更新 | 撮合池列表 |
| `/api/collectionItem/consignmentCheck` | GET | 🔄 更新 | 寄售检查 |
| `/api/collectionItem/purchaseRecords` | GET | 🔄 更新 | 购买记录 |

### 寄售模块
| 接口 | 方法 | 类型 | 说明 |
|------|------|------|------|
| `/api/collectionItem/consign` | POST | 🔄 更新 | 寄售申请 |

---

**总计：** 新增4个，更新12个，已优化1个✅，废弃2个


