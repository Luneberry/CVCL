import React, { useState } from 'react';
import { LinkItem, Comment } from '../types';
import { 
  XMarkIcon, 
  ArrowTopRightOnSquareIcon, 
  PhotoIcon,
  UserCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface PostDetailProps {
  item: LinkItem;
  onClose: () => void;
  onAddComment: (itemId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ item, onClose, onAddComment }) => {
  const [commentText, setCommentText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const youtubeId = getYouTubeId(item.url);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !imageFile) return;

    let imageUrl = undefined;
    if (imageFile) {
      imageUrl = URL.createObjectURL(imageFile);
    }

    onAddComment(item.id, {
      author: 'Guest User',
      content: commentText,
      imageUrl
    });

    setCommentText('');
    setImageFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                {item.category}
             </span>
             <span className="text-gray-500 text-xs flex items-center gap-1">
                <CalendarDaysIcon className="w-4 h-4"/> {item.date}
             </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
            
            {/* Left Column: Content */}
            <div className="lg:col-span-3 p-6 border-r border-gray-200 dark:border-gray-800">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                 {item.title || item.url}
               </h2>
               
               <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                 <UserCircleIcon className="w-5 h-5" />
                 <span className="font-semibold">{item.sender}</span>
                 <span>님이 공유함</span>
               </div>

               {/* Preview Area */}
               <div className="mb-6 rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 border border-gray-200 dark:border-gray-800">
                  {youtubeId ? (
                    <div className="aspect-video">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/1] flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/50">
                       <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{new URL(item.url).hostname}</p>
                       <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm truncate">{item.url}</p>
                    </div>
                  )}
               </div>

               {/* Context & Link */}
               <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">요약</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                    {item.summary}
                  </p>
                  
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">원본 메시지</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-6 border border-gray-100 dark:border-gray-700 overflow-x-hidden break-words">
                    {item.originalText}
                  </div>

                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 w-full justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30"
                  >
                    <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    사이트 방문하기
                  </a>
               </div>
            </div>

            {/* Right Column: Comments */}
            <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/50 flex flex-col h-full min-h-[400px]">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                 <h3 className="font-bold text-gray-900 dark:text-white">코멘트 ({item.comments.length})</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {item.comments.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-sm">아직 작성된 코멘트가 없습니다.</p>
                    <p className="text-xs mt-1">이 글에 대한 생각을 남겨주세요!</p>
                  </div>
                ) : (
                  item.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                        {comment.author[0]}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{comment.author}</span>
                            <span className="text-[10px] text-gray-400">{comment.timestamp.toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                          {comment.imageUrl && (
                            <img src={comment.imageUrl} alt="Attachment" className="mt-2 rounded-lg max-h-32 object-cover border border-gray-200 dark:border-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                 <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
                   <textarea 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="내용을 입력하세요..."
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20 text-gray-900 dark:text-white"
                   />
                   
                   <div className="flex items-center justify-between">
                      <label className="cursor-pointer p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 text-xs">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if(e.target.files?.[0]) setImageFile(e.target.files[0]);
                          }}
                        />
                        <PhotoIcon className="w-5 h-5" />
                        {imageFile ? <span className="text-blue-600 max-w-[100px] truncate">{imageFile.name}</span> : <span>사진 첨부</span>}
                        {imageFile && <button type="button" onClick={(e) => {e.preventDefault(); setImageFile(null)}} className="text-red-500 hover:underline ml-1">삭제</button>}
                      </label>

                      <button 
                        type="submit"
                        disabled={!commentText && !imageFile}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        등록
                      </button>
                   </div>
                 </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;