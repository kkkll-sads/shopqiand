import type { GenesisNodeActivity, GenesisNodeOrder } from '../../api/modules/genesisNode';

export const GENESIS_NODE_AMOUNT_OPTIONS = [1000, 2000, 3000, 4000, 5000] as const;
export type GenesisNodeAmount = (typeof GENESIS_NODE_AMOUNT_OPTIONS)[number];

export type GenesisActivityPhase = 'upcoming' | 'selling' | 'drawing' | 'settled';

const RESULT_SEEN_STORAGE_KEY = 'genesis-node-result-seen-orders-v2';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
    const nextDate = new Date(timestamp);
    return Number.isNaN(nextDate.getTime()) ? null : nextDate;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const nextDate = new Date(trimmed.replace(/-/g, '/'));
    return Number.isNaN(nextDate.getTime()) ? null : nextDate;
  }

  return null;
}

function readSeenOrderIds(): number[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.sessionStorage.getItem(RESULT_SEEN_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);
  } catch {
    return [];
  }
}

function writeSeenOrderIds(orderIds: number[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(RESULT_SEEN_STORAGE_KEY, JSON.stringify(orderIds));
}

export function formatDateTime(value: Date | string | number | null | undefined): string {
  const date = toDate(value);
  if (!date) {
    return '--';
  }

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
}

export function formatCountdown(targetAt: Date | string | number | null | undefined, now = new Date()) {
  const targetDate = toDate(targetAt);
  const diff = targetDate ? Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000)) : 0;
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return {
    totalSeconds: diff,
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

export function getGenesisActivityPhase(activity?: Pick<GenesisNodeActivity, 'stage' | 'todayOrder'> | null): GenesisActivityPhase {
  const stage = activity?.stage ?? 'upcoming';
  const order = activity?.todayOrder ?? null;
  const orderSettled = Boolean(order && order.status !== 0);

  if (stage === 'upcoming') {
    return 'upcoming';
  }

  if (stage === 'rushing') {
    return 'selling';
  }

  if (stage === 'result_pending') {
    return orderSettled ? 'settled' : 'drawing';
  }

  return 'settled';
}

export function getGenesisStatusLabel(order?: Pick<GenesisNodeOrder, 'frontendStatusText' | 'statusText'> | null): string {
  if (!order) {
    return '待开奖';
  }

  return order.frontendStatusText || order.statusText || '待开奖';
}

export function getGenesisStatusTone(order?: Pick<GenesisNodeOrder, 'status' | 'frontendStatusText'> | null): string {
  if (!order) {
    return 'bg-[#f3ede7] text-[#8f7764]';
  }

  if (order.frontendStatusText === '已退回' || order.status === 4) {
    return 'bg-[#edf6ff] text-[#2563eb]';
  }

  switch (order.status) {
    case 1:
      return 'bg-emerald-50 text-emerald-600';
    case 2:
    case 3:
      return 'bg-orange-50 text-orange-600';
    case 5:
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-[#fff4e6] text-[#b26a00]';
  }
}

export function hasGenesisResultBeenSeen(orderId: number): boolean {
  return readSeenOrderIds().includes(orderId);
}

export function markGenesisResultSeen(orderId: number): number[] {
  const currentIds = readSeenOrderIds();
  if (currentIds.includes(orderId)) {
    return currentIds;
  }

  const nextIds = [...currentIds, orderId];
  writeSeenOrderIds(nextIds);
  return nextIds;
}
