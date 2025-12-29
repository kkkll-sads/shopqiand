import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Trash2, Edit2, ChevronRight, Plus } from 'lucide-react';
import SubPageLayout from '../../components/SubPageLayout';
import { LoadingSpinner, EmptyState, BankPicker } from '../../components/common';
import {
  AUTH_TOKEN_KEY,
  PaymentAccountItem,
  fetchPaymentAccountList,
  addPaymentAccount,
  deletePaymentAccount,
  editPaymentAccount,
  setDefaultPaymentAccount,
} from '../../services/api';
// ✅ 引入统一 API 处理工具
import { isSuccess, extractData, extractError } from '../../utils/apiHelpers';

interface CardManagementProps {
  onBack: () => void;
}

type PaymentAccountFormValues = {
  type: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_branch: string;
  screenshot: File | null;
  /** 是否设置为默认账户，仅在编辑模式下生效 */
  is_default: boolean;
};

const createInitialFormValues = (): PaymentAccountFormValues => ({
  type: 'bank_card',
  bank_name: '',
  account_name: '',
  account_number: '',
  bank_branch: '',
  screenshot: null,
  is_default: false,
});

const CardManagement: React.FC<CardManagementProps> = ({ onBack }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccountItem[]>([]);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingWasDefault, setEditingWasDefault] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<PaymentAccountFormValues>(() => createInitialFormValues());
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);

  const loadAccounts = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    if (!token) {
      setError('未检测到登录信息，请重新登录后重试');
      setAccounts([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 为避免网络问题导致长时间无响应，这里增加超时保护
      const timeoutMs = 10000;
      const res = await Promise.race([
        fetchPaymentAccountList(token),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('加载超时，请稍后重试')),
            timeoutMs,
          ),
        ),
      ]);

      // ✅ 使用统一判断
      const data = extractData(res);
      if (data) {
        setAccounts(data.list || []);
      } else {
        setError(extractError(res, '获取卡号列表失败'));
      }
    } catch (e: any) {
      // 优先使用接口返回的错误消息
      setError(e?.msg || e?.response?.msg || e?.message || '获取卡号列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const renderItem = (item: PaymentAccountItem) => {
    const rawId = item.id ?? '';
    const id = rawId === null || rawId === undefined ? '' : String(rawId);
    const typeText = item.type_text || item.type || '卡号';
    const account = item.account || '';
    const bankName = item.bank_name || '';
    const branch = item.bank_branch || '';
    const holder = item.account_name || '';
    const isDefault = Number(item.is_default) === 1;

    return (
      <div
        key={id || `${typeText}-${account}`}
        className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
            <CreditCard size={18} strokeWidth={1.7} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {typeText}
              </span>
              {isDefault && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                  默认
                </span>
              )}
            </div>
            {account && (
              <span className="text-xs text-gray-700 mt-0.5 break-all">
                {account}
              </span>
            )}
            {(bankName || branch || holder) && (
              <span className="text-[11px] text-gray-400 mt-0.5">
                {[bankName, branch, holder].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="p-1.5 rounded-full text-gray-400 hover:text-orange-500 hover:bg-orange-50 active:opacity-80"
            onClick={() => {
              if (!id) {
                setNotice('该账户缺少 ID，无法编辑');
                return;
              }
              setEditingId(id);
              setEditingWasDefault(isDefault);
              setFormValues({
                type: item.type || 'bank_card',
                bank_name: bankName,
                account_name: holder,
                account_number: account,
                bank_branch: branch,
                screenshot: null,
                is_default: isDefault,
              });
              setFormError(null);
              setNotice(null);
              setMode('edit');
            }}
          >
            <Edit2 size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 active:opacity-80"
            onClick={async () => {
              if (!id) {
                setNotice('该账户缺少 ID，无法删除');
                return;
              }
              if (!window.confirm('确定要删除该账户吗？')) {
                return;
              }
              try {
                const res = await deletePaymentAccount({ id });
                // ✅ 使用统一判断
                if (isSuccess(res)) {
                  setNotice(extractError(res, '删除成功'));
                  await loadAccounts();
                } else {
                  setNotice(extractError(res, '删除失败，请稍后重试'));
                }
              } catch (e: any) {
                // 优先使用接口返回的错误消息
                const errorMsg = e?.msg || e?.response?.msg || e?.message || '删除失败，请稍后重试';
                setNotice(errorMsg);
              }
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  const handleFormInputChange = (
    field: keyof PaymentAccountFormValues,
    value: string | File | null | boolean,
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormValues(createInitialFormValues());
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    const { type, bank_name, account_name, account_number, bank_branch, screenshot, is_default } = formValues;

    if (!type) return setFormError('请选择账户类型');
    if (!account_name.trim()) return setFormError('请输入账户名称');
    if (!account_number.trim()) return setFormError('请输入账号/卡号');
    if (type === 'bank_card' && !bank_name.trim()) return setFormError('请选择或输入银行名称');
    if (type === 'usdt' && !bank_branch.trim()) return setFormError('请输入 USDT 网络类型');

    setFormLoading(true);
    try {
      if (mode === 'edit') {
        if (!editingId) {
          setFormError('缺少要编辑的账户 ID');
          setFormLoading(false);
          return;
        }

        const res = await editPaymentAccount({
          id: editingId,
          bank_name: bank_name.trim(),
          account_name: account_name.trim(),
          account_number: account_number.trim(),
          bank_branch: bank_branch.trim(),
          screenshot: screenshot ?? undefined,
        });

        // ✅ 使用统一判断
        if (isSuccess(res)) {
          // 如有勾选"设为默认账户"，并且之前不是默认，则额外调用设置默认接口
          if (is_default && !editingWasDefault) {
            await setDefaultPaymentAccount({ id: editingId });
          }
          setNotice('账户信息已更新');
          resetForm();
          setMode('list');
          setEditingId(null);
          setEditingWasDefault(false);
          await loadAccounts();
        } else {
          setFormError(extractError(res, '保存失败，请检查填写信息'));
        }
      } else {
        const res = await addPaymentAccount({
          type,
          // 目前前端不再区分账户性质，默认按个人账户提交
          account_type: 'personal',
          bank_name: bank_name.trim(),
          account_name: account_name.trim(),
          account_number: account_number.trim(),
          bank_branch: bank_branch.trim(),
          screenshot: screenshot ?? undefined,
        });

        // ✅ 使用统一判断
        if (isSuccess(res)) {
          setNotice(extractError(res, '新增账户成功'));
          resetForm();
          setMode('list');
          await loadAccounts();
        } else {
          // 显示后端返回的业务错误信息
          setFormError(extractError(res, '新增账户失败，请检查填写信息'));
        }
      }
    } catch (e: any) {
      // 优先使用接口返回的错误消息
      setFormError(e?.msg || e?.response?.msg || e?.message || '提交失败，请稍后重试');
    } finally {
      setFormLoading(false);
    }
  };

  const renderRequirements = () => {
    if (formValues.type === 'usdt') {
      return 'USDT 网络类型（如 TRC20、ERC20）';
    }
    return '开户行 / 支行（选填）';
  };

  const renderForm = () => (
    <form className="bg-white mt-2 px-4" onSubmit={handleSubmit}>
      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-2">账户类型 <span className="text-red-500">*</span></span>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'bank_card', label: '银行卡' },
            { value: 'alipay', label: '支付宝' },
            // { value: 'wechat', label: '微信' },
            // { value: 'usdt', label: 'USDT' }, // 暂时隐藏 USDT
          ].map((opt) => {
            const active = formValues.type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${active
                  ? 'bg-orange-50 text-orange-600 border-orange-200 border'
                  : 'bg-gray-50 text-gray-600 border border-transparent'
                  }`}
                onClick={() => handleFormInputChange('type', opt.value)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {formValues.type === 'bank_card' && (
        <div
          className="py-4 border-b border-gray-100 flex flex-col gap-1 cursor-pointer"
          onClick={() => setShowBankPicker(true)}
        >
          <span className="block text-sm text-gray-500 mb-1">银行名称 <span className="text-red-500">*</span></span>
          <div className="flex items-center justify-between">
            <span className={`text-base font-medium ${formValues.bank_name ? 'text-gray-900' : 'text-gray-300'}`}>
              {formValues.bank_name || '点击选择银行'}
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>
      )}

      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-1">账户名称 / 持卡人 <span className="text-red-500">*</span></span>
        <input
          className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
          type="text"
          placeholder="请输入账户名或持卡人姓名"
          value={formValues.account_name}
          onChange={(e) => handleFormInputChange('account_name', e.target.value)}
        />
      </div>

      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-1">账号 / 卡号 / 收款账号 <span className="text-red-500">*</span></span>
        <input
          className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
          type="text"
          placeholder="请输入账号/卡号"
          value={formValues.account_number}
          onChange={(e) => handleFormInputChange('account_number', e.target.value)}
        />
      </div>

      {(formValues.type === 'bank_card' || formValues.type === 'usdt') && (
        <div className="py-4 border-b border-gray-100">
          <span className="block text-sm text-gray-500 mb-1">{renderRequirements()}</span>
          <input
            className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
            type="text"
            placeholder={formValues.type === 'usdt' ? 'TRC20 / ERC20 等' : '如：招商银行上海徐家汇支行'}
            value={formValues.bank_branch}
            onChange={(e) => handleFormInputChange('bank_branch', e.target.value)}
          />
        </div>
      )}

      {formValues.type === 'wechat' && (
        <div className="py-4 border-b border-gray-100">
          <span className="block text-sm text-gray-500 mb-1">收款二维码（选填）</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFormInputChange('screenshot', e.target.files?.[0] || null)}
            className="text-xs text-gray-500 mt-1"
          />
          {formValues.screenshot && (
            <span className="block text-[11px] text-gray-400 mt-1">{formValues.screenshot.name}</span>
          )}
        </div>
      )}

      {mode === 'edit' && (
        <label className="flex items-center justify-between py-4">
          <span className="text-base text-gray-800">设为默认账户</span>
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formValues.is_default}
              onChange={(e) => handleFormInputChange('is_default', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </div>
        </label>
      )}

      {formError && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-md mt-2 mb-2">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={formLoading}
        className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white text-base font-bold py-3.5 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed mt-8 mb-8"
      >
        {formLoading ? '提交中...' : '提交保存'}
      </button>
    </form>
  );

  return (
    <SubPageLayout
      title={mode === 'add' ? '新增账户' : mode === 'edit' ? '编辑账户' : '银行卡'}
      onBack={() => {
        if (mode === 'add' || mode === 'edit') {
          resetForm();
          setMode('list');
          setEditingId(null);
          setEditingWasDefault(false);
        } else {
          onBack();
        }
      }}
    >
      {notice && mode === 'list' && (
        <div className="bg-green-50 text-green-600 text-xs px-3 py-2 m-4 rounded-lg">
          {notice}
        </div>
      )}

      {/* Bank Picker Configured outside the form for z-index reasons */}
      <BankPicker
        visible={showBankPicker}
        onClose={() => setShowBankPicker(false)}
        onConfirm={(bank) => {
          handleFormInputChange('bank_name', bank);
          setShowBankPicker(false);
        }}
        initialBank={formValues.bank_name}
      />

      {(mode === 'add' || mode === 'edit') && renderForm()}

      {mode === 'list' && (
        <div className="p-4 space-y-3 pb-24">
          {loading && <LoadingSpinner text="加载中..." />}

          {!loading && error && (
            <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {!loading && !error && accounts.length === 0 && (
            <div className="mt-12 flex flex-col items-center text-gray-400 text-sm">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <CreditCard size={26} className="text-gray-300" />
              </div>
              <div>没有任何账户</div>
            </div>
          )}

          {!loading && !error && accounts.length > 0 && accounts.map(renderItem)}
        </div>
      )}

      {/* Bottom Add Button */}
      {mode === 'list' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe max-w-md mx-auto">
          <button
            type="button"
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-orange-200"
            onClick={() => {
              setMode('add');
              setNotice(null);
            }}
          >
            <Plus size={20} />
            新增账户
          </button>
        </div>
      )}
    </SubPageLayout>
  );
};

export default CardManagement;


