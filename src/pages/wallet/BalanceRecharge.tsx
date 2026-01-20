/**
 * BalanceRecharge - 余额充值页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, Radar, CheckCircle, Shield, AlertTriangle, AlertCircle, X, Wallet, CreditCard, Banknote, Upload, Image as ImageIcon } from 'lucide-react';

import { LoadingSpinner, PaymentRedirect } from '../../../components/common';
import { fetchCompanyAccountList, CompanyAccountItem, submitRechargeOrder, transferIncomeToPurchase, updateRechargeOrderRemark } from '../../../services/api';
import { fetchProfile } from '../../../services/user';
import { getStoredToken } from '../../../services/client';
import { useNotification } from '../../../context/NotificationContext';
import { isSuccess, extractError } from '../../../utils/apiHelpers';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { copyToClipboard } from '../../../utils/clipboard';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '../../../types/states';
import { debugLog, warnLog, errorLog } from '../../../utils/logger';

import RechargeOrderList from './RechargeOrderList'; // Import the new component
import RechargeOrderDetail from './RechargeOrderDetail'; // Import the detail component

interface BalanceRechargeProps {
  initialAmount?: string;
}

const BalanceRecharge: React.FC<BalanceRechargeProps> = ({ initialAmount }) => {
  const navigate = useNavigate();

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
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const [availableMethods, setAvailableMethods] = useState<{ id: string; name: string; icon: string }[]>([]);

  // Embedded Browser State
  const [showPaymentBrowser, setShowPaymentBrowser] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  // Transfer State
  const [transferAmount, setTransferAmount] = useState<string>('');
  const transferMachine = useStateMachine<FormState, FormEvent>({
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
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(0);
  const transferRemark = '余额划转'; // Fixed remark

  // Retry State (自动重试相关状态)
  const [retryCount, setRetryCount] = useState(0); // 当前重试次数
  const [maxRetries] = useState(3); // 最大重试次数
  const [availableAccounts, setAvailableAccounts] = useState<CompanyAccountItem[]>([]); // 可用账户队列
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0); // 当前尝试的账户索引

  // Warning Details State (警告详情展开/收起)
  const [showWarningDetails, setShowWarningDetails] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadUserBalance();
  }, []);

  // 当显示银行卡账户信息时，启用页面复制功能
  useEffect(() => {
    if (viewState === 'matched' && selectedMethod === 'bank_card') {
      // 启用复制
      document.body.setAttribute('data-allow-copy', 'true');
      debugLog('BalanceRecharge', '已启用复制功能');
    } else {
      // 禁用复制
      document.body.setAttribute('data-allow-copy', 'false');
      debugLog('BalanceRecharge', '已禁用复制功能');
    }

    // 清理函数：组件卸载时恢复默认状态
    return () => {
      document.body.setAttribute('data-allow-copy', 'false');
    };
  }, [viewState, selectedMethod]);

  const loadAccounts = async () => {
    loadMachine.send(LoadingEvent.LOAD);
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
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        // ✅ 使用统一错误处理
        handleError(res, {
          toastTitle: '加载失败',
          customMessage: '获取收款账户失败',
          context: { usage: 'recharge' }
        });
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (err) {
      // ✅ 使用统一错误处理
      handleError(err, {
        toastTitle: '加载失败',
        customMessage: '获取收款账户失败',
        context: { usage: 'recharge' }
      });
      loadMachine.send(LoadingEvent.ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  const loadUserBalance = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        // 用户未登录，跳过获取余额
        return;
      }

      const res = await fetchProfile(token);
      if (isSuccess(res)) {
        const withdrawableMoney = Number(res.data.userInfo.withdrawable_money) || 0;
        setWithdrawableBalance(withdrawableMoney);
      }
    } catch (err) {
      // 静默失败，不显示错误提示，因为这不是核心功能
      warnLog('BalanceRecharge', 'Failed to load user balance', err);
    }
  };

  // Image Upload State
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
  const loading = loadMachine.state === LoadingState.LOADING;
  const transferring = transferMachine.state === FormState.SUBMITTING;
  const submitting = submitMachine.state === FormState.SUBMITTING;

  // Confirmation Modal State (for bank card)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastFourDigits, setLastFourDigits] = useState<string>('');

  // Payment Result Confirmation Modal State (for WeChat/Alipay)
  // showPaymentResultModal 已移除 - 支付结果确认逻辑移至 PaymentRedirect
  const [paymentResultRemark, setPaymentResultRemark] = useState<string>('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

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
      warnLog('BalanceRecharge', 'Failed to parse range', { rangeStr, error: e });
    }
    return true;
  };

  const trySubmitWithAccount = async (accounts: CompanyAccountItem[], index: number) => {
    // 检查是否已尝试所有账户
    if (index >= accounts.length) {
      showToast('error', '通道不可用', '所有支付通道暂时无法使用，请稍后重试');
      setViewState('input');
      return;
    }

    // 检查是否达到最大重试次数
    if (index >= maxRetries) {
      showToast('error', '重试失败', `已尝试 ${maxRetries} 个通道，请稍后重试或联系客服`);
      setViewState('input');
      return;
    }

    const selected = accounts[index];
    setMatchedAccount(selected);

    // ✅ 银行卡通道：直接显示收款账户信息页面，用户手动上传截图后提交
    if (selectedMethod === 'bank_card') {
      setViewState('matched');
      return;
    }

    // 其他通道：尝试自动提交
    try {
      const response = await submitRechargeOrder({
        company_account_id: selected.id,
        amount: Number(amount),
        payment_type: selectedMethod || undefined,
        payment_method: 'online',
      });

      if (isSuccess(response)) {
        const { pay_url, order_id, order_no } = response.data || {};

        if (pay_url) {
          showToast('success', '订单创建成功', '正在加载支付页面...');
          setPaymentUrl(pay_url);
          setShowPaymentBrowser(true);
          // Store order ID for later update
          setPendingOrderId(order_id || order_no || null);
        } else {
          // Fallback to manual view if no pay_url
          setViewState('matched');
        }
      } else {
        // 失败：判断是否需要重试
        const errorMsg = response.msg || '';

        // 特定错误需要重试
        const shouldRetry =
          errorMsg.includes('获取支付链接失败') ||
          errorMsg.includes('未获取到支付地址') ||
          errorMsg.includes('Exception:') ||
          errorMsg.includes('Stack trace:');

        if (shouldRetry && index < accounts.length - 1 && index < maxRetries - 1) {
          // 静默重试，不显示提示
          const nextIndex = index + 1;
          setRetryCount(nextIndex);
          setCurrentAccountIndex(nextIndex);

          // 延迟 500ms 后尝试下一个通道
          setTimeout(() => {
            trySubmitWithAccount(accounts, nextIndex);
          }, 500);
        } else {
          // 不重试，显示错误
          let friendlyMessage = errorMsg || '充值通道维护中';
          if (shouldRetry) {
            friendlyMessage = '当前支付通道暂时无法使用，请稍后重试或更换其他支付方式';
          }

          handleError(response, {
            toastTitle: '创建订单失败',
            customMessage: friendlyMessage,
            context: { amount: Number(amount), accountId: selected.id }
          });
          setViewState('input');
        }
      }
    } catch (error) {
      // 网络错误：静默尝试下一个通道
      if (index < accounts.length - 1 && index < maxRetries - 1) {
        const nextIndex = index + 1;
        setRetryCount(nextIndex);
        setCurrentAccountIndex(nextIndex);

        setTimeout(() => {
          trySubmitWithAccount(accounts, nextIndex);
        }, 500);
      } else {
        handleError(error, {
          toastTitle: '创建订单失败',
          customMessage: '网络错误，请重试',
          context: { amount: Number(amount), accountId: selected.id }
        });
        setViewState('input');
      }
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
      // 筛选并排序账户
      // 筛选并排序账户
      const filteredAccounts = allAccounts.filter(acc => {
        const typeMatch = acc.type === selectedMethod;
        const rangeMatch = isAmountInRange(Number(amount), acc.remark);
        return typeMatch && rangeMatch;
      });

      // 预处理：先随机打乱 (Fisher-Yates Shuffle)
      // 目的：当 sort 序号相同时，确保随机选择，而不是总是命中数据库 ID 较小的那一个
      for (let i = filteredAccounts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredAccounts[i], filteredAccounts[j]] = [filteredAccounts[j], filteredAccounts[i]];
      }

      // 排序逻辑：支付宝和微信第一次匹配排序高的，后续随机选择
      let validAccounts = [...filteredAccounts];
      if (selectedMethod === 'alipay' || selectedMethod === 'wechat') {
        const hasMatchedKey = `HAS_MATCHED_${selectedMethod.toUpperCase()}`;
        const hasMatched = sessionStorage.getItem(hasMatchedKey);

        if (!hasMatched) {
          // 第一次：按 sort 升序 (由于已预先 shuffle，相同 sort 的项相对顺序随机)
          validAccounts.sort((a, b) => {
            const sortA = typeof a.sort === 'number' ? a.sort : Number.MAX_SAFE_INTEGER;
            const sortB = typeof b.sort === 'number' ? b.sort : Number.MAX_SAFE_INTEGER;
            return sortA - sortB;
          });
          sessionStorage.setItem(hasMatchedKey, 'true');
        } else {
          // 后续：随机打乱 (Fisher-Yates Shuffle)
          for (let i = validAccounts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validAccounts[i], validAccounts[j]] = [validAccounts[j], validAccounts[i]];
          }
        }
      } else {
        // 其他方式：保持按 sort 升序 (由于已预先 shuffle，相同 sort 的项相对顺序随机)
        validAccounts.sort((a, b) => {
          const sortA = typeof a.sort === 'number' ? a.sort : Number.MAX_SAFE_INTEGER;
          const sortB = typeof b.sort === 'number' ? b.sort : Number.MAX_SAFE_INTEGER;
          return sortA - sortB;
        });
      }

      if (validAccounts.length > 0) {
        // 保存可用账户列表
        setAvailableAccounts(validAccounts);
        setCurrentAccountIndex(0);
        setRetryCount(0);

        // 尝试第一个账户
        await trySubmitWithAccount(validAccounts, 0);
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

    // Validate last four digits for bank card payments
    if (selectedMethod === 'bank_card' && lastFourDigits.length !== 4) {
      showToast('warning', '请输入卡号', '请输入付款银行卡后四位号码');
      return;
    }

    submitMachine.send(FormEvent.SUBMIT);
    try {
      const response = await submitRechargeOrder({
        company_account_id: matchedAccount.id,
        amount: Number(amount),
        payment_screenshot: uploadedImage,
        payment_type: selectedMethod || undefined,
        card_last_four: selectedMethod === 'bank_card' ? lastFourDigits : undefined,
      });

      if (isSuccess(response)) {
        showToast('success', '提交成功', `订单号: ${response.data?.order_no || response.data?.order_id || '已生成'}`);

        // Reset form completely & go back
        setAmount('');
        setSelectedMethod(null);
        setUploadedImage(null);
        setImagePreview(null);
        setMatchedAccount(null);
        setShowConfirmModal(false);
        setLastFourDigits('');
        setViewState('input');
        navigate(-1);
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        // ✅ 使用统一错误处理
        handleError(response, {
          toastTitle: '提交失败',
          customMessage: '充值订单提交失败，请重试',
          context: { amount, companyAccountId: matchedAccount?.id }
        });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error: any) {
      // ✅ 使用统一错误处理
      handleError(error, {
        toastTitle: '提交失败',
        customMessage: '网络错误，请重试',
        context: { amount, companyAccountId: matchedAccount?.id }
      });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  const handleReset = () => {
    setViewState('input');
    setMatchedAccount(null);
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleTransfer = async () => {
    const numAmount = Number(transferAmount);
    if (!transferAmount || isNaN(numAmount) || numAmount <= 0) {
      showToast('warning', '输入有误', '请输入有效的划转金额');
      return;
    }

    transferMachine.send(FormEvent.SUBMIT);
    try {
      const response = await transferIncomeToPurchase({
        amount: numAmount,
        remark: transferRemark || '余额划转',
      });

      if (isSuccess(response)) {
        const { transfer_amount, remaining_withdrawable, new_balance_available } = response.data;
        showToast('success', '划转成功', `成功划转 ¥${transfer_amount} 到可用余额`);

        // Update balance
        setWithdrawableBalance(remaining_withdrawable);

        // Reset form
        setTransferAmount('');
        transferMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        // ✅ 使用统一错误处理
        handleError(response, {
          toastTitle: '划转失败',
          customMessage: response.msg || '余额划转失败，请重试',
          context: { amount: numAmount, remark: transferRemark }
        });
        transferMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error) {
      // ✅ 使用统一错误处理
      handleError(error, {
        toastTitle: '划转失败',
        customMessage: '网络错误，请重试',
        context: { amount: numAmount, remark: transferRemark }
      });
      transferMachine.send(FormEvent.SUBMIT_ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  // Render Functions
  const renderInputView = () => (
    <>
      {/* 1. Header */}
      <div className="bg-gradient-to-b from-red-100 to-gray-50 px-4 py-5 pt-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">专项金申购通道</h1>
          </div>
          <button
            onClick={() => setViewState('history')}
            className="text-xs font-bold text-red-600 bg-white/50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1 hover:bg-white transition-colors"
          >
            <Banknote size={14} />
            充值记录
          </button>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-red-100/50 mb-4 border border-white">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="text-red-600" size={20} />
            <span className="text-sm font-bold text-gray-800">申购金额</span>
          </div>
          <div className="flex items-center gap-1 pb-3 border-b-2 border-gray-100 focus-within:border-red-500 transition-colors">
            <span className="text-2xl font-bold text-gray-400">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 w-full min-w-0 text-[36px] font-bold bg-transparent border-none focus:ring-0 outline-none p-0 placeholder-gray-200 text-gray-900 leading-tight"
              style={{ fontSize: '36px' }}
            />
            {amount && (
              <button
                onClick={() => setAmount('')}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
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
                  ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm'
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

        {/* Transfer Section */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-blue-100/50 mb-4 border border-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="text-blue-500" size={20} />
              <span className="text-sm font-bold text-gray-800">可提现余额划转</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">可提现余额</p>
              <p className="text-lg font-bold text-blue-600">¥{withdrawableBalance.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 pb-3 border-b-2 border-gray-100 focus-within:border-blue-500 transition-colors mb-4">
            <span className="text-2xl font-bold text-gray-400">¥</span>
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0"
              className="flex-1 w-full min-w-0 text-[36px] font-bold bg-transparent border-none focus:ring-0 outline-none p-0 placeholder-gray-200 text-gray-900 leading-tight"
              style={{ fontSize: '36px' }}
            />
            {transferAmount && (
              <button
                onClick={() => setTransferAmount('')}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Display Transfer Amount */}
          {transferAmount && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                划转金额：¥{Number(transferAmount).toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                备注：{transferRemark}
              </p>
            </div>
          )}

          <button
            onClick={handleTransfer}
            disabled={!transferAmount || transferring}
            className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${transferAmount && !transferring
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-200 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
          >
            {transferring ? (
              <>
                <LoadingSpinner className="w-5 h-5 border-white/20 border-t-white" />
                划转中...
              </>
            ) : (
              <>
                <Zap size={18} fill="currentColor" />
                立即划转到可用余额
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <Shield size={12} />
            划转后资金可用于专项金申购
          </p>
        </div>
      </div>

      {/* 2. Payment Method Selection */}
      <div className="px-4 flex-1">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-red-600 rounded-full"></span>
          选择支付通道
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" className="text-red-500" />
          </div>
        ) : availableMethods.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {availableMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${selectedMethod === method.id
                  ? `bg-red-50 text-red-600 border-red-200 shadow-lg scale-[1.02]`
                  : 'bg-white border-gray-100 text-gray-600 hover:border-red-100 hover:shadow-md'
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
                  <CreditCard size={24} className={`text-red-600 absolute transition-opacity ${method.icon ? 'opacity-0' : ''}`} />
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
          className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
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
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black"></div>

      <div className="relative z-10 text-center flex flex-col items-center w-full max-w-sm">
        {/* Radar Animation */}
        <div className="relative w-64 h-64 mb-12">
          <div className="absolute inset-0 bg-red-600/10 rounded-full animate-ping [animation-duration:2s]"></div>
          <div className="absolute inset-0 border border-red-600/20 rounded-full"></div>
          <div className="absolute inset-[15%] border border-red-600/30 rounded-full"></div>
          <div className="absolute inset-[30%] border border-red-600/40 rounded-full"></div>
          <div className="absolute inset-[45%] bg-red-600/10 rounded-full blur-xl"></div>

          {/* Scanning Line */}
          <div className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-gradient-to-r from-transparent via-red-400 to-red-600 origin-left animate-[spin_1.5s_linear_infinite] shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <Radar size={64} className="text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
          </div>

          {/* Decorative particles */}
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse [animation-delay:0.5s]"></div>
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
        <div className="bg-red-600 px-4 py-5 pt-8 text-white relative overflow-hidden shrink-0">
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
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-600 shadow-lg mb-3 animate-in zoom-in duration-300">
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
          <div className="bg-white rounded-2xl p-4 shadow-xl shadow-orange-100/20 border border-gray-100 mb-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-500 text-white flex items-center justify-center text-base font-bold shadow-md shadow-orange-200">
                {matchedAccount.account_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-base truncate">{matchedAccount.account_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">金牌承兑服务商 (UID: {matchedAccount.id})</div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                <span className="text-xs text-gray-500 block mb-1">收款账号</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-gray-900 font-mono tracking-wide truncate flex-1">{matchedAccount.account_number}</span>
                  <button
                    className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50 shrink-0"
                    onClick={async () => {
                      const success = await copyToClipboard(matchedAccount.account_number);
                      if (success) {
                        showToast('success', '复制成功', '账号已复制到剪贴板');
                      } else {
                        showToast('error', '复制失败', '请长按手动复制');
                      }
                    }}
                  >
                    复制
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                  <span className="text-xs text-gray-500 block mb-1">银行名称</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 block truncate flex-1">{matchedAccount.bank_name || '支付平台'}</span>
                    <button
                      className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50 shrink-0"
                      onClick={async () => {
                        const success = await copyToClipboard(matchedAccount.bank_name || '支付平台');
                        if (success) {
                          showToast('success', '复制成功', '银行名称已复制到剪贴板');
                        } else {
                          showToast('error', '复制失败', '请长按手动复制');
                        }
                      }}
                    >
                      复制
                    </button>
                  </div>
                </div>
                {matchedAccount.bank_branch && (
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                    <span className="text-xs text-gray-500 block mb-1">开户行</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-gray-900 block truncate flex-1">{matchedAccount.bank_branch}</span>
                      <button
                        className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50 shrink-0"
                        onClick={async () => {
                          const success = await copyToClipboard(matchedAccount.bank_branch || '');
                          if (success) {
                            showToast('success', '复制成功', '开户行已复制到剪贴板');
                          } else {
                            showToast('error', '复制失败', '请长按手动复制');
                          }
                        }}
                      >
                        复制
                      </button>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                  <span className="text-xs text-gray-500 block mb-1">收款姓名</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 block truncate flex-1">{matchedAccount.account_name}</span>
                    <button
                      className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 active:bg-gray-50 shrink-0"
                      onClick={async () => {
                        const success = await copyToClipboard(matchedAccount.account_name);
                        if (success) {
                          showToast('success', '复制成功', '姓名已复制到剪贴板');
                        } else {
                          showToast('error', '复制失败', '请长按手动复制');
                        }
                      }}
                    >
                      复制
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Warning Section - Collapsible */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl mb-4 border-2 border-red-400 shadow-lg shadow-red-200 overflow-hidden">
            <div className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-white shrink-0" strokeWidth={3} />
                <h3 className="text-white font-bold text-sm flex-1">重要提示</h3>
                <button
                  onClick={() => setShowWarningDetails(!showWarningDetails)}
                  className="text-white/80 text-xs px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                >
                  {showWarningDetails ? '收起' : '展开'}
                </button>
              </div>
              <p className="text-white text-xs leading-relaxed mb-2">
                <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded">切勿保存</span>
                收款人信息转账！请务必使用本人账户转账，<span className="font-bold underline decoration-yellow-300 decoration-2">转账时不要备注任何信息</span>。
              </p>
            </div>
            {showWarningDetails && (
              <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 p-3.5">
                <ul className="text-white text-xs space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 shrink-0 mt-0.5">●</span>
                    <span>每次充值都需要<span className="font-bold underline decoration-yellow-300 decoration-2">重新获取</span>收款信息</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 shrink-0 mt-0.5">●</span>
                    <span>收款账户为<span className="font-bold">动态分配</span>，使用旧信息将导致<span className="font-bold text-yellow-300">无法到账</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 shrink-0 mt-0.5">●</span>
                    <span>请勿备注、留言或保存收款人为常用联系人</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 shrink-0 mt-0.5">●</span>
                    <span>转账完成后请截图上传</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-900 mb-2 block flex items-center gap-2">
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
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all group bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-orange-100 transition-colors">
                  <Upload size={20} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <span className="text-xs font-medium text-gray-600 group-hover:text-orange-600">点击上传付款截图</span>
                <span className="text-[10px] text-gray-400 mt-0.5">支持 JPG/PNG/GIF，最大5MB</span>
              </label>
            ) : (
              <div className="relative group rounded-2xl overflow-hidden shadow-lg shadow-gray-200">
                <div className="absolute inset-0 bg-gray-900/5 -z-10"></div>
                <img
                  src={imagePreview}
                  alt="付款截图"
                  className="w-full h-auto max-h-[300px] object-contain bg-gray-900"
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
            onClick={() => {
              if (!uploadedImage) {
                showToast('warning', '请上传截图', '请先上传付款截图');
                return;
              }
              setShowConfirmModal(true);
            }}
            disabled={!uploadedImage || submitting}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2 mb-4 ${uploadedImage && !submitting
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-orange-200 active:scale-[0.98]'
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

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">确认提交</h3>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setLastFourDigits('');
                    }}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    请输入付款银行卡后四位号码
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={lastFourDigits}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setLastFourDigits(value);
                    }}
                    placeholder="请输入4位数字"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 outline-none text-center text-2xl font-mono tracking-widest"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    为确保资金安全，请输入您付款银行卡的后四位号码
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setLastFourDigits('');
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={lastFourDigits.length !== 4 || submitting}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${lastFourDigits.length === 4 && !submitting
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-orange-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {submitting ? '提交中...' : '确定'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  );

  // Handle navigation to detail
  const handleNavigateToDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setViewState('detail');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {viewState === 'input' && renderInputView()}
      {viewState === 'matching' && renderMatchingView()}
      {viewState === 'matched' && renderMatchedView()}
      {viewState === 'history' && (
        <RechargeOrderList
          onBack={() => setViewState('input')}
          onOrderSelect={handleNavigateToDetail}
        />
      )}
      {viewState === 'detail' && (
        <RechargeOrderDetail
          orderId={selectedOrderId}
          onBack={() => setViewState('history')}
        />
      )}

      {/* 支付跳转组件 - 替代 EmbeddedBrowser 以支持第三方支付 */}
      <PaymentRedirect
        isOpen={showPaymentBrowser}
        url={paymentUrl}
        title="支付收银台"
        amount={amount}
        orderNo={pendingOrderId || undefined}
        timeout={300}
        onClose={() => {
          setShowPaymentBrowser(false);
          setPaymentUrl('');
          // 返回时不显示确认弹窗，回到输入页面
          setViewState('input');
        }}
        onSuccess={async () => {
          // 只有点击支付成功才发送 API
          const remark = '用户确认支付成功';
          if (pendingOrderId) {
            try {
              const token = getStoredToken();
              await updateRechargeOrderRemark({
                order_id: pendingOrderId,
                user_remark: remark,
                token: token || undefined,
              });
            } catch (error) {
              errorLog('BalanceRecharge', 'Failed to update order remark', error);
            }
          }
          
          setShowPaymentBrowser(false);
          setPaymentUrl('');
          loadUserBalance();
          showToast('success', '支付状态已提交', '请等待系统确认');
          setViewState('history');
        }}
        onRefreshUrl={async () => {
          // 重新获取支付链接
          if (!selectedMethod || !matchedAccount) return null;
          
          try {
            const response = await submitRechargeOrder({
              company_account_id: matchedAccount.id,
              amount: Number(amount),
              payment_type: selectedMethod,
              payment_method: 'online',
            });
            
            if (isSuccess(response) && response.data?.pay_url) {
              setPendingOrderId(response.data.order_id || response.data.order_no || null);
              return response.data.pay_url;
            }
          } catch (error) {
            errorLog('BalanceRecharge', 'Failed to refresh payment URL', error);
          }
          return null;
        }}
      />

    </div>
  );
};

export default BalanceRecharge;
