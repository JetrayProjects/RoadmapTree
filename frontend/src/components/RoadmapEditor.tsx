'use client';

import { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node, Edge, Controls, Background, useNodesState, useEdgesState,
  addEdge, Connection, BackgroundVariant, NodeTypes, useReactFlow, ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ResourceNode, TextNode } from './CustomNodes';
import NodeEditor from './NodeEditor';
import { v4 as uuidv4 } from 'uuid';
import { MarkerType } from 'reactflow';

const nodeTypes: NodeTypes = {
  resource: ResourceNode,
  text: TextNode,
};

const defaultEdgeOptions = {
  type: 'default',
  style: { stroke: '#000', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#000' },
};

interface RoadmapEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onChange?: (nodes: Node[], edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  readOnly?: boolean;
  completedResourceIds?: string[];
}

function RoadmapEditorInner({ initialNodes = [], initialEdges = [], onSave, onChange, readOnly = false, onNodeSelect, completedResourceIds = [] }: RoadmapEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (readOnly) setNodes(initialNodes);
  }, [initialNodes, readOnly, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    if (!readOnly) {
      setEditingNode(node);
      setIsEditorOpen(true);
    }
    if (onNodeSelect) onNodeSelect(node);
  }, [readOnly, onNodeSelect]);



  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    if (onNodeSelect) onNodeSelect(null);
  }, [onNodeSelect]);

  const addNode = (type: 'resource' | 'text') => {
    const position = { x: 250, y: 100 + nodes.length * 150 };
    const id = uuidv4();
    const newNode: Node = {
      id, type, position,
      data: {
        label: type === 'resource' ? 'New Resource' : 'Note',
        description: '', resources: type === 'resource' ? [] : undefined, estimatedTime: 0,
        onLabelChange: (newLabel: string) => updateNodeLabel(id, newLabel),
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setEditingNode(newNode);
    setIsEditorOpen(true);
  };

  const updateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
      )
    );
    // Also update editingNode if it's the same node
    setEditingNode((prev) =>
      prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, label: newLabel } } : prev
    );
  }, [setNodes]);

  const deleteSelectedNode = () => {
    if (selectedNode && !readOnly) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      setIsEditorOpen(false);
    }
  };

  const handleSaveNode = (updatedNodeData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedNodeData.id ? { ...node, type: updatedNodeData.type, data: { ...node.data, ...updatedNodeData } } : node
      )
    );
  };

  const handleSave = () => {
    if (onSave) onSave(nodes, edges);
  };

  // Notify parent of changes so the external Save button has current data
  useEffect(() => {
    if (onChange) onChange(nodes, edges);
  }, [nodes, edges, onChange]);

  // Inject onLabelChange callback and progress data into every node
  const nodesWithCallbacks = useMemo(() =>
    nodes.map((node) => {
      // Calculate progress if it's a resource node
      const nodeResources = node.data.resources || [];
      const completedCount = nodeResources.filter((r: any) => completedResourceIds?.includes(r.id)).length;
      const progressPercent = nodeResources.length > 0 ? (completedCount / nodeResources.length) * 100 : 0;
      const isCompleted = nodeResources.length > 0 && completedCount === nodeResources.length;

      return {
        ...node,
        data: {
          ...node.data,
          progressPercent,
          completed: isCompleted,
          onLabelChange: (newLabel: string) => updateNodeLabel(node.id, newLabel),
        },
      };
    }),
    [nodes, updateNodeLabel, completedResourceIds]
  );

  return (
    <div className="flex h-full">
      {/* Left Side - Node Canvas */}
      <div className={`${readOnly || editorCollapsed ? 'w-full' : 'w-2/3'} h-full transition-all duration-300`} ref={reactFlowWrapper}>
        {!readOnly && (
          <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => addNode('resource')}
                className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Resource
              </button>
              <button onClick={() => addNode('text')}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Note
              </button>
            </div>
            <div className="flex items-center gap-3">
              {selectedNode && (
                <button onClick={deleteSelectedNode}
                  className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-all">
                  Delete
                </button>
              )}
              {!editorCollapsed && (
                <button onClick={() => setEditorCollapsed(true)}
                  className="px-3 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              {onSave && (
                <button onClick={handleSave}
                  className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all">
                  Save
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`w-full ${readOnly ? 'h-full' : 'h-[calc(100%-60px)]'} bg-gray-50`}>
          <ReactFlow
            nodes={nodesWithCallbacks} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={readOnly ? undefined : onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick} nodeTypes={nodeTypes} defaultEdgeOptions={defaultEdgeOptions}
            fitView snapToGrid snapGrid={[20, 20]}
            deleteKeyCode={readOnly ? null : 'Delete'}
            nodesDraggable={!readOnly} nodesConnectable={!readOnly} elementsSelectable={!readOnly}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e5e5" />
            <Controls className="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg" />
          </ReactFlow>
        </div>
      </div>

      {/* Right Side - Node Editor Panel */}
      {!readOnly && (
        <div className={`${editorCollapsed ? 'w-0' : 'w-1/3'} h-full bg-white border-l border-gray-200 transition-all duration-300 overflow-hidden`}>
          {!editorCollapsed && (
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
                <h2 className="text-base font-bold">
                  {editingNode ? 'Edit Node' : 'Select a Node'}
                </h2>
                <button 
                  onClick={() => setEditorCollapsed(true)}
                  className="p-1 hover:bg-gray-800 rounded transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto">
                {editingNode ? (
                  <NodeEditor
                    key={editingNode.id}
                    node={{ 
                      id: editingNode.id, 
                      type: editingNode.data.type || 'resource',
                      label: editingNode.data.label, 
                      description: editingNode.data.description,
                      resources: editingNode.data.resources, 
                      estimatedTime: editingNode.data.estimatedTime 
                    }}
                    onSave={handleSaveNode}
                    onCancel={() => { setEditingNode(null); setIsEditorOpen(false); }}
                  />
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <p className="text-sm">Click on a node to edit its content</p>
                    <p className="text-xs text-gray-400 mt-2">or add a new node using the buttons above</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expand Button (when collapsed) */}
          {editorCollapsed && (
            <button 
              onClick={() => setEditorCollapsed(false)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black text-white px-2 py-8 rounded-l-lg shadow-lg hover:bg-gray-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoadmapEditor(props: RoadmapEditorProps) {
  return (
    <ReactFlowProvider>
      <RoadmapEditorInner {...props} />
    </ReactFlowProvider>
  );
}
