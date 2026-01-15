# 视频管理功能说明

## 功能概述

视频管理后台页面用于管理热门视频内容，支持视频的增删改查、状态管理、排序等功能。

## 访问方式

### 1. 通过设置页面访问（推荐）

- 登录后进入"个人中心" → "设置"
- 如果当前用户是管理员（`user_type === 'admin'`），会显示"视频管理"入口
- 点击进入视频管理页面

### 2. 通过路由直接访问

```typescript
navigateRoute({ name: 'video-management' })
```

## API 接口

所有接口均已在 `services/config.ts` 中配置：

### 1. 获取视频列表
- **接口**: `GET /api/ContentHotVideo/index`
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
  - `status`: 状态筛选（0=下架，1=上架）
  - `keyword`: 关键词搜索

### 2. 添加视频
- **接口**: `POST /api/ContentHotVideo/add`
- **参数**:
  - `title`: 视频标题（必填）
  - `cover`: 封面图URL（必填）
  - `video_url`: 视频URL（必填）
  - `description`: 视频描述（可选）
  - `duration`: 时长（秒，可选）
  - `status`: 状态（0=下架，1=上架，默认1）
  - `sort`: 排序（默认0）

### 3. 编辑视频
- **接口**: `POST /api/ContentHotVideo/edit`
- **参数**: 同添加视频，需额外传入 `id`

### 4. 删除视频
- **接口**: `POST /api/ContentHotVideo/delete`
- **参数**:
  - `id`: 视频ID

### 5. 视频详情
- **接口**: `GET /api/ContentHotVideo/detail`
- **参数**:
  - `id`: 视频ID

## 功能特性

### 1. 视频列表
- 显示视频封面、标题、描述、排序、时长、观看次数等信息
- 支持按状态筛选（全部/已上架/已下架）
- 支持关键词搜索
- 支持分页浏览

### 2. 添加/编辑视频
- 表单验证（标题、封面、视频URL必填）
- 支持封面图上传（最大5MB）
- 支持设置视频时长、排序、状态
- 支持添加视频描述

### 3. 删除视频
- 删除前弹窗确认
- 防止误操作

### 4. 状态管理
- 支持上架/下架切换
- 状态标签显示（绿色=已上架，灰色=已下架）

## 文件结构

```
/www/wwwroot/qingduan/
├── services/
│   ├── video.ts                    # 视频服务模块
│   └── config.ts                   # API配置（已添加视频接口）
├── pages/
│   └── admin/
│       └── VideoManagement.tsx     # 视频管理页面
├── router/
│   ├── routes.ts                   # 路由定义（已添加video-management）
│   └── routesConfig.tsx            # 路由配置（已添加组件映射）
└── pages/user/
    └── Settings.tsx                # 设置页面（已添加管理入口）
```

## 数据结构

### VideoItem 接口

```typescript
interface VideoItem {
    id: number;
    title: string;
    cover: string;          // 封面图
    video_url: string;      // 视频URL
    description?: string;   // 描述
    duration?: number;      // 时长（秒）
    view_count?: number;    // 观看次数
    like_count?: number;    // 点赞数
    status: number;         // 状态：0=下架，1=上架
    sort: number;           // 排序
    create_time?: string;   // 创建时间
    update_time?: string;   // 更新时间
}
```

## 权限控制

目前权限控制在前端实现：
- 只有 `user_type === 'admin'` 的用户才能在设置页面看到"视频管理"入口
- 建议后端也实现相应的权限验证

## 注意事项

1. **封面图上传**：
   - 支持的格式：jpg, jpeg, png, gif, webp
   - 最大文件大小：5MB
   - 上传使用 `/api/ajax/upload` 接口

2. **视频URL**：
   - 需要提供完整的视频URL
   - 建议使用CDN加速

3. **排序规则**：
   - 数字越大排序越靠前
   - 可以使用负数

4. **时长格式**：
   - 以秒为单位
   - 显示时自动转换为 MM:SS 格式

## 后续优化建议

1. 添加视频预览功能
2. 支持批量操作（批量上架/下架/删除）
3. 添加视频分类管理
4. 支持视频标签
5. 添加数据统计（观看量、点赞量趋势）
6. 支持视频文件直接上传（需要后端支持）
