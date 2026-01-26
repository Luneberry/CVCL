import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bars3Icon, 
  SunIcon, 
  MoonIcon,
  CloudArrowUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Sidebar from './components/Sidebar';
import LinkCard from './components/LinkCard';
import PostDetail from './components/PostDetail';
import { parseChatFile } from './services/chatParser';
import { processMessagesWithGemini } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { LinkItem, Comment } from './types';
import initialData from './data/generated.json';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Initialize with generated data safely
  const [items, setItems] = useState<LinkItem[]>(() => {
    // Handle potential ESM default export wrapping or direct array
    const data = (initialData as any).default || initialData;
    return Array.isArray(data) ? data : [];
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LinkItem | null>(null);

  // Load comments from Supabase on mount
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      if (data) {
        const commentsByLinkId: Record<string, Comment[]> = {};
        
        data.forEach((row: any) => {
          const c: Comment = {
            id: row.id,
            author: row.author,
            content: row.content,
            timestamp: new Date(row.created_at),
            imageUrl: row.image_url || undefined
          };
          if (!commentsByLinkId[row.link_id]) {
            commentsByLinkId[row.link_id] = [];
          }
          commentsByLinkId[row.link_id].push(c);
        });

        setItems(prev => prev.map(item => ({
          ...item,
          comments: commentsByLinkId[item.id] || []
        })));
      }
    };

    fetchComments();
  }, []);

  // Toggle Dark Mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // File Upload Handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };


  const processFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      // 1. Parse raw text
      const parsedMessages = parseChatFile(text);
      
      // 2. Process with AI
      try {
        const processedItems = await processMessagesWithGemini(parsedMessages);
        setItems(processedItems);
      } catch (error) {
        console.error("Failed to process with AI", error);
        alert("AI 처리에 실패했습니다. API 키를 확인하거나 다시 시도해주세요.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Comment Handler
  const addComment = async (itemId: string, newComment: Omit<Comment, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          link_id: itemId,
          author: newComment.author,
          content: newComment.content,
          image_url: newComment.imageUrl
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      alert('코멘트 저장에 실패했습니다.');
      return;
    }

    if (data) {
      const addedComment: Comment = {
        id: data.id,
        author: data.author,
        content: data.content,
        timestamp: new Date(data.created_at),
        imageUrl: data.image_url || undefined
      };

      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            comments: [
              ...item.comments,
              addedComment
            ]
          };
        }
        return item;
      }));
    }
  };

  // Update selected item if it changes (e.g. comments added while modal open)
  const activeItem = useMemo(() => {
    return items.find(i => i.id === selectedItem?.id) || null;
  }, [items, selectedItem]);

  // Derived State
  const categories = useMemo(() => {
    const uniqueCats = new Set(items.map(i => i.category));
    return Array.from(uniqueCats);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter(i => i.category === selectedCategory);
  }, [items, selectedCategory]);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full relative">
          
          {/* Header */}
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-10 sticky top-0">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden text-gray-600 dark:text-gray-300"
                >
                  <Bars3Icon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
                  Creative Vibe Coding Lab <span className="text-blue-600">Archive</span>
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="새 파일 분석">
                  <ArrowPathIcon className="w-6 h-6" />
                  <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                </label>

                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </header>

          {/* Scrollable Feed */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth" onDragEnter={handleDrag}>
            
            {items.length === 0 && !isProcessing && (
              <div 
                className={`
                  max-w-xl mx-auto mt-20 p-10 border-2 border-dashed rounded-3xl text-center transition-all
                  ${dragActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CloudArrowUpIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">채팅 로그 업로드</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  카카오톡 내보내기 .txt 파일을 여기에 드래그하거나 클릭하여 선택하세요.
                  <br/>Gemini AI가 유용한 링크를 분석하고 요약해줍니다.
                </p>
                <label className="inline-flex">
                  <span className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-blue-500/30">
                    파일 선택
                  </span>
                  <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                 <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
                   대화 내용을 분석하고 링크를 정리하는 중입니다...
                 </p>
              </div>
            )}

            {items.length > 0 && !isProcessing && (
              <>
                 <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {selectedCategory === 'All' ? '최근 공유' : `${selectedCategory}`}
                    </h2>
                    <span className="text-sm text-gray-500 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">
                      {filteredItems.length} 개
                    </span>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                  {filteredItems.map((item) => (
                    <LinkCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </>
            )}
          </main>

          {/* Detail Modal */}
          {activeItem && (
            <PostDetail 
              item={activeItem}
              onClose={() => setSelectedItem(null)}
              onAddComment={addComment}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default App;
