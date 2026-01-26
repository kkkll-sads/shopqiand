import React from 'react';

interface GridItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
}

interface GridShowcaseProps {
  items: GridItem[];
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

const GridShowcase: React.FC<GridShowcaseProps> = ({ items, aspectRatio = 'square' }) => {
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'portrait': return 'aspect-[3/4]';
      case 'landscape': return 'aspect-video';
      case 'square': default: return 'aspect-square';
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-center bg-white rounded-xl p-2 shadow-sm">
            <div className={`w-full ${getAspectRatioClass()} rounded-lg overflow-hidden mb-3 bg-gray-100`}>
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
            </div>
            <span className="text-sm text-gray-800 font-medium text-center px-1 truncate w-full">
              {item.title}
            </span>
            {item.subtitle && (
              <span className="text-xs text-gray-500 mt-1">{item.subtitle}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GridShowcase;
