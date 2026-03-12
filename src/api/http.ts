import { apiConfig } from './config';
import { HttpClient } from './core/client';
import { mockHandlers } from './mock/handlers';
import { getAuthHeaders } from '../lib/auth';

export const http = new HttpClient({
  baseURL: apiConfig.baseURL,
  defaultHeaders: {
    accept: 'application/json',
  },
  enableMock: apiConfig.useMock,
  getAuthHeaders,
  isSuccessCode: (code) => code === 1 || code === '1',
  mockDelay: apiConfig.mockDelay,
  mockHandlers,
  timeout: apiConfig.timeout,
});

