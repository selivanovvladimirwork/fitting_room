
import React, { useState, useRef } from 'react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
  onFitClick?: (e: React.MouseEvent, post: Post) => void;
  onAuthorClick?: (author: string) => void;
  onSaveClick?: (post: Post) => void;
  hideActions?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, onFitClick, onAuthorClick, onSaveClick, hideActions }) => {
  const { requireAuth } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: 'Примерочная Studio',
        text: `Посмотрите на этот образ от ${post.author}!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  const handleFit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFitClick) {
      onFitClick(e, post);
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAuthorClick) {
      onAuthorClick(post.author);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      if (onSaveClick) {
        onSaveClick(post);
      } else {
        setIsSaved(!isSaved);
      }
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={() => onClick(post)}
      className="break-inside-avoid mb-3 md:mb-6 relative group cursor-pointer"
    >
      {/* Image Card Wrapper */}
      <div className="relative w-full aspect-auto overflow-hidden rounded-[24px] md:rounded-[32px] bg-gray-50 transition-all duration-700 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] md:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.18)]">
        {/* Image Container */}
        <div className="relative w-full aspect-auto">
          <img
            src={post.imageUrl}
            alt="Fashion"
            className="w-full h-auto object-cover transition-transform duration-700 md:group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 z-10" />
        </div>

        {/* Action Buttons (Like, Save, Share) - Hidden on mobile, show on hover desktop */}
        <div className="absolute right-2 top-10 flex flex-col gap-2 opacity-0 md:group-hover:opacity-100 transition-all duration-500 translate-x-4 md:group-hover:translate-x-0 z-40 hidden md:flex">
          <button
            onClick={(e) => { e.stopPropagation(); requireAuth(() => setIsLiked(!isLiked)); }}
            className={`w-10 h-10 flex items-center justify-center transition-all hover:scale-125 active:scale-90 ${isLiked ? 'text-[#FF4D4D] fill-[#FF4D4D]' : 'text-white'}`}
          >
            <svg className="w-7 h-7 drop-shadow-md" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            onClick={handleSave}
            className={`w-10 h-10 flex items-center justify-center transition-all hover:scale-125 active:scale-90 ${isSaved ? 'text-white fill-white' : 'text-white'}`}
          >
            <svg className="w-7 h-7 drop-shadow-md" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center text-white transition-all hover:scale-125 active:scale-90"
          >
            <svg className="w-7 h-7 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-all duration-500 p-4 flex flex-col justify-end z-20 pointer-events-none translate-y-4 md:group-hover:translate-y-0 hidden md:flex">
          <div className="mb-2 pr-14 pointer-events-auto">
            <h3
              onClick={handleAuthorClick}
              className="text-white text-base font-medium tracking-tight mb-0.5 truncate hover:underline underline-offset-4 cursor-pointer"
            >
              {post.author?.startsWith('@') ? post.author : `@${post.author}`}
            </h3>
            {post.title && (
              <p className="text-white/70 text-[10px] font-light uppercase tracking-widest">
                {post.title}
              </p>
            )}
          </div>

          {!hideActions && (
            <div className="flex flex-col gap-2 w-full pointer-events-auto">
              <button
                onClick={handleFit}
                className="w-full py-2.5 bg-black text-white border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-gray-900 active:scale-95 transition-all duration-300"
              >
                ПРИМЕРИТЬ
              </button>
              <button
                className="w-full py-2.5 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 active:scale-95 transition-all duration-300"
              >
                К ТОВАРУ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Content (Below Card) - Visible ONLY on mobile */}
      <div className="md:hidden pt-3 flex flex-col gap-3 px-1">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <h3
              onClick={handleAuthorClick}
              className="text-sm font-bold text-black leading-tight mb-1 truncate max-w-[140px] active:text-gray-600"
            >
              {post.author?.startsWith('@') ? post.author : `@${post.author}`}
            </h3>
            {post.title && (
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">{post.title}</p>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={(e) => { e.stopPropagation(); requireAuth(() => setIsLiked(!isLiked)); }}
              className={`transition-transform active:scale-90 ${isLiked ? 'text-[#FF4D4D] fill-[#FF4D4D]' : 'text-gray-300'}`}
            >
              <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={handleShare}
              className="text-gray-300 transition-transform active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {!hideActions && (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleFit}
              className="w-full py-2.5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-all"
            >
              ПРИМЕРИТЬ
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2.5 bg-white border border-gray-200 text-black rounded-full text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
            >
              К ТОВАРУ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
