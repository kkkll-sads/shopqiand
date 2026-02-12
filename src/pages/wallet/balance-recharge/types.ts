export type BalanceRechargeViewState = 'input' | 'matching' | 'matched' | 'history' | 'detail';

export interface BalanceRechargeProps {
  initialAmount?: string;
}
