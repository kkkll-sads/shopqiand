import { Award, Copy, ExternalLink, FileText, Fingerprint, Shield } from 'lucide-react';
import type { UserCollectionDetail } from '../../../api/modules/userCollection';

interface MyCollectionCertificateCardProps {
  item: UserCollectionDetail;
  onCopy: (text: string, successMessage?: string) => void | Promise<void>;
  onSearchHash: (hash: string) => void;
  title: string;
}

const DEFAULT_HASH =
  '0x7d9a8b1c4e2f3a6b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6';

function formatTimeRange(startTime: string, endTime: string): string {
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  return startTime || endTime || '--';
}

function getFingerprint(item: UserCollectionDetail): string {
  return item.hash || item.fingerprint || item.md5 || item.tx_hash || DEFAULT_HASH;
}

export function MyCollectionCertificateCard({
  item,
  onCopy,
  onSearchHash,
  title,
}: MyCollectionCertificateCardProps) {
  const assetCode =
    item.asset_code || `37-DATA-****-${String(item.user_collection_id || item.id || 8821).padStart(4, '0')}`;
  const hashValue = getFingerprint(item);

  return (
    <div className="p-5">
      <div className="relative overflow-hidden rounded-sm border-[6px] border-double border-amber-900/10 bg-white p-6 shadow-2xl shadow-gray-200/50 md:p-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <Shield size={200} />
        </div>

        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-900">
            <Award size={24} />
          </div>
          <h2 className="mb-1 text-2xl font-bold tracking-wide text-gray-900">数字资产持有凭证</h2>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
            Digital Asset Certificate
          </div>
        </div>

        <div className="relative z-10 space-y-6 font-sans">
          <div className="relative mb-2 py-6 text-center">
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg border border-amber-900/5 opacity-[0.08]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 10px, #C5A572 10px, #C5A572 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, #C5A572 10px, #C5A572 11px)',
              }}
            />

            <button
              type="button"
              className="relative z-10 mb-3 inline-flex items-center justify-center gap-2 text-sm font-bold tracking-widest text-gray-600 drop-shadow-sm transition-colors hover:text-amber-600"
              style={{ fontFamily: 'courier, monospace' }}
              onClick={() => void onCopy(assetCode, '确权编号已复制')}
            >
              <span>确权编号：{assetCode}</span>
              <Copy size={12} className="text-gray-400" />
            </button>

            <h3
              className="relative z-10 mb-3 px-2 text-2xl font-extrabold leading-tight tracking-tight text-gray-700 drop-shadow-sm"
              style={{ fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif' }}
            >
              《{title || '未命名藏品'}》
            </h3>

            <div className="pointer-events-none absolute -bottom-6 -right-4 z-20 h-32 w-32 rotate-[-12deg] opacity-[0.85] mix-blend-multiply contrast-125 brightness-90">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <path id="certificate-seal-circle" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
                  <filter id="certificate-seal-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                  </filter>
                </defs>
                <g filter="url(#certificate-seal-noise)" fill="#B22222" stroke="none">
                  <circle cx="100" cy="100" r="96" fill="none" stroke="#B22222" strokeWidth="3" />
                  <circle cx="100" cy="100" r="92" fill="none" stroke="#B22222" strokeWidth="1" />
                  <text fontSize="14" fontWeight="bold" fontFamily="SimSun, serif" fill="#B22222">
                    <textPath href="#certificate-seal-circle" startOffset="50%" textAnchor="middle">
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
                    验
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

          <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-start gap-3">
              <Shield size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <label className="mb-0.5 block text-xs font-bold uppercase text-gray-400">
                  Asset Anchor / 资产锚定
                </label>
                <div className="text-sm font-medium text-gray-600">
                  涉及农户/合作社：{item.farmer_info || '暂无数据'}
                  <span className="ml-1 inline-block rounded border border-amber-200 bg-white px-1 text-[10px] text-amber-600">
                    隐私保护
                  </span>
                </div>
                <div className="mt-1 text-xs font-medium text-gray-600">
                  核心企业：{item.core_enterprise || '暂无数据'}
                </div>
                <div className="mt-1 text-[10px] leading-tight text-gray-400">
                  * 根据相关数据合规要求，底层隐私信息已做 hash 脱敏处理，仅持有人可申请解密查看。
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-start gap-3">
              <FileText size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                  Contract & Session / 合约与场次
                </label>

                <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                  {item.contract_no ? (
                    <div>
                      <div className="text-[10px] text-gray-400">合约编号</div>
                      <div className="break-all font-mono text-sm font-medium text-gray-700">
                        {item.contract_no}
                      </div>
                    </div>
                  ) : null}

                  {item.session_title ? (
                    <div>
                      <div className="text-[10px] text-gray-400">所属场次</div>
                      <div className="text-sm font-medium text-gray-700">{item.session_title}</div>
                    </div>
                  ) : null}

                  {item.session_start_time || item.session_end_time ? (
                    <div>
                      <div className="text-[10px] text-gray-400">交易时段</div>
                      <div className="text-sm font-medium text-gray-700">
                        {formatTimeRange(item.session_start_time, item.session_end_time)}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="text-[10px] text-gray-400">权益节点状态</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          item.mining_status === 1
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.mining_status === 1 ? '运行中' : '未激活'}
                      </span>
                      {item.mining_start_time ? (
                        <span className="text-[10px] text-gray-400">
                          （{item.mining_start_time} 开始）
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {item.last_dividend_time ? (
                    <div>
                      <div className="text-[10px] text-gray-400">最近更新</div>
                      <div className="font-mono text-sm font-medium text-gray-700">
                        {item.last_dividend_time}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Blockchain Fingerprint / 存证指纹
            </label>
            <div className="relative break-all rounded-t bg-gray-900 p-3 font-mono text-[10px] leading-relaxed text-green-500">
              <div className="mb-1 flex items-center gap-2 font-sans font-bold text-gray-500">
                <Fingerprint size={12} />
                <span className="uppercase">TREE-CHAIN CONSORTIUM</span>
              </div>
              {hashValue}
            </div>
            <div className="flex gap-2 rounded-b border-t border-gray-700 bg-gray-800 p-2">
              <button
                type="button"
                onClick={() => void onCopy(hashValue, '链上指纹已复制')}
                className="flex flex-1 items-center justify-center gap-1 rounded bg-gray-700 py-1.5 text-[10px] text-white transition-colors active:bg-gray-600"
              >
                <Copy size={10} />
                <span>复制 Hash</span>
              </button>
              <button
                type="button"
                onClick={() => onSearchHash(hashValue)}
                className="flex flex-1 items-center justify-center gap-1 rounded bg-gray-700 py-1.5 text-[10px] text-white transition-colors active:bg-gray-600"
              >
                <ExternalLink size={10} />
                <span>去查询</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
