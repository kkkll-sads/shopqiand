/**
 * AgentAuth - 代理商申请页面
 * 
 * 使用 PageContainer、LoadingSpinner 组件重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */


import React, { useEffect, useState } from 'react';
import { Building2, User, IdCard, Image as ImageIcon } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner } from '../../components/common';
import {
  AUTH_TOKEN_KEY,
  AgentReviewStatusData,
  fetchAgentReviewStatus,
  submitAgentReview,
  uploadImage,
  normalizeAssetUrl,
} from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { isSuccess, extractError } from '../../utils/apiHelpers';

/**
 * AgentAuth 组件属性接口
 */
interface AgentAuthProps {
  onBack: () => void;
}

/**
 * AgentAuth 代理商申请页面组件
 */
const AgentAuth: React.FC<AgentAuthProps> = ({ onBack }) => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  const [status, setStatus] = useState<AgentReviewStatusData | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [legalPerson, setLegalPerson] = useState('');
  const [legalId, setLegalId] = useState('');
  const [entityType, setEntityType] = useState<'individual' | 'company'>('company');
  const [licensePreview, setLicensePreview] = useState<string>('');
  const [licenseImagePath, setLicenseImagePath] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  // 加载代理商状态
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
      if (!token) {
        setError('未找到登录信息，请先登录');
        setLoading(false);
        return;
      }

      try {
        const res = await fetchAgentReviewStatus(token);
        if (isSuccess(res)) {
          const data = res.data as AgentReviewStatusData;
          setStatus(data);

          if (data) {
            setCompanyName(data.company_name || '');
            setLegalPerson(data.legal_person || '');
            setLegalId(data.legal_id_number || '');
            setEntityType(data.subject_type === 2 ? 'individual' : 'company');
            setLicenseImagePath(data.license_image || '');
            setLicensePreview(normalizeAssetUrl(data.license_image || ''));
          }
        } else {
          setError(extractError(res, '获取代理商状态失败'));
        }
      } catch (e: any) {
        console.error('获取代理商状态异常:', e);
        setError(e?.message || '获取代理商状态失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  /**
   * 处理营业执照上传
   */
  const handleLicenseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;


    try {
      setUploadingLicense(true);
      const res = await uploadImage(file);
      const data = (res.data || {}) as any;
      const path = data.url || data.path || data.filepath || '';
      const fullUrl = data.fullurl || data.fullUrl || data.url || path;

      if (!path && !fullUrl) {
        throw new Error('上传失败，返回数据为空');
      }

      setLicenseImagePath(path || fullUrl);
      const previewUrl = normalizeAssetUrl(fullUrl || path);
      setLicensePreview(previewUrl);
      showToast('success', res?.msg || '上传成功');
    } catch (err: any) {
      console.error('营业执照上传失败:', err);
      const errorMsg = err?.msg || err?.response?.msg || err?.message || '营业执照上传失败，请稍后重试';
      showToast('error', '上传失败', errorMsg);
    } finally {
      setUploadingLicense(false);
    }
  };

  /**
   * 处理提交
   */
  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
      const res = await submitAgentReview({
        company_name: companyName,
        legal_person: legalPerson,
        legal_id_number: legalId,
        subject_type: entityType === 'individual' ? 2 : 1,
        license_image: licenseImagePath,
        token,
      });
      if (res?.msg) {
        showToast(res.code === 1 ? 'success' : 'info', '提示', res.msg);
      } else {
        showToast('success', '提交成功');
      }

      // 刷新状态
      try {
        const res = await fetchAgentReviewStatus(token);
        if (isSuccess(res)) {
          setStatus(res.data as AgentReviewStatusData);
        }
      } catch (e) {
        console.warn('刷新代理商状态失败:', e);
      }
    } catch (e: any) {
      console.error('提交代理商申请失败:', e);
      const errorMsg = e?.message || '提交代理商申请失败，请稍后重试';
      showToast('error', '提交失败', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="代理商申请" onBack={onBack}>
      {/* 加载状态 */}
      {loading && <LoadingSpinner text="正在加载代理商状态..." />}

      {/* 错误提示 */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {/* 当前状态 */}
      {status && !loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-50 text-sm">
            <span className="text-gray-500 mr-2">当前状态:</span>
            <span className="font-medium text-gray-900">{status.status_text}</span>
          </div>
          {status.audit_remark && (
            <div className="px-4 py-3 text-xs text-red-500 bg-red-50 border-t border-red-100">
              审核备注：{status.audit_remark}
            </div>
          )}
        </div>
      )}

      {/* 表单区域 */}
      {!loading && (
        <>
          {/* 企业信息 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center">
              <span className="w-24 text-xs text-gray-500 flex items-center gap-1">
                <Building2 size={14} />
                企业名称
              </span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="请输入企业名称"
                className="flex-1 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
              />
            </div>
            <div className="px-4 py-3 border-b border-gray-50 flex items-center">
              <span className="w-24 text-xs text-gray-500 flex items-center gap-1">
                <User size={14} />
                企业法人
              </span>
              <input
                type="text"
                value={legalPerson}
                onChange={(e) => setLegalPerson(e.target.value)}
                placeholder="请输入企业法人"
                className="flex-1 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
              />
            </div>
            <div className="px-4 py-3 flex items-center">
              <span className="w-24 text-xs text-gray-500 flex items-center gap-1">
                <IdCard size={14} />
                法人证件号
              </span>
              <input
                type="text"
                value={legalId}
                onChange={(e) => setLegalId(e.target.value)}
                placeholder="请输入法人证件号"
                className="flex-1 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* 主体类型 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="px-4 pt-3 pb-2 text-xs text-gray-500">个体户/企业法人</div>
            <div className="px-4 pb-3 flex items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  className="w-4 h-4 text-orange-500"
                  checked={entityType === 'individual'}
                  onChange={() => setEntityType('individual')}
                />
                <span>个体户</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  className="w-4 h-4 text-orange-500"
                  checked={entityType === 'company'}
                  onChange={() => setEntityType('company')}
                />
                <span>企业法人</span>
              </label>
            </div>
          </div>

          {/* 营业执照上传 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="px-4 pt-3 pb-2 text-xs text-gray-500">请上传营业执照</div>
            <div className="px-4 pb-4">
              <label className="border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-6 text-xs text-gray-400 active:bg-gray-50 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLicenseChange}
                />
                {licensePreview ? (
                  <img
                    src={licensePreview}
                    alt="营业执照预览图"
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                ) : (
                  <ImageIcon size={28} className="mb-2 text-gray-300" />
                )}
                <span className="text-gray-700 text-xs mb-0.5">预览图</span>
                <span className="text-[10px] text-gray-400">
                  {uploadingLicense ? '上传中...' : '点击上传营业执照'}
                </span>
              </label>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-md active:opacity-80 shadow-sm disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting || uploadingLicense || loading}
          >
            {submitting ? '提交中...' : '提交申请'}
          </button>
        </>
      )}
    </PageContainer>
  );
};

export default AgentAuth;
