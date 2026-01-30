import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, Bars3Icon, LinkIcon, BookOpenIcon, RocketLaunchIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onCloseMobile: () => void;
  currentSession: number;
  onSelectSession: (session: number) => void;
  isDesktopOpen: boolean;
  onToggleDesktop: () => void;
  view: 'archive' | 'journal' | 'project' | 'member';
  onSetView: (view: 'archive' | 'journal' | 'project' | 'member') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  categories, 
  selectedCategory, 
  onSelectCategory,
  onCloseMobile,
  currentSession,
  onSelectSession,
  isDesktopOpen,
  onToggleDesktop,
  view,
  onSetView
}) => {
  const [isSessionListOpen, setIsSessionListOpen] = useState(true);

  const handleSetView = (newView: 'archive' | 'journal' | 'project' | 'member') => {
    onSetView(newView);
    onCloseMobile();
  };

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
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 
          ${isDesktopOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
        `}
      >
        <div className="p-6 h-full overflow-y-auto custom-scrollbar relative">
          
          {/* Header with Close Button for Desktop */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Creative Vibe
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Coding Lab 정보공유</p>
            </div>
            {/* Desktop Toggle Button inside Sidebar */}
            <button 
              onClick={onToggleDesktop}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hidden lg:block"
              title="메뉴 닫기"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
            
          {/* Session Accordion */}
          <div className="mt-6">
            <button 
              onClick={() => setIsSessionListOpen(!isSessionListOpen)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span>세션 목록</span>
              {isSessionListOpen ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
            
            <div 
              className={`space-y-1 pl-2 border-l-2 border-gray-100 dark:border-gray-700 ml-1 transition-all duration-300 overflow-hidden ${
                isSessionListOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {[5, 4, 3, 2, 1].map((num) => (
                <button
                  key={num}
                  onClick={() => onSelectSession(num)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                    currentSession === num 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium translate-x-1' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:translate-x-1'
                  }`}
                >
                  <span>Session {num}</span>
                  {num === 5 && <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 px-1.5 py-0.5 rounded">현재</span>}
                </button>
              ))}
            </div>
          </div>

          {/* View Switcher */}
          <div className="mt-8 space-y-1">
            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">메뉴</h3>
            <button 
              onClick={() => handleSetView('member')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center ${
                view === 'member'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <UserCircleIcon className="w-5 h-5 mr-3" />
              <span>멤버 소개</span>
            </button>
            <button 
              onClick={() => handleSetView('archive')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center ${
                view === 'archive'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <LinkIcon className="w-5 h-5 mr-3" />
              <span>링크 아카이브</span>
            </button>
            <button 
              onClick={() => handleSetView('journal')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center ${
                view === 'journal'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <BookOpenIcon className="w-5 h-5 mr-3" />
              <span>모임일지</span>
            </button>
            <button 
              onClick={() => handleSetView('project')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center ${
                view === 'project'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <RocketLaunchIcon className="w-5 h-5 mr-3" />
              <span>개인 프로젝트</span>
            </button>
          </div>

          {/* Conditional Category List */}
          {view === 'archive' && (
            <nav className="space-y-2 mt-8">
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

              <div className="pt-6 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  카테고리
                </p>
              </div>

              {categories.slice(1).map((cat) => ( // 'All' is handled above, so we slice it
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
          )}
          
          <div className="mt-auto pt-12 pb-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                AI 엔진: Google Gemini 2.0 Flash
                </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;