import React from 'react';
import { LinkItem } from '../types';
import { 
  ChatBubbleLeftIcon, 
  ArrowTopRightOnSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface LinkCardProps {
  item: LinkItem;
  onClick: () => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ item, onClick }) => {
  // Helper to detect YouTube video ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeId(item.url);

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col h-full cursor-pointer group"
    >
      
      {/* Media Preview */}
      <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
        {youtubeId ? (
          <img 
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt="Video Thumbnail"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
             <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <ArrowTopRightOnSquareIcon className="w-8 h-8 text-blue-500" />
             </div>
             <span className="text-sm font-medium truncate max-w-xs text-gray-500 dark:text-gray-400">
               {new URL(item.url).hostname}
             </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-lg">
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-lg leading-snug group-hover:text-blue-600 transition-colors">
            {item.title || item.url}
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-1 line-clamp-3">
          {item.summary}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
          <div className="flex items-center gap-2">
             <UserCircleIcon className="w-4 h-4" />
             <span>{item.sender}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{item.date}</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
         <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
           <ChatBubbleLeftIcon className="w-4 h-4" />
           댓글 {item.comments.length}
         </span>
         <span className="text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
           자세히 보기 &rarr;
         </span>
      </div>
    </div>
  );
};

export default LinkCard;
