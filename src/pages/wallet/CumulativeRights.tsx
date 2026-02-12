/**
 * CumulativeRights - 累计权益页面
 * 已迁移: 使用 React Router 导航
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import PageContainer from '@/layouts/PageContainer'
import {
  CumulativeRightsBalanceSection,
  CumulativeRightsCollectionSection,
  CumulativeRightsErrorState,
  CumulativeRightsFundExplanation,
  CumulativeRightsIncomeSection,
  CumulativeRightsLoadingSkeleton,
  CumulativeRightsOrderFundButton,
  CumulativeRightsOverviewCard,
} from './cumulative-rights/components'
import {
  createBalanceData,
  createCollectionStats,
  createIncomeData,
  FUND_EXPLANATIONS,
} from './cumulative-rights/helpers'
import { useCumulativeRightsOverview } from './cumulative-rights/hooks/useCumulativeRightsOverview'

const CumulativeRights: React.FC = () => {
  const navigate = useNavigate()
  const { loading, error, data, retry } = useCumulativeRightsOverview()

  const balance = data?.balance || null
  const income = data?.income || null
  const collection = data?.collection || null

  const balanceData = createBalanceData(balance)
  const incomeData = createIncomeData(income)
  const collectionStats = createCollectionStats(collection)

  return (
    <PageContainer title="权益总览" onBack={() => navigate(-1)}>
      {loading && <CumulativeRightsLoadingSkeleton />}

      {!loading && error && <CumulativeRightsErrorState message={error} onRetry={retry} />}

      {!loading && !error && (
        <>
          <CumulativeRightsOverviewCard />
          <CumulativeRightsBalanceSection items={balanceData} />
          <CumulativeRightsIncomeSection income={income} items={incomeData} />
          <CumulativeRightsCollectionSection collection={collection} stats={collectionStats} />
          <CumulativeRightsOrderFundButton onClick={() => navigate('/order-fund-detail')} />
          <CumulativeRightsFundExplanation items={FUND_EXPLANATIONS} />
        </>
      )}
    </PageContainer>
  )
}

export default CumulativeRights
