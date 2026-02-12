import React from 'react';
import type { ChangeEventHandler } from 'react';
import { Building2, User, IdCard, Image as ImageIcon } from 'lucide-react';
import type { AgentReviewStatusData } from '@/services';
import type { AgentEntityType } from '../../hooks/useAgentAuthForm';

interface AgentAuthStatusCardProps {
  status: AgentReviewStatusData;
}

export const AgentAuthStatusCard: React.FC<AgentAuthStatusCardProps> = ({ status }) => {
  return (
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
  );
};

interface AgentAuthFormProps {
  companyName: string;
  legalPerson: string;
  legalId: string;
  entityType: AgentEntityType;
  licensePreview: string;
  uploadingLicense: boolean;
  submitting: boolean;
  loading: boolean;
  onCompanyNameChange: (value: string) => void;
  onLegalPersonChange: (value: string) => void;
  onLegalIdChange: (value: string) => void;
  onEntityTypeChange: (value: AgentEntityType) => void;
  onLicenseChange: ChangeEventHandler<HTMLInputElement>;
  onSubmit: () => void;
}

export const AgentAuthForm: React.FC<AgentAuthFormProps> = ({
  companyName,
  legalPerson,
  legalId,
  entityType,
  licensePreview,
  uploadingLicense,
  submitting,
  loading,
  onCompanyNameChange,
  onLegalPersonChange,
  onLegalIdChange,
  onEntityTypeChange,
  onLicenseChange,
  onSubmit,
}) => {
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center">
          <span className="w-24 text-xs text-gray-500 flex items-center gap-1">
            <Building2 size={14} />
            企业名称
          </span>
          <input
            type="text"
            value={companyName}
            onChange={(event) => onCompanyNameChange(event.target.value)}
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
            onChange={(event) => onLegalPersonChange(event.target.value)}
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
            onChange={(event) => onLegalIdChange(event.target.value)}
            placeholder="请输入法人证件号"
            className="flex-1 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 pt-3 pb-2 text-xs text-gray-500">个体户/企业法人</div>
        <div className="px-4 pb-3 flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              className="w-4 h-4 text-red-600"
              checked={entityType === 'individual'}
              onChange={() => onEntityTypeChange('individual')}
            />
            <span>个体户</span>
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              className="w-4 h-4 text-red-600"
              checked={entityType === 'company'}
              onChange={() => onEntityTypeChange('company')}
            />
            <span>企业法人</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 pt-3 pb-2 text-xs text-gray-500">请上传营业执照</div>
        <div className="px-4 pb-4">
          <label className="border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-6 text-xs text-gray-400 active:bg-gray-50 cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={onLicenseChange} />
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

      <button
        className="w-full bg-red-600 text-white text-sm font-semibold py-3 rounded-md active:opacity-80 shadow-sm disabled:opacity-50"
        onClick={onSubmit}
        disabled={submitting || uploadingLicense || loading}
      >
        {submitting ? '提交中...' : '提交申请'}
      </button>
    </>
  );
};
