---
name: user-interaction-design
description: 设计和实现高质量的移动端用户交互体验。适用于构建表单交互、页面转场、手势操作、加载状态、错误处理、确认弹窗、Toast 提示、下拉刷新、无限滚动、骨架屏等用户交互模式。确保交互流畅、反馈及时、符合移动端操作习惯。
---

# 用户前端交互设计技能

本技能指导创建流畅、直觉化的移动端用户交互体验。所有交互设计都应以用户为中心，确保操作反馈明确、状态转换自然、错误处理优雅。

## 设计原则

在编写交互代码之前，先明确以下要素：

### 1. 反馈即时性
- 每个用户操作都必须有即时视觉反馈（< 100ms）
- 按钮点击：缩放动画 `scale(0.96)` + 透明度变化
- 表单提交：按钮进入 loading 状态，禁用重复提交
- 网络请求：显示加载指示器（Spinner / 骨架屏）

### 2. 状态完整性
每个交互组件必须覆盖以下状态：
- **空状态（Empty）**：无数据时的友好提示 + 引导操作
- **加载状态（Loading）**：骨架屏 > Spinner > 文字提示（优先级）
- **成功状态（Success）**：数据正常展示
- **错误状态（Error）**：错误提示 + 重试按钮
- **刷新状态（Refreshing）**：下拉刷新指示器

### 3. 防误操作
- **危险操作**（删除、注销、支付）必须二次确认
- 确认弹窗使用 `Modal.confirm()` 或自定义确认组件
- 危险按钮使用红色/警告色，与普通按钮明确区分
- 不可逆操作需要输入确认（如输入账户名确认删除）

## 交互模式规范

### 表单交互
```tsx
// ✅ 推荐：完整的表单交互模式
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async () => {
  // 1. 前端校验
  const validationErrors = validate(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  // 2. 防重复提交
  if (loading) return;
  setLoading(true);

  try {
    await api.submit(formData);
    // 3. 成功反馈
    Toast.success('提交成功');
    navigate(-1); // 返回上一页
  } catch (err) {
    // 4. 错误处理
    Toast.error(err.message || '提交失败，请重试');
  } finally {
    setLoading(false);
  }
};
```

**表单校验规则：**
- 实时校验：输入时即时提示格式错误（手机号、邮箱等）
- 提交校验：提交时统一校验必填项
- 错误提示紧贴对应输入框下方，使用红色文字
- 校验通过后清除对应错误提示

### 列表加载
```tsx
// ✅ 推荐：下拉刷新 + 无限滚动
const {
  data,
  loading,
  refreshing,
  hasMore,
  onRefresh,
  onLoadMore,
} = useInfiniteList(fetchList);

return (
  <PullToRefresh onRefresh={onRefresh} refreshing={refreshing}>
    {loading && !data.length ? (
      <SkeletonList count={5} />           {/* 首次加载：骨架屏 */}
    ) : !data.length ? (
      <EmptyState message="暂无数据" />    {/* 空状态 */}
    ) : (
      <>
        {data.map(item => <ListItem key={item.id} {...item} />)}
        {hasMore ? (
          <LoadMoreTrigger onVisible={onLoadMore} /> {/* 触底加载 */}
        ) : (
          <div className="list-end">没有更多了</div>
        )}
      </>
    )}
  </PullToRefresh>
);
```

### 确认弹窗
```tsx
// ✅ 推荐：危险操作确认模式
const handleDelete = () => {
  showConfirmDialog({
    title: '确认删除',
    message: '删除后无法恢复，是否继续？',
    confirmText: '删除',
    confirmVariant: 'danger',  // 红色确认按钮
    cancelText: '取消',
    onConfirm: async () => {
      await api.delete(id);
      Toast.success('已删除');
      refreshList();
    },
  });
};
```

### 页面转场
```tsx
// ✅ 推荐：页面切换动画
// 前进：从右侧滑入（slide-in-right）
// 后退：向右侧滑出（slide-out-right）
// 弹窗：从底部滑入（slide-in-bottom）

// CSS 关键帧
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

@keyframes slideOutRight {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}
```

### Toast 提示
- **成功**：绿色对勾图标，显示 1.5 秒后自动消失
- **错误**：红色叹号图标，显示 2.5 秒或手动关闭
- **警告**：橙色警告图标，显示 2 秒
- **加载**：旋转图标，需手动关闭（请求完成后）
- 同一时间最多显示一个 Toast，新 Toast 替换旧的

