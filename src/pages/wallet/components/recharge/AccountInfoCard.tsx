/**
 * AccountInfoCard - 账户信息卡片组件
 */
import React from 'react';
import { Shield } from 'lucide-react';
import { CompanyAccountItem } from '@/services';
import { copyToClipboard } from '@/utils/clipboard';
import { useNotification } from '@/context/NotificationContext';

interface AccountInfoCardProps {
  account: CompanyAccountItem;
}

const AccountInfoCard: React.FC<AccountInfoCardProps> = ({ account }) => {
  const { showToast } = useNotification();

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      showToast('success', '复制成功', `${label}已复制到剪贴板`);
    } else {
      showToast('error', '复制失败', '请长按手动复制');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl shadow-orange-100/20 border border-gray-100 mb-4">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-500 text-white flex items-center justify-center text-base font-bold shadow-md shadow-orange-200">
          {account.account_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-base truncate">{account.account_name}</div>
          <div className="text-xs text-gray-500 mt-0.5">金牌承兑服务商 (UID: {account.id})</div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
          <span className="text-xs text-gray-500 block mb-1">收款账号</span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-bold text-gray-900 font-mono tracking-wide truncate flex-1">
              {account.account_number}
            </span>
            <button
              className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50 shrink-0"
              onClick={() => handleCopy(account.account_number, '账号')}
            >
              复制
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
            <span className="text-xs text-gray-500 block mb-1">银行名称</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-900 block truncate flex-1">
                {account.bank_name || '支付平台'}
              </span>
              <button
                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50 shrink-0"
                onClick={() => handleCopy(account.bank_name || '支付平台', '银行名称')}
              >
                复制
              </button>
            </div>
          </div>
          {account.bank_branch && (
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
              <span className="text-xs text-gray-500 block mb-1">开户行</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-gray-900 block truncate flex-1">
                  {account.bank_branch}
                </span>
                <button
                  className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50 shrink-0"
                  onClick={() => handleCopy(account.bank_branch || '', '开户行')}
                >
                  复制
                </button>
              </div>
            </div>
          )}
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
            <span className="text-xs text-gray-500 block mb-1">收款姓名</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-900 block truncate flex-1">
                {account.account_name}
              </span>
              <button
                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50 shrink-0"
                onClick={() => handleCopy(account.account_name, '姓名')}
              >
                复制
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoCard;
