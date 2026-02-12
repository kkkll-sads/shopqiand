import React from 'react';
import { BadgeCheck, Copy, Shield } from 'lucide-react';

interface CertificateOnChainSectionProps {
  txHash?: string;
  supplierName?: string;
  onCopyTxHash: (hash: string) => void;
}

const CertificateOnChainSection: React.FC<CertificateOnChainSectionProps> = ({
  txHash,
  supplierName,
  onCopyTxHash,
}) => (
  <div className="space-y-2">
    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">
      On-chain Proof / 上链信息
    </label>
    <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded break-all leading-relaxed relative group hover:bg-gray-800 transition-colors">
      {txHash && (
        <button
          onClick={() => onCopyTxHash(txHash)}
          className="absolute right-2 top-2 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          title="点击复制"
        >
          <Copy size={12} className="text-gray-500 group-hover:text-green-400" />
        </button>
      )}
      <div className="flex items-center gap-2 mb-2 text-gray-500 font-sans font-bold">
        <BadgeCheck size={12} />
        <span className="uppercase">Tx Hash</span>
      </div>
      {txHash ? (
        <div className="bg-black/30 p-2 rounded text-green-400 break-all">{txHash}</div>
      ) : (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-transparent border-t-amber-500 rounded-full animate-[spin_1.5s_linear_infinite]" />
            <div className="absolute inset-1 border-2 border-transparent border-b-amber-300 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
          </div>
          <span className="text-xs font-bold animate-pulse">⛓️ 链上节点正在算力撮合中...</span>
        </div>
      )}
    </div>
    {supplierName && (
      <div className="bg-gray-50 border border-gray-100 rounded p-3 text-[12px] text-gray-700 flex items-center gap-2">
        <Shield size={14} className="text-amber-600" />
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase">Supplier</div>
          <div className="text-sm font-medium text-gray-600">{supplierName}</div>
        </div>
      </div>
    )}
  </div>
);

export default CertificateOnChainSection;
