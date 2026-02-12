import React from 'react';
import { Search } from 'lucide-react';

interface HomeHeaderSearchProps {
  onSearch: () => void;
}

const HomeHeaderSearch: React.FC<HomeHeaderSearchProps> = ({ onSearch }) => (
  <header className="px-4 py-3 fixed top-0 left-0 right-0 z-20 max-w-md mx-auto">
    <div
      className="flex items-center bg-white/90 backdrop-blur-md rounded-full p-1.5 pl-4 shadow-lg shadow-red-500/10 cursor-pointer active:scale-[0.98] transition-all border border-white/50"
      onClick={onSearch}
    >
      <Search size={18} className="text-red-400 mr-2 flex-shrink-0" />
      <span className="text-sm text-gray-400 flex-1 truncate">搜索数据资产、藏品...</span>
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold px-5 py-2 rounded-full flex-shrink-0 ml-2 shadow-md shadow-red-500/30">
        搜索
      </div>
    </div>
  </header>
);

export default HomeHeaderSearch;
