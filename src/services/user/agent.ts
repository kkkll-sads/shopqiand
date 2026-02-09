import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';

export interface AgentReviewStatusData {
  id: number;
  user_id: number;
  status: '0' | '1' | '2'; // 0:审核中, 1:通过, 2:拒绝
  status_text?: string;
  apply_time: string;
  review_time?: string;
  review_reason?: string;
  audit_remark?: string;
  company_name?: string;
  legal_person?: string;
  legal_id_number?: string;
  subject_type?: number;
  license_image?: string;
  [key: string]: any;
}

export async function fetchAgentReviewStatus(token: string): Promise<ApiResponse<AgentReviewStatusData | null>> {
  return authedFetch<AgentReviewStatusData | null>(API_ENDPOINTS.user.agentReviewStatus, {
    method: 'GET',
    token,
  });
}

export interface SubmitAgentReviewParams {
  name?: string; // Opt
  phone?: string; // Opt
  company_name?: string;
  legal_person?: string;
  legal_id_number?: string;
  subject_type?: number;
  license_image?: string;
  reason?: string;
  token?: string;
}

export async function submitAgentReview(params: SubmitAgentReviewParams): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();
  if (params.name) payload.append('name', params.name);
  if (params.phone) payload.append('phone', params.phone);
  if (params.company_name) payload.append('company_name', params.company_name);
  if (params.legal_person) payload.append('legal_person', params.legal_person);
  if (params.legal_id_number) payload.append('legal_id_number', params.legal_id_number);
  if (params.subject_type) payload.append('subject_type', String(params.subject_type));
  if (params.license_image) payload.append('license_image', params.license_image);
  if (params.reason) payload.append('reason', params.reason);

  return authedFetch(API_ENDPOINTS.user.submitAgentReview, {
    method: 'POST',
    body: payload,
    token,
  });
}
