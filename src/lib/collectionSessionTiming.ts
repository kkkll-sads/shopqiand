export type CollectionSessionStatus = 'not_started' | 'in_progress' | 'ended';

export interface CollectionSessionTiming {
  status: CollectionSessionStatus;
  countdownMs: number;
  countdownText: string;
  startAt: number | null;
  endAt: number | null;
}

function parseSessionClock(time: string, now: Date): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return target.getTime();
}

export function formatSessionCountdown(countdownMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(countdownMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    seconds,
  ).padStart(2, '0')}`;
}

export function getCollectionSessionTiming(
  startTime: string,
  endTime: string,
  nowMs: number = Date.now(),
): CollectionSessionTiming {
  const now = new Date(nowMs);
  const startAt = parseSessionClock(startTime, now);
  let endAt = parseSessionClock(endTime, now);

  if (startAt == null || endAt == null) {
    return {
      status: 'in_progress',
      countdownMs: 0,
      countdownText: formatSessionCountdown(0),
      startAt,
      endAt,
    };
  }

  if (endAt <= startAt) {
    endAt += 24 * 60 * 60 * 1000;
  }

  if (nowMs < startAt) {
    const countdownMs = startAt - nowMs;
    return {
      status: 'not_started',
      countdownMs,
      countdownText: formatSessionCountdown(countdownMs),
      startAt,
      endAt,
    };
  }

  if (nowMs < endAt) {
    const countdownMs = endAt - nowMs;
    return {
      status: 'in_progress',
      countdownMs,
      countdownText: formatSessionCountdown(countdownMs),
      startAt,
      endAt,
    };
  }

  return {
    status: 'ended',
    countdownMs: 0,
    countdownText: formatSessionCountdown(0),
    startAt,
    endAt,
  };
}
