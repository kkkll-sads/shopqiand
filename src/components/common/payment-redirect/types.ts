export interface PaymentRedirectProps {
  url: string;
  title?: string;
  amount?: string | number;
  orderNo?: string;
  onClose: () => void;
  onSuccess?: () => void;
  /** 重新获取支付链接的回调 */
  onRefreshUrl?: () => Promise<string | null>;
  isOpen: boolean;
  /** 支付超时时间（秒），默认300秒（5分钟） */
  timeout?: number;
}

export type PaymentStep = 'ready' | 'paying' | 'checking' | 'blocked';
