import type { LucideIcon } from 'lucide-react'

export interface BalanceCardItem {
  icon: LucideIcon
  label: string
  value: string
  color: string
  bgColor: string
  description: string
}

export interface IncomeCardItem {
  icon: LucideIcon
  label: string
  value: string
  scoreValue: number
  color: string
  bgColor: string
}

export interface CollectionStatItem {
  label: string
  value: number
  unit: string
}

export interface FundExplanationItem {
  dotColorClass: string
  text: string
}
