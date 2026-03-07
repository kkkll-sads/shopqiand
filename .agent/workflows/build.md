---
description: 构建项目并验证产物兼容性
---

# 构建流程

// turbo-all

1. 安装依赖（如果 node_modules 不存在）
```bash
cd /www/wwwroot/qingduan && npm install
```

2. 执行完整构建（包含 CSS 清理）
```bash
cd /www/wwwroot/qingduan && npm run build
```

3. 检查 CSS 兼容性
```bash
cd /www/wwwroot/qingduan && npm run check:css-compat
```
