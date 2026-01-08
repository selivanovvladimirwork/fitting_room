
import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { postsApi } from '../services/api';

interface UserProfileViewProps {
  username: string;
  onBack: () => void;
  onSelectPost: (post: Post, list: Post[]) => void;
  onFitPost: (post: Post) => void;
  onNavigateToProfile: (username: string) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ username, onBack, onSelectPost, onFitPost, onNavigateToProfile }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserPosts = async () => {
      setIsLoading(true);
      try {
        const posts = await postsApi.getByUser(username);
        setUserPosts(posts);
      } catch (error) {
        console.error('Failed to load user posts:', error);
        setUserPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserPosts();
  }, [username]);

  return (
    <div className="w-full pb-12 pt-16 px-1 md:px-6 max-w-7xl mx-auto animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-12 md:mb-20 px-4">
        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
          <button
            onClick={onBack}
            className="w-10 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white rounded-[30px] md:rounded-full shadow-md border border-gray-50 hover:scale-110 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5 md:w-7 md:h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-3xl md:text-6xl font-thin tracking-widest uppercase flex-grow text-center md:text-left">{username}</h2>
        </div>
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          className={`w-full md:w-auto px-10 py-3 md:py-3.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] md:tracking-[0.35em] transition-all shadow-lg ${isFollowing ? 'bg-gray-100 text-gray-400' : 'bg-black text-white'
            }`}
        >
          {isFollowing ? 'Подписки' : 'Подписаться'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 px-1 md:px-0">
        {userPosts.map((post) => (
          <div key={post.id}>
            <PostCard
              post={post}
              onClick={(p) => onSelectPost(p, userPosts)}
              onFitClick={(e, p) => onFitPost(p)}
              onAuthorClick={onNavigateToProfile}
              hideActions={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfileView;
