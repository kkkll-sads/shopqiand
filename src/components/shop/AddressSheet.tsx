/**
 * AddressSheet - 地址选择弹窗内容
 * 
 * 展示配送信息、当前位置、收货地址列表
 * 参考京东商品详情页地址选择弹窗设计
 */
import React, { useState } from 'react';
import { MapPin, Clock, Truck, Package, Home, ChevronRight, Plus, Check } from 'lucide-react';

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
  /** 地址列表 */
  addresses?: Address[];
  /** 选择地址回调 */
  onSelectAddress?: (address: Address) => void;
  /** 新增地址回调 */
  onAddAddress?: () => void;
}

// 模拟地址数据
const mockAddresses: Address[] = [
  {
    id: '1',
    name: '张三',
    phone: '13333333333',
    province: '北京',
    city: '北京',
    district: '东城区',
    detail: '北京天安门大街1号',
    isDefault: true,
  },
  {
    id: '2',
    name: '李四',
    phone: '13333333333',
    province: '北京',
    city: '北京',
    district: '东城区',
    detail: '北京天安门大街2号',
    isDefault: false,
  },
  {
    id: '3',
    name: '王五',
    phone: '13692503887',
    province: '北京',
    city: '北京',
    district: '东城区',
    detail: '北京天安门大街3号',
    isDefault: false,
  },
];

const AddressSheet: React.FC<AddressSheetProps> = ({
  selectedAddressId,
  addresses = mockAddresses,
  onSelectAddress,
  onAddAddress,
}) => {
  const [selected, setSelected] = useState(selectedAddressId || addresses[0]?.id);

  const handleSelect = (address: Address) => {
    setSelected(address.id);
    onSelectAddress?.(address);
  };

  // 获取明天日期
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getMonth() + 1}月${tomorrow.getDate()}日`;

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
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">当前使用位置</div>
            <div className="text-sm font-medium text-gray-800">
              上佳脆香大锅狗(化州市商业园店)
            </div>
          </div>
          <button className="text-blue-500 text-xs flex items-center gap-1">
            <MapPin size={12} />
            重新定位
          </button>
        </div>
      </div>

      {/* 地址列表 */}
      <div className="divide-y divide-gray-100">
        {addresses.map(address => (
          <div
            key={address.id}
            className="px-4 py-4 active:bg-gray-50"
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
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={address.isDefault}
                      readOnly
                      className="w-3.5 h-3.5 rounded border-gray-300"
                    />
                    设为购物默认
                  </label>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <button>删除</button>
                    <span>|</span>
                    <button>复制</button>
                    <span>|</span>
                    <button>修改</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
