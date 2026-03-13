export type AppPlatform = 'android' | 'ios';

const DEFAULT_APP_VERSION = '1.0.0';
const DEFAULT_APP_CHANNEL = 'AppStore';
const DEFAULT_APP_BUILD_NUMBER = '20260306.1';

function normalizePlatform(value: string | undefined): AppPlatform | undefined {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'android' || normalized === 'ios') {
    return normalized;
  }

  return undefined;
}

function getUserAgent(): string {
  if (typeof navigator === 'undefined') {
    return '';
  }

  return navigator.userAgent;
}

function toVersionParts(version: string): number[] {
  return version
    .split(/[^\d]+/)
    .filter(Boolean)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

export function detectAppPlatform(userAgent = getUserAgent()): AppPlatform {
  return /iphone|ipad|ipod/i.test(userAgent) ? 'ios' : 'android';
}

export function compareAppVersions(left: string, right: string): number {
  const leftParts = toVersionParts(left);
  const rightParts = toVersionParts(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (delta !== 0) {
      return delta > 0 ? 1 : -1;
    }
  }

  return 0;
}

export function formatVersionLabel(version: string): string {
  return version.startsWith('v') ? version : `v${version}`;
}

export const APP_PLATFORM =
  normalizePlatform(import.meta.env.VITE_APP_PLATFORM) ?? detectAppPlatform();

export const CURRENT_APP_VERSION =
  import.meta.env.VITE_APP_VERSION?.trim() || DEFAULT_APP_VERSION;

export const APP_CHANNEL =
  import.meta.env.VITE_APP_CHANNEL?.trim() || DEFAULT_APP_CHANNEL;

export const APP_BUILD_NUMBER =
  import.meta.env.VITE_APP_BUILD_NUMBER?.trim() || DEFAULT_APP_BUILD_NUMBER;