### 手势操作（移动端）
- **左滑删除**：列表项左滑露出删除按钮
- **下拉刷新**：页面顶部下拉触发数据刷新
- **长按操作**：长按弹出操作菜单（复制、分享、删除等）
- 所有手势操作需提供视觉引导（首次使用时）

## 加载与骨架屏

### 骨架屏规范
```tsx
// ✅ 推荐：与真实内容结构匹配的骨架屏
const CardSkeleton = () => (
  <div className="card-skeleton animate-pulse">
    <div className="skeleton-avatar" />      {/* 圆形头像占位 */}
    <div className="skeleton-content">
      <div className="skeleton-title" />     {/* 标题行：60% 宽度 */}
      <div className="skeleton-text" />      {/* 内容行：100% 宽度 */}
      <div className="skeleton-text short" /> {/* 短内容行：40% 宽度 */}
    </div>
  </div>
);

// 骨架屏 CSS
.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

.skeleton-avatar,
.skeleton-title,
.skeleton-text {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 加载策略优先级
1. **骨架屏**：首次加载页面 / 关键内容区域
2. **内联 Spinner**：按钮提交、局部数据加载
3. **全屏 Loading**：仅用于不可分割的全局操作（如支付中）
4. **进度条**：文件上传、多步操作

## 错误处理

### 网络错误
```tsx
// ✅ 统一错误处理
const ErrorFallback = ({ error, onRetry }) => (
  <div className="error-state">
    <WifiOff size={48} className="error-icon" />
    <p className="error-title">网络异常</p>
    <p className="error-desc">{error.message || '请检查网络连接后重试'}</p>
    <button onClick={onRetry} className="retry-btn">
      重新加载
    </button>
  </div>
);
```

### 错误边界
- 页面级错误：显示错误页面 + 返回首页按钮
- 组件级错误：显示内联错误提示 + 重试按钮
- 接口级错误：Toast 提示 + 业务状态回滚

## 动画与过渡

### 过渡时长规范
| 场景 | 时长 | 缓动函数 |
|------|------|----------|
| 按钮点击反馈 | 80-120ms | ease-out |
| 弹窗出现/消失 | 200-300ms | ease-out / ease-in |
| 页面转场 | 250-350ms | cubic-bezier(0.4, 0, 0.2, 1) |
| 列表项动画 | 150-200ms | ease-out |
| 下拉刷新 | 200ms | ease-out |

### 动画原则
- **有意义**：动画服务于功能，不是装饰
- **不阻塞**：动画期间不阻止用户操作
- **可中断**：长动画支持中断（如页面转场时快速返回）
- **低耗能**：只动画 `transform` 和 `opacity`，避免触发重排

## 无障碍（A11y）

- 所有可点击元素最小触摸区域 44×44px
- 表单标签与输入框关联（`htmlFor` / `aria-label`）
- 颜色对比度 ≥ 4.5:1（普通文字）/ ≥ 3:1（大文字）
- 加载状态添加 `aria-busy="true"`
- 弹窗打开时锁定焦点在弹窗内

## 暗色模式适配

```css
/* ✅ 使用 CSS 变量实现主题切换 */
:root {
  --bg-primary: #ffffff;
  --bg-card: #f8f9fa;
  --text-primary: #1a1a2e;
  --text-secondary: #6b7280;
  --border-color: rgba(0, 0, 0, 0.06);
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] {
  --bg-primary: #0f0f1a;
  --bg-card: #1a1a2e;
  --text-primary: #f0f0f5;
  --text-secondary: #9ca3af;
  --border-color: rgba(255, 255, 255, 0.08);
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

## 检查清单

在交付交互组件/页面前，逐项检查：

- [ ] 所有按钮有点击反馈（缩放/透明度）
- [ ] 表单有完整校验（实时 + 提交时）
- [ ] 网络请求有 loading 状态
- [ ] 空数据有友好的空状态页
- [ ] 网络错误有错误状态 + 重试按钮
- [ ] 危险操作有二次确认弹窗
- [ ] 防重复提交（loading 时禁用按钮）
- [ ] 成功/失败有 Toast 反馈
- [ ] 页面转场有过渡动画
- [ ] 暗色模式正常显示
- [ ] 触摸区域 ≥ 44×44px
