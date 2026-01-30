import React from 'react';
import { PencilIcon, TrashIcon, PlusIcon, UserCircleIcon, HeartIcon, TrophyIcon } from '@heroicons/react/24/outline';
import type { Member } from '../types';

interface MemberViewProps {
  members: Member[];
  onAdd: () => void;
  onEdit: (member: Member) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

const MemberView: React.FC<MemberViewProps> = ({ members, onAdd, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">멤버 소개</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Creative Vibe Coding Lab과 함께하는 멤버들입니다.</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          <span>멤버 등록</span>
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center mt-20 p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
          <UserCircleIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">아직 등록된 멤버가 없습니다.</p>
          <button onClick={onAdd} className="mt-4 text-blue-600 font-semibold hover:underline">첫 번째 멤버가 되어보세요!</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member) => (
            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all group">
              <div className="relative h-24 bg-gradient-to-r from-blue-500 to-indigo-600">
                <div className="absolute -bottom-12 left-6">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-700">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UserCircleIcon className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(member)} className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(member.id)} className="p-2 bg-white/20 hover:bg-red-500/40 backdrop-blur-md rounded-lg text-white transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-16 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {member.nickname}
                    <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({member.name})</span>
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mt-1">{member.intro || '한줄 소개가 없습니다.'}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <TrophyIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Goal</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{member.goal || '목표가 없습니다.'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <HeartIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interests</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(member.interests || '').split(',').map((interest, idx) => (
                          interest.trim() && (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded-md font-medium">
                              {interest.trim()}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberView;
