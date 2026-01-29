import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Journal } from '../types';

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

  useEffect(() => {
    if (journalToEdit) {
      setTitle(journalToEdit.title || '');
      setContent(journalToEdit.content || '');
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
