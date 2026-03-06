import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, Edit, MapPin, Check } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

interface Address {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

const MOCK_ADDRESSES: Address[] = [
  {
    id: '1',
    name: '张三',
    phone: '138****1234',
    region: '广东省 深圳市 南山区',
    detail: '科技园南区高新南九道99号',
    isDefault: true,
  },
  {
    id: '2',
    name: '李四',
    phone: '139****5678',
    region: '北京市 朝阳区',
    detail: '建国路88号SOHO现代城',
    isDefault: false,
  },
];

export const AddressPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [view, setView] = useState<'list' | 'edit'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Address>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (view === 'list') {
      fetchData();
    }
  }, [view]);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    
    // Simulate network request
    setTimeout(() => {
      if (Math.random() < 0.1) {
        setError(true);
      } else {
        setAddresses(MOCK_ADDRESSES);
      }
      setLoading(false);
    }, 600);
  };

  const handleBack = () => {
    if (view === 'edit') {
      setView('list');
      setEditingAddress(null);
      setFormData({});
      setFormErrors({});
    } else {
      goBack();
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setFormData(addr);
    setView('edit');
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setFormData({ isDefault: false });
    setView('edit');
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = '请输入收货人姓名';
    if (!formData.phone?.trim()) {
      errors.phone = '请输入手机号码';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone.replace(/\*/g, '0'))) {
      // Simple validation, allowing asterisks for mock data
      errors.phone = '手机号码格式不正确';
    }
    if (!formData.region?.trim()) errors.region = '请选择所在地区';
    if (!formData.detail?.trim()) errors.detail = '请输入详细地址';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Simulate save
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setView('list');
        // In a real app, we would refresh the list here
        fetchData();
      }, 500);
    }
  };

  const renderHeader = (title: string) => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-text-main text-center w-1/3">{title}</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center shadow-sm animate-pulse">
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-16"></div>
              <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-24"></div>
            </div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3"></div>
          </div>
          <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 mx-4"></div>
          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <EmptyState message="暂无收货地址" />
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderList = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();

    return (
      <div className="flex-1 flex flex-col relative h-full">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24">
          {addresses.length === 0 ? renderEmpty() : (
            addresses.map((addr) => (
              <div key={addr.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center shadow-sm active:bg-gray-50 dark:bg-gray-800 transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center mb-2">
                    <span className="text-xl font-bold text-text-main mr-2 truncate max-w-[100px]">{addr.name}</span>
                    <span className="text-md text-text-sub font-medium">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-primary-start shrink-0">
                        默认
                      </span>
                    )}
                  </div>
                  <div className="text-base text-text-main leading-relaxed line-clamp-2">
                    {addr.region} {addr.detail}
                  </div>
                </div>
                <div className="w-px h-8 bg-border-light shrink-0"></div>
                <button 
                  onClick={() => handleEdit(addr)}
                  className="pl-4 py-2 text-text-sub active:text-text-main shrink-0"
                >
                  <Edit size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Fixed Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-border-light pb-safe">
          <button 
            onClick={handleAdd}
            className="w-full h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-lg font-medium shadow-sm active:opacity-80"
          >
            新增收货地址
          </button>
        </div>
      </div>
    );
  };

  const renderEdit = () => {
    const isFormValid = formData.name && formData.phone && formData.region && formData.detail;

    return (
      <div className="flex-1 flex flex-col relative h-full bg-bg-base">
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <div className="bg-white dark:bg-gray-900 mt-2 px-4">
            {/* Name */}
            <div className="flex items-center py-4 border-b border-border-light">
              <div className="w-20 text-lg text-text-main shrink-0">收货人</div>
              <div className="flex-1 flex flex-col">
                <input 
                  type="text" 
                  placeholder="名字" 
                  className="text-lg text-text-main placeholder:text-text-aux outline-none w-full bg-transparent"
                  value={formData.name || ''}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value});
                    if (formErrors.name) setFormErrors({...formErrors, name: ''});
                  }}
                />
              </div>
            </div>
            {formErrors.name && <div className="text-s text-primary-start pt-1 pb-2">{formErrors.name}</div>}

            {/* Phone */}
            <div className="flex items-center py-4 border-b border-border-light">
              <div className="w-20 text-lg text-text-main shrink-0">手机号码</div>
              <div className="flex-1 flex flex-col">
                <input 
                  type="tel" 
                  placeholder="手机号" 
                  className="text-lg text-text-main placeholder:text-text-aux outline-none w-full bg-transparent"
                  value={formData.phone || ''}
                  onChange={(e) => {
                    setFormData({...formData, phone: e.target.value});
                    if (formErrors.phone) setFormErrors({...formErrors, phone: ''});
                  }}
                />
              </div>
            </div>
            {formErrors.phone && <div className="text-s text-primary-start pt-1 pb-2">{formErrors.phone}</div>}

            {/* Region */}
            <div className="flex items-center py-4 border-b border-border-light">
              <div className="w-20 text-lg text-text-main shrink-0">所在地区</div>
              <div className="flex-1 flex flex-col">
                {/* Simulated Picker Input */}
                <input 
                  type="text" 
                  placeholder="省市区县、乡镇等" 
                  className="text-lg text-text-main placeholder:text-text-aux outline-none w-full bg-transparent"
                  value={formData.region || ''}
                  onChange={(e) => {
                    setFormData({...formData, region: e.target.value});
                    if (formErrors.region) setFormErrors({...formErrors, region: ''});
                  }}
                />
              </div>
            </div>
            {formErrors.region && <div className="text-s text-primary-start pt-1 pb-2">{formErrors.region}</div>}

            {/* Detail */}
            <div className="flex items-start py-4 border-b border-border-light">
              <div className="w-20 text-lg text-text-main shrink-0 pt-0.5">详细地址</div>
              <div className="flex-1 flex flex-col">
                <textarea 
                  placeholder="小区楼栋/乡村名称" 
                  className="text-lg text-text-main placeholder:text-text-aux outline-none w-full bg-transparent resize-none h-16"
                  value={formData.detail || ''}
                  onChange={(e) => {
                    setFormData({...formData, detail: e.target.value});
                    if (formErrors.detail) setFormErrors({...formErrors, detail: ''});
                  }}
                />
              </div>
            </div>
            {formErrors.detail && <div className="text-s text-primary-start pt-1 pb-2">{formErrors.detail}</div>}

            {/* Default Switch */}
            <div className="flex items-center justify-between py-4">
              <div className="text-lg text-text-main">设为默认收货地址</div>
              <button 
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.isDefault ? 'bg-primary-start' : 'bg-gray-200 dark:bg-gray-800'}`}
                onClick={() => setFormData({...formData, isDefault: !formData.isDefault})}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform ${formData.isDefault ? 'left-[26px]' : 'left-0.5'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Fixed Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-border-light pb-safe">
          <button 
            onClick={handleSave}
            disabled={!isFormValid || loading}
            className={`w-full h-11 rounded-full text-lg font-medium shadow-sm transition-all ${
              isFormValid && !loading
                ? 'bg-gradient-to-r from-primary-start to-primary-end text-white active:opacity-80' 
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      {/* Demo Controls */}
      {view === 'list' && (
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar bg-bg-card border-b border-border-light text-xs absolute top-12 left-0 right-0 z-50 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-text-aux flex items-center shrink-0">Demo:</span>
          <button onClick={() => setOffline(!offline)} className={`px-2 py-1 rounded border ${offline ? 'bg-primary-start text-white border-primary-start' : 'border-border-light'}`}>Offline</button>
          <button onClick={() => setError(!error)} className={`px-2 py-1 rounded border ${error ? 'bg-primary-start text-white border-primary-start' : 'border-border-light'}`}>Error</button>
          <button onClick={() => setAddresses([])} className={`px-2 py-1 rounded border ${addresses.length === 0 ? 'bg-primary-start text-white border-primary-start' : 'border-border-light'}`}>Empty</button>
          <button onClick={() => setAddresses(MOCK_ADDRESSES)} className="px-2 py-1 rounded border border-border-light">Reset</button>
        </div>
      )}

      {renderHeader(view === 'list' ? '地址管理' : (editingAddress ? '编辑收货地址' : '新增收货地址'))}
      
      {view === 'list' ? renderList() : renderEdit()}
    </div>
  );
};
