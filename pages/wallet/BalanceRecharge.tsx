
import React, { useEffect, useState } from 'react';
import { ChevronLeft, Zap, Radar, CheckCircle, Shield, AlertTriangle, X, Wallet, CreditCard, Banknote, Upload, Image as ImageIcon } from 'lucide-react';

import { LoadingSpinner } from '../../components/common';
import { fetchCompanyAccountList, CompanyAccountItem, submitRechargeOrder } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

interface BalanceRechargeProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  initialAmount?: string;
}

// Payment Methods Configuration
const PAYMENT_METHODS = [
  { id: 'alipay', name: '支付宝', icon: 'http://oss.spyggw.cc/zhifub.png', color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
  { id: 'wechat', name: '微信支付', icon: 'http://oss.spyggw.cc/weix.png', color: 'bg-green-50 text-green-600', border: 'border-green-100' },
  { id: 'bank_card', name: '银联转账', icon: 'http://oss.spyggw.cc/%E9%93%B6%E8%81%94.png', color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
  { id: 'cloud_flash', name: '云闪付', icon: 'http://oss.spyggw.cc/unnamed.png', color: 'bg-red-50 text-red-600', border: 'border-red-100' },
];

const BalanceRecharge: React.FC<BalanceRechargeProps> = ({ onBack, onNavigate, initialAmount }) => {

  // Common State
  const [amount, setAmount] = useState<string>(initialAmount || '');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const { showToast } = useNotification();

  // Matching State
  const [isMatching, setIsMatching] = useState(false);
  const [matchStep, setMatchStep] = useState(0); // 0: Idle, 1: Scanning, 2: Found
  const [matchedAccount, setMatchedAccount] = useState<CompanyAccountItem | null>(null);

  // Data State
  const [allAccounts, setAllAccounts] = useState<CompanyAccountItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetchCompanyAccountList({ usage: 'recharge' });
      if (res.code === 1) {
        setAllAccounts(res.data.list || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Image Upload State
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startMatching = () => {
    if (!amount || Number(amount) <= 0) {
      showToast('warning', '输入有误', '请输入申购金额');
      return;
    }
    if (!selectedMethod) {
      showToast('warning', '请选择', '请选择支付方式');
      return;
    }

    setIsMatching(true);
    setMatchStep(1); // Start Scanning

    // Simulate Radar Scan Duration
    setTimeout(() => {
      // Perform Weighted Matching
      // Filter accounts by selected method type
      const relevantAccounts = allAccounts.filter(acc => acc.type === selectedMethod);

      let selected = null;
      if (relevantAccounts.length > 0) {
        // Mock Weight Logic: In real app, check 'weight' property. Here default to first.
        // Assuming backend returns sorted by weight, or we pick based on hidden 'weight' prop.
        // Let's pretend specific logic: if multiple, pick random for visual demo, or first.
        selected = relevantAccounts[0];
      } else {
        // Fallback for demo if no specific account type found (or showing 'bank_card' for all)
        selected = allAccounts[0];
      }

      setMatchedAccount(selected);
      setMatchStep(2); // Match Found
    }, 2500); // 2.5s scan time
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

      if (response.code === 1) {
        showToast('success', '提交成功', `订单号: ${response.data?.order_no || response.data?.order_id || '已生成'}`);

        // Reset form
        setAmount('');
        setSelectedMethod(null);
        setUploadedImage(null);
        setImagePreview(null);
        handleClose();
      } else {
        showToast('error', '提交失败', response.msg || '请重试');
      }
    } catch (error: any) {
      console.error('Submit recharge order error:', error);
      showToast('error', '提交失败', error.message || '网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsMatching(false);
    setMatchStep(0);
    setMatchedAccount(null);
    setUploadedImage(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-safe">
      {/* 1. Header */}
      <div className="bg-gradient-to-b from-orange-100 to-gray-50 p-5 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">专项金申购通道</h1>
        </div>

        {/* 金额输入卡片 - 仅保留中文提示，移除英文以简化视觉 */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-orange-100/50 mb-6 border border-orange-50">
          <div className="text-sm font-bold text-gray-400 mb-4 tracking-wide">申购金额</div>
          <div className="flex items-baseline gap-2 border-b-2 border-orange-50 pb-2 focus-within:border-orange-500 transition-colors">
            <span className="text-3xl font-bold text-gray-900">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-4xl font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-200"
            />
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
            {[100, 500, 1000, 5000].map(val => (
              <button
                key={val}
                onClick={() => setAmount(String(val))}
                className="px-4 py-1.5 rounded-full bg-gray-50 text-xs font-bold text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors whitespace-nowrap"
              >
                ¥{val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Payment Method Selection */}
      <div className="px-5 flex-1">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
          选择支付通道
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_METHODS.map(method => (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-3
                ${selectedMethod === method.id
                  ? 'bg-orange-50 border-orange-500 shadow-md ring-1 ring-orange-500'
                  : 'bg-white border-gray-100 hover:border-orange-200'}`}
            >
              {selectedMethod === method.id && (
                <div className="absolute top-2 right-2 text-orange-500">
                  <CheckCircle size={16} fill="currentColor" className="text-white" />
                </div>
              )}
              <div className="w-12 h-12 flex items-center justify-center p-1">
                {/* Icon or Image */}
                <img src={method.icon} alt={method.name} className="w-full h-full object-contain" />
              </div>
              <span className={`text-sm font-bold ${selectedMethod === method.id ? 'text-orange-700' : 'text-gray-600'}`}>
                {method.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bottom Action */}
      <div className="p-5 safe-area-bottom bg-white/80 backdrop-blur border-t border-gray-100">
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

      {/* 4. Radar Scanning Modal */}
      {isMatching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          {matchStep === 1 && (
            <div className="text-center flex flex-col items-center">
              {/* Radar Animation */}
              <div className="relative w-48 h-48 mb-8">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-0 border-2 border-orange-500/30 rounded-full"></div>
                <div className="absolute inset-4 border border-orange-500/50 rounded-full"></div>
                {/* Scanning Line */}
                <div className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-gradient-to-r from-transparent to-orange-400 origin-left animate-[spin_2s_linear_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radar size={48} className="text-orange-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">正在接入区域结算服务商...</h3>
              <p className="text-sm text-gray-400">智能匹配最优资金通道 (权重优先)</p>
            </div>
          )}

          {matchStep === 2 && matchedAccount && (
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden animate-in zoom-in duration-300">
              {/* Success Header */}
              <div className="bg-[#FF6B35] p-6 text-white text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg text-[#FF6B35]">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold">通道接入成功</h3>
                  <p className="text-sm text-white/80">已为您分配专属服务专员</p>
                </div>
              </div>

              {/* Account Details */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase">Service Specialist</span>
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded">已缴保证金</span>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200/50">
                    <div className="w-10 h-10 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-bold">
                      李
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">李*强</div>
                      <div className="text-xs text-gray-500">金牌承兑服务商 (UID: 8829)</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">收款账号</span>
                      <span className="text-sm font-bold text-gray-900 font-mono select-all decoration-dashed underline">{matchedAccount.account_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">开户银行</span>
                      <span className="text-sm font-bold text-gray-900">{matchedAccount.bank_name || '支付平台'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">收款姓名</span>
                      <span className="text-sm font-bold text-gray-900">{matchedAccount.account_name}</span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-red-50 p-3 rounded-xl flex items-start gap-2 mb-4">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 leading-tight">
                    您正在委托授权服务商办理专项金划拨业务，请务必使用本人账户转账，<span className="font-bold underline">备注您的UID</span>，否则将无法自动到账。
                  </p>
                </div>

                {/* Image Upload Section */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    上传付款截图
                  </label>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="payment-screenshot"
                  />

                  {/* Upload button or preview */}
                  {!imagePreview ? (
                    <label
                      htmlFor="payment-screenshot"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-colors"
                    >
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">点击上传付款截图</span>
                      <span className="text-xs text-gray-400 mt-1">支持 JPG/PNG/GIF，最大5MB</span>
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="付款截图"
                        className="w-full h-64 object-contain bg-gray-900 rounded-xl"
                      />
                      <button
                        onClick={() => {
                          setUploadedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <label
                        htmlFor="payment-screenshot"
                        className="absolute bottom-2 right-2 px-3 py-1 bg-white/90 backdrop-blur text-xs font-medium text-gray-700 rounded-full cursor-pointer hover:bg-white transition-colors border border-gray-200"
                      >
                        重新上传
                      </label>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={!uploadedImage || submitting}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${uploadedImage && !submitting
                    ? 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {submitting ? '提交中...' : '提交充值订单'}
                </button>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm mt-2 hover:bg-gray-200 transition-colors"
                >
                  稍后处理
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BalanceRecharge;
