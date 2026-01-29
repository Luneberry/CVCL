import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Bars3Icon, 
  SunIcon, 
  MoonIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Sidebar from './components/Sidebar';
import LinkCard from './components/LinkCard';
import PostDetail from './components/PostDetail';
import JournalView from './components/JournalView';
import JournalEditor from './components/JournalEditor';
import { parseChatFile } from './services/chatParser';
import { processMessagesWithGemini } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { LinkItem, Comment, Journal } from './types';

const App: React.FC = () => {
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [view, setView] = useState<'archive' | 'journal'>('archive');
  
  // Data State
  const [currentSession, setCurrentSession] = useState<number>(5);
  const [items, setItems] = useState<LinkItem[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  
  // Archive View State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [selectedItem, setSelectedItem] = useState<LinkItem | null>(null);

  // Journal View State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [journalToEdit, setJournalToEdit] = useState<Journal | null>(null);
  
  // Loading/Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isJournalLoading, setIsJournalLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // --- Data Loading Effects ---
  
  // Load Archive (LinkItem) Data
  useEffect(() => {
    const loadSessionData = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/data/session-${currentSession}.json`);
        if (!response.ok) throw new Error('Data not found');
        const data = await response.json();
        const safeData = (data as any).default || data;
        setItems(Array.isArray(safeData) ? safeData : []);
      } catch (e) {
        console.error("Failed to load session data", e);
        setItems([]);
      } finally {
        setIsProcessing(false);
      }
    };
    if (view === 'archive') {
      loadSessionData();
    }
  }, [currentSession, view]);

  // Load Journals Data
  const fetchJournals = useCallback(async () => {
    setIsJournalLoading(true);
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('session_id', currentSession)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching journals:', error);
      alert('모임일지를 불러오는 데 실패했습니다.');
    } else {
      setJournals(data || []);
    }
    setIsJournalLoading(false);
  }, [currentSession]);

  useEffect(() => {
    if (view === 'journal') {
      fetchJournals();
    }
  }, [view, fetchJournals]);

  // Load comments from Supabase for LinkItems
  useEffect(() => {
    if (view !== 'archive' || items.length === 0) return;
    const fetchComments = async () => {
      const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }
      if (data) {
        const commentsByLinkId: Record<string, Comment[]> = {};
        data.forEach((row: any) => {
          const c: Comment = { id: row.id, author: row.author, content: row.content, timestamp: new Date(row.created_at), imageUrl: row.image_url || undefined };
          if (!commentsByLinkId[row.link_id]) commentsByLinkId[row.link_id] = [];
          commentsByLinkId[row.link_id].push(c);
        });
        setItems(prev => prev.map(item => ({ ...item, comments: commentsByLinkId[item.id] || [] })));
      }
    };
    fetchComments();
  }, [items.length, view]);

  // --- Handlers ---

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    const text = await file.text();
    try {
      const parsedMessages = parseChatFile(text);
      const processedItems = await processMessagesWithGemini(parsedMessages);
      setItems(processedItems);
      setView('archive');
    } catch (error) {
      console.error("Failed to process with AI", error);
      alert("AI 처리에 실패했습니다. API 키를 확인하거나 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const addComment = async (itemId: string, newComment: Omit<Comment, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase.from('comments').insert([{ link_id: itemId, ...newComment }]).select().single();
    if (error) {
      console.error('Error adding comment:', error);
      alert('코멘트 저장에 실패했습니다.');
      return;
    }
    if (data) {
      const addedComment: Comment = { id: data.id, author: data.author, content: data.content, timestamp: new Date(data.created_at), imageUrl: data.image_url || undefined };
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, comments: [...item.comments, addedComment] } : item));
    }
  };
  
  // --- Journal Handlers ---

  const handleAddJournal = () => {
    setJournalToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEditJournal = (journal: Journal) => {
    setJournalToEdit(journal);
    setIsEditorOpen(true);
  };

  const handleDeleteJournal = async (id: number) => {
    if (window.confirm('정말로 이 일지를 삭제하시겠습니까?')) {
      const { error } = await supabase.from('journals').delete().eq('id', id);
      if (error) {
        alert('삭제에 실패했습니다.');
      } else {
        setJournals(prev => prev.filter(j => j.id !== id));
      }
    }
  };

  const handleSaveJournal = async (journalData: Omit<Journal, 'id' | 'created_at'>) => {
    if (journalToEdit) { // Update
      const { error } = await supabase.from('journals').update({ title: journalData.title, content: journalData.content }).eq('id', journalToEdit.id);
      if (error) alert('수정에 실패했습니다.');
    } else { // Create
      const { error } = await supabase.from('journals').insert([journalData]);
      if (error) alert('저장에 실패했습니다.');
    }
    fetchJournals(); // Refetch list
  };

  // --- Derived State & Memos ---
  
  const activeItem = useMemo(() => items.find(i => i.id === selectedItem?.id) || null, [items, selectedItem]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(i => i.category))).sort((a, b) => a.localeCompare(b))], [items]);

  const filteredItems = useMemo(() => {
    const categoryFiltered = selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);
    const sortableItems = [...categoryFiltered];
    sortableItems.sort((a, b) => {
      switch (sortOrder) {
        case 'date_asc': return a.timestamp - b.timestamp;
        case 'title_asc': return (a.title || '').localeCompare(b.title || '');
        case 'date_desc': default: return b.timestamp - a.timestamp;
      }
    });
    return sortableItems;
  }, [items, selectedCategory, sortOrder]);
  
  // --- Render ---

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen overflow-hidden">
        
        <Sidebar 
          isOpen={isSidebarOpen}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onCloseMobile={() => setIsSidebarOpen(false)}
          currentSession={currentSession}
          onSelectSession={setCurrentSession}
          isDesktopOpen={isDesktopSidebarOpen}
          onToggleDesktop={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          view={view}
          onSetView={setView}
        />

        <div className={`flex-1 flex flex-col overflow-hidden w-full relative transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? 'lg:ml-64' : ''}`}>
          
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-10 sticky top-0">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden text-gray-600 dark:text-gray-300">
                  <Bars3Icon className="w-6 h-6" />
                </button>
                <button onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hidden lg:block text-gray-600 dark:text-gray-300 ${isDesktopSidebarOpen ? 'opacity-0 pointer-events-none w-0 p-0 overflow-hidden' : ''}`}>
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
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                  {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto" onDragEnter={handleDrag}>
            
            {view === 'archive' && (
              <div className="p-4 md:p-8">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 mt-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
                      대화 내용을 분석하고 링크를 정리하는 중입니다...
                    </p>
                  </div>
                ) : items.length > 0 ? (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {selectedCategory === 'All' ? '최근 공유' : `${selectedCategory}`}
                      </h2>
                      <div className="relative">
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="appearance-none cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 pl-4 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                          <option value="date_desc">최신순</option>
                          <option value="date_asc">오래된순</option>
                          <option value="title_asc">가나다순</option>
                        </select>
                        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                      {filteredItems.map((item) => <LinkCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
                    </div>
                  </>
                ) : (
                  // File upload view
                  <div className={`max-w-xl mx-auto mt-20 p-10 border-2 border-dashed rounded-3xl text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><CloudArrowUpIcon className="w-10 h-10" /></div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">채팅 로그 업로드</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">카카오톡 내보내기 .txt 파일을 여기에 드래그하거나 클릭하여 선택하세요.<br/>Gemini AI가 유용한 링크를 분석하고 요약해줍니다.</p>
                    <label className="inline-flex"><span className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-blue-500/30">파일 선택</span><input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} /></label>
                  </div>
                )}
              </div>
            )}

            {view === 'journal' && (
              <JournalView 
                journals={journals}
                onAdd={handleAddJournal}
                onEdit={handleEditJournal}
                onDelete={handleDeleteJournal}
                isLoading={isJournalLoading}
              />
            )}

          </main>

          {activeItem && <PostDetail item={activeItem} onClose={() => setSelectedItem(null)} onAddComment={addComment} />}
          <JournalEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveJournal} journalToEdit={journalToEdit} sessionId={currentSession} />
        </div>
      </div>
    </div>
  );
};

export default App;
