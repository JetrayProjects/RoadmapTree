'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import RoadmapEditor from '@/components/RoadmapEditor';
import { Node, Edge } from 'reactflow';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function EditRoadmap() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Draggable split state
  const [splitPercent, setSplitPercent] = useState(30); // left panel width %
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!user || !id) return;
      try {
        const roadmapDoc = await getDoc(doc(db, 'roadmaps', id));
        if (!roadmapDoc.exists() || roadmapDoc.data().creatorId !== user.id) {
          router.push('/dashboard');
          return;
        }
        const data = roadmapDoc.data();
        setTitle(data.title || '');
        setDescription(data.description || '');
        setDifficulty(data.difficulty || 'beginner');
        setIsPublic(data.isPublic ?? true);

        const nodesSnapshot = await getDocs(collection(db, 'roadmaps', id, 'nodes'));
        const loadedNodes: Node[] = [];
        nodesSnapshot.forEach((nodeDoc) => {
          const nodeData = nodeDoc.data();
          loadedNodes.push({
            id: nodeDoc.id, type: nodeData.type || 'resource',
            position: nodeData.position || { x: 0, y: 0 },
            data: { label: nodeData.title || '', description: nodeData.description || '',
              resources: nodeData.resources || [], estimatedTime: nodeData.estimatedTimeMinutes || 0,
              type: nodeData.type || 'resource' },
          });
        });
        setNodes(loadedNodes);

        const edgesSnapshot = await getDocs(collection(db, 'roadmaps', id, 'edges'));
        const loadedEdges: Edge[] = [];
        edgesSnapshot.forEach((edgeDoc) => {
          const edgeData = edgeDoc.data();
          loadedEdges.push({ id: edgeDoc.id, source: edgeData.sourceNodeId, target: edgeData.targetNodeId,
            type: 'default', style: { stroke: '#000', strokeWidth: 2 } });
        });
        setEdges(loadedEdges);
      } catch (error) {
        console.error('Error fetching roadmap:', error);
      } finally {
        setLoadingRoadmap(false);
      }
    };
    if (user) fetchRoadmap();
  }, [user, id, router]);

  // Drag handler for resizable split
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(percent, 20), 50)); // clamp 20%-50%
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleSave = async (updatedNodes: Node[], updatedEdges: Edge[]) => {
    if (!user || !title.trim()) {
      showToast('Please enter a title for your roadmap', 'info');
      return;
    }
    setSaving(true);
    try {
      const totalTime = updatedNodes.reduce((acc, node) => acc + (Number(node.data?.estimatedTime) || 0), 0);

      await setDoc(doc(db, 'roadmaps', id), {
        title: title.trim(), description: description.trim(), creatorId: user.id,
        difficulty, estimatedTimeMinutes: totalTime, isPublic, isPaid: false, priceUSD: 0,
        tags: [], updatedAt: serverTimestamp(),
      });
      const existingNodes = await getDocs(collection(db, 'roadmaps', id, 'nodes'));
      const existingEdges = await getDocs(collection(db, 'roadmaps', id, 'edges'));
      await Promise.all(existingNodes.docs.map(doc => deleteDoc(doc.ref)));
      await Promise.all(existingEdges.docs.map(doc => deleteDoc(doc.ref)));

      const nodesCollection = collection(db, 'roadmaps', id, 'nodes');
      await Promise.all(updatedNodes.map(async (node) => {
        await setDoc(doc(nodesCollection, node.id), {
          roadmapId: id, type: node.type, title: node.data.label || '',
          description: node.data.description || '', position: node.position,
          estimatedTimeMinutes: node.data.estimatedTime || 0,
          resources: node.data.resources || [], prerequisites: [], order: 0,
        });
      }));

      const edgesCollection = collection(db, 'roadmaps', id, 'edges');
      await Promise.all(updatedEdges.map(async (edge) => {
        await setDoc(doc(edgesCollection, edge.id), {
          roadmapId: id, sourceNodeId: edge.source, targetNodeId: edge.target,
        });
      }));

      showToast('Roadmap saved successfully!', 'success');
      router.push(`/roadmap/${id}`);
    } catch (error) {
      console.error('Error saving roadmap:', error);
      showToast('Failed to save roadmap. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const existingNodes = await getDocs(collection(db, 'roadmaps', id, 'nodes'));
      const existingEdges = await getDocs(collection(db, 'roadmaps', id, 'edges'));
      await Promise.all(existingNodes.docs.map(n => deleteDoc(n.ref)));
      await Promise.all(existingEdges.docs.map(e => deleteDoc(e.ref)));
      await deleteDoc(doc(db, 'roadmaps', id));
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      showToast('Failed to delete roadmap.', 'error');
    }
  };

  if (loading || loadingRoadmap || !user) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* ── Top Header Bar ── */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-black transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Node Road" className="w-7 h-7 rounded-md object-contain" />
            <span className="text-sm font-bold text-black">Edit Roadmap</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-2 border-r border-gray-200 pr-4">
            {nodes.length} nodes · {edges.length} connections
          </span>
          <Link
            href={`/roadmap/${id}`}
            target="_blank"
            className="px-4 py-2 text-gray-600 font-semibold text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Preview
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-all"
          >
            Delete
          </button>
          <button
            onClick={() => handleSave(nodes, edges)}
            disabled={saving || !title.trim()}
            className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Split Content Area ── */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>

        {/* ── LEFT PANEL: Description & Metadata ── */}
        <div
          className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0"
          style={{ width: `${splitPercent}%` }}
        >


          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter roadmap title"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what learners will achieve..."
                rows={5}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Difficulty
              </label>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                      difficulty === level
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Visibility
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    isPublic
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Public
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    !isPublic
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Private
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Stats
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-lg font-bold text-black">{nodes.length}</div>
                  <div className="text-xs text-gray-500">Nodes</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-lg font-bold text-black">{edges.length}</div>
                  <div className="text-xs text-gray-500">Connections</div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">💡 Tips</h4>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li>• Click the canvas to add resource nodes</li>
                <li>• Click a node to edit its content</li>
                <li>• Drag between node handles to connect</li>
                <li>• Select a node and press Delete to remove</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── DRAG HANDLE ── */}
        <div
          className="w-1.5 bg-gray-100 hover:bg-gray-300 cursor-col-resize flex-shrink-0 relative transition-colors group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gray-300 group-hover:bg-gray-500 transition-colors" />
        </div>

        {/* ── RIGHT PANEL: ReactFlow Canvas ── */}
        <div className="flex-1 h-full overflow-hidden">
          <RoadmapEditor initialNodes={nodes} initialEdges={edges} onSave={handleSave} onChange={(n, e) => { setNodes(n); setEdges(e); }} />
        </div>
      </div>

      {/* Delete Modal Popup */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Roadmap</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this roadmap? This action cannot be undone and will remove all nodes, edges, and resources.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
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
