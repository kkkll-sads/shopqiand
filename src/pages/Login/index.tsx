import React, { useState } from 'react';
import { Headset, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAppNavigate } from '../../lib/navigation';

export const LoginPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [tab, setTab] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
        <h1 className="text-6xl font-bold text-text-main mb-2">Hello!</h1>
        <p className="text-3xl text-text-sub">欢迎登录树交所</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 mb-6">
        <button
          className={`text-3xl font-medium pb-1 relative ${tab === 'password' ? 'text-text-main' : 'text-text-aux'}`}
          onClick={() => setTab('password')}
        >
          密码登录
          {tab === 'password' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary-start rounded-full"></div>}
        </button>
        <button
          className={`text-3xl font-medium pb-1 relative ${tab === 'code' ? 'text-text-main' : 'text-text-aux'}`}
          onClick={() => setTab('code')}
        >
          验证码登录
          {tab === 'code' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary-start rounded-full"></div>}
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-4">
        <Input placeholder="请输入手机号" type="tel" />
        {tab === 'password' ? (
          <Input
            placeholder="请输入密码"
            type={showPassword ? 'text' : 'password'}
            rightIcon={
              <button onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            }
          />
        ) : (
          <div className="flex space-x-3">
            <Input placeholder="请输入验证码" type="number" className="flex-1" />
            <button className="h-[48px] px-4 rounded-2xl bg-bg-card text-primary-start text-lg font-medium shadow-soft whitespace-nowrap border border-border-light">
              获取验证码
            </button>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex justify-between items-center mb-8">
        <Checkbox checked={remember} onChange={() => setRemember(!remember)} label="记住密码" />
        <button className="text-sm text-text-sub">忘记密码</button>
      </div>

      {/* Login Button */}
      <Button 
        className="mb-4"
        onClick={() => goTo('home')}
      >
        登录
      </Button>

      {/* Agreement */}
      <div className="flex items-start justify-center mb-auto">
        <Checkbox checked={agree} onChange={() => setAgree(!agree)} className="mt-0.5" />
        <div className="ml-2 text-sm text-text-sub leading-tight">
          登录即代表你已同意 <a href="#" className="text-primary-start">用户协议</a> 和 <a href="#" className="text-primary-start">隐私政策</a>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-12 text-center">
        <button className="text-lg text-text-main font-medium" onClick={() => goTo('register')}>没有账户？点击注册</button>
      </div>
    </div>
  );
};
