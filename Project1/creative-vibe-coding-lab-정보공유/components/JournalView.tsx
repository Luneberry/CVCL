import React from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Journal } from '../types';

interface JournalViewProps {
  journals: Journal[];
  onAdd: () => void;
  onEdit: (journal: Journal) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

const JournalView: React.FC<JournalViewProps> = ({ journals, onAdd, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">모임일지</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>새 일지 작성</span>
        </button>
      </div>

      {journals.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-gray-500">작성된 모임일지가 없습니다.</p>
          <p className="text-gray-400 text-sm mt-2">첫 번째 일지를 작성해보세요!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {journals.map((journal) => (
            <div key={journal.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{journal.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {new Date(journal.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                  
                  <div className="markdown-body prose prose-sm dark:prose-invert max-w-none mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {journal.content || ''}
                    </ReactMarkdown>
                  </div>
                  
                  {journal.raw_content && (
                    <details className="mt-4 group border-t dark:border-gray-700 pt-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        원본 데이터 (Raw Text) 확인
                      </summary>
                      <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                          {journal.raw_content}
                        </p>
                      </div>
                    </details>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-4">
                  <button onClick={() => onEdit(journal)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="수정">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDelete(journal.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="삭제">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalView;
