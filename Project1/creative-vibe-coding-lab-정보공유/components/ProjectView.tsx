import React from 'react';
import { PencilIcon, TrashIcon, PlusIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import type { Project } from '../types';

interface ProjectViewProps {
  projects: Project[];
  onAdd: () => void;
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({ projects, onAdd, onEdit, onDelete, isLoading }) => {
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">개인 프로젝트</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>새 프로젝트 등록</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-gray-500">등록된 개인 프로젝트가 없습니다.</p>
          <p className="text-gray-400 text-sm mt-2">첫 번째 프로젝트를 등록해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">{project.title}</h3>
                <div className="flex gap-1 -mr-2">
                  <button onClick={() => onEdit(project)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(project.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1">
                 {project.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                   <span className="text-gray-500 dark:text-gray-400">작성자: <span className="text-gray-700 dark:text-gray-200 font-medium">{project.author}</span></span>
                </div>
                {project.url && (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      <GlobeAltIcon className="w-4 h-4" />
                      <span>프로젝트 보기</span>
                    </a>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectView;
