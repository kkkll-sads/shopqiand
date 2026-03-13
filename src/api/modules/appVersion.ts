import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';
import type { AppPlatform } from '../../lib/appVersion';

export interface AppVersionRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export interface CheckUpdateParams {
  currentVersion: string;
  platform: AppPlatform;
}

export interface GetLatestVersionParams {
  platform: AppPlatform;
}

interface AppVersionInfoRaw {
  app_name: string;
  download_url: string;
  version_code: string;
}

interface CheckUpdateResultRaw {
  data?: AppVersionInfoRaw;
  message: string;
  need_update: boolean;
}

export interface AppVersionInfo {
  appName: string;
  downloadUrl: string;
  versionCode: string;
}

export interface CheckUpdateResult {
  data?: AppVersionInfo;
  message: string;
  needUpdate: boolean;
}

function normalizeVersionInfo(payload: AppVersionInfoRaw): AppVersionInfo {
  return {
    appName: payload.app_name,
    downloadUrl: payload.download_url,
    versionCode: payload.version_code,
  };
}

export const appVersionApi = {
  async checkUpdate(
    params: CheckUpdateParams,
    options: AppVersionRequestOptions = {},
  ): Promise<CheckUpdateResult> {
    const payload = await http.get<CheckUpdateResultRaw>('/api/AppVersion/checkUpdate', {
      headers: createApiHeaders(options),
      query: {
        current_version: params.currentVersion,
        platform: params.platform,
      },
      signal: options.signal,
    });

    return {
      data: payload.data ? normalizeVersionInfo(payload.data) : undefined,
      message: payload.message,
      needUpdate: payload.need_update,
    };
  },

  async getLatestVersion(
    params: GetLatestVersionParams,
    options: AppVersionRequestOptions = {},
  ): Promise<AppVersionInfo> {
    const payload = await http.get<AppVersionInfoRaw>('/api/AppVersion/getLatestVersion', {
      headers: createApiHeaders(options),
      query: {
        platform: params.platform,
      },
      signal: options.signal,
    });

    return normalizeVersionInfo(payload);
  },
};
