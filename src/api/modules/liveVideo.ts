import { http } from '../http';

interface LiveVideoConfigRaw {
  description?: string;
  title?: string;
  video_url?: string;
}

export interface LiveVideoConfig {
  description: string;
  title: string;
  videoUrl: string;
}

function readString(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeConfig(payload: LiveVideoConfigRaw | null | undefined): LiveVideoConfig {
  return {
    description: readString(payload?.description),
    title: readString(payload?.title),
    videoUrl: readString(payload?.video_url),
  };
}

export const liveVideoApi = {
  async getConfig(signal?: AbortSignal): Promise<LiveVideoConfig> {
    const response = await http.get<LiveVideoConfigRaw>('/api/liveVideo/config', {
      signal,
    });

    return normalizeConfig(response);
  },
};
