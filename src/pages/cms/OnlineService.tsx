/**
 * OnlineService - 在线客服页面
 * 使用统一的 ChatWidget 组件
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, MessageCircle, Clock, ChevronRight } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import { openChatWidget } from '../../../components/common';

/**
 * OnlineService 在线客服页面组件
 */
const OnlineService: React.FC = () => {
  const navigate = useNavigate();

  // 进入页面时自动打开客服窗口
  useEffect(() => {
    // 延迟一下确保 widget 已加载
    const timer = setTimeout(() => {
      openChatWidget();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageContainer title="在线客服" onBack={() => navigate(-1)} padding={false}>
      <div className="flex flex-col min-h-[calc(100vh-56px)] bg-gray-50">
        {/* 头部装饰 */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Headphones size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">在线客服</h2>
                <p className="text-red-100 text-sm">7×24小时为您服务</p>
              </div>
            </div>
          </div>
        </div>

        {/* 服务入口 */}
        <div className="p-4 -mt-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 在线咨询入口 */}
            <button
              onClick={openChatWidget}
              className="w-full p-4 flex items-center gap-4 active:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <MessageCircle size={24} className="text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-gray-900">在线咨询</div>
                <div className="text-xs text-gray-500 mt-0.5">即时响应，快速解答</div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            {/* 服务时间 */}
            <div className="p-4 flex items-center gap-4 bg-gray-50/50">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">服务时间</div>
                <div className="text-xs text-gray-500 mt-0.5">每日 09:00 - 21:00</div>
              </div>
            </div>
          </div>

          {/* 常见问题快捷入口 */}
          <div className="mt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">常见问题</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '如何充值', icon: '💰' },
                { label: '如何提现', icon: '💳' },
                { label: '如何寄售', icon: '📦' },
                { label: '订单问题', icon: '📋' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={openChatWidget}
                  className="bg-white rounded-xl p-4 text-left active:scale-[0.98] transition-transform shadow-sm"
                >
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 温馨提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-blue-700 text-sm leading-relaxed">
              💡 <strong>温馨提示：</strong>点击右下角的客服图标即可随时与客服沟通，无需停留在此页面。
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default OnlineService;
