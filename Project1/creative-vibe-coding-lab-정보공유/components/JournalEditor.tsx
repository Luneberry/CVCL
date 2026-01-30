import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { Journal } from '../types';
import { generateJournalFromRawText } from '../services/geminiService';

interface JournalEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (journalData: Omit<Journal, 'id' | 'created_at'>) => void;
  journalToEdit: Journal | null;
  sessionId: number;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ isOpen, onClose, onSave, journalToEdit, sessionId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (journalToEdit) {
        setTitle(journalToEdit.title || '');
        setContent(journalToEdit.content || '');
        setRawContent(journalToEdit.raw_content || '');
      } else {
        // Reset for new entry
        setTitle('');
        setContent('');
        setRawContent('');
      }
    }
  }, [journalToEdit, isOpen]);

  const handleGenerate = async () => {
    if (!rawContent.trim()) {
      alert('요약할 원본 내용을 입력해주세요.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateJournalFromRawText(rawContent);
      setTitle(result.title);
      setContent(result.content);
    } catch (error) {
      console.error(error);
      alert('AI 요약 생성에 실패했습니다. API 키를 확인하거나 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({
      title,
      content,
      raw_content: rawContent,
      session_id: journalToEdit ? journalToEdit.session_id : sessionId,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl transform transition-all">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {journalToEdit ? '모임일지 수정' : '새 모임일지 작성'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
          {/* Left Side: Raw Content Input */}
          <div className="space-y-4">
            <label className="font-bold text-gray-800 dark:text-gray-200">원본 내용 (Raw Text)</label>
            <textarea
              placeholder="여기에 회의록이나 스터디 내용을 붙여넣으세요..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 shadow disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>요약 중...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>AI로 요약 생성</span>
                </>
              )}
            </button>
          </div>

          {/* Right Side: AI Generated Content */}
          <div className="space-y-4">
            <label className="font-bold text-gray-800 dark:text-gray-200">AI 생성 결과</label>
            <input
              type="text"
              placeholder="AI가 생성할 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="AI가 생성할 요약 내용 (Markdown 지원)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 mr-2 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 shadow"
          >
            {journalToEdit ? '수정하기' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalEditor;
dit.content || '');
    } else {
      // Reset for new entry
      setTitle('');
      setContent('');
    }
  }, [journalToEdit, isOpen]);

  const handleSave = () => {
    onSave({
      title,
      content,
      session_id: journalToEdit ? journalToEdit.session_id : sessionId,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {journalToEdit ? '모임일지 수정' : '새 모임일지 작성'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 mr-2 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 shadow"
          >
            {journalToEdit ? '수정하기' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalEditor;
