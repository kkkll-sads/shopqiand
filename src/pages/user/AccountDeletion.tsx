/**
 * AccountDeletion - 账户注销页面
 * 已迁移: 使用 React Router 导航
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { ConfirmModal } from '@/components/common';
import { cancelAccount } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { useModal } from '@/hooks';
import { useNotification } from '@/context/NotificationContext';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState } from '@/types/states';

/** 注销提示列表 */
const tips = [
  '账户不存在安全状态（没有被盗、被封等风险）；',
  '平台内，您的资产账户已结清；',
  '平台内，您的账户与与三方账号没有绑定关系；',
  '您的所有订单均处于已完成状态。',
];

/**
 * AccountDeletion 账户注销页面组件
 */
const AccountDeletion: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const submitMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });
  const loading = submitMachine.state === FormState.SUBMITTING;

  // 使用 useModal 管理确认弹窗
  const confirmModal = useModal();

  /**
   * 验证表单
   */
  const validateForm = () => {
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirm) {
      setError('请填写登录密码并完成二次确认');
      return false;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError('两次输入的密码不一致');
      return false;
    }

    setError('');
    return true;
  };

  /**
   * 处理提交
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      confirmModal.show();
    }
  };

  /**
   * 确认注销
   */
  const handleConfirmDeletion = async () => {
    confirmModal.hide();
    submitMachine.send(FormEvent.SUBMIT);

    try {
      const response = await cancelAccount({
        password: password.trim(),
        reason: reason.trim(),
      });

      // 注销成功后清理本地登录态
      useAuthStore.getState().logout();

      showToast('success', '提交成功', response?.msg || '您的注销申请已提交，我们将尽快处理。');
      navigate(-1);
      submitMachine.send(FormEvent.SUBMIT_SUCCESS);
    } catch (err: any) {
      const message =
        err?.msg || err?.message || err?.data?.msg || '提交注销申请失败，请稍后重试';
      setError(message);
      showToast('error', '注销失败', message);
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  return (
    <PageContainer title="账户注销" onBack={() => navigate(-1)} padding={false}>
      <form className="flex flex-col flex-1" onSubmit={handleSubmit}>
        <main className="px-4 pt-4 flex flex-col gap-3 flex-1">
          {/* 注销提示 */}
          <section className="bg-white mt-2 pb-2">
            <h2 className="px-4 py-4 text-base font-bold text-gray-900 border-b border-gray-100">
              注销提示
            </h2>
            <p className="px-4 py-3 text-sm leading-6 text-gray-600">
              注销成功后，您将无法使用当前账号，相关数据也将被删除无法找回。
            </p>
          </section>

          {/* 注销条件 */}
          <section className="bg-white mt-2 pb-2">
            <h2 className="px-4 py-4 text-base font-bold text-gray-900 border-b border-gray-100">
              注销条件
            </h2>
            <div className="px-4 py-3 text-sm leading-6 text-gray-600">
              <p className="mb-2">
                您提交的注销申请生效前，平台将进行以下验证，以保证您的账户与财产安全：
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ol>
            </div>
          </section>

          {/* 身份验证 */}
          <section className="bg-white mt-2">
            <h2 className="px-4 py-4 text-base font-bold text-gray-900 border-b border-gray-100">
              身份验证
            </h2>
            <div className="px-4 pb-4">
              <div className="py-4 border-b border-gray-100">
                <div className="text-sm text-gray-500 mb-1">请输入登录密码</div>
                <input
                  type="password"
                  className="w-full text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
                  placeholder="请输入登录密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="py-4 border-b border-gray-100">
                <div className="text-sm text-gray-500 mb-1">再次输入密码确认注销</div>
                <input
                  type="password"
                  className="w-full text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
                  placeholder="请再次输入登录密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="py-4 border-b border-gray-100">
                <div className="text-sm text-gray-500 mb-1">注销原因（选填）</div>
                <textarea
                  className="w-full text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 resize-none min-h-[60px]"
                  placeholder="请输入注销原因，我们将用于优化体验"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}
            </div>
          </section>
        </main>

        {/* 提交按钮 */}
        <div className="px-4 pt-6 pb-6">
          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white shadow-sm active:opacity-80 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '提交中...' : '确认注销'}
          </button>
        </div>
      </form>

      {/* 确认弹窗 */}
      <ConfirmModal
        open={confirmModal.open}
        title="确认注销账户"
        content="确认提交账号注销申请？确认后账号将无法恢复。"
        confirmText="确认注销"
        cancelText="取消"
        type="danger"
        onConfirm={handleConfirmDeletion}
        onCancel={confirmModal.hide}
      />
    </PageContainer>
  );
};

export default AccountDeletion;
