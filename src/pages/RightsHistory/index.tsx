import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText, Filter } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

const MOCK_HISTORY = [
  { id: '1', type: 'screenshot', amount: 5000, status: 'pending', time: '2026-03-01 10:00:00', remark: '这是备注信息' },
  { id: '2', type: 'transfer_record', amount: 10000, status: 'approved', time: '2026-02-28 14:30:00', remark: '' },
  { id: '3', type: 'other', amount: 2000, status: 'rejected', time: '2026-02-25 09:15:00', remark: '驳回原因：凭证不清晰' },
  { id: '4', type: 'screenshot', amount: 1500, status: 'cancelled', time: '2026-02-20 11:20:00', remark: '' },
];

const VOUCHER_TYPES = {
  screenshot: '截图凭证',
  transfer_record: '转账记录',
  other: '其他'
};

const STATUS_MAP = {
  pending: { text: '审核中', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  approved: { text: '已通过', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
  rejected: { text: '已驳回', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
  cancelled: { text: '已取消', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' },
};

export function RightsHistoryPage() {
  const { goBack } = useAppNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGoBack = () => {
    goBack();
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#FDFBFB] dark:bg-bg-base flex flex-col">
        <div className="h-12 flex items-center px-4 border-b border-border-light">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FDFBFB] dark:bg-bg-base flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-900/80 dark:bg-bg-card/80 backdrop-blur-md sticky top-0 z-10 border-b border-border-light shadow-sm">
        <button onClick={handleGoBack} className="p-2 -ml-2 text-text-main active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-semibold text-text-main">确权记录</h1>
        <button className="p-2 -mr-2 text-text-main active:scale-95 transition-transform">
          <Filter size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
        {MOCK_HISTORY.length > 0 ? (
          MOCK_HISTORY.map((record) => {
            const statusInfo = STATUS_MAP[record.status as keyof typeof STATUS_MAP];
            return (
              <Card key={record.id} className="p-4 bg-white dark:bg-bg-card border border-border-light shadow-sm rounded-2xl active:scale-[0.98] transition-transform cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-text-main">
                        {VOUCHER_TYPES[record.type as keyof typeof VOUCHER_TYPES]}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="text-sm text-text-sub">{record.time}</div>
                  </div>
                  <div className={`text-3xl font-bold ${record.status === 'rejected' || record.status === 'cancelled' ? 'text-text-main' : 'text-red-500'}`}>
                    ¥{record.amount.toLocaleString()}
                  </div>
                </div>
                {record.remark && (
                  <div className="mt-3 pt-3 border-t border-border-light text-base text-text-sub bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                    {record.remark}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="text-md">暂无确权记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
