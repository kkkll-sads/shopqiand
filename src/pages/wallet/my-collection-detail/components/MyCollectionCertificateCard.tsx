import React from 'react';
import {
  Award,
  Copy,
  ExternalLink,
  FileText,
  Fingerprint,
  Shield,
} from 'lucide-react';

interface MyCollectionCertificateCardProps {
  item: any;
  title: string;
  onCopy: (text: string, successMsg?: string) => void;
  onSearchHash: (hash: string) => void;
}

const DEFAULT_HASH =
  '0x7d9a8b1c4e2f3a6b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6';

const MyCollectionCertificateCard: React.FC<MyCollectionCertificateCardProps> = ({
  item,
  title,
  onCopy,
  onSearchHash,
}) => {
  const assetCode =
    item.asset_code || `37-DATA-****-${String(item.id || 8821).padStart(4, '0')}`;
  const hashValue =
    item.hash || item.fingerprint || item.md5 || item.tx_hash || DEFAULT_HASH;

  return (
    <div className="p-5">
      <div className="bg-white relative shadow-2xl shadow-gray-200/50 rounded-sm overflow-hidden border-[6px] border-double border-amber-900/10 p-6 md:p-8">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Shield size={200} />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-900 mb-3 border border-amber-100">
            <Award size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-wide mb-1">数字资产持有凭证</h2>
          <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
            Digital Asset Certificate
          </div>
        </div>

        <div className="space-y-6 relative z-10 font-sans">
          <div className="text-center py-6 mb-2 relative">
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none rounded-lg border border-amber-900/5 overflow-hidden"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #C5A572 10px, #C5A572 11px),
                                    repeating-linear-gradient(-45deg, transparent, transparent 10px, #C5A572 10px, #C5A572 11px)`,
              }}
            />

            <div
              className="text-sm text-gray-600 font-[courier,monospace] font-bold tracking-widest mb-3 relative z-10 drop-shadow-sm cursor-pointer hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
              onClick={() => onCopy(assetCode, '确权编号已复制')}
            >
              <span>确权编号：{assetCode}</span>
              <Copy size={12} className="text-gray-400" />
            </div>

            <h3 className="text-2xl font-extrabold text-gray-700 mb-3 font-serif tracking-tight leading-tight relative z-10 drop-shadow-sm px-2">
              【{title}】
            </h3>

            <div className="absolute -right-4 -bottom-6 w-32 h-32 opacity-[0.85] -rotate-12 mix-blend-multiply z-20 pointer-events-none filter contrast-125 brightness-90">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <path id="textCircleTop" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
                  <filter id="roughPaper">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.08"
                      numOctaves="3"
                      result="noise"
                    />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                  </filter>
                </defs>
                <g filter="url(#roughPaper)" fill="#B22222" stroke="none">
                  <circle cx="100" cy="100" r="96" fill="none" stroke="#B22222" strokeWidth="3" />
                  <circle cx="100" cy="100" r="92" fill="none" stroke="#B22222" strokeWidth="1" />
                  <text fontSize="14" fontWeight="bold" fontFamily="SimSun, serif" fill="#B22222">
                    <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle" spacing="auto">
                      树交所数字资产登记结算中心
                    </textPath>
                  </text>
                  <text
                    x="100"
                    y="100"
                    fontSize="40"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#B22222"
                  >
                    ★
                  </text>
                  <text
                    x="100"
                    y="135"
                    fontSize="18"
                    fontWeight="bold"
                    fontFamily="SimHei, sans-serif"
                    textAnchor="middle"
                    fill="#B22222"
                  >
                    确权专用章
                  </text>
                  <text
                    x="100"
                    y="155"
                    fontSize="10"
                    fontFamily="Arial, sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#B22222"
                    letterSpacing="1"
                  >
                    37010299821
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-0.5">
                  Asset Anchor / 资产锚定
                </label>
                <div className="text-sm font-medium text-gray-600">
                  涉及农户/合作社：{item.farmer_info || '暂无数据'}
                  <span className="inline-block ml-1 text-[10px] text-amber-600 border border-amber-200 px-1 rounded bg-white">
                    隐私保护
                  </span>
                </div>
                <div className="text-xs font-medium text-gray-600 mt-1">
                  核心企业：{item.core_enterprise || '暂无数据'}
                </div>
                <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                  * 根据《数据安全法》及商业保密协议，底层隐私信息已做Hash脱敏处理，仅持有人可申请解密查看。
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <FileText size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Contract & Session / 合约与场次
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
                  {item.contract_no && (
                    <div>
                      <div className="text-[10px] text-gray-400">合约编号</div>
                      <div className="text-sm font-medium text-gray-700 font-mono break-all">
                        {item.contract_no}
                      </div>
                    </div>
                  )}

                  {item.session_title && (
                    <div>
                      <div className="text-[10px] text-gray-400">所属场次</div>
                      <div className="text-sm font-medium text-gray-700">{item.session_title}</div>
                    </div>
                  )}

                  {(item.session_start_time || item.session_end_time) && (
                    <div>
                      <div className="text-[10px] text-gray-400">交易时段</div>
                      <div className="text-sm font-medium text-gray-700">
                        {item.session_start_time} - {item.session_end_time}
                        {item.is_trading_time !== undefined && (
                          <span
                            className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                              item.is_trading_time
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-50 text-red-500'
                            }`}
                          >
                            {item.is_trading_time ? '交易中' : '非交易时段'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {item.mining_status !== undefined && (
                    <div>
                      <div className="text-[10px] text-gray-400">产出状态</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.mining_status === 1
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.mining_status === 1 ? '正在运行' : '未激活'}
                        </span>
                        {item.mining_start_time && (
                          <span className="text-[10px] text-gray-400">
                            ({item.mining_start_time} 开始)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {item.last_dividend_time && (
                    <div>
                      <div className="text-[10px] text-gray-400">上次分红</div>
                      <div className="text-sm font-medium text-gray-700 font-mono">
                        {item.last_dividend_time}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">
              Blockchain Fingerprint / 存证指纹
            </label>
            <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded-t break-all leading-relaxed relative group">
              <div className="flex items-center gap-2 mb-1 text-gray-500 font-sans font-bold">
                <Fingerprint size={12} />
                <span className="uppercase">TREE-CHAIN CONSORTIUM</span>
              </div>
              {hashValue}
            </div>
            <div className="bg-gray-800 rounded-b p-2 flex gap-2 border-t border-gray-700">
              <button
                onClick={() => onCopy(hashValue, '已复制存证哈希')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <Copy size={10} />
                复制Hash
              </button>
              <button
                onClick={() => onSearchHash(hashValue)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <ExternalLink size={10} />
                去查证
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCollectionCertificateCard;
