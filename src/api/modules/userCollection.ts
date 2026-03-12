import { http } from '../http';

function readNumber(value: unknown, fallback = 0): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatTimestamp(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`,
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`,
  ].join(' ');
}

function readDateTime(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }

    if (/^\d+$/.test(trimmed)) {
      return formatTimestamp(Number(trimmed)) || fallback;
    }

    return trimmed;
  }

  if (typeof value === 'number') {
    return formatTimestamp(value) || fallback;
  }

  return fallback;
}

interface UserCollectionDetailRaw {
  [key: string]: unknown;
  object_type?: string;
  id?: number | string;
  user_collection_id?: number | string;
  item_id?: number | string;
  title?: string;
  name?: string;
  image?: string;
  buy_price?: number | string;
  price?: number | string;
  market_price?: number | string;
  asset_code?: string;
  hash?: string;
  fingerprint?: string;
  md5?: string;
  tx_hash?: string;
  consignment_status?: number | string;
  consignment_status_text?: string;
  status_text?: string;
  rights_status?: string;
  session_title?: string;
  session_name?: string;
  sessionName?: string;
  session_start_time?: number | string;
  sessionStartTime?: number | string;
  session_end_time?: number | string;
  sessionEndTime?: number | string;
  core_enterprise?: string;
  coreEnterprise?: string;
  farmer_info?: string;
  farmerInfo?: string;
  contract_no?: string;
  mining_status?: number | string;
  mining_start_time?: number | string;
  last_dividend_time?: number | string;
  create_time?: number | string;
  create_time_text?: string;
}

export interface UserCollectionDetail {
  [key: string]: unknown;
  object_type: string;
  id: number;
  user_collection_id: number;
  item_id: number;
  title: string;
  image: string;
  buy_price: number;
  market_price: number;
  asset_code: string;
  hash: string;
  fingerprint: string;
  md5: string;
  tx_hash: string;
  consignment_status: number;
  consignment_status_text: string;
  status_text: string;
  rights_status: string;
  session_title: string;
  session_start_time: string;
  session_end_time: string;
  core_enterprise: string;
  farmer_info: string;
  contract_no: string;
  mining_status: number;
  mining_start_time: string;
  last_dividend_time: string;
  create_time_text: string;
}

function normalizeUserCollectionDetail(raw: UserCollectionDetailRaw): UserCollectionDetail {
  const id = readNumber(raw.id);
  const userCollectionId = readNumber(raw.user_collection_id, id);
  const buyPrice = readNumber(raw.buy_price, readNumber(raw.price));

  return {
    ...raw,
    object_type: readString(raw.object_type, 'user_collection'),
    id: readNumber(raw.id, userCollectionId),
    user_collection_id: userCollectionId,
    item_id: readNumber(raw.item_id),
    title: readString(raw.title, readString(raw.name)),
    image: readString(raw.image),
    buy_price: buyPrice,
    market_price: readNumber(raw.market_price, buyPrice),
    asset_code: readString(raw.asset_code),
    hash: readString(raw.hash),
    fingerprint: readString(raw.fingerprint),
    md5: readString(raw.md5),
    tx_hash: readString(raw.tx_hash),
    consignment_status: readNumber(raw.consignment_status),
    consignment_status_text: readString(raw.consignment_status_text),
    status_text: readString(raw.status_text, readString(raw.consignment_status_text, '持有中')),
    rights_status: readString(raw.rights_status),
    session_title: readString(
      raw.session_title,
      readString(raw.session_name, readString(raw.sessionName)),
    ),
    session_start_time: readDateTime(raw.session_start_time ?? raw.sessionStartTime),
    session_end_time: readDateTime(raw.session_end_time ?? raw.sessionEndTime),
    core_enterprise: readString(raw.core_enterprise, readString(raw.coreEnterprise)),
    farmer_info: readString(raw.farmer_info, readString(raw.farmerInfo)),
    contract_no: readString(raw.contract_no),
    mining_status: readNumber(raw.mining_status),
    mining_start_time: readDateTime(raw.mining_start_time),
    last_dividend_time: readDateTime(raw.last_dividend_time),
    create_time_text: readString(raw.create_time_text) || readDateTime(raw.create_time),
  };
}

export const userCollectionApi = {
  detail(userCollectionId: number | string, signal?: AbortSignal) {
    return http
      .get<UserCollectionDetailRaw>('/api/userCollection/detail', {
        query: { user_collection_id: userCollectionId },
        signal,
      })
      .then(normalizeUserCollectionDetail);
  },
};
