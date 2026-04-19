'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Resource } from '@/lib/types';

interface ResourceNodeData {
  label: string;
  description: string;
  type: 'youtube' | 'pdf' | 'doc' | 'article' | 'link';
  resources: Resource[];
  estimatedTime: number;
  completed?: boolean;
  onLabelChange?: (newLabel: string) => void;
}

const resourceTypeIcons: Record<string, string> = {
  youtube: '▶',
  pdf: '📄',
  doc: '📝',
  article: '📰',
  link: '🔗',
};

const resourceTypeLabels: Record<string, string> = {
  youtube: 'YouTube',
  pdf: 'PDF',
  doc: 'Word Doc',
  article: 'Article',
  link: 'Link',
};

export function ResourceNode({ data, selected }: NodeProps<ResourceNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== data.label) {
      data.onLabelChange?.(trimmed);
    } else {
      setEditValue(data.label || '');
    }
    setIsEditing(false);
  }, [editValue, data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditValue(data.label || '');
      setIsEditing(false);
    }
  }, [commitEdit, data.label]);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg min-w-[280px] max-w-[340px] ${
        selected ? 'ring-2 ring-black shadow-xl' : 'border border-gray-200'
      } ${data.completed ? 'bg-gray-50' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-black !border-white !border-2"
      />
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="text-base font-bold text-black bg-gray-50 border border-gray-300 rounded-md px-2 py-1 w-full outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          ) : (
            <span
              className="text-base font-bold text-black truncate cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Double-click to rename"
            >
              {data.label || 'Resource Node'}
            </span>
          )}
          {data.completed && !isEditing && (
            <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-full flex-shrink-0 ml-2">
              Done
            </span>
          )}
        </div>
        
        {data.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {data.description}
          </p>
        )}
        
        {data.resources && data.resources.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-3">
            {data.resources.slice(0, 3).map((resource, index) => (
              <div
                key={index}
                className="flex items-center gap-2.5 text-sm bg-gray-50 p-2.5 rounded-lg"
              >
                <span className="flex-shrink-0 text-base">
                  {resourceTypeIcons[resource.type] || '📄'}
                </span>
                <span className="truncate flex-1 text-gray-700 font-medium">
                  {resource.title || resourceTypeLabels[resource.type]}
                </span>
              </div>
            ))}
            {data.resources.length > 3 && (
              <div className="text-xs text-gray-400 text-center font-medium">
                +{data.resources.length - 3} more resources
              </div>
            )}
          </div>
        )}
        
        {data.estimatedTime > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {data.estimatedTime >= 60
              ? `${Math.floor(data.estimatedTime / 60)}h${data.estimatedTime % 60 > 0 ? ` ${data.estimatedTime % 60}m` : ''}`
              : `${data.estimatedTime}m`}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-black !border-white !border-2"
      />
    </div>
  );
}

interface MilestoneNodeData {
  label: string;
  description: string;
  completed?: boolean;
}

export function MilestoneNode({ data, selected }: NodeProps<MilestoneNodeData>) {
  return (
    <div
      className={`bg-gradient-to-br from-black to-gray-800 text-white rounded-xl shadow-lg min-w-[220px] ${
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-white !border-white"
      />
      
      <div className="p-6 text-center">
        <div className="mb-3">
          {data.completed ? (
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          )}
        </div>
        <div className="font-bold text-base uppercase tracking-wide text-white">
          {data.label || 'Milestone'}
        </div>
        {data.description && (
          <p className="text-xs text-gray-300 mt-2 opacity-80">
            {data.description}
          </p>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-white !border-white"
      />
    </div>
  );
}

interface TextNodeData {
  label: string;
  description: string;
  onLabelChange?: (newLabel: string) => void;
}

export function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== data.label) {
      data.onLabelChange?.(trimmed);
    } else {
      setEditValue(data.label || '');
    }
    setIsEditing(false);
  }, [editValue, data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditValue(data.label || '');
      setIsEditing(false);
    }
  }, [commitEdit, data.label]);

  return (
    <div
      className={`bg-white rounded-lg border min-w-[200px] max-w-[260px] ${
        selected ? 'border-black border-2 shadow-lg' : 'border-gray-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-gray-400 !border-white"
      />
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="font-semibold text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-md px-1.5 py-0.5 w-full outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          ) : (
            <span
              className="font-semibold text-sm text-gray-700 cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Double-click to rename"
            >
              {data.label || 'Note'}
            </span>
          )}
        </div>
        {data.description && (
          <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
            {data.description}
          </p>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-gray-400 !border-white"
      />
    </div>
  );
}
