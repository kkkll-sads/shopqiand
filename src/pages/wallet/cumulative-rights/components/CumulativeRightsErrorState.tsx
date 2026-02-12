import React from 'react'
import { FileText } from 'lucide-react'

interface CumulativeRightsErrorStateProps {
  message: string
  onRetry?: () => void
}

const CumulativeRightsErrorState: React.FC<CumulativeRightsErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-red-400">
      <div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center">
        <FileText size={32} className="opacity-50" />
      </div>
      <span className="text-xs">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg bg-white active:scale-[0.98] transition-transform"
        >
          重试
        </button>
      )}
    </div>
  )
}

export default CumulativeRightsErrorState
