# 浏览器组件说明文档

## 组件概述

项目中有三个浏览器相关组件，用于不同场景：

### 1. PaymentBrowser（支付浏览器）

**文件路径**: `components/common/PaymentBrowser.tsx`

**使用场景**: 
- 余额充值支付页面
- 微信/支付宝支付收银台

**功能特性**:
- ✅ 关闭按钮
- ✅ 刷新按钮
- ✅ 右上角"在浏览器中打开"按钮
- ✅ 支付提示遮罩层（首次显示，可关闭）
- ❌ 无自动跳转检测（已禁用）

**使用示例**:
```tsx
import { PaymentBrowser } from '../../components/common';

<PaymentBrowser
  isOpen={showPaymentBrowser}
  url={paymentUrl}
  title="支付收银台"
  onClose={() => setShowPaymentBrowser(false)}
/>
```

**支付提示内容**:
1. 点击右上角按钮
2. 在浏览器中打开页面
3. 跳转至支付宝/微信完成支付
4. 支付成功后，返回APP查看订单

---

### 2. VideoBrowser（视频浏览器）

**文件路径**: `components/common/VideoBrowser.tsx`

**使用场景**: 
- 直播间页面
- 广告视频播放
- 其他视频内容

**功能特性**:
- ✅ 关闭按钮
- ✅ 刷新按钮
- ❌ 无浏览器打开按钮
- ❌ 无自动跳转检测
- ❌ 无提示遮罩层

**使用示例**:
```tsx
import { VideoBrowser } from '../../components/common';

<VideoBrowser
  isOpen={showVideoBrowser}
  url={videoUrl}
  title="直播间"
  onClose={() => setShowVideoBrowser(false)}
/>
```

---

### 3. EmbeddedBrowser（通用浏览器）- 已废弃

**文件路径**: `components/common/EmbeddedBrowser.tsx`

**状态**: 保留以兼容旧代码，新代码请使用 `PaymentBrowser` 或 `VideoBrowser`

**说明**: 
- 原始的通用浏览器组件
- 包含自动跳转检测功能（已在新组件中移除）
- 建议迁移到专用组件

---

## 组件对比

| 功能 | PaymentBrowser | VideoBrowser | EmbeddedBrowser (废弃) |
|------|----------------|--------------|----------------------|
| 关闭按钮 | ✅ | ✅ | ✅ |
| 刷新按钮 | ✅ | ✅ | ✅ |
| 浏览器打开按钮 | ✅ | ❌ | ✅ |
| 自动跳转检测 | ❌ | ❌ | ✅ |
| 支付提示遮罩 | ✅ | ❌ | ✅ |
| iframe sandbox | 完整权限 | 基础权限 | 完整权限 |

---

## 修改历史

### 2026-01-16
- **创建 PaymentBrowser**: 专门用于支付场景，包含支付提示遮罩
- **创建 VideoBrowser**: 专门用于视频场景，简化功能
- **禁用自动跳转**: 移除 PaymentBrowser 的自动跳转检测功能
- **更新使用**: 
  - `pages/wallet/BalanceRecharge.tsx` 使用 `PaymentBrowser`
  - `pages/live/LivePage.tsx` 使用 `VideoBrowser`

---

## 技术细节

### iframe sandbox 权限

**PaymentBrowser**:
```
allow-forms allow-scripts allow-same-origin allow-popups 
allow-modals allow-top-navigation-by-user-activation 
allow-popups-to-escape-sandbox
```

**VideoBrowser**:
```
allow-forms allow-scripts allow-same-origin 
allow-popups allow-modals
```

### 支付提示遮罩持久化

使用 `localStorage` 记录用户是否关闭过提示：
- Key: `payment_instruction_dismissed_${url}`
- Value: `'true'`
- 每个 URL 独立记录

---

## 常见问题

### Q: 为什么禁用自动跳转？
A: 自动跳转会导致用户体验不佳，用户应该手动选择是否在浏览器中打开。

### Q: 支付页面无法显示怎么办？
A: 点击右上角的"在浏览器中打开"按钮，在浏览器中完成支付。

### Q: 视频无法播放怎么办？
A: 尝试点击刷新按钮重新加载视频。

---

## 维护建议

1. **不要修改 EmbeddedBrowser**: 该组件已废弃，仅保留兼容性
2. **新功能使用专用组件**: 根据场景选择 `PaymentBrowser` 或 `VideoBrowser`
3. **统一错误处理**: 所有浏览器组件应使用相同的错误处理逻辑
4. **测试跨域场景**: 确保 iframe 在各种跨域限制下正常工作
