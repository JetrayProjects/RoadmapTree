'use client';

import { useState } from 'react';
import { Resource } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface NodeEditorProps {
  node: {
    id: string;
    type: 'resource' | 'milestone' | 'text';
    label?: string;
    description?: string;
    resources?: Resource[];
    estimatedTime?: number;
  };
  onSave: (node: any) => void;
  onCancel: () => void;
}



export default function NodeEditor({ node, onSave, onCancel }: NodeEditorProps) {
  const [nodeType, setNodeType] = useState(node.type);
  const [label, setLabel] = useState(node.label || '');
  const [description, setDescription] = useState(node.description || '');
  const [estimatedTime, setEstimatedTime] = useState(node.estimatedTime || 0);
  const [resources, setResources] = useState<Resource[]>(node.resources || []);

  const addResource = () => {
    setResources([...resources, { id: uuidv4(), type: 'link', url: '', title: '' }]);
  };

  const updateResource = (index: number, field: keyof Resource, value: string) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({ ...node, type: nodeType, label, description, estimatedTime, resources: nodeType === 'resource' ? resources : [] });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Node Type Selector */}
      {nodeType !== 'resource' && (
        <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 inline-block">
          Text Note
        </div>
      )}

      {nodeType === 'resource' && (
        <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 inline-block">
          Resource Node
        </div>
      )}

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <input 
          type="text" 
          value={label} 
          onChange={(e) => setLabel(e.target.value)} 
          placeholder="Enter node title"
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Enter description" 
          rows={3}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none" 
        />
      </div>

      {/* Estimated Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <input 
                type="number" 
                value={Math.floor(estimatedTime / 60)} 
                onChange={(e) => {
                  const hours = Math.max(0, parseInt(e.target.value) || 0);
                  setEstimatedTime(hours * 60 + (estimatedTime % 60));
                }} 
                min="0"
                className="w-full px-3 py-2.5 pr-8 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">hr</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <input 
                type="number" 
                value={estimatedTime % 60} 
                onChange={(e) => {
                  const mins = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                  setEstimatedTime(Math.floor(estimatedTime / 60) * 60 + mins);
                }} 
                min="0"
                max="59"
                className="w-full px-3 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resources (only for resource nodes) */}
      {nodeType === 'resource' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Resources ({resources.length})</label>
            <button 
              onClick={addResource} 
              className="px-3 py-1.5 text-xs font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
            >
              + Add
            </button>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {resources.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p>No resources added yet.</p>
                <p className="text-xs mt-1">Add a link or upload a file</p>
              </div>
            )}
            
            {resources.map((resource, index) => (
              <div key={resource.id} className="bg-gray-50 rounded-xl p-3 space-y-2.5 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                  <button 
                    onClick={() => removeResource(index)} 
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
                
                <input 
                  type="text" 
                  value={resource.title} 
                  onChange={(e) => updateResource(index, 'title', e.target.value)} 
                  placeholder="Resource title"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" 
                />
                
                <input 
                  type="url" 
                  value={resource.url} 
                  onChange={(e) => updateResource(index, 'url', e.target.value)} 
                  placeholder="Paste a link (https://...)"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button 
          onClick={onCancel} 
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          className="flex-1 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
        >
          Save Node
        </button>
      </div>
    </div>
  );
}
