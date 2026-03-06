import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Search, Copy, QrCode, UserPlus, 
  Users, ShieldCheck, ShieldAlert, ChevronRight, 
  WifiOff, RefreshCcw, User, Info, XCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const FriendsPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showRulesModal, setShowRulesModal] = useState(false);

  const MOCK_FRIENDS = [
    { id: '1', uid: '88492019', nickname: '张三', phone: '138****1234', avatar: 'https://picsum.photos/seed/f1/100/100', regTime: '2026-02-28 10:20', activeTime: '刚刚', status: 'verified' },
    { id: '2', uid: '88492020', nickname: '李四', phone: '139****5678', avatar: '', regTime: '2026-02-27 14:30', activeTime: '1小时前', status: 'unverified' },
    { id: '3', uid: '88492021', nickname: '王五', phone: '137****9012', avatar: 'https://picsum.photos/seed/f3/100/100', regTime: '2026-02-20 09:15', activeTime: '3天前', status: 'frozen' },
    { id: '4', uid: '88492022', nickname: '赵六', phone: '136****3456', avatar: 'https://picsum.photos/seed/f4/100/100', regTime: '2026-02-15 16:45', activeTime: '1周前', status: 'verified' },
    { id: '5', uid: '88492023', nickname: '钱七', phone: '135****7890', avatar: 'https://picsum.photos/seed/f5/100/100', regTime: '2026-02-10 11:20', activeTime: '2周前', status: 'verified' },
  ];

  const FILTERS = [
    { id: 'all', label: '全部' },
    { id: 'verified', label: '已实名' },
    { id: 'unverified', label: '未实名' },
    { id: 'active', label: '活跃' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleGoBack = () => {
    goBack();
  };

  const handleCopy = (text: string) => {
    alert(`已复制: ${text}`);
  };

  const filteredFriends = MOCK_FRIENDS.filter(friend => {
    const matchesSearch = 
      friend.nickname.includes(searchQuery) || 
      friend.phone.includes(searchQuery) || 
      friend.uid.includes(searchQuery);
    
    if (!matchesSearch) return false;

    if (activeFilter === 'verified') return friend.status === 'verified';
    if (activeFilter === 'unverified') return friend.status === 'unverified';
    if (activeFilter === 'active') return friend.activeTime.includes('刚刚') || friend.activeTime.includes('小时');
    
    return true;
  });

  const renderHeader = () => (
    <div className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 h-12">
        <button onClick={handleGoBack} className="p-1 -ml-1 active:opacity-70 text-text-main">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-medium text-text-main">我的好友</h1>
        <button 
          className="bg-gradient-to-r from-primary-start to-primary-end text-white text-sm font-medium px-3 py-1.5 rounded-full shadow-sm active:opacity-80 flex items-center"
          onClick={() => alert('邀请好友')}
        >
          <UserPlus size={14} className="mr-1" /> 邀请
        </button>
      </div>
    </div>
  );

  if (moduleError) {
    return (
      <div className="flex-1 flex flex-col bg-bg-base h-full">
        {renderHeader()}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <RefreshCcw size={48} className="text-text-aux mb-4" />
          <p className="text-lg text-text-main mb-2">页面加载失败</p>
          <p className="text-base text-text-sub mb-6 text-center">请检查网络连接后重试</p>
          <button 
            onClick={() => {
              setLoading(true);
              setModuleError(false);
              setTimeout(() => setLoading(false), 1000);
            }}
            className="px-6 py-2 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-full text-md font-medium shadow-sm active:opacity-80"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-red-50/30 relative h-full">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm z-50 absolute top-12 left-0 right-0">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}

      {renderHeader()}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 py-4">
          
          {/* Stats Overview */}
          <Card className="p-4 mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-start/5 to-transparent rounded-bl-full pointer-events-none"></div>
            {loading ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="w-16 h-10" />
                  <Skeleton className="w-16 h-10" />
                  <Skeleton className="w-16 h-10" />
                </div>
                <Skeleton className="w-full h-14 rounded-xl" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-text-sub mb-1">好友总数</span>
                    <span className="text-4xl font-bold text-text-main">128</span>
                  </div>
                  <div className="w-px h-8 bg-border-light"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-text-sub mb-1">今日新增</span>
                    <span className="text-4xl font-bold text-primary-start">+3</span>
                  </div>
                  <div className="w-px h-8 bg-border-light"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-text-sub mb-1">有效好友</span>
                    <span className="text-4xl font-bold text-text-main">86</span>
                  </div>
                </div>
                <div className="bg-bg-base/80 rounded-xl p-3 flex items-center justify-between border border-border-light/50">
                  <div>
                    <div className="text-s text-text-sub mb-0.5">我的专属邀请码</div>
                    <div className="text-xl font-bold text-text-main tracking-wider">A8B2C9</div>
                  </div>
                  <div className="flex items-center">
                    <button 
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow-sm mr-2 text-text-main active:opacity-70 border border-border-light/50"
                      onClick={() => alert('展示二维码')}
                    >
                      <QrCode size={14} />
                    </button>
                    <button 
                      className="flex items-center justify-center px-3 h-8 rounded-full bg-white dark:bg-gray-900 shadow-sm text-sm font-medium text-text-main active:opacity-70 border border-border-light/50"
                      onClick={() => handleCopy('A8B2C9')}
                    >
                      <Copy size={12} className="mr-1" /> 复制
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Search & Filter */}
          <div className="mb-4">
            <div className="flex items-center bg-white dark:bg-gray-900 rounded-full px-3 py-2 mb-3 shadow-sm border border-border-light">
              <Search size={16} className="text-text-aux mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="搜索手机号/昵称/UID" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-md outline-none text-text-main placeholder:text-text-aux min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-text-aux active:text-text-sub shrink-0">
                  <XCircle size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
              {FILTERS.map(f => (
                <button 
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-base mr-2 transition-colors shrink-0 ${
                    activeFilter === f.id 
                      ? 'bg-red-50 text-primary-start font-medium border border-primary-start/30' 
                      : 'bg-white dark:bg-gray-900 text-text-sub border border-border-light shadow-sm'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Friend List */}
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map(i => (
                <Card key={i} className="p-3 flex items-center">
                  <Skeleton className="w-12 h-12 rounded-full mr-3 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-48 h-3" />
                    <Skeleton className="w-full h-3" />
                  </div>
                </Card>
              ))
            ) : filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users size={48} className="text-text-aux mb-4 opacity-30" strokeWidth={1.5} />
                <p className="text-md text-text-main mb-2">暂无符合条件的好友</p>
                <p className="text-sm text-text-sub mb-6">快去邀请更多好友加入吧</p>
                <button 
                  className="px-6 py-2 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-full text-md font-medium shadow-sm active:opacity-80"
                  onClick={() => alert('邀请好友')}
                >
                  立即邀请好友
                </button>
              </div>
            ) : (
              filteredFriends.map(friend => (
                <Card key={friend.id} className="p-3 flex items-center active:bg-bg-base transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-bg-base mr-3 overflow-hidden shrink-0 flex items-center justify-center border border-border-light relative">
                    {friend.avatar ? (
                      <>
                        <img 
                          src={friend.avatar} 
                          alt="avatar" 
                          className="w-full h-full object-cover absolute inset-0 z-10" 
                          referrerPolicy="no-referrer"
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none'; 
                          }} 
                        />
                        <User size={20} className="text-text-aux absolute z-0" />
                      </>
                    ) : (
                      <User size={20} className="text-text-aux" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <span className="text-lg font-medium text-text-main truncate mr-2 max-w-[120px]">{friend.nickname}</span>
                      {friend.status === 'verified' && (
                        <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded flex items-center shrink-0">
                          <ShieldCheck size={10} className="mr-0.5"/> 已实名
                        </span>
                      )}
                      {friend.status === 'unverified' && (
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded flex items-center shrink-0">
                          未实名
                        </span>
                      )}
                      {friend.status === 'frozen' && (
                        <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded flex items-center shrink-0">
                          <ShieldAlert size={10} className="mr-0.5"/> 已冻结
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-sub mb-1.5 flex items-center">
                      <span className="font-mono">{friend.phone}</span>
                      <span className="mx-1.5 text-border-light">|</span>
                      <span>UID: {friend.uid}</span>
                    </div>
                    <div className="text-s text-text-aux flex items-center justify-between">
                      <span>注册: {friend.regTime}</span>
                      <span>活跃: {friend.activeTime}</span>
                    </div>
                  </div>
                  <div className="ml-2 text-text-aux shrink-0">
                    <ChevronRight size={16} />
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Bottom Hint */}
          {!loading && filteredFriends.length > 0 && (
            <div className="mt-6 mb-4 flex justify-center">
              <button 
                className="text-sm text-text-aux flex items-center active:text-text-main transition-colors"
                onClick={() => setShowRulesModal(true)}
              >
                好友规则与有效口径说明 <Info size={12} className="ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRulesModal(false)}></div>
          <Card className="w-full max-w-[320px] relative z-10 p-6 flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-main">好友规则说明</h3>
              <button onClick={() => setShowRulesModal(false)} className="text-text-aux active:text-text-main">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4 text-base text-text-sub max-h-[60vh] overflow-y-auto no-scrollbar">
              <div>
                <h4 className="font-medium text-text-main mb-1">1. 有效好友定义</h4>
                <p>有效好友指通过您的专属邀请码/链接注册，且完成实名认证并有至少一次活跃行为（如登录、浏览）的用户。</p>
              </div>
              <div>
                <h4 className="font-medium text-text-main mb-1">2. 邀请奖励</h4>
                <p>每成功邀请一名有效好友，您将获得相应的积分或现金奖励，具体奖励以当前活动为准。</p>
              </div>
              <div>
                <h4 className="font-medium text-text-main mb-1">3. 状态说明</h4>
                <p>• <span className="text-green-600">已实名</span>：已完成身份认证，可正常参与平台活动。</p>
                <p>• <span className="text-gray-600 dark:text-gray-400">未实名</span>：仅注册未认证，部分功能受限。</p>
                <p>• <span className="text-red-600">已冻结</span>：账号存在违规行为已被冻结，不计入有效好友。</p>
              </div>
            </div>
            <button 
              className="w-full mt-6 py-2.5 bg-bg-base text-text-main rounded-full text-md font-medium active:bg-border-light transition-colors"
              onClick={() => setShowRulesModal(false)}
            >
              我知道了
            </button>
          </Card>
        </div>
      )}
    </div>
  );
};
