import React from 'react';
import { Info } from 'lucide-react';
import type { SignInRuleItem } from '../../../api';

interface SignInRulesCardProps {
  rules?: SignInRuleItem[];
}

const FALLBACK_RULES: SignInRuleItem[] = [
  {
    key: 'daily_reward',
    title: '每日签到奖励',
    description: '每日首次签到可获得 0.20 - 0.50 元随机金额奖励',
  },
  {
    key: 'register_reward',
    title: '注册奖励',
    description: '新用户注册/激活可获得 2.88 元奖励',
  },
  {
    key: 'invite_reward',
    title: '邀请好友奖励',
    description: '邀请好友注册可获得 1.5 元 - 2.0 元 / 人',
  },
  {
    key: 'withdraw_rules',
    title: '提现规则',
    description: '账户余额满 10.00 元可申请提现，每人每天限提 1 次，24 小时内审核到账。',
  },
];

const BADGE_COLORS: Record<string, string> = {
  daily_reward: 'bg-red-100 text-red-600',
  register_reward: 'bg-green-100 text-green-600',
  invite_reward: 'bg-purple-100 text-purple-600',
};

const SignInRulesCard: React.FC<SignInRulesCardProps> = ({ rules }) => {
  const list = rules?.length ? rules : FALLBACK_RULES;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-gray-800 mb-4">
        <Info className="text-blue-500" size={20} />
        <span>活动规则</span>
      </div>
      <div className="space-y-3">
        {list.map((rule, idx) => (
          <div
            key={`${rule.key}-${idx}`}
            className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
          >
            <div className="w-24 shrink-0 flex justify-center">
              <span
                className={`text-xs px-2 py-0.5 rounded-md w-full text-center font-medium block ${
                  BADGE_COLORS[rule.key] || 'bg-blue-100 text-blue-600'
                }`}
              >
                {rule.title}
              </span>
            </div>
            <p className="text-sm text-gray-600 flex-1 leading-relaxed">
              {rule.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignInRulesCard;
