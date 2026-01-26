import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  categories, 
  selectedCategory, 
  onSelectCategory,
  onCloseMobile
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none lg:border-r border-gray-200 dark:border-gray-700
        `}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Creative Vibe
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Coding Lab 정보공유</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                onSelectCategory('All');
                onCloseMobile();
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'All' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              전체 보기
            </button>

            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                카테고리
              </p>
            </div>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onSelectCategory(cat);
                  onCloseMobile();
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === cat
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{cat}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-12 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              Powered by Google Gemini 2.0 Flash
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
