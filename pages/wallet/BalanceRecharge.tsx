
import React, { useEffect, useState } from 'react';
import { ChevronLeft, Zap, Radar, CheckCircle, Shield, AlertTriangle, X, Wallet, CreditCard, Banknote, Upload, Image as ImageIcon } from 'lucide-react';

import { LoadingSpinner } from '../../components/common';
import { fetchCompanyAccountList, CompanyAccountItem, submitRechargeOrder } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Route } from '../../router/routes';
import { isSuccess, extractError } from '../../utils/apiHelpers';
import { useErrorHandler } from '../../hooks/useErrorHandler';

import RechargeOrderList from './RechargeOrderList'; // Import the new component
import RechargeOrderDetail from './RechargeOrderDetail'; // Import the detail component

interface BalanceRechargeProps {
  onBack: () => void;
  onNavigate?: (route: Route) => void;
  initialAmount?: string;
}

const BalanceRecharge: React.FC<BalanceRechargeProps> = ({ onBack, onNavigate, initialAmount }) => {

  // Common State
  const [amount, setAmount] = useState<string>(initialAmount || '');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const { showToast } = useNotification();

  // ✅ 使用统一错误处理Hook（纯Toast模式，自动日志记录）
  const { handleError } = useErrorHandler({ showToast: true, persist: false });

  // View State: 'input' | 'matching' | 'matched' | 'history' | 'detail'
  const [viewState, setViewState] = useState<'input' | 'matching' | 'matched' | 'history' | 'detail'>('input');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const [matchedAccount, setMatchedAccount] = useState<CompanyAccountItem | null>(null);

  // Data State
  const [allAccounts, setAllAccounts] = useState<CompanyAccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<{ id: string; name: string; icon: string }[]>([]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetchCompanyAccountList({ usage: 'recharge' });
      if (isSuccess(res)) {
        const list = res.data.list || [];
        setAllAccounts(list);

        // Extract unique payment methods
        const methodsMap = new Map<string, { id: string; name: string; icon: string }>();
        list.forEach(acc => {
          if (!methodsMap.has(acc.type)) {
            methodsMap.set(acc.type, {
              id: acc.type,
              name: acc.type_text || acc.type,
              icon: acc.icon // Use API provided icon
            });
          }
        });
        setAvailableMethods(Array.from(methodsMap.values()));
      } else {
        // ✅ 使用统一错误处理
        handleError(res, {
          toastTitle: '加载失败',
          customMessage: '获取收款账户失败',
          context: { usage: 'recharge' }
        });
      }
    } catch (err) {
      // ✅ 使用统一错误处理
      handleError(err, {
        toastTitle: '加载失败',
        customMessage: '获取收款账户失败',
        context: { usage: 'recharge' }
      });
    } finally {
      setLoading(false);
    }
  };

  // Image Upload State
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Helper: Check if amount is within the range specified in remark (e.g., "100-2000")
  const isAmountInRange = (amount: number, rangeStr: string): boolean => {
    if (!rangeStr) return true; // No range limit
    try {
      const match = rangeStr.match(/(\d+)\s*-\s*(\d+)/);
      if (match) {
        const min = Number(match[1]);
        const max = Number(match[2]);
        if (!isNaN(min) && !isNaN(max)) {
          return amount >= min && amount <= max;
        }
      }
    } catch (e) {
      console.warn('Failed to parse range:', rangeStr, e);
    }
    return true;
  };

  const handleAutoSubmit = async (account: CompanyAccountItem, orderAmount: number) => {
    try {
      const response = await submitRechargeOrder({
        company_account_id: account.id,
        amount: orderAmount,
        payment_type: selectedMethod || undefined,
        payment_method: 'online',
      });

      if (isSuccess(response)) {
        const { pay_url } = response.data || {};

        if (pay_url) {
          showToast('success', '订单创建成功', '正在前往支付...');
          setTimeout(() => {
            window.location.href = pay_url;
          }, 1000);
        } else {
          // Fallback to manual view if no pay_url
          setViewState('matched');
        }
      } else {
        handleError(response, {
          toastTitle: '创建订单失败',
          customMessage: response.msg || '充值通道维护中',
          context: { amount: orderAmount, accountId: account.id }
        });
        setViewState('input');
      }
    } catch (error) {
      handleError(error, {
        toastTitle: '创建订单失败',
        customMessage: '网络错误，请重试',
        context: { amount: orderAmount, accountId: account.id }
      });
      setViewState('input');
    }
  };

  const startMatching = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount < 100) {
      showToast('warning', '输入有误', '最低申购金额为 100 元');
      return;
    }
    if (!selectedMethod) {
      showToast('warning', '请选择', '请选择支付方式');
      return;
    }

    setViewState('matching');

    setTimeout(async () => {
      // 1. Filter by selected method type
      // 2. Filter by amount range in remark
      const validAccounts = allAccounts.filter(acc => {
        const typeMatch = acc.type === selectedMethod;
        const rangeMatch = isAmountInRange(Number(amount), acc.remark);
        return typeMatch && rangeMatch;
      });

      if (validAccounts.length > 0) {
        // Randomly select one
        const randomIndex = Math.floor(Math.random() * validAccounts.length);
        const selected = validAccounts[randomIndex];
        setMatchedAccount(selected);

        // Auto Submit
        await handleAutoSubmit(selected, Number(amount));
      } else {
        showToast('error', '匹配失败', '当前金额暂无匹配通道，请调整金额重试');
        setViewState('input');
      }
    }, 2500);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      showToast('error', '格式错误', '只支持 JPG、PNG、GIF 格式');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', '文件过大', '图片大小不能超过 5MB');
      return;
    }

    setUploadedImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async () => {
    if (!uploadedImage) {
      showToast('warning', '请上传截图', '请先上传付款截图');
      return;
    }

    if (!matchedAccount) {
      showToast('error', '系统错误', '未找到匹配账户');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitRechargeOrder({
        company_account_id: matchedAccount.id,
        amount: Number(amount),
        payment_screenshot: uploadedImage,
        payment_type: selectedMethod || undefined,
      });

      if (isSuccess(response)) {
        showToast('success', '提交成功', `订单号: ${response.data?.order_no || response.data?.order_id || '已生成'}`);

        // Reset form completely & go back
        setAmount('');
        setSelectedMethod(null);
        setUploadedImage(null);
        setImagePreview(null);
        setMatchedAccount(null);
        setViewState('input');
        onBack();
      } else {
        // ✅ 使用统一错误处理
        handleError(response, {
          toastTitle: '提交失败',
          customMessage: '充值订单提交失败，请重试',
          context: { amount, companyAccountId: matchedAccount?.id }
        });
      }
    } catch (error: any) {
      // ✅ 使用统一错误处理
      handleError(error, {
        toastTitle: '提交失败',
        customMessage: '网络错误，请重试',
        context: { amount, companyAccountId: matchedAccount?.id }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setViewState('input');
    setMatchedAccount(null);
    setUploadedImage(null);
    setImagePreview(null);
  };

  // Render Functions
  const renderInputView = () => (
    <>
      {/* 1. Header */}
      <div className="bg-gradient-to-b from-orange-100 to-gray-50 px-4 py-5 pt-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">专项金申购通道</h1>
          </div>
          <button
            onClick={() => setViewState('history')}
            className="text-xs font-bold text-orange-600 bg-white/50 px-3 py-1.5 rounded-full border border-orange-100 flex items-center gap-1 hover:bg-white transition-colors"
          >
            <Banknote size={14} />
            充值记录
          </button>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-orange-100/50 mb-4 border border-white">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="text-orange-500" size={20} />
            <span className="text-sm font-bold text-gray-800">申购金额</span>
          </div>
          <div className="flex items-end gap-2 border-b-2 border-orange-50 pb-2">
            <span className="text-3xl font-bold text-gray-900">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 w-full min-w-0 text-4xl font-bold bg-transparent border-none focus:ring-0 outline-none p-0 placeholder-gray-200"
            />
            {amount && (
              <button
                onClick={() => setAmount('')}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[100, 500, 1000, 2000, 5000, 10000].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(String(val))}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${amount === String(val)
                  ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                {val}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <Shield size={12} />
            资金由第三方银行全流程监管
          </p>
        </div>
      </div>

      {/* 2. Payment Method Selection */}
      <div className="px-4 flex-1">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
          选择支付通道
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" className="text-orange-500" />
          </div>
        ) : availableMethods.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {availableMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${selectedMethod === method.id
                  ? `bg-orange-50 text-orange-600 border-orange-200 shadow-lg scale-[1.02]`
                  : 'bg-white border-gray-100 text-gray-600 hover:border-orange-100 hover:shadow-md'
                  }`}
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm relative overflow-hidden">
                  {method.icon && (
                    <img
                      src={method.icon}
                      alt={method.name}
                      className="w-full h-full object-cover p-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('opacity-0');
                      }}
                    />
                  )}
                  <CreditCard size={24} className={`text-orange-500 absolute transition-opacity ${method.icon ? 'opacity-0' : ''}`} />
                </div>
                <span className="font-bold text-sm">{method.name}</span>
                {selectedMethod === method.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle size={16} fill="currentColor" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
            暂无可用支付通道
          </div>
        )}
      </div>

      {/* 3. Bottom Action */}
      <div className="px-4 py-5 safe-area-bottom bg-white/80 backdrop-blur border-t border-gray-100">
        <button
          onClick={startMatching}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white font-bold text-lg shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Zap size={20} fill="currentColor" />
          立即接入匹配 · Match
        </button>
        <div className="text-center mt-3 text-[10px] text-gray-400">
          安全加密通道 | 资金存管保障 | 24H 实时到账
        </div>
      </div>
    </>
  );

  const renderMatchingView = () => (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/20 via-black to-black"></div>

      <div className="relative z-10 text-center flex flex-col items-center w-full max-w-sm">
        {/* Radar Animation */}
        <div className="relative w-64 h-64 mb-12">
          <div className="absolute inset-0 bg-orange-500/10 rounded-full animate-ping [animation-duration:2s]"></div>
          <div className="absolute inset-0 border border-orange-500/20 rounded-full"></div>
          <div className="absolute inset-[15%] border border-orange-500/30 rounded-full"></div>
          <div className="absolute inset-[30%] border border-orange-500/40 rounded-full"></div>
          <div className="absolute inset-[45%] bg-orange-500/10 rounded-full blur-xl"></div>

          {/* Scanning Line */}
          <div className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-orange-500 origin-left animate-[spin_1.5s_linear_infinite] shadow-[0_0_15px_rgba(251,146,60,0.8)]"></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <Radar size={64} className="text-orange-500 animate-pulse drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
          </div>

          {/* Decorative particles */}
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-orange-300 rounded-full animate-pulse [animation-delay:0.5s]"></div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">正在接入区域结算...</h3>
        <p className="text-sm text-gray-400 border border-gray-800 bg-gray-900/50 px-4 py-2 rounded-full backdrop-blur-sm">
          智能匹配最优资金通道 (权重优先)
        </p>
      </div>
    </div>
  );

  const renderMatchedView = () => (
    matchedAccount && (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#FF6B35] px-4 py-5 pt-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleReset}
                className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors backdrop-blur-sm">
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">通道接入成功</h1>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#FF6B35] shadow-lg mb-3 animate-in zoom-in duration-300">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-1">已分配专属专员</h2>
              <p className="text-sm text-white/90 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                请在 15 分钟内完成转账
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 -mt-4 rounded-t-3xl relative z-20 px-4 pt-6 pb-safe">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service Specialist</span>
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Shield size={10} />
              已缴保证金
            </span>
          </div>

          {/* Account Info Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xl shadow-orange-100/20 border border-gray-100 mb-6">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-50">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF9F2E] text-white flex items-center justify-center text-lg font-bold shadow-md shadow-orange-200">
                {matchedAccount.account_name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">{matchedAccount.account_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">金牌承兑服务商 (UID: {matchedAccount.id})</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                <span className="text-xs text-gray-500 block mb-1">收款账号</span>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 font-mono tracking-wide">{matchedAccount.account_number}</span>
                  <button
                    className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50"
                    onClick={() => {
                      navigator.clipboard.writeText(matchedAccount.account_number);
                      showToast('success', '复制成功', '账号已复制到剪贴板');
                    }}
                  >
                    复制
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                  <span className="text-xs text-gray-500 block mb-1">开户银行</span>
                  <span className="text-sm font-bold text-gray-900 block truncate">{matchedAccount.bank_name || '支付平台'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                  <span className="text-xs text-gray-500 block mb-1">收款姓名</span>
                  <span className="text-sm font-bold text-gray-900 block truncate">{matchedAccount.account_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 p-4 rounded-xl flex items-start gap-3 mb-6 border border-red-100">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 leading-relaxed">
              您正在委托授权服务商办理专项金划拨业务，请务必使用本人账户转账，
              <span className="font-bold underline Decoration-red-500 decoration-2 underline-offset-2">备注您的UID</span>
              ，否则将无法自动到账。
            </p>
          </div>

          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="text-sm font-bold text-gray-900 mb-3 block flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              上传付款截图
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageSelect}
              className="hidden"
              id="payment-screenshot"
            />

            {!imagePreview ? (
              <label
                htmlFor="payment-screenshot"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all group bg-white"
              >
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                  <Upload size={24} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600">点击上传付款截图</span>
                <span className="text-xs text-gray-400 mt-1">支持 JPG/PNG/GIF，最大5MB</span>
              </label>
            ) : (
              <div className="relative group rounded-2xl overflow-hidden shadow-lg shadow-gray-200">
                <div className="absolute inset-0 bg-gray-900/5 -z-10"></div>
                <img
                  src={imagePreview}
                  alt="付款截图"
                  className="w-full h-auto max-h-[400px] object-contain bg-gray-900"
                />
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/50 to-transparent flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setImagePreview(null);
                    }}
                    className="w-8 h-8 bg-red-500/80 text-white rounded-full flex items-center justify-center hover:bg-red-600 backdrop-blur-sm transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <label
                  htmlFor="payment-screenshot"
                  className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur text-xs font-bold text-gray-800 rounded-full cursor-pointer hover:bg-white transition-all shadow-lg border border-gray-100 flex items-center gap-2"
                >
                  <ImageIcon size={14} />
                  重新上传
                </label>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={!uploadedImage || submitting}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2 mb-4 ${uploadedImage && !submitting
              ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white shadow-orange-200 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
          >
            {submitting ? (
              <>
                <LoadingSpinner className="w-5 h-5 border-white/20 border-t-white" />
                提交处理中...
              </>
            ) : (
              <>
                <Zap size={18} fill="currentColor" />
                提交充值订单
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-white text-gray-500 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            取消并返回
          </button>
        </div>
      </div>
    )
  );

  // Handle navigation to detail
  const handleNavigateToDetail = (route: Route) => {
    if (route.name === 'recharge-order-detail' && route.orderId) {
      setSelectedOrderId(route.orderId);
      setViewState('detail');
    } else if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {viewState === 'input' && renderInputView()}
      {viewState === 'matching' && renderMatchingView()}
      {viewState === 'matched' && renderMatchedView()}
      {viewState === 'history' && (
        <RechargeOrderList
          onBack={() => setViewState('input')}
          onNavigate={handleNavigateToDetail}
        />
      )}
      {viewState === 'detail' && (
        <RechargeOrderDetail
          orderId={selectedOrderId}
          onBack={() => setViewState('history')}
        />
      )}
    </div>
  );
};

export default BalanceRecharge;
