import { apiConfig } from './config';
import { HttpClient } from './core/client';
import { mockHandlers } from './mock/handlers';
import { getAuthHeaders } from '../lib/auth';
import { emitGlobalToast } from '../lib/feedback';

let latestResolvedLine = '';

function resolveHostName(baseURL: string): string {
  try {
    return new URL(baseURL).hostname || '';
  } catch {
    return '';
  }
}

export const http = new HttpClient({
  baseURL: apiConfig.baseURL,
  baseURLCacheKey: apiConfig.baseURLCacheKey,
  baseURLCandidates: apiConfig.baseURLCandidates,
  baseURLProbePath: apiConfig.baseURLProbePath,
  baseURLProbeTimeout: apiConfig.baseURLProbeTimeout,
  defaultHeaders: {
    accept: 'application/json',
  },
  enableMock: apiConfig.useMock,
  getAuthHeaders,
  isSuccessCode: (code) => code === 0 || code === '0' || code === 1 || code === '1',
  mockDelay: apiConfig.mockDelay,
  mockHandlers,
  onBaseURLResolved: ({ baseURL, line, total }) => {
    if (total <= 1) {
      return;
    }

    const lineKey = `${line}:${baseURL}`;
    if (lineKey === latestResolvedLine) {
      return;
    }
    latestResolvedLine = lineKey;

    const host = resolveHostName(baseURL);
    const hostSuffix = host ? ` (${host})` : '';
    emitGlobalToast({
      message: `当前线路${line}${hostSuffix}`,
      type: 'info',
      duration: 1800,
    });
  },
  timeout: apiConfig.timeout,
});

