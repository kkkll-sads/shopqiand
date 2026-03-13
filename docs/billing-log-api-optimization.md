# 资金流水接口优化方案

## 目标

- 同时支持 `合并流水` 和 `正常流水` 两种视图。
- 保持筛选参数一致，前端只切换模式，不重复维护两套筛选逻辑。
- 降低大用户流水查询的扫描成本，优先保障列表首屏和翻页性能。
- 详情接口兼容普通流水与合并流水，避免前端分叉太多。

## 前端接入约定

- 前端统一调用 `accountApi.getLogList(params)`。
- `params.viewMode = 'merged' | 'normal'`。
- 当前页面已接入模式切换、筛选、详情透传。
- 兼容保留：
  - `accountApi.getAllLog()` 固定请求正常流水。
  - `accountApi.getMergedLog()` 固定请求合并流水。

## 推荐接口

### 1. 正常流水列表

- `GET /api/Account/allLog`

查询参数：

- `page`
- `limit`
- `type`
- `biz_type`
- `flow_direction`
- `keyword`
- `start_time`
- `end_time`
- `view_mode=normal`

### 2. 合并流水列表

- `GET /api/Account/mergedLog`

查询参数：

- 与正常流水完全一致
- `view_mode=merged`

### 3. 流水详情

- `GET /api/Account/moneyLogDetail`

查询参数：

- 普通流水：`id` / `flow_no`
- 合并流水：`merge_key`
- 通用：`view_mode`

## 推荐响应结构

### 列表响应

```json
{
  "code": 1,
  "data": {
    "current_page": 1,
    "per_page": 20,
    "total": 128,
    "has_more": true,
    "list": [
      {
        "id": 10001,
        "flow_no": "FL202603120001",
        "merge_key": "2026-03-12:withdrawable_money:recharge",
        "is_merged": 1,
        "merge_row_count": 6,
        "account_type": "withdrawable_money",
        "biz_type": "recharge",
        "amount": "120.00",
        "before_value": "300.00",
        "after_value": "420.00",
        "create_time": 1773273600,
        "create_time_text": "2026-03-12 10:00:00",
        "memo": "3月12日充值汇总",
        "breakdown": {
          "merge_row_count": 6,
          "merge_parts": {
            "withdrawable_money": 120.0
          }
        }
      }
    ]
  }
}
```

字段要求：

- `is_merged`：前端直接判断视图标签和详情查询方式。
- `merge_key`：合并详情唯一键。
- `merge_row_count`：列表直接显示“已合并 N 笔”。
- `breakdown.merge_parts`：详情页可直接展示拆分结构。
- `has_more`：建议新增，前端可优先依赖它，降低对 `total` 的强依赖。

### 详情响应

建议与列表字段保持同构，并额外补充：

- `merge_key`
- `merge_row_count`
- `batch_no`
- `biz_id`
- `title_snapshot`
- `user_collection_id`
- `item_id`
- `breakdown`

## 合并流水的后端实现建议

### 方案 A：实时聚合

适合数据量中等、筛选组合不复杂的场景。

- 以 `user_id + merge_key` 为聚合维度。
- `merge_key` 推荐由以下维度组合：
  - 日期粒度（按天或按小时）
  - `account_type`
  - `biz_type`
  - `flow_direction`
- 只在必要场景做 `GROUP BY`，不要在主表上做无索引聚合。

### 方案 B：预聚合表

适合资金流水量大、账务查询高频的场景，推荐优先落地。

建议维护一张汇总表，例如 `account_log_merged`：

- `user_id`
- `merge_key`
- `account_type`
- `biz_type`
- `flow_direction`
- `amount_sum`
- `before_value_min`
- `after_value_max`
- `merge_row_count`
- `latest_create_time`
- `latest_flow_no`
- `summary_memo`
- `breakdown_json`

更新方式：

- 流水写入主表后异步增量更新汇总表。
- 或按分钟/小时批处理刷新。
- 汇总表只服务“合并流水列表”和“合并流水详情”。

## 索引优化建议

假设原始流水主表为 `account_log`。

### 主表必备索引

```sql
CREATE INDEX idx_account_log_user_time_id
ON account_log (user_id, create_time DESC, id DESC);

CREATE INDEX idx_account_log_user_type_time_id
ON account_log (user_id, account_type, create_time DESC, id DESC);

CREATE INDEX idx_account_log_user_flow_time_id
ON account_log (user_id, flow_direction, create_time DESC, id DESC);

CREATE INDEX idx_account_log_user_biz_time_id
ON account_log (user_id, biz_type, create_time DESC, id DESC);
```

说明：

- `user_id` 必须放在联合索引最左侧，因为账务查询一定是当前用户维度。
- `create_time + id` 用于稳定倒序分页。
- `account_type / flow_direction / biz_type` 走常见筛选组合。

### 合并表索引

```sql
CREATE UNIQUE INDEX uk_account_log_merged_user_merge_key
ON account_log_merged (user_id, merge_key);

CREATE INDEX idx_account_log_merged_user_time
ON account_log_merged (user_id, latest_create_time DESC);

CREATE INDEX idx_account_log_merged_user_type_time
ON account_log_merged (user_id, account_type, latest_create_time DESC);

CREATE INDEX idx_account_log_merged_user_biz_time
ON account_log_merged (user_id, biz_type, latest_create_time DESC);
```

## 查询与分页建议

- 大数据量场景优先改成游标分页，不建议长期使用 `page + offset`。
- 推荐游标字段：
  - `cursor_time`
  - `cursor_id`
- 排序规则：
  - `ORDER BY create_time DESC, id DESC`

如果短期不改分页协议，也建议内部 SQL 使用“上一页最后一条记录”的条件分页，避免深分页。

## keyword 查询建议

不要直接在主流水表对 `memo` 做 `%keyword%` 模糊匹配。

建议拆成三类：

- 精确字段：
  - `flow_no`
  - `batch_no`
  - `biz_id`
- 前缀匹配字段：
  - 业务单号
- 备注搜索：
  - MySQL `FULLTEXT`
  - 或单独的搜索索引表 / ES

## 响应性能建议

- 列表只返回展示必需字段，不要把详情冗余字段全部塞进列表。
- `create_time_text` 可由后端统一格式化，减少前端兼容成本。
- `total` 如果计算昂贵，可以：
  - 首屏返回精确值
  - 翻页只返回 `has_more`
  - 或改成异步统计

## 建议落地顺序

1. 后端先补 `mergedLog` 列表接口和 `moneyLogDetail` 对 `merge_key` 的支持。
2. 前端通过 `viewMode` 切换正常 / 合并模式。
3. 主表补联合索引，观察正常流水耗时。
4. 如果合并列表仍慢，再引入 `account_log_merged` 预聚合表。
5. 最后再评估把 `page` 分页切成游标分页。

## 当前前端实现对应关系

- 列表模式切换：`merged / normal`
- 列表筛选：账户类型、收支方向、关键字
- 详情透传：
  - 普通流水用 `flow_no / id`
  - 合并流水用 `merge_key + view_mode`
- 详情展示：
  - `merge_row_count`
  - `merge_key`
  - `breakdown.merge_parts`

如果后端接口命名不想用 `mergedLog`，前端只需要改一处：`src/api/modules/account.ts` 里的 `getLogList()` 路由分发。
