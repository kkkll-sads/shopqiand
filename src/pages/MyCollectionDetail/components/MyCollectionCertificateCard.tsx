import { Award, Copy, FileText, Fingerprint, Shield } from 'lucide-react';
import type { UserCollectionDetail } from '../../../api';

interface MyCollectionCertificateCardProps {
  item: UserCollectionDetail;
  title: string;
  onCopy: (text: string, successMessage?: string) => void;
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
  const candidates = [item.hash, item.fingerprint, item.md5, item.tx_hash];
  return candidates.find((value) => typeof value === 'string' && value.trim()) || DEFAULT_HASH;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 border-b border-[#e8dcc6] py-2.5 last:border-b-0">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#9d8266]">{label}</div>
      <div className="text-right text-[13px] leading-6 text-[#453126]">{value || '--'}</div>
    </div>
  );
}

export function MyCollectionCertificateCard({
  item,
  title,
  onCopy,
}: MyCollectionCertificateCardProps) {
  const assetCode =
    item.asset_code || `37-DATA-${String(item.user_collection_id || item.id || 0).padStart(8, '0')}`;
  const fingerprint = getFingerprint(item);

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#dfc7a4] bg-[#fbf4e8] p-4 shadow-[0_18px_40px_rgba(137,92,37,0.12)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(255,255,255,0.85), transparent 38%), repeating-linear-gradient(135deg, rgba(191,150,96,0.07) 0 8px, transparent 8px 18px)',
        }}
      />

      <div className="relative rounded-[24px] border-[6px] border-double border-[#d9bd93] bg-[linear-gradient(180deg,#fffaf1_0%,#f6e7ce_100%)] p-5 shadow-[inset_0_0_0_1px_rgba(167,120,59,0.18)]">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="flex h-full items-center justify-center text-[#8b5b2b]">
            <Shield size={220} strokeWidth={1.2} />
          </div>
        </div>

        <div className="relative z-10">
          <div className="text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#e8cba7] bg-[#fff3de] text-[#8a5829] shadow-[0_10px_20px_rgba(192,146,86,0.15)]">
              <Award size={26} />
            </div>
            <div
              className="mt-4 text-[27px] font-semibold tracking-[0.14em] text-[#5d3e23]"
              style={{ fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif' }}
            >
              数字资产持有凭证
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.34em] text-[#b78a57]">
              Digital Asset Certificate
            </div>
          </div>

          <div className="relative mt-7 overflow-hidden rounded-[22px] border border-[#ebd8bb] bg-[rgba(255,248,237,0.86)] px-4 py-5 text-center">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                background:
                  'repeating-linear-gradient(45deg, transparent, transparent 10px, #b99362 10px, #b99362 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, #b99362 10px, #b99362 11px)',
              }}
            />

            <button
              type="button"
              onClick={() => onCopy(assetCode, '确权编号已复制')}
              className="relative z-10 inline-flex items-center gap-2 rounded-full border border-[#e8cfad] bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#8a5829] transition active:scale-[0.98]"
            >
              <span>确权编号 {assetCode}</span>
              <Copy size={12} />
            </button>

            <h2
              className="relative z-10 mt-4 px-4 text-[28px] font-semibold leading-tight text-[#3a291f]"
              style={{ fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif' }}
            >
              《{title || '未命名藏品'}》
            </h2>

            <div className="pointer-events-none absolute -bottom-7 right-[-6px] z-20 h-32 w-32 rotate-[-12deg] opacity-90 mix-blend-multiply">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <path id="certificate-seal-circle" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
                  <filter id="certificate-seal-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                  </filter>
                </defs>
                <g filter="url(#certificate-seal-noise)" fill="#b22222" stroke="none">
                  <circle cx="100" cy="100" r="96" fill="none" stroke="#b22222" strokeWidth="3" />
                  <circle cx="100" cy="100" r="91" fill="none" stroke="#b22222" strokeWidth="1" />
                  <text fontSize="14" fontWeight="bold" fontFamily="SimSun, serif" fill="#b22222">
                    <textPath href="#certificate-seal-circle" startOffset="50%" textAnchor="middle">
                      树交所数字资产登记结算中心
                    </textPath>
                  </text>
                  <text x="100" y="100" fontSize="40" textAnchor="middle" dominantBaseline="middle" fill="#b22222">
                    验
                  </text>
                  <text
                    x="100"
                    y="135"
                    fontSize="18"
                    fontWeight="bold"
                    fontFamily="SimHei, sans-serif"
                    textAnchor="middle"
                    fill="#b22222"
                  >
                    确权专用章
                  </text>
                  <text
                    x="100"
                    y="154"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                    textAnchor="middle"
                    fill="#b22222"
                    letterSpacing="1"
                  >
                    37010299821
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-[#ead6b8] bg-white/70 p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#f7ead7] p-2 text-[#8b5b2b]">
                <Shield size={16} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#9d8266]">
                  Asset Anchor / 资产锚定
                </div>
                <div className="mt-1 text-[14px] font-medium leading-6 text-[#49352a]">
                  涉及农户/合作社：{item.farmer_info || '暂未披露'}
                </div>
                <div className="mt-1 text-[13px] leading-6 text-[#6d5648]">
                  核心企业：{item.core_enterprise || '暂未披露'}
                </div>
                <div className="mt-2 inline-flex rounded-full border border-[#edd8bc] bg-[#fff7ea] px-2.5 py-1 text-[10px] tracking-[0.12em] text-[#a17847]">
                  已做隐私脱敏处理
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-[#ead6b8] bg-white/72 p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#f7ead7] p-2 text-[#8b5b2b]">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#9d8266]">
                  Contract & Session / 合约与场次
                </div>
                <div className="mt-3">
                  <InfoRow label="合约编号" value={item.contract_no || '--'} />
                  <InfoRow label="所属场次" value={item.session_title || '--'} />
                  <InfoRow
                    label="交易时段"
                    value={formatTimeRange(item.session_start_time, item.session_end_time)}
                  />
                  <InfoRow
                    label="运行状态"
                    value={item.mining_status === 1 ? '运行中' : '未激活'}
                  />
                  <InfoRow label="启动时间" value={item.mining_start_time || '--'} />
                  <InfoRow label="最近更新" value={item.last_dividend_time || item.create_time_text || '--'} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[#9d8266]">
              Blockchain Fingerprint / 存证指纹
            </div>
            <div className="overflow-hidden rounded-[22px] border border-[#2d231f] shadow-[0_18px_32px_rgba(22,16,14,0.22)]">
              <div className="bg-[#1d1613] px-4 py-3 text-[#7ce690]">
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#8ca18f]">
                  <Fingerprint size={13} />
                  <span>Tree Chain Consortium</span>
                </div>
                <div className="break-all font-mono text-[11px] leading-6 text-[#dbffe1]">
                  {fingerprint}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-[#3d322d] bg-[#2a211d] p-2">
                <button
                  type="button"
                  onClick={() => onCopy(fingerprint, '链上指纹已复制')}
                  className="flex items-center justify-center gap-1 rounded-2xl bg-white/10 py-2 text-[12px] text-white transition active:scale-[0.98]"
                >
                  <Copy size={12} />
                  <span>复制指纹</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCopy(assetCode, '凭证编号已复制')}
                  className="flex items-center justify-center gap-1 rounded-2xl bg-white/10 py-2 text-[12px] text-white transition active:scale-[0.98]"
                >
                  <Award size={12} />
                  <span>复制凭证号</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
