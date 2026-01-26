/**
 * ServiceSheet - 安心保障弹窗内容
 * 
 * 展示服务保障详情，包括退换货政策、质量保证等
 * 参考京东商品详情页服务保障弹窗设计
 */
import React from 'react';
import { Shield, RotateCcw, Headphones, Truck, Check, Clock, Award } from 'lucide-react';

interface ServiceItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

interface ServiceSheetProps {
  /** 商品名称 */
  productName?: string;
}

const ServiceSheet: React.FC<ServiceSheetProps> = ({ productName }) => {
  const services: ServiceItem[] = [
    {
      icon: <Headphones size={20} className="text-purple-500" />,
      title: '专属客服',
      description: '7x24小时在线客服，随时为您解答疑问，处理售后问题',
      highlight: true,
    },
    {
      icon: <Truck size={20} className="text-orange-500" />,
      title: '极速发货',
      description: '付款后预计1-3天送达，部分地区支持当日达或次日达',
    },
    {
      icon: <Award size={20} className="text-red-500" />,
      title: '正品保证',
      description: '100%官方正品，支持验货，假一赔十',
      highlight: true,
    },
    {
      icon: <Clock size={20} className="text-cyan-500" />,
      title: '价格保护',
      description: '购买后7天内如降价，可申请价保补差',
    },
  ];

  return (
    <div className="pb-6">
      {/* 服务概览 */}
      <div className="px-4 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 text-sm text-purple-600">
            <Check size={16} className="text-purple-500" />
            专属客服
          </div>
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <Check size={16} className="text-red-500" />
            正品保障
          </div>
          <div className="flex items-center gap-1.5 text-sm text-orange-600">
            <Check size={16} className="text-orange-500" />
            极速发货
          </div>
        </div>
      </div>

      {/* 服务详情列表 */}
      <div className="divide-y divide-gray-100">
        {services.map((service, index) => (
          <div key={index} className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                {service.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">{service.title}</span>
                  {service.highlight && (
                    <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      已享
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部说明 */}
      <div className="px-4 pt-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">特别说明</h4>
          <ul className="text-xs text-gray-500 space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span>所有商品均为100%官方正品，支持验货</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span>7x24小时专属客服随时为您服务</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span>具体服务政策以商品详情页及订单页面为准</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ServiceSheet;
