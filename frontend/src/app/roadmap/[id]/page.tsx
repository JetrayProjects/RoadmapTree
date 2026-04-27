'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import RoadmapEditor from '@/components/RoadmapEditor';
import { Node, Edge } from 'reactflow';
import Link from 'next/link';

export default function RoadmapView() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [creator, setCreator] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [completedResourceIds, setCompletedResourceIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const roadmapDoc = await getDoc(doc(db, 'roadmaps', id));
        if (roadmapDoc.exists()) {
          setRoadmap({ id: roadmapDoc.id, ...roadmapDoc.data() });
          
          const creatorId = roadmapDoc.data().creatorId;
          const creatorDoc = await getDoc(doc(db, 'users', creatorId));
          if (creatorDoc.exists()) setCreator({ id: creatorDoc.id, ...creatorDoc.data() });

          const nodesSnapshot = await getDocs(collection(db, 'roadmaps', id, 'nodes'));
          const loadedNodes: Node[] = [];
          nodesSnapshot.forEach((nodeDoc) => {
            const nodeData = nodeDoc.data();
            loadedNodes.push({
              id: nodeDoc.id, type: nodeData.type || 'resource',
              position: nodeData.position || { x: 0, y: 0 },
              data: {
                label: nodeData.title || '', description: nodeData.description || '',
                resources: nodeData.resources || [], estimatedTime: nodeData.estimatedTimeMinutes || 0,
                type: nodeData.type || 'resource',
              },
            });
          });
          setNodes(loadedNodes);

          const edgesSnapshot = await getDocs(collection(db, 'roadmaps', id, 'edges'));
          const loadedEdges: Edge[] = [];
          edgesSnapshot.forEach((edgeDoc) => {
            const edgeData = edgeDoc.data();
            loadedEdges.push({
              id: edgeDoc.id, source: edgeData.sourceNodeId, target: edgeData.targetNodeId,
              type: 'default', style: { stroke: '#000', strokeWidth: 2 },
            });
          });
          setEdges(loadedEdges);
          
          if (user) {
            const progressDoc = await getDoc(doc(db, 'progress', `${user.id}_${id}`));
            if (progressDoc.exists()) {
              setCompletedResourceIds(progressDoc.data().completedResourceIds || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching roadmap:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-black">Roadmap Not Found</h1>
          <Link href="/roadmaps" className="text-black underline">Browse Roadmaps</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === roadmap.creatorId;

  const toggleResourceComplete = async (resourceId: string) => {
    if (!user) {
      showToast('Please sign in to track your progress', 'info');
      return;
    }
    
    const isCompleted = completedResourceIds.includes(resourceId);
    const newCompleted = isCompleted 
      ? completedResourceIds.filter(id => id !== resourceId)
      : [...completedResourceIds, resourceId];
      
    setCompletedResourceIds(newCompleted);

    try {
      await setDoc(doc(db, 'progress', `${user.id}_${id}`), {
        userId: user.id,
        roadmapId: id,
        completedResourceIds: newCompleted,
        lastUpdatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };
  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/roadmaps" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Node Road" className="w-8 h-8 rounded-lg object-contain" />
              <div>
                <h1 className="text-lg font-bold text-black">{roadmap.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>by {creator?.displayName || 'Unknown'}</span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${difficultyColors[roadmap.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                    {roadmap.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {isOwner && (
            <Link href={`/edit/${id}`} className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all">
              Edit Roadmap
            </Link>
          )}
        </div>
      </header>

      {/* Description */}
      {roadmap.description && (
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <p className="text-gray-600 max-w-4xl">{roadmap.description}</p>
        </div>
      )}

      {/* Editor & Sidebar */}
      <div className="flex-1 min-h-0 flex">
        {/* Editor (Read-only) */}
        <div className="flex-1 h-full relative">
          <RoadmapEditor initialNodes={nodes} initialEdges={edges} readOnly onNodeSelect={setSelectedNode} completedResourceIds={completedResourceIds} />
        </div>

        {/* Sidebar */}
        {selectedNode && (
          <div className="w-80 h-full bg-white border-l border-gray-100 flex flex-col overflow-hidden shadow-xl shrink-0">
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 truncate pr-2">{selectedNode.data.label}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-black transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedNode.data.description && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedNode.data.description}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resources</h4>
                {(!selectedNode.data.resources || selectedNode.data.resources.length === 0) ? (
                  <p className="text-sm text-gray-500 italic">No resources available for this node.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedNode.data.resources.map((resource: any) => {
                      const isComplete = completedResourceIds.includes(resource.id);
                      return (
                        <div key={resource.id} className={`p-3 rounded-xl border ${isComplete ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-100 hover:border-gray-200'} transition-all flex items-start gap-3 shadow-sm`}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleResourceComplete(resource.id); }}
                            className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isComplete 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'bg-white border-gray-300 hover:border-gray-400 text-transparent'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                          </button>
                          
                          <div className="min-w-0 flex-1">
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`block text-sm font-medium hover:underline mb-1 ${isComplete ? 'text-gray-500 line-through' : 'text-gray-900 hover:text-black'}`}>
                              {resource.title || 'Untitled Resource'}
                            </a>
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold rounded">
                              {resource.type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
