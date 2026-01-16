/**
 * RealNameAuth - 实名认证页面（状态机重构版）
 * 已迁移: 使用 React Router 导航
 *
 * @author 树交所前端团队
 * @version 3.1.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner } from '../../components/common';
import { formatIdCard } from '../../utils/format';
import { useRealNameAuth, RealNameState } from '../../hooks/useRealNameAuth';

/**
 * RealNameAuth 实名认证页面组件
 */
const RealNameAuth: React.FC = () => {
  const navigate = useNavigate();

  // 使用状态机Hook管理所有状态和业务逻辑
  const {
    state,
    context,
    canSubmit,
    isLoading,
    showForm,
    showSuccess,
    showPending,
    showError,
    handleSubmit,
    handleRetry,
    handleRetryLoad,
    updateForm,
  } = useRealNameAuth();

  const { status, error, realName, idCard } = context;

  return (
    <PageContainer title="实名认证" onBack={() => navigate(-1)}>
      {/* 加载状态 */}
      {isLoading && (
        <LoadingSpinner
          text={
            state === RealNameState.LOADING
              ? '正在加载实名认证信息...'
              : state === RealNameState.PROCESSING
              ? '正在处理核身结果...'
              : state === RealNameState.SUBMITTING
              ? '正在提交...'
              : '处理中...'
          }
        />
      )}

      {/* 错误提示 */}
      {showError && error && (
        <div className="bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {/* 内容区域 */}
      {!isLoading && (
        <>
          {/* 已认证状态 */}
          {showSuccess && (
            <div className="flex flex-col items-center pt-8 pb-8">
              <CheckCircle size={64} className="text-orange-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">已完成实名认证</h2>
              <p className="text-sm text-gray-500 mb-8 text-center max-w-[240px]">
                您的身份信息已通过审核，现在可以享受平台的全部服务
              </p>

              <div className="w-full bg-white px-4 border-t border-b border-gray-100">
                <div className="py-4 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-base text-gray-500">真实姓名</span>
                  <span className="text-base font-bold text-gray-800">
                    {status?.real_name || realName}
                  </span>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <span className="text-base text-gray-500">身份证号</span>
                  <span className="text-base font-bold text-gray-800">
                    {formatIdCard(status?.id_card || idCard)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 待审核状态 */}
          {showPending && (
            <div className="flex flex-col items-center pt-8 pb-8">
              <Clock size={64} className="text-orange-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">实名认证审核中</h2>
              <p className="text-sm text-gray-500 mb-8 text-center max-w-[240px]">
                您的资料已提交，工作人员正在加急审核中，请您耐心等待
              </p>

              <div className="w-full bg-white rounded-xl shadow-sm border border-orange-100 bg-orange-50/30 overflow-hidden">
                <div className="p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-orange-700 leading-5">
                    审核通常在1-3个工作日内完成。审核结果将通过站内消息通知您，请留意查看。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 表单区域 */}
          {showForm && (
            <>
              {/* 状态提示banner */}
              {status?.audit_reason ? (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg p-3 mb-4 flex gap-2">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold mb-1">审核未通过</div>
                    <div className="text-xs">{status.audit_reason}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-100 text-orange-700 text-xs rounded-lg p-3 mb-4">
                  根据国家相关法规要求，为了保障您的账户安全，使用相关服务前请先完成实名认证。
                </div>
              )}

              {/* 基本信息 */}
              <div className="bg-white px-4 mb-6">
                <div className="py-4 border-b border-gray-100 flex items-center">
                  <span className="w-24 text-base text-gray-800">真实姓名</span>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => updateForm({ realName: e.target.value })}
                    placeholder="请输入身份证上的姓名"
                    className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 text-right font-medium"
                  />
                </div>
                <div className="py-4 border-b border-gray-100 flex items-center">
                  <span className="w-24 text-base text-gray-800">身份证号</span>
                  <input
                    type="text"
                    value={idCard}
                    onChange={(e) => updateForm({ idCard: e.target.value })}
                    placeholder="请输入身份证号码"
                    className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 text-right font-medium"
                  />
                </div>
              </div>

              {/* 人脸核身说明 */}
              <div className="mb-6 px-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <UserCheck size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700 leading-5">
                      <div className="font-bold mb-1">人脸核身说明</div>
                      <div>
                        点击提交后将跳转到第三方人脸识别页面进行身份验证，请确保本人操作并准备好您的身份证。
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                className="w-full bg-orange-600 text-white text-base font-semibold py-3.5 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {state === RealNameState.VERIFYING
                  ? '正在跳转...'
                  : '开始人脸核身认证'}
              </button>
            </>
          )}

          {/* 错误状态的重试按钮 */}
          {showError && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full bg-orange-600 text-white text-base font-semibold py-3.5 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] transition-all"
              >
                返回表单
              </button>
              <button
                onClick={handleRetryLoad}
                className="w-full bg-white text-orange-600 text-base font-semibold py-3.5 rounded-full border-2 border-orange-600 active:scale-[0.98] transition-all"
              >
                刷新状态
              </button>
            </div>
          )}
        </>
      )}

      {/* 底部提示 */}
      <div className="mt-auto pt-8 text-center pb-6">
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-1">
          <ShieldCheck size={12} />
          <span>信息安全加密存储</span>
        </div>
        <p className="text-[10px] text-gray-300 px-8 leading-4">
          由于监管要求，您的身份信息仅用于合规认证，平台承诺严格保密，不会向任何无关第三方泄露。
        </p>
      </div>
    </PageContainer>
  );
};

export default RealNameAuth;
