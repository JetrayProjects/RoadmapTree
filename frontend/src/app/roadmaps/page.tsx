'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface RoadmapPreview {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  creatorName: string;
  creatorAvatar: string;
  estimatedTimeMinutes: number;
  stats: {
    views: number;
    saves: number;
    averageRating: number;
  };
  createdAt: Date;
}

export default function RoadmapsPage() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const q = query(collection(db, 'roadmaps'), where('isPublic', '==', true));
        const snapshot = await getDocs(q);
        const loadedRoadmaps: RoadmapPreview[] = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          
          let creatorName = 'Unknown';
          let creatorAvatar = '';
          try {
            const { doc: docFn, getDoc } = await import('firebase/firestore');
            const creatorDoc = await getDoc(docFn(db, 'users', data.creatorId));
            if (creatorDoc.exists()) {
              creatorName = creatorDoc.data().displayName || 'Unknown';
              creatorAvatar = creatorDoc.data().avatarUrl || '';
            }
          } catch (e) {}

          loadedRoadmaps.push({
            id: doc.id,
            title: data.title || 'Untitled',
            description: data.description || '',
            difficulty: data.difficulty || 'beginner',
            creatorName,
            creatorAvatar,
            estimatedTimeMinutes: data.estimatedTimeMinutes || 0,
            stats: data.stats || { views: 0, saves: 0, averageRating: 0 },
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
        
        setRoadmaps(loadedRoadmaps);
      } catch (error) {
        console.error('Error fetching roadmaps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  const filteredRoadmaps = roadmaps.filter((roadmap) => {
    const matchesSearch = roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roadmap.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roadmap.creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = difficultyFilter === 'all' || roadmap.difficulty === difficultyFilter;
    
    return matchesSearch && matchesDifficulty;
  });

  const sortedRoadmaps = [...filteredRoadmaps].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.stats.views + b.stats.saves * 10) - (a.stats.views + a.stats.saves * 10);
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Node Road" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-xl font-bold text-white [-webkit-text-stroke:0.25px_black] font-[family-name:var(--font-vast-shadow)]">Node Road</span>
          </Link>
          
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link href="/create" className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all">
                  + Create
                </Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-black transition-colors font-medium">
                  Dashboard
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-black transition-colors font-medium">
                  Profile
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black">Explore Roadmaps</h1>
          <p className="text-gray-600">Discover learning paths created by other learners and experts</p>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center mt-8">
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search roadmaps..."
                  className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-full transition-all ${
                    difficultyFilter === level
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2.5 text-sm font-medium rounded-full transition-all ${
                  sortBy === 'recent'
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2.5 text-sm font-medium rounded-full transition-all ${
                  sortBy === 'popular'
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                Popular
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmaps Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">Loading roadmaps...</span>
            </div>
          </div>
        ) : sortedRoadmaps.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold mb-2 text-black">No Roadmaps Found</h2>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search or filters' : 'Be the first to create a roadmap!'}
            </p>
            {user && (
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all"
              >
                Create Roadmap
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRoadmaps.map((roadmap) => (
              <Link
                key={roadmap.id}
                href={`/roadmap/${roadmap.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 card-hover"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1 text-xs font-semibold rounded-full ${difficultyColors[roadmap.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                      {roadmap.difficulty}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {roadmap.stats.views} views
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 text-black group-hover:text-gray-700 transition-colors">
                    {roadmap.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {roadmap.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {roadmap.creatorAvatar ? (
                        <img src={roadmap.creatorAvatar} alt={roadmap.creatorName} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">{roadmap.creatorName[0]}</span>
                        </div>
                      )}
                      <span className="text-sm text-gray-600">{roadmap.creatorName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {roadmap.estimatedTimeMinutes > 0 
                        ? (roadmap.estimatedTimeMinutes >= 60 
                            ? `${Math.floor(roadmap.estimatedTimeMinutes/60)}h ${roadmap.estimatedTimeMinutes%60>0?`${roadmap.estimatedTimeMinutes%60}m`:''}` 
                            : `${roadmap.estimatedTimeMinutes}m`) 
                        : '0m'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
