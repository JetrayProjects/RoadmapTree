'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface DashboardRoadmap {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  isPublic: boolean;
  stats: {
    views: number;
    saves: number;
    averageRating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const [myRoadmaps, setMyRoadmaps] = useState<DashboardRoadmap[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchMyRoadmaps = async () => {
      if (!user) return;

      try {
        const q = query(collection(db, 'roadmaps'), where('creatorId', '==', user.id));
        const snapshot = await getDocs(q);
        const roadmaps: DashboardRoadmap[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          roadmaps.push({
            id: doc.id,
            title: data.title || 'Untitled',
            description: data.description || '',
            difficulty: data.difficulty || 'beginner',
            isPublic: data.isPublic || false,
            stats: data.stats || { views: 0, saves: 0, averageRating: 0 },
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        setMyRoadmaps(roadmaps);
      } catch (error) {
        console.error('Error fetching roadmaps:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchMyRoadmaps();
  }, [user]);

  const confirmDeleteRoadmap = async () => {
    if (!deleteModal) return;
    try {
      const id = deleteModal.id;
      const nodesQuery = await getDocs(collection(db, 'roadmaps', id, 'nodes'));
      const edgesQuery = await getDocs(collection(db, 'roadmaps', id, 'edges'));
      
      await Promise.all(nodesQuery.docs.map(n => deleteDoc(n.ref)));
      await Promise.all(edgesQuery.docs.map(e => deleteDoc(e.ref)));
      await deleteDoc(doc(db, 'roadmaps', id));

      setMyRoadmaps(prev => prev.filter(r => r.id !== id));
      setDeleteModal(null);
      showToast('Roadmap deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      showToast('Failed to delete roadmap.', 'error');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Node Road" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-xl font-bold text-white [-webkit-text-stroke:0.25px_black] font-[family-name:var(--font-vast-shadow)]">Node Road</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/roadmaps" className="text-gray-600 hover:text-black transition-colors font-medium">
              Explore
            </Link>
            <Link href="/create" className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all">
              + Create
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-black transition-colors font-medium">
              Profile
            </Link>
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full ring-2 ring-gray-200" />
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-black">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user.displayName}</p>
          </div>
          <Link
            href="/create"
            className="px-6 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Roadmap
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover">
            <div className="text-3xl font-bold">{myRoadmaps.length}</div>
            <div className="text-sm text-gray-500 mt-1">My Roadmaps</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover">
            <div className="text-3xl font-bold">{myRoadmaps.reduce((sum, r) => sum + r.stats.views, 0)}</div>
            <div className="text-sm text-gray-500 mt-1">Total Views</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover">
            <div className="text-3xl font-bold">{myRoadmaps.reduce((sum, r) => sum + r.stats.saves, 0)}</div>
            <div className="text-sm text-gray-500 mt-1">Total Saves</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover">
            <div className="text-3xl font-bold">{myRoadmaps.filter(r => r.isPublic).length}</div>
            <div className="text-sm text-gray-500 mt-1">Public Roadmaps</div>
          </div>
        </div>

        {/* My Roadmaps */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-6 text-black">My Roadmaps</h2>

          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 font-medium">Loading...</span>
              </div>
            </div>
          ) : myRoadmaps.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">You haven't created any roadmaps yet.</p>
              <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all">
                Create Your First Roadmap
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm text-gray-500 font-medium">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Views</th>
                    <th className="px-6 py-4">Saves</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myRoadmaps.map((roadmap) => (
                    <tr key={roadmap.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{roadmap.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{roadmap.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${roadmap.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                            roadmap.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                          }`}>
                          {roadmap.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${roadmap.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {roadmap.isPublic ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{roadmap.stats.views}</td>
                      <td className="px-6 py-4 text-gray-600">{roadmap.stats.saves}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link href={`/roadmap/${roadmap.id}`} className="text-sm text-gray-600 hover:text-black font-medium">
                            View
                          </Link>
                          <Link href={`/edit/${roadmap.id}`} className="text-sm text-black hover:underline font-medium">
                            Edit
                          </Link>
                          <button 
                            onClick={() => setDeleteModal({id: roadmap.id, title: roadmap.title})}
                            className="text-sm text-red-600 hover:text-red-800 font-medium ml-2 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black">Profile</h2>
            <Link href="/profile" className="text-sm font-bold text-black hover:underline px-4 py-2 border border-black rounded-full">
              Edit Full Profile
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 max-w-md">
            <div className="flex items-center gap-4 mb-4">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt={user.displayName} className="w-16 h-16 rounded-full ring-2 ring-gray-200" />
              )}
              <div>
                <div className="text-lg font-bold">{user.displayName}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">Bio:</span> {user.bio || 'No bio added yet.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Roadmap</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.title}"</span>? This action cannot be undone and will remove all nodes, edges, and resources.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteRoadmap}
                className="px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
