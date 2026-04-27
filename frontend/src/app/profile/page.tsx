'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { Roadmap } from '@/lib/types';

interface CompletedRoadmap extends Roadmap {
  completedAt: Date;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [completedRoadmaps, setCompletedRoadmaps] = useState<CompletedRoadmap[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setSkills(user.skills || []);
      fetchCompletedRoadmaps();
    }
  }, [user]);

  const fetchCompletedRoadmaps = async () => {
    if (!user) return;
    setLoadingProgress(true);
    try {
      const q = query(
        collection(db, 'progress'),
        where('userId', '==', user.id),
        where('completedAt', '!=', null)
      );
      const snapshot = await getDocs(q);
      const roadmaps: CompletedRoadmap[] = [];

      for (const progressDoc of snapshot.docs) {
        const progressData = progressDoc.data();
        const roadmapDoc = await getDoc(doc(db, 'roadmaps', progressData.roadmapId));
        if (roadmapDoc.exists()) {
          roadmaps.push({
            id: roadmapDoc.id,
            ...roadmapDoc.data(),
            completedAt: progressData.completedAt.toDate(),
          } as CompletedRoadmap);
        }
      }
      setCompletedRoadmaps(roadmaps);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        displayName,
        skills,
        updatedAt: new Date(),
      });
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio while resizing
          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress the image down to base64 webp string
          const base64String = canvas.toDataURL('image/webp', 0.8);

          try {
            await updateDoc(doc(db, 'users', user.id), {
              avatarUrl: base64String,
              updatedAt: new Date(),
            });
            showToast('Avatar updated!', 'success');
          } catch (error) {
            console.error('Error saving avatar to Firestore:', error);
            showToast('Failed to save avatar.', 'error');
          } finally {
            setUploadingAvatar(false);
          }
        };
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        showToast('Failed to read image file.', 'error');
        setUploadingAvatar(false);
      };
      
    } catch (error) {
      console.error('Error processing avatar:', error);
      showToast('Failed to process avatar.', 'error');
      setUploadingAvatar(false);
    }
  };

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <h1 className="text-2xl font-bold">Please sign in to view your profile</h1>
        <Link href="/" className="px-6 py-2 bg-black text-white rounded-full">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Node Road" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-xl font-bold text-white [-webkit-text-stroke:0.25px_black] font-[family-name:var(--font-vast-shadow)]">Node Road</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/roadmaps" className="text-gray-600 hover:text-black transition-colors font-medium">Explore</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-black transition-colors font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Sidebar / Basic Info */}
          <div className="md:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
              <div className="relative group mx-auto w-32 h-32 mb-6">
                <div 
                  className={`w-full h-full rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer transition-all group-hover:border-black ${uploadingAvatar ? 'opacity-50' : ''}`}
                  onClick={handleAvatarClick}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                    <span className="text-white text-xs font-bold uppercase tracking-wider">Change</span>
                  </div>
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              <h2 className="text-xl font-bold text-black mb-1">{user.displayName}</h2>
              <p className="text-sm text-gray-500 mb-6">{user.email}</p>
              
              <div className="pt-6 border-t border-gray-50 flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Public Profile</p>
                <Link href={`/u/${user.id}`} className="text-sm text-black font-semibold hover:underline">node-road.com/u/{user.id.slice(0,6)}</Link>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-black mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                My Skills
              </h3>
              <form onSubmit={addSkill} className="mb-4">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g. React)"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400 text-black"
                />
              </form>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-semibold rounded-full border border-gray-100 flex items-center gap-2 group">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-black">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No skills added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Profile Info & Completed Roadmaps */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-black">Profile Settings</h3>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className={`px-6 py-2.5 bg-black text-white text-sm font-bold rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100`}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-5 py-3 bg-gray-50/50 border border-transparent rounded-2xl text-gray-400 font-medium cursor-not-allowed"
                  />
                  <p className="mt-2 text-[10px] text-gray-400">Email cannot be changed as it is tied to your login provider.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-black flex items-center gap-3">
                Completed Roadmaps
                <span className="text-sm font-normal text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{completedRoadmaps.length}</span>
              </h3>

              {loadingProgress ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-3xl border border-gray-100 border-dashed">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : completedRoadmaps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {completedRoadmaps.map((roadmap) => (
                    <Link 
                      key={roadmap.id} 
                      href={`/roadmap/${roadmap.id}`}
                      className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-black/10"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                          Completed
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{roadmap.completedAt.toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-black group-hover:text-gray-700 transition-colors line-clamp-1">{roadmap.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{roadmap.description}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-gray-100 border-dashed text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <h4 className="text-sm font-bold text-black mb-1">No roadmaps completed yet</h4>
                  <p className="text-xs text-gray-400 mb-6">Start learning and master new subjects!</p>
                  <Link href="/roadmaps" className="text-xs font-bold text-black hover:underline">Browse Roadmaps →</Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
