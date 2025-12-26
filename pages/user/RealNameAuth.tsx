/**
 * RealNameAuth - 实名认证页面
 * 
 * 使用 PageContainer、LoadingSpinner 组件重构
 * 使用 formatIdCard 工具函数
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */


import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner } from '../../components/common';
import {
  AUTH_TOKEN_KEY,
  fetchRealNameStatus,
  RealNameStatusData,
  submitRealName,
  fetchH5AuthToken,
  h5Recheck,
  H5RecheckResult,
  H5AuthTokenResult,
} from '../../services/api';
import { formatIdCard } from '../../utils/format';
import { useNotification } from '../../context/NotificationContext';


/**
 * RealNameAuth 组件属性接口
 */
interface RealNameAuthProps {
  onBack: () => void;
}


/**
 * RealNameAuth 实名认证页面组件
 */
const RealNameAuth: React.FC<RealNameAuthProps> = ({ onBack }) => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [status, setStatus] = useState<RealNameStatusData | null>(null);

  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');

  const [error, setError] = useState<string | null>(null);

  // 状态判断
  const isAuthed = status?.real_name_status === 2;
  const isPending = status?.real_name_status === 1;

  // 处理从H5核身页面返回的逻辑
  useEffect(() => {
    const handleAuthCallback = async () => {
      // 检查URL参数，判断是否从核身页面返回
      const urlParams = new URLSearchParams(window.location.search);
      const authToken = urlParams.get('authToken');
      const code = urlParams.get('code');
      const success = urlParams.get('success');

      if (!authToken) {
        // 不是从核身页面返回，正常加载状态
        loadRealNameStatus();
        return;
      }

      // 从核身页面返回，重置verifying状态
      setVerifying(false);

      // 从核身页面返回，处理核身结果
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
        if (!token) {
          setError('未找到登录信息，请先登录');
          setLoading(false);
          return;
        }

        // 清除URL参数，避免重复处理
        window.history.replaceState({}, '', window.location.pathname);

        // 如果URL中有错误码，先检查
        if (code && code !== '0') {
          const errorMsg = getErrorMsgByCode(code);
          setError(errorMsg);
          showToast('error', '核身失败', errorMsg);
          setLoading(false);
          return;
        }

        if (success === 'false') {
          const errorMsg = '人脸核身验证失败，请重试';
          setError(errorMsg);
          showToast('error', '核身失败', errorMsg);
          setLoading(false);
          return;
        }

        // 调用校验接口获取核身结果
        const recheckRes = await h5Recheck({ authToken, token });

        if (recheckRes.code === 1 || typeof recheckRes.code === 'undefined') {
          // 后端返回的数据在 data 字段中
          const result = recheckRes.data as H5RecheckResult;

          if (!result) {
            const errorMsg = '获取核身结果失败，返回数据为空';
            setError(errorMsg);
            showToast('error', '核身失败', errorMsg);
            setLoading(false);
            return;
          }

          if (result.status === 1) {
            // 核身通过，提交实名认证
            await submitRealNameWithAuthToken(authToken, token);
          } else {
            // 核身不通过
            const errorMsg = result.reasonTypeDesc || result.statusDesc || getErrorMsgByStatus(result.status, result.reasonType);
            setError(errorMsg);
            showToast('error', '核身失败', errorMsg);
          }
        } else {
          const errorMsg = recheckRes.msg || '获取核身结果失败';
          setError(errorMsg);
          showToast('error', '核身失败', errorMsg);
        }
      } catch (e: any) {
        console.error('处理核身回调失败:', e);
        const errorMsg = e?.msg || e?.response?.msg || e?.message || '处理核身结果失败，请稍后重试';
        setError(errorMsg);
        showToast('error', '处理失败', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, []);

  /**
   * 加载实名认证状态
   */
  const loadRealNameStatus = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    if (!token) {
      setError('未找到登录信息，请先登录');
      setLoading(false);
      return;
    }

    try {
      const res = await fetchRealNameStatus(token);
      if (res.code === 1 || typeof res.code === 'undefined') {
        const data = res.data as RealNameStatusData;
        setStatus(data);

        if (data) {
          setRealName(data.real_name || '');
          setIdCard(data.id_card || '');
        }
      } else {
        setError(res.msg || '获取实名认证状态失败');
      }
    } catch (e: any) {
      console.error('获取实名认证状态异常:', e);
      setError(e?.msg || e?.response?.msg || e?.message || '获取实名认证状态失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 根据错误码获取错误信息
   */
  const getErrorMsgByCode = (code: string): string => {
    const errorMap: Record<string, string> = {
      '2': '身份信息不匹配',
      '3': '身份信息不匹配',
      '4': '活体检测不通过',
      '5': '活体检测超时，请重试',
      '6': '身份信息不一致',
      '7': '无身份证照片',
      '8': '照片过大',
      '9': '权威数据错误，请重试',
      '10': '活体检测不通过',
      '11': '识别到未成年人',
    };
    return errorMap[code] || '人脸核身验证失败';
  };

  /**
   * 根据状态码和原因类型获取错误信息
   */
  const getErrorMsgByStatus = (status: number, reasonType?: number): string => {
    if (status === 2) {
      // 核身不通过
      if (reasonType) {
        return getErrorMsgByCode(String(reasonType));
      }
      return '人脸核身验证失败';
    }
    if (status === 0) {
      return '核身待定，请稍后重试';
    }
    return '人脸核身验证失败';
  };

  /**
   * 使用 authToken 提交实名认证
   */
  const submitRealNameWithAuthToken = async (authToken: string, token: string) => {
    try {
      setSubmitting(true);

      const res = await submitRealName({
        auth_token: authToken,
        token,
      });

      const success = res?.code === 1 || typeof res?.code === 'undefined';
      const message = res?.msg || (success ? '实名认证提交成功，请等待审核' : '提交实名认证失败，请稍后重试');

      if (success) {
        showToast('success', '提交成功', message);
        // 刷新状态
        await loadRealNameStatus();
      } else {
        setError(message);
        showToast('error', '提交失败', message);
      }
    } catch (e: any) {
      console.error('提交实名认证失败:', e);
      const errorMsg = e?.msg || e?.response?.msg || e?.message || '提交实名认证失败，请稍后重试';
      setError(errorMsg);
      showToast('error', '提交失败', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };


  /**
   * 处理提交 - 获取H5认证地址并跳转
   */
  const handleSubmit = async () => {
    if (submitting || verifying) return;

    // 表单验证
    if (!realName?.trim()) {
      setError('请输入真实姓名');
      showToast('warning', '请输入真实姓名');
      return;
    }

    if (!idCard?.trim()) {
      setError('请输入身份证号码');
      showToast('warning', '请输入身份证号码');
      return;
    }


    try {
      setError(null);
      setVerifying(true);

      const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
      if (!token) {
        const errorMsg = '未找到登录信息，请先登录';
        setError(errorMsg);
        showToast('error', '登录信息缺失', errorMsg);
        setVerifying(false);
        return;
      }

      // 构建重定向URL（当前页面URL，用于核身完成后返回）
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;

      // 调用后端接口获取 authToken 和 authUrl
      const res = await fetchH5AuthToken({
        real_name: realName.trim(),
        id_card: idCard.trim(),
        redirect_url: redirectUrl,
        token,
      });

      // 检查接口返回状态
      if (res.code === 1 || typeof res.code === 'undefined') {
        // 后端返回的数据在 data 字段中
        const data = res.data as H5AuthTokenResult;
        const authUrl = data?.authUrl;

        if (!authUrl) {
          const errorMsg = '获取认证地址失败，返回数据为空';
          setError(errorMsg);
          showToast('error', '获取认证地址失败', errorMsg);
          setVerifying(false);
          return;
        }

        // 只有在成功获取到 authUrl 时才跳转
        // 跳转前不重置verifying，因为页面会跳走
        window.location.href = authUrl;
      } else {
        // 接口返回错误，不跳转，显示错误信息
        const errorMsg = res.msg || '获取认证地址失败';
        setError(errorMsg);
        showToast('error', '获取认证地址失败', errorMsg);
        setVerifying(false);
        return;
      }
    } catch (e: any) {
      console.error('获取认证地址失败:', e);
      // 网络错误或其他异常，不跳转
      const errorMsg = e?.msg || e?.response?.msg || e?.message || '获取认证地址失败，请稍后重试';
      setError(errorMsg);
      showToast('error', '网络错误', errorMsg);
      setVerifying(false);
    }
  };

  return (
    <PageContainer title="实名认证" onBack={onBack}>
      {/* 加载状态 */}
      {loading && <LoadingSpinner text="正在加载实名认证信息..." />}

      {/* 错误提示 */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {/* 内容区域 */}
      {!loading && (
        <>
          {/* 已认证状态 */}
          {isAuthed && (
            <div className="flex flex-col items-center pt-8 pb-8">
              <CheckCircle size={64} className="text-orange-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">已完成实名认证</h2>
              <p className="text-sm text-gray-500 mb-8 text-center max-w-[240px]">
                您的身份信息已通过审核，现在可以享受平台的全部服务
              </p>

              <div className="w-full bg-white px-4 border-t border-b border-gray-100">
                <div className="py-4 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-base text-gray-500">真实姓名</span>
                  <span className="text-base font-bold text-gray-800">{status?.real_name || realName}</span>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <span className="text-base text-gray-500">身份证号</span>
                  <span className="text-base font-bold text-gray-800">{formatIdCard(status?.id_card || idCard)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 待审核状态 */}
          {isPending && (
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
          {!isAuthed && !isPending && (
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
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="请输入身份证上的姓名"
                    className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 text-right font-medium"
                  />
                </div>
                <div className="py-4 border-b border-gray-100 flex items-center">
                  <span className="w-24 text-base text-gray-800">身份证号</span>
                  <input
                    type="text"
                    value={idCard}
                    onChange={(e) => setIdCard(e.target.value)}
                    placeholder="请输入身份证号码"
                    className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 text-right font-medium"
                  />
                </div>
              </div>

              {/* 人脸核身说明 */}


              {/* 提交按钮 */}
              <button
                className="w-full bg-orange-600 text-white text-base font-semibold py-3.5 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                onClick={handleSubmit}
                disabled={submitting || verifying}
              >
                {verifying ? '正在跳转...' : submitting ? '提交中...' : '开始人脸核身认证'}
              </button>
            </>
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
