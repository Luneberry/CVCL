import React, { useState, useEffect } from 'react';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import type { Member } from '../types';

interface MemberEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<Member, 'id' | 'created_at'>) => void;
  memberToEdit: Member | null;
}

const MemberEditor: React.FC<MemberEditorProps> = ({ isOpen, onClose, onSave, memberToEdit }) => {
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [intro, setIntro] = useState('');
  const [goal, setGoal] = useState('');
  const [interests, setInterests] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setNickname(memberToEdit.nickname || '');
        setName(memberToEdit.name || '');
        setAvatarUrl(memberToEdit.avatar_url || '');
        setIntro(memberToEdit.intro || '');
        setGoal(memberToEdit.goal || '');
        setInterests(memberToEdit.interests || '');
      } else {
        setNickname('');
        setName('');
        setAvatarUrl('');
        setIntro('');
        setGoal('');
        setInterests('');
      }
    }
  }, [memberToEdit, isOpen]);

  const handleSave = () => {
    if (!nickname.trim() || !name.trim()) {
      alert('닉네임과 이름은 필수 입력 항목입니다.');
      return;
    }
    
    onSave({
      nickname,
      name,
      avatar_url: avatarUrl,
      intro,
      goal,
      interests,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {memberToEdit ? '멤버 정보 수정' : '새 멤버 등록'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <CameraIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">닉네임 *</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="닉네임"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="본명"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">프로필 이미지 URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">한줄 소개</label>
            <input
              type="text"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="자신을 한 줄로 표현해주세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">목표</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이번 스터디에서 이루고 싶은 목표"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">관심사 (쉼표로 구분)</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="React, AI, TypeScript..."
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
            {memberToEdit ? '수정하기' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberEditor;
