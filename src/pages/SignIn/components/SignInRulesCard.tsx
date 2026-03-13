import React from 'react';
import { Info } from 'lucide-react';
import type { SignInRuleItem } from '../../../api';

interface SignInRulesCardProps {
  rules?: SignInRuleItem[];
}

const BADGE_COLORS: Record<string, string> = {
  daily_reward: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  register_reward: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-300',
  invite_reward: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
};

const SignInRulesCard: React.FC<SignInRulesCardProps> = ({ rules }) => {
  const list = rules ?? [];

  return (
    <div className="rounded-xl border border-border-light bg-bg-card p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-2 font-bold text-text-main">
        <Info className="text-blue-500" size={20} />
        <span>活动规则</span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg bg-bg-base px-4 py-6 text-center text-sm text-text-sub">
          暂无活动规则
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((rule, idx) => (
            <div
              key={`${rule.key}-${idx}`}
              className="flex items-start gap-3 rounded-lg bg-bg-base p-3"
            >
              <div className="flex w-24 shrink-0 justify-center">
                <span
                  className={`block w-full rounded-md px-2 py-0.5 text-center text-xs font-medium ${
                    BADGE_COLORS[rule.key] || 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                  }`}
                >
                  {rule.title}
                </span>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-text-sub">
                {rule.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignInRulesCard;
