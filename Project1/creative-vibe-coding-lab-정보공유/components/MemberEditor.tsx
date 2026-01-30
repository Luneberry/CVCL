import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CameraIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { Member } from '../types';

interface MemberEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<Member, 'id' | 'created_at'>, file?: File | null) => void;
  memberToEdit: Member | null;
}

const MemberEditor: React.FC<MemberEditorProps> = ({ isOpen, onClose, onSave, memberToEdit }) => {
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [intro, setIntro] = useState('');
  const [goal, setGoal] = useState('');
  const [interests, setInterests] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setNickname(memberToEdit.nickname || '');
        setName(memberToEdit.name || '');
        setAvatarUrl(memberToEdit.avatar_url || '');
        setIntro(memberToEdit.intro || '');
        setGoal(memberToEdit.goal || '');
        setInterests(memberToEdit.interests || '');
        setIsLeader(memberToEdit.is_leader || false);
      } else {
        setNickname('');
        setName('');
        setAvatarUrl('');
        setIntro('');
        setGoal('');
        setInterests('');
        setIsLeader(false);
      }
      setSelectedFile(null);
    }
  }, [memberToEdit, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create a temporary preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

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
      is_leader: isLeader,
    }, selectedFile);
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
          <div className="flex flex-col items-center mb-6">
            <div 
              onClick={triggerFileInput}
              className="relative group cursor-pointer"
            >
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-16 h-16 text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                  <CameraIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">클릭하여 프로필 사진 선택</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">랩장 여부</span>
              <p className="text-[10px] text-blue-500 dark:text-blue-400">전체에서 단 한 명만 선택 가능합니다.</p>
            </div>
            <button
              onClick={() => setIsLeader(!isLeader)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isLeader ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isLeader ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
