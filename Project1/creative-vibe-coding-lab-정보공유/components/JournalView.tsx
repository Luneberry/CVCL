import React, { useState } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Journal } from '../types'; // Journal 타입을 정의해야 합니다.

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
        <div className="space-y-4">
          {journals.map((journal) => (
            <div key={journal.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{journal.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(journal.created_at).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{journal.content}</p>
                  
                  {journal.raw_content && (
                    <details className="mt-3 group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600">
                        원문 펼쳐보기
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {journal.raw_content}
                        </p>
                      </div>
                    </details>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button onClick={() => onEdit(journal)} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDelete(journal.id)} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
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
