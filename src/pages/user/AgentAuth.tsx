/**
 * AgentAuth - 代理商申请页面
 * 已迁移: 使用 React Router 导航
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner } from '@/components/common';
import { useAgentAuthForm } from './hooks/useAgentAuthForm';
import { AgentAuthForm, AgentAuthStatusCard } from './components/agent-auth/AgentAuthSections';

const AgentAuth: React.FC = () => {
  const navigate = useNavigate();
  const {
    status,
    companyName,
    legalPerson,
    legalId,
    entityType,
    licensePreview,
    loading,
    submitting,
    uploadingLicense,
    hasError,
    errorMessage,
    setCompanyName,
    setLegalPerson,
    setLegalId,
    setEntityType,
    handleLicenseChange,
    handleSubmit,
  } = useAgentAuthForm();

  return (
    <PageContainer title="代理商申请" onBack={() => navigate(-1)}>
      {loading && <LoadingSpinner text="正在加载代理商状态..." />}

      {!loading && hasError && (
        <div className="bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg px-3 py-2 mb-4">
          {errorMessage}
        </div>
      )}

      {status && !loading && !hasError && <AgentAuthStatusCard status={status} />}

      {!loading && (
        <AgentAuthForm
          companyName={companyName}
          legalPerson={legalPerson}
          legalId={legalId}
          entityType={entityType}
          licensePreview={licensePreview}
          uploadingLicense={uploadingLicense}
          submitting={submitting}
          loading={loading}
          onCompanyNameChange={setCompanyName}
          onLegalPersonChange={setLegalPerson}
          onLegalIdChange={setLegalId}
          onEntityTypeChange={setEntityType}
          onLicenseChange={handleLicenseChange}
          onSubmit={() => {
            void handleSubmit();
          }}
        />
      )}
    </PageContainer>
  );
};

export default AgentAuth;
