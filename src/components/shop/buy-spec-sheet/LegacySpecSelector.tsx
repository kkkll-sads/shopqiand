import React from 'react';
import type { ProductSpec } from './types';

interface LegacySpecSelectorProps {
  specs: ProductSpec[];
  selectedSpecs: Record<string, string>;
  onSelectSpec: (specName: string, value: string) => void;
}

const LegacySpecSelector: React.FC<LegacySpecSelectorProps> = ({
  specs,
  selectedSpecs,
  onSelectSpec,
}) => {
  return (
    <div className="px-4 py-3 border-t border-gray-100 max-h-[200px] overflow-y-auto">
      {specs.map((spec) => (
        <div key={spec.id} className="mb-4 last:mb-0">
          <div className="text-sm text-gray-700 mb-2">{spec.name}</div>
          <div className="flex flex-wrap gap-2">
            {spec.values.map((value) => (
              <button
                key={value}
                onClick={() => onSelectSpec(spec.name, value)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                  selectedSpecs[spec.name] === value
                    ? 'border-red-500 bg-red-50 text-red-500'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LegacySpecSelector;
