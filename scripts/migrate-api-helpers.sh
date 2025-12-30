#!/bin/bash
# API Helpers 批量迁移脚本
# 用途：为剩余 32 个文件添加 import 语句
# 使用：bash scripts/migrate-api-helpers.sh

echo "🚀 开始批量迁移 API Helpers..."

# 待迁移文件列表（剩余32个）
FILES=(
    "pages/wallet/components/asset/AssetHeaderCard.tsx"
    "pages/wallet/ServiceRecharge.tsx"
    "pages/wallet/MyCollectionDetail.tsx"
    "pages/wallet/CumulativeRights.tsx"
    "pages/wallet/ExtensionWithdraw.tsx"
    "pages/wallet/HashrateExchange.tsx"
    "pages/wallet/MyCollection.tsx"
    "pages/wallet/ConsignmentVoucher.tsx"
    "pages/wallet/BalanceRecharge.tsx"
    "pages/wallet/BalanceWithdraw.tsx"
    "pages/wallet/CardManagement.tsx"
    "pages/wallet/ClaimHistory.tsx"
    "pages/wallet/AssetHistory.tsx"
    "pages/wallet/ClaimDetail.tsx"
    "pages/user/AgentAuth.tsx"
    "pages/user/InviteFriends.tsx"
    "pages/user/MyFriends.tsx"
    "pages/user/Profile.tsx"
    "pages/user/AddressList.tsx"
    "pages/market/ReservationPage.tsx"
    "pages/market/SearchPage.tsx"
    "pages/market/TradingZone.tsx"
    "pages/market/OrderDetail.tsx"
    "pages/market/OrderListPage.tsx"
    "pages/market/PointsProductDetail.tsx"
    "pages/market/MatchingPoolPage.tsx"
    "pages/cms/SignIn.tsx"
    "pages/cms/MessageCenter.tsx"
    "pages/cms/Home.tsx"
    "pages/cms/HelpCenter.tsx"
    "pages/auth/Register.tsx"
    "pages/auth/Login.tsx"
)

# 要添加的 import 语句
IMPORT_LINE="import { isSuccess, extractData, extractError } from '../../utils/apiHelpers';"

# 计数器
SUCCESS_COUNT=0
SKIP_COUNT=0
TOTAL=${#FILES[@]}

echo "📦 待迁移文件数: $TOTAL"
echo ""

for file in "${FILES[@]}"; do
    echo "处理: $file"

    # 检查文件是否存在
    if [ ! -f "$file" ]; then
        echo "  ⚠️  文件不存在，跳过"
        ((SKIP_COUNT++))
        continue
    fi

    # 检查是否已经导入
    if grep -q "from '../../utils/apiHelpers'" "$file" 2>/dev/null; then
        echo "  ✅ 已导入，跳过"
        ((SKIP_COUNT++))
        continue
    fi

    # 查找最后一个 import 语句的行号
    LAST_IMPORT_LINE=$(grep -n "^import " "$file" | tail -1 | cut -d: -f1)

    if [ -z "$LAST_IMPORT_LINE" ]; then
        echo "  ⚠️  未找到 import 语句，跳过"
        ((SKIP_COUNT++))
        continue
    fi

    # 在最后一个 import 之后插入新的 import
    sed -i "${LAST_IMPORT_LINE}a\\
// ✅ 引入统一 API 处理工具\\
$IMPORT_LINE
" "$file"

    echo "  ✅ 已添加 import 语句"
    ((SUCCESS_COUNT++))
done

echo ""
echo "========================================="
echo "📊 迁移完成统计"
echo "========================================="
echo "总文件数: $TOTAL"
echo "成功添加: $SUCCESS_COUNT"
echo "已存在/跳过: $SKIP_COUNT"
echo ""
echo "⚠️  注意：import 已添加，但仍需手动替换代码中的判断逻辑"
echo "📖 参考迁移指南: docs/changes/task-02-api-helpers-migration.md"
echo ""
echo "下一步："
echo "1. 检查 git diff 确认改动"
echo "2. 逐个文件替换 .code === 1 判断"
echo "3. 运行测试验证功能"
echo ""
