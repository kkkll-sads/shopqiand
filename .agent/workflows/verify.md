---
description: 完整验证（测试 + 类型检查 + 构建 + CSS 兼容性检查）
---

# 完整验证

// turbo-all

1. 运行所有检查
```bash
cd /www/wwwroot/qingduan && npm run verify
```

此命令等同于依次执行：
- `npm run test` — Vitest 单元测试
- `npm run typecheck` — TypeScript 类型检查
- `npm run build` — Vite 构建 + CSS 清理
- `npm run check:css-compat` — CSS 兼容性检查
