/**
 * WarningSection - 重要提示组件
 */
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const WarningSection: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl mb-4 border-2 border-red-400 shadow-lg shadow-red-200 overflow-hidden">
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-white shrink-0" strokeWidth={3} />
          <h3 className="text-white font-bold text-sm flex-1">重要提示</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-white/80 text-xs px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
          >
            {showDetails ? '收起' : '展开'}
          </button>
        </div>
        <p className="text-white text-xs leading-relaxed mb-2">
          <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded">切勿保存</span>
          收款人信息转账！请务必使用本人账户转账，<span className="font-bold underline decoration-yellow-300 decoration-2">转账时不要备注任何信息</span>。
        </p>
      </div>
      {showDetails && (
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 p-3.5">
          <ul className="text-white text-xs space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-yellow-300 shrink-0 mt-0.5">●</span>
              <span>每次充值都需要<span className="font-bold underline decoration-yellow-300 decoration-2">重新获取</span>收款信息</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-300 shrink-0 mt-0.5">●</span>
              <span>收款账户为<span className="font-bold">动态分配</span>，使用旧信息将导致<span className="font-bold text-yellow-300">无法到账</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-300 shrink-0 mt-0.5">●</span>
              <span>请勿备注、留言或保存收款人为常用联系人</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-300 shrink-0 mt-0.5">●</span>
              <span>转账完成后请截图上传</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WarningSection;
