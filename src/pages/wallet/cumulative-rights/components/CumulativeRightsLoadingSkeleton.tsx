import React from 'react'

const CumulativeRightsLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="skeleton h-40 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="skeleton w-10 h-10 rounded-full mb-2" />
            <div className="skeleton h-3 w-16 rounded mb-1" />
            <div className="skeleton h-6 w-24 rounded mb-1" />
            <div className="skeleton h-2 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default CumulativeRightsLoadingSkeleton
