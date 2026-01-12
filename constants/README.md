# 常量与映射字典

本目录包含项目中使用的所有常量定义和前后端统一的映射字典。

## 文件说明

### `apiMappings.ts` - 前后端统一映射字典

这是**最重要的映射字典文件**，定义了前后端共同使用的所有映射关系。

#### 主要内容

1. **API 响应码定义**
   - `ApiResponseCode` - API 响应码枚举
   - `API_RESPONSE_CODE_LABELS` - 响应码文本映射
   - `isApiSuccess()` - 判断响应码是否成功

2. **业务状态枚举**（引用 `statusEnums.ts`）
   - 实名认证状态
   - 寄售状态
   - 提货状态
   - 订单状态
   - 等等

3. **状态文本映射**
   - 所有状态值对应的中文文本
   - 用于前端显示

4. **支付方式映射**
   - `PayType` - 支付方式枚举
   - `PAY_TYPE_LABELS` - 支付方式文本映射

5. **账户类型映射**
   - `PaymentAccountType` - 支付账户类型
   - `ACCOUNT_TYPE_LABELS` - 账户类型文本映射

6. **业务类型映射**
   - `BIZ_TYPE_LABELS` - 业务类型文本映射（用于资金明细）
   - `ACCOUNT_TYPE_LABELS` - 账户类型文本映射

7. **工具函数**
   - `getStatusLabel()` - 通用状态文本获取函数
   - `getPayTypeLabel()` - 支付方式文本获取函数
   - 等等

#### 使用示例

```typescript
import { ApiMappings, ApiResponseCode, getStatusLabel, REAL_NAME_STATUS_LABELS } from '@/constants/apiMappings';
import { RealNameStatus } from '@/constants/statusEnums';

// 1. 判断 API 响应码
if (response.code === ApiResponseCode.SUCCESS) {
  // 处理成功逻辑
}

// 2. 获取状态文本
const statusText = getStatusLabel(user.real_name_status, REAL_NAME_STATUS_LABELS, '未知');
// 或者使用枚举
const statusText = getStatusLabel(RealNameStatus.VERIFIED, REAL_NAME_STATUS_LABELS);

// 3. 获取支付方式文本
import { getPayTypeLabel } from '@/constants/apiMappings';
const payTypeText = getPayTypeLabel(order.pay_type);

// 4. 使用默认导出
import ApiMappings from '@/constants/apiMappings';
const label = ApiMappings.getStatusLabel(status, ApiMappings.CONSIGNMENT_STATUS_LABELS);
```

### `statusEnums.ts` - 状态枚举定义

定义了所有业务状态的枚举类型，用于替换代码中的魔法数字。

#### 使用示例

```typescript
import { ConsignmentStatus } from '@/constants/statusEnums';

// 使用枚举而不是魔法数字
if (item.consignment_status === ConsignmentStatus.CONSIGNING) {
  // 处理寄售中的逻辑
}
```

### `balanceTypes.ts` - 资金类型映射

定义了资金类型字段与中文名称的映射关系。

### `storageKeys.ts` - 本地存储键名

定义了所有 localStorage 使用的键名，避免硬编码字符串。

## 最佳实践

1. **使用枚举代替魔法数字**
   ```typescript
   // ❌ 不好的做法
   if (status === 1) { ... }
   
   // ✅ 好的做法
   if (status === RealNameStatus.VERIFIED) { ... }
   ```

2. **使用映射获取文本**
   ```typescript
   // ❌ 不好的做法
   const statusText = status === 1 ? '已认证' : '未认证';
   
   // ✅ 好的做法
   const statusText = getStatusLabel(status, REAL_NAME_STATUS_LABELS);
   ```

3. **统一使用响应码判断**
   ```typescript
   // ❌ 不好的做法
   if (response.code === 1) { ... }
   
   // ✅ 好的做法
   if (response.code === ApiResponseCode.SUCCESS) { ... }
   // 或者使用 utils/apiHelpers.isSuccess(response)
   ```

4. **避免硬编码字符串**
   ```typescript
   // ❌ 不好的做法
   localStorage.setItem('user_token', token);
   
   // ✅ 好的做法
   import { STORAGE_KEYS } from '@/constants/storageKeys';
   localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN_KEY, token);
   ```

## 与后端约定

所有映射值必须与后端保持一致：

1. **API 响应码**
   - `1` - 成功
   - `0` - 成功（部分接口）
   - `303` - 需要登录
   - 其他 - 业务错误

2. **状态值**
   - 所有状态枚举值必须与后端数据库定义一致
   - 状态文本映射必须与后端返回的 `status_text` 字段一致

3. **字段名称**
   - 所有字段名必须与后端 API 返回的 JSON 字段名一致
   - 使用驼峰命名（前端）或下划线命名（后端）保持一致

## 更新指南

当后端添加新的状态或枚举值时：

1. 在 `statusEnums.ts` 中添加新的枚举定义
2. 在 `apiMappings.ts` 中添加对应的文本映射
3. 在 `apiMappings.ts` 中导出新的枚举
4. 更新本文档说明

## 注意事项

1. **不要直接修改映射值**：所有映射值必须与后端保持一致
2. **保持向后兼容**：新增枚举时不要修改已有的值
3. **统一命名**：新添加的映射遵循现有的命名规范
4. **文档同步**：更新映射时同步更新本文档




