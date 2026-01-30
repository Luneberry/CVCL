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
import ProjectView from './components/ProjectView';
import ProjectEditor from './components/ProjectEditor';
import MemberView from './components/MemberView';
import MemberEditor from './components/MemberEditor';
import { parseChatFile } from './services/chatParser';
import { processMessagesWithGemini } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { LinkItem, Comment, Journal, Project, Member } from './types';

console.log("URL 체크:", import.meta.env.VITE_SUPABASE_URL);

const App: React.FC = () => {
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [view, setView] = useState<'archive' | 'journal' | 'project' | 'member'>('archive');
  
  // Data State
  const [currentSession, setCurrentSession] = useState<number>(5);
  const [items, setItems] = useState<LinkItem[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Archive View State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [selectedItem, setSelectedItem] = useState<LinkItem | null>(null);

  // Journal View State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [journalToEdit, setJournalToEdit] = useState<Journal | null>(null);

  // Project View State
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Member View State
  const [isMemberEditorOpen, setIsMemberEditorOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  
  // Loading/Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isJournalLoading, setIsJournalLoading] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [isMemberLoading, setIsMemberLoading] = useState(false);
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
      alert(`모임일지를 불러오는 데 실패했습니다: ${error.message}`);
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

  // Load Projects Data
  const fetchProjects = useCallback(async () => {
    setIsProjectLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      // alert(`프로젝트를 불러오는 데 실패했습니다: ${error.message}`); // Optional: Suppress if table doesn't exist yet
    } else {
      setProjects(data || []);
    }
    setIsProjectLoading(false);
  }, []);

  useEffect(() => {
    if (view === 'project') {
      fetchProjects();
    }
  }, [view, fetchProjects]);

  // Load Members Data
  const fetchMembers = useCallback(async () => {
    setIsMemberLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      setMembers(data || []);
    }
    setIsMemberLoading(false);
  }, []);

  useEffect(() => {
    if (view === 'member') {
      fetchMembers();
    }
  }, [view, fetchMembers]);

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

  // --- Project Handlers ---

  const handleAddProject = () => {
    setProjectToEdit(null);
    setIsProjectEditorOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectEditorOpen(true);
  };

  const handleDeleteProject = async (id: number) => {
    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) {
        alert('삭제에 실패했습니다.');
      } else {
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    if (projectToEdit) { // Update
      const { error } = await supabase.from('projects').update(projectData).eq('id', projectToEdit.id);
      if (error) alert('수정에 실패했습니다.');
    } else { // Create
      const { error } = await supabase.from('projects').insert([projectData]);
      if (error) alert('저장에 실패했습니다.');
    }
    fetchProjects(); // Refetch list
  };

  // --- Member Handlers ---

  const handleAddMember = () => {
    setMemberToEdit(null);
    setIsMemberEditorOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setMemberToEdit(member);
    setIsMemberEditorOpen(true);
  };

  const handleDeleteMember = async (id: number) => {
    if (window.confirm('정말로 이 멤버를 삭제하시겠습니까?')) {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) {
        alert('삭제에 실패했습니다.');
      } else {
        setMembers(prev => prev.filter(m => m.id !== id));
      }
    }
  };

  const handleSaveMember = async (memberData: Omit<Member, 'id' | 'created_at'>, file?: File | null) => {
    let finalAvatarUrl = memberData.avatar_url;

    if (file) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('members')
          .upload(filePath, file);

        if (uploadError) {
          console.warn('Supabase storage upload failed:', uploadError);
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          finalAvatarUrl = base64;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('members')
            .getPublicUrl(filePath);
          finalAvatarUrl = publicUrl;
        }
      } catch (err) {
        console.error('Error handling image upload:', err);
      }
    }

    const updatedData = { ...memberData, avatar_url: finalAvatarUrl };

    try {
      if (updatedData.is_leader) {
        await supabase.from('members').update({ is_leader: false }).neq('id', -1);
      }

      if (memberToEdit) {
        const { error } = await supabase.from('members').update(updatedData).eq('id', memberToEdit.id);
        if (error) {
          alert(`수정 실패: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase.from('members').insert([updatedData]);
        if (error) {
          alert(`저장 실패: ${error.message}\n\n팁: Supabase에 is_leader 컬럼을 추가하셨나요?`);
          return;
        }
      }
      fetchMembers();
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  // --- Derived State & Memos ---
  
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      // 1. Leader goes first
      if (a.is_leader && !b.is_leader) return -1;
      if (!a.is_leader && b.is_leader) return 1;
      // 2. Then sort by creation date
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [members]);

  const activeItem = useMemo(() => items.find(i => i.id === selectedItem?.id) || null, [items, selectedItem]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(i => i.category))).sort((a, b) => a.localeCompare(b))], [items]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

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
          categoryCounts={categoryCounts}
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
            
            {view === 'member' && (
              <MemberView 
                members={sortedMembers}
                onAdd={handleAddMember}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                isLoading={isMemberLoading}
              />
            )}

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

            {view === 'project' && (
              <ProjectView 
                projects={projects}
                onAdd={handleAddProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                isLoading={isProjectLoading}
              />
            )}

          </main>

          {activeItem && <PostDetail item={activeItem} onClose={() => setSelectedItem(null)} onAddComment={addComment} />}
          <JournalEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveJournal} journalToEdit={journalToEdit} sessionId={currentSession} />
          <ProjectEditor isOpen={isProjectEditorOpen} onClose={() => setIsProjectEditorOpen(false)} onSave={handleSaveProject} projectToEdit={projectToEdit} />
          <MemberEditor isOpen={isMemberEditorOpen} onClose={() => setIsMemberEditorOpen(false)} onSave={handleSaveMember} memberToEdit={memberToEdit} />
        </div>
      </div>
    </div>
  );
};

export default App;
