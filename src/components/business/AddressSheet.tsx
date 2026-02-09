/**
 * AddressSheet - 地址选择弹窗内容
 * 
 * 展示配送信息、当前位置、收货地址列表
 * 参考京东商品详情页地址选择弹窗设计
 */
import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, Package, Home, ChevronRight, Plus, Check, Loader2 } from 'lucide-react';
import { fetchAddressList, AddressItem } from '@/services';
import { getStoredToken } from '@/services/client';
import { isSuccess } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

interface AddressSheetProps {
  /** 当前选中的地址ID */
  selectedAddressId?: string;
  /** 地址列表（外部传入，优先使用） */
  addresses?: Address[];
  /** 选择地址回调 */
  onSelectAddress?: (address: Address) => void;
  /** 新增地址回调 */
  onAddAddress?: () => void;
}

// 转换API地址数据为组件格式
const adaptAddress = (item: AddressItem): Address => ({
  id: String(item.id),
  name: item.name,
  phone: item.phone,
  province: item.province,
  city: item.city,
  district: item.area || item.district || '',
  detail: item.detail || item.address || '',
  isDefault: item.is_default === 1,
});

const AddressSheet: React.FC<AddressSheetProps> = ({
  selectedAddressId,
  addresses: externalAddresses,
  onSelectAddress,
  onAddAddress,
}) => {
  const [addresses, setAddresses] = useState<Address[]>(externalAddresses || []);
  const [selected, setSelected] = useState(selectedAddressId || '');
  const [loading, setLoading] = useState(!externalAddresses);

  // 加载地址列表
  useEffect(() => {
    if (externalAddresses) {
      setAddresses(externalAddresses);
      if (!selected && externalAddresses.length > 0) {
        const defaultAddr = externalAddresses.find(a => a.isDefault) || externalAddresses[0];
        setSelected(defaultAddr.id);
      }
      return;
    }

    const loadAddresses = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetchAddressList(token);
        if (isSuccess(response) && response.data) {
          const list = Array.isArray(response.data) ? response.data : response.data.list || [];
          const adaptedList = list.map(adaptAddress);
          setAddresses(adaptedList);
          
          // 设置默认选中
          if (adaptedList.length > 0) {
            const defaultAddr = adaptedList.find(a => a.isDefault) || adaptedList[0];
            setSelected(defaultAddr.id);
          }
        }
      } catch (error) {
        errorLog('AddressSheet', '加载地址列表失败', error);
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [externalAddresses, selected]);

  const handleSelect = (address: Address) => {
    setSelected(address.id);
    onSelectAddress?.(address);
  };

  // 获取明天日期
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getMonth() + 1}月${tomorrow.getDate()}日`;

  // 获取当前选中的地址
  const currentAddress = addresses.find(a => a.id === selected) || addresses[0];

  return (
    <div className="pb-6">
      {/* 配送信息 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-800 mb-2">
          现货，23:10前付款，预计明天({tomorrowStr})送达
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-500 text-xs font-medium">树交所物流</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={12} />
            211限时达
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Truck size={12} />
            预约送货
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Package size={12} />
            部分收货
          </span>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Home size={12} />
            送货上门
          </span>
          <span>本地仓</span>
          <span>自提</span>
        </div>
      </div>

      {/* 当前使用位置 */}
      {currentAddress && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">当前使用位置</div>
              <div className="text-sm font-medium text-gray-800">
                {currentAddress.city} {currentAddress.district} {currentAddress.detail}
              </div>
            </div>
            <button className="text-blue-500 text-xs flex items-center gap-1">
              <MapPin size={12} />
              重新定位
            </button>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="py-12 flex items-center justify-center text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          加载中...
        </div>
      )}

      {/* 空状态 */}
      {!loading && addresses.length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
          <div>暂无收货地址</div>
        </div>
      )}

      {/* 地址列表 */}
      {!loading && addresses.length > 0 && (
        <div className="divide-y divide-gray-100">
          {addresses.map(address => (
            <div
              key={address.id}
              className="px-4 py-4 active:bg-gray-50 cursor-pointer"
              onClick={() => handleSelect(address)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{address.name}</span>
                    <span className="text-gray-600">{address.phone}</span>
                    {selected === address.id && (
                      <Check size={16} className="text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    {address.province} {address.city} {address.district} {address.detail}
                  </div>
                  {address.isDefault && (
                    <span className="inline-block mt-1 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                      默认地址
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增地址按钮 */}
      <div className="px-4 pt-4">
        <button
          onClick={onAddAddress}
          className="w-full py-3 border-2 border-red-500 text-red-500 rounded-full text-sm font-medium flex items-center justify-center gap-1"
        >
          <Plus size={16} />
          新增收货地址
        </button>
      </div>
    </div>
  );
};

export default AddressSheet;
