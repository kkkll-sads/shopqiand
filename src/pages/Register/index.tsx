import React, { useState } from 'react';
import { Headset, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAppNavigate } from '../../lib/navigation';

export const RegisterPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPayPassword, setShowPayPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  return (
    <div className="flex-1 flex flex-col px-4 pt-12 pb-8 overflow-y-auto no-scrollbar relative z-10">
      {/* Top Buttons */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
        <button 
          className="p-2 -ml-2 text-text-main active:opacity-70"
          onClick={() => goBack()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button className="flex items-center bg-bg-card/60 backdrop-blur-md px-3 py-1.5 rounded-full text-sm text-text-main shadow-sm border border-border-light">
          <Headset size={14} className="mr-1" />
          客服
        </button>
      </div>

      {/* Header */}
      <div className="mt-16 mb-10">
        <h1 className="text-6xl font-bold text-text-main mb-2">Welcome!</h1>
        <p className="text-3xl text-text-sub">欢迎注册树交所</p>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-8">
        <Input placeholder="请输入邀请码" type="text" />
        <Input placeholder="请输入手机号" type="tel" />
        <Input
          placeholder="请设置登录密码"
          type={showLoginPassword ? 'text' : 'password'}
          rightIcon={
            <button onClick={() => setShowLoginPassword(!showLoginPassword)} className="focus:outline-none">
              {showLoginPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          }
        />
        <Input
          placeholder="请设置支付密码"
          type={showPayPassword ? 'text' : 'password'}
          rightIcon={
            <button onClick={() => setShowPayPassword(!showPayPassword)} className="focus:outline-none">
              {showPayPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          }
        />
        <div className="flex space-x-3">
          <Input placeholder="请输入验证码" type="number" className="flex-1" />
          <button className="h-[48px] px-4 rounded-2xl bg-bg-card text-primary-start text-lg font-medium shadow-soft whitespace-nowrap border border-border-light">
            获取验证码
          </button>
        </div>
      </div>

      {/* Register Button */}
      <Button 
        className="mb-4"
        onClick={() => goTo('home')}
      >
        注册
      </Button>

      {/* Agreement */}
      <div className="flex items-start justify-center mb-auto">
        <Checkbox checked={agree} onChange={() => setAgree(!agree)} className="mt-0.5" />
        <div className="ml-2 text-sm text-text-sub leading-tight">
          注册即代表你已同意 <a href="#" className="text-primary-start">用户协议</a> 和 <a href="#" className="text-primary-start">隐私政策</a>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-12 text-center">
        <button className="text-lg text-text-main font-medium" onClick={() => goTo('login')}>已有账户？点击登录</button>
      </div>
    </div>
  );
};
