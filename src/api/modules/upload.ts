import { apiConfig } from '../config';
import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export type UploadDriver = 'local' | 'aliyun';

export interface UploadFilePayload {
  file: File;
  driver?: UploadDriver;
  topic?: string;
}

export interface UploadFileOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export interface UploadedFile {
  id: number;
  url: string;
  name: string;
  size: number;
  mimetype: string;
  width?: number;
  height?: number;
  sha1: string;
  storage: string;
}

interface UploadedFileRaw {
  height?: number | string;
  id?: number | string;
  mimetype?: string;
  name?: string;
  sha1?: string;
  size?: number | string;
  storage?: string;
  url?: string;
  width?: number | string;
}

interface UploadResponseRaw extends UploadedFileRaw {
  file?: UploadedFileRaw;
}

function normalizeResolvedUrl(targetUrl: URL): string {
  // Keep the original asset key from backend to avoid rewriting valid OSS object paths.
  return targetUrl.toString();
}

export function resolveUploadUrl(url: string): string {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return trimmedUrl;
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    try {
      return normalizeResolvedUrl(new URL(trimmedUrl));
    } catch {
      return trimmedUrl;
    }
  }

  if (/^[\w-]+\.[\w-]+\.\w+\//.test(trimmedUrl)) {
    try {
      return normalizeResolvedUrl(new URL(`https://${trimmedUrl}`));
    } catch {
      return `https://${trimmedUrl}`;
    }
  }

  /* 优先使用 HTTP 客户端已解析出的线路域名，避免在本地页面 origin 下拼出错误资源地址 */
  const runtimeOrigin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const base = http.getResolvedBaseURL() || apiConfig.baseURL || runtimeOrigin;
  return normalizeResolvedUrl(
    new URL(trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`, base),
  );
}

function readNumber(value: number | string | undefined): number {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : 0;
}

function readOptionalNumber(value: number | string | undefined): number | undefined {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : undefined;
}

function readString(value: string | undefined): string {
  return typeof value === 'string' ? value : '';
}

function normalizeUploadedFile(payload: UploadResponseRaw): UploadedFile {
  const raw = payload.file ?? payload;

  return {
    height: readOptionalNumber(raw.height),
    id: readNumber(raw.id),
    mimetype: readString(raw.mimetype),
    name: readString(raw.name),
    sha1: readString(raw.sha1),
    size: readNumber(raw.size),
    storage: readString(raw.storage),
    url: resolveUploadUrl(readString(raw.url)),
    width: readOptionalNumber(raw.width),
  };
}

export const uploadApi = {
  async upload(payload: UploadFilePayload, options: UploadFileOptions = {}) {
    const formData = new FormData();

    formData.append('file', payload.file);

    if (payload.driver) {
      formData.append('driver', payload.driver);
    }

    if (payload.topic) {
      formData.append('topic', payload.topic);
    }

    const response = await http.post<UploadResponseRaw, FormData>('/api/ajax/upload', formData, {
      headers: createApiHeaders(options),
      signal: options.signal,
    });

    return normalizeUploadedFile(response);
  },
};
