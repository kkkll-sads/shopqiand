import type { ElementType } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Info,
  Package,
  Receipt,
  Truck,
  Wallet,
} from 'lucide-react';

export type MessageType =
  | 'system'
  | 'order'
  | 'activity'
  | 'notice'
  | 'recharge'
  | 'withdraw'
  | 'shop_order';

export interface MessageItem {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  time: string;
  timestamp: number;
  isRead: boolean;
  icon: ElementType;
  color: string;
  bgColor: string;
  sourceId?: string | number;
}

export const messageIconMap = {
  AlertCircle,
  Info,
  Wallet,
  Receipt,
  Package,
  CheckCircle,
  Truck,
} as const;

export type MessageIconKey = keyof typeof messageIconMap;

const iconEntries = Object.entries(messageIconMap) as Array<[MessageIconKey, ElementType]>;

export function getMessageIconKey(icon: ElementType): MessageIconKey {
  const matched = iconEntries.find(([, value]) => value === icon);
  return matched?.[0] ?? 'Info';
}

export function resolveMessageIcon(iconKey?: string): ElementType {
  if (!iconKey) return messageIconMap.Info;
  return messageIconMap[iconKey as MessageIconKey] ?? messageIconMap.Info;
}
